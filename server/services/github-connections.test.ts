import { randomBytes, randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import type { Database } from "@/server/db/client";
import { githubConnections } from "@/server/db/schema";
import { createTestDb } from "@/server/db/test-db";
import {
    deleteGithubConnection,
    getGithubConnection,
    getGithubCredentials,
    saveGithubConnection,
} from "./github-connections";
import { deleteUserData } from "./users";

let db: Database;
const originalKey = process.env.TOKEN_ENCRYPTION_KEY;

beforeAll(async () => {
    process.env.TOKEN_ENCRYPTION_KEY = randomBytes(32).toString("base64");
    db = await createTestDb();
});

afterAll(() => {
    process.env.TOKEN_ENCRYPTION_KEY = originalKey;
});

const user = () => `user_${randomUUID()}`;

describe("github connections service", () => {
    it("stores the token encrypted and returns it decrypted", async () => {
        const u = user();
        await saveGithubConnection(db, u, { token: "gho_secret", username: "octocat", scopes: "read:user repo" });

        const [row] = await db.select().from(githubConnections).where(eq(githubConnections.userId, u));
        expect(row.accessToken).not.toContain("gho_secret");
        expect(row.accessToken).toMatch(/^enc:v1:/);

        expect(await getGithubCredentials(db, u)).toEqual({ token: "gho_secret", username: "octocat" });
    });

    it("summarises the connection without exposing the token", async () => {
        const u = user();
        expect(await getGithubConnection(db, u)).toEqual({ connected: false, username: null, connectedAt: null });

        await saveGithubConnection(db, u, { token: "gho_secret", username: "octocat", scopes: "" });
        const summary = await getGithubConnection(db, u);
        expect(summary).toMatchObject({ connected: true, username: "octocat" });
        expect(JSON.stringify(summary)).not.toContain("gho_secret");
    });

    it("replaces the connection when the user reconnects", async () => {
        const u = user();
        await saveGithubConnection(db, u, { token: "old", username: "old-name", scopes: "" });
        await saveGithubConnection(db, u, { token: "new", username: "new-name", scopes: "" });
        expect(await getGithubCredentials(db, u)).toEqual({ token: "new", username: "new-name" });
    });

    it("disconnects, and is removed with the user", async () => {
        const a = user();
        const b = user();
        await saveGithubConnection(db, a, { token: "t", username: "a", scopes: "" });
        await saveGithubConnection(db, b, { token: "t", username: "b", scopes: "" });

        await deleteGithubConnection(db, a);
        expect(await getGithubCredentials(db, a)).toBeNull();

        await deleteUserData(db, b);
        expect(await getGithubCredentials(db, b)).toBeNull();
    });
});
