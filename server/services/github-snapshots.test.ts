import { randomBytes, randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";
import type { Database } from "@/server/db/client";
import { githubSnapshots } from "@/server/db/schema";
import { createTestDb } from "@/server/db/test-db";
import { GithubApiError, GithubUserNotFoundError } from "@/server/github/snapshot";
import { createMemoryRateLimiter } from "@/server/rate-limit";
import { makeRepo, makeSnapshot } from "@/lib/skills/fixtures";
import { deleteGithubConnection, saveGithubConnection } from "./github-connections";
import { getCachedScan, pruneScans, scanGithubUser } from "./github-scans";
import { findStaleSnapshots, getGithubProfileState, markSyncQueued, syncGithubSnapshot } from "./github-snapshots";

let db: Database;
const originalKey = process.env.TOKEN_ENCRYPTION_KEY;

beforeAll(async () => {
    process.env.TOKEN_ENCRYPTION_KEY = randomBytes(32).toString("base64");
    db = await createTestDb();
});

afterAll(() => {
    process.env.TOKEN_ENCRYPTION_KEY = originalKey;
});

const now = new Date("2026-10-01T00:00:00Z");
const snapshot = makeSnapshot([makeRepo({ name: "storefront", deps: { npm: ["next", "react"] } })]);

async function connectedUser() {
    const userId = `user_${randomUUID()}`;
    await saveGithubConnection(db, userId, { token: "gho_token", username: "octocat", scopes: "read:user repo" });
    return userId;
}

describe("github snapshots", () => {
    it("reports not connected without a GitHub connection", async () => {
        expect(await getGithubProfileState(db, `user_${randomUUID()}`)).toMatchObject({ connected: false, profile: null });
    });

    it("syncs with the owner's token, including private repositories, and builds the profile on read", async () => {
        const userId = await connectedUser();
        await markSyncQueued(db, userId);
        expect(await getGithubProfileState(db, userId)).toMatchObject({ connected: true, status: "queued", profile: null });

        const fetchSnapshot = vi.fn().mockResolvedValue(snapshot);
        expect(await syncGithubSnapshot(db, userId, { fetchSnapshot, now })).toEqual({ status: "ready", repos: 1 });
        expect(fetchSnapshot).toHaveBeenCalledWith({ token: "gho_token", login: "octocat", includePrivate: true, deadline: expect.any(Number), now });

        const state = await getGithubProfileState(db, userId, now);
        expect(state).toMatchObject({ status: "ready", syncedAt: now.toISOString(), error: null });
        expect(state.profile?.technologies.map((t) => t.id)).toEqual(expect.arrayContaining(["nextjs", "react"]));
    });

    it("keeps the last good snapshot when a sync fails and explains why", async () => {
        const userId = await connectedUser();
        await syncGithubSnapshot(db, userId, { fetchSnapshot: async () => snapshot, now });

        const failing = vi.fn().mockRejectedValue(new GithubApiError("Bad credentials", 401));
        await expect(syncGithubSnapshot(db, userId, { fetchSnapshot: failing, now })).rejects.toThrow("Bad credentials");

        const state = await getGithubProfileState(db, userId, now);
        expect(state.status).toBe("failed");
        expect(state.error).toMatch(/Reconnect GitHub/);
        expect(state.profile).not.toBeNull();
    });

    it("drops old data when reconnecting, and the snapshot when disconnecting", async () => {
        const userId = await connectedUser();
        await syncGithubSnapshot(db, userId, { fetchSnapshot: async () => snapshot, now });

        await markSyncQueued(db, userId, { reset: true });
        expect(await getGithubProfileState(db, userId)).toMatchObject({ status: "queued", profile: null, syncedAt: null });

        await deleteGithubConnection(db, userId);
        expect(await db.select().from(githubSnapshots).where(eq(githubSnapshots.userId, userId))).toEqual([]);
    });

    it("skips accounts that aren't connected", async () => {
        expect(await syncGithubSnapshot(db, `user_${randomUUID()}`, { fetchSnapshot: vi.fn() })).toEqual({ status: "skipped", reason: "not-connected" });
    });

    it("finds connections that have never synced or synced over a day ago", async () => {
        const never = await connectedUser();
        const fresh = await connectedUser();
        await syncGithubSnapshot(db, fresh, { fetchSnapshot: async () => snapshot, now: new Date() });
        const stale = await connectedUser();
        await syncGithubSnapshot(db, stale, { fetchSnapshot: async () => snapshot, now: new Date("2026-01-01T00:00:00Z") });
        await db.update(githubSnapshots).set({ updatedAt: new Date("2026-01-01T00:00:00Z") }).where(eq(githubSnapshots.userId, stale));

        const due = await findStaleSnapshots(db, new Date(Date.now() - 86_400_000));
        expect(due).toEqual(expect.arrayContaining([never, stale]));
        expect(due).not.toContain(fresh);
    });
});

describe("public scans", () => {
    const options = (overrides = {}) => ({
        requester: "203.0.113.7",
        limiter: createMemoryRateLimiter(10, 60_000),
        token: "scan-token",
        now,
        ...overrides,
    });
    const scanned = (login: string) => makeSnapshot([makeRepo({ name: "site" })], { user: { ...snapshot.user, login } });

    it("scans public repositories only and caches the result for a day", async () => {
        const fetchSnapshot = vi.fn().mockResolvedValue(scanned("Cached-Cat"));
        const first = await scanGithubUser(db, "cached-cat", options({ fetchSnapshot }));
        expect(first).toMatchObject({ status: "ok", cached: false });
        expect(fetchSnapshot).toHaveBeenCalledWith(expect.objectContaining({ login: "cached-cat", includePrivate: false }));

        const again = await scanGithubUser(db, "cached-cat", options({ fetchSnapshot, now: new Date(now.getTime() + 3_600_000) }));
        expect(again).toMatchObject({ status: "ok", cached: true });
        expect(fetchSnapshot).toHaveBeenCalledTimes(1);
    });

    it("rate-limits uncached scans per requester but still serves stale cache", async () => {
        const limiter = createMemoryRateLimiter(1, 60_000);
        const fetchSnapshot = vi.fn().mockImplementation(async ({ login }) => scanned(login));
        expect((await scanGithubUser(db, "limited-a", options({ limiter, fetchSnapshot }))).status).toBe("ok");
        expect(await scanGithubUser(db, "limited-b", options({ limiter, fetchSnapshot }))).toMatchObject({ status: "rate-limited" });

        const tomorrow = new Date(now.getTime() + 2 * 86_400_000);
        expect(await scanGithubUser(db, "limited-a", options({ limiter, fetchSnapshot, now: tomorrow }))).toMatchObject({ status: "ok", cached: true });
    });

    it("reports unknown users and degrades without a token", async () => {
        const notFound = vi.fn().mockRejectedValue(new GithubUserNotFoundError("ghost"));
        expect(await scanGithubUser(db, "ghost", options({ fetchSnapshot: notFound }))).toEqual({ status: "not-found" });
        expect(await scanGithubUser(db, "no-token", options({ token: undefined }))).toEqual({ status: "unavailable" });
    });

    it("prunes old scans", async () => {
        await scanGithubUser(db, "old-scan", options({ fetchSnapshot: async () => scanned("old-scan"), now: new Date("2020-01-01T00:00:00Z") }));
        expect(await pruneScans(db, new Date("2021-01-01T00:00:00Z"))).toBeGreaterThanOrEqual(1);
        expect(await getCachedScan(db, "old-scan")).toBeNull();
    });
});
