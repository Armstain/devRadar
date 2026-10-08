import { and, eq, isNull, lt, or, sql } from "drizzle-orm";
import type { Database } from "@/server/db/client";
import { githubConnections, githubSnapshots } from "@/server/db/schema";
import { fetchGithubSnapshot, GithubApiError, type SnapshotFetcher } from "@/server/github/snapshot";
import { getGithubCredentials } from "@/server/services/github-connections";
import { buildSkillProfile } from "@/lib/skills/profile";
import type { SkillProfile } from "@/lib/skills/types";

export type GithubSyncStatus = "queued" | "syncing" | "ready" | "failed";

export interface GithubProfileState {
    connected: boolean;
    username: string | null;
    status: GithubSyncStatus | null;
    syncedAt: string | null;
    error: string | null;
    profile: SkillProfile | null;
}

// The connected account's profile, built from the stored snapshot. Never
// calls GitHub.
export async function getGithubProfileState(db: Database, userId: string, now = new Date()): Promise<GithubProfileState> {
    const [row] = await db
        .select({ username: githubConnections.username, snapshot: githubSnapshots })
        .from(githubConnections)
        .leftJoin(githubSnapshots, eq(githubSnapshots.userId, githubConnections.userId))
        .where(eq(githubConnections.userId, userId));

    if (!row) return { connected: false, username: null, status: null, syncedAt: null, error: null, profile: null };
    const snapshot = row.snapshot;
    return {
        connected: true,
        username: row.username,
        status: snapshot?.status ?? null,
        syncedAt: snapshot?.syncedAt?.toISOString() ?? null,
        error: snapshot?.error ?? null,
        profile: snapshot?.data ? buildSkillProfile(snapshot.data, now) : null,
    };
}

// Marks a sync as requested. `reset` drops the previous data, for when the
// connection now points at a different GitHub account.
export async function markSyncQueued(db: Database, userId: string, options: { reset?: boolean } = {}): Promise<void> {
    const values = { status: "queued" as const, error: null, updatedAt: new Date(), ...(options.reset ? { data: null, syncedAt: null } : {}) };
    await db
        .insert(githubSnapshots)
        .values({ userId, ...values })
        .onConflictDoUpdate({ target: githubSnapshots.userId, set: values });
}

function describeFailure(error: unknown): string {
    if (error instanceof GithubApiError && error.status === 401) return "GitHub rejected the saved token. Reconnect GitHub to sync again.";
    if (error instanceof GithubApiError && (error.status === 403 || error.status === 429)) return "GitHub rate limit reached. The next sync will retry.";
    return "Couldn’t reach GitHub. The next sync will retry.";
}

export type SyncResult = { status: "ready"; repos: number } | { status: "skipped"; reason: "not-connected" };

// Fetches the account's repositories and replaces the stored snapshot. Runs
// in a background job; safe to repeat.
export async function syncGithubSnapshot(
    db: Database,
    userId: string,
    options: { fetchSnapshot?: SnapshotFetcher; now?: Date } = {}
): Promise<SyncResult> {
    const { fetchSnapshot = fetchGithubSnapshot, now = new Date() } = options;
    const credentials = await getGithubCredentials(db, userId);
    if (!credentials) return { status: "skipped", reason: "not-connected" };

    const setStatus = (values: Partial<typeof githubSnapshots.$inferInsert>) =>
        db
            .insert(githubSnapshots)
            .values({ userId, ...values })
            .onConflictDoUpdate({ target: githubSnapshots.userId, set: { ...values, updatedAt: new Date() } });

    await setStatus({ status: "syncing", error: null });
    try {
        // Stops paging in time to save what it read before the job's function limit
        const data = await fetchSnapshot({
            token: credentials.token,
            login: credentials.username,
            includePrivate: true,
            now,
            deadline: Date.now() + 45_000,
        });
        await setStatus({ status: "ready", data, error: null, syncedAt: now });
        return { status: "ready", repos: data.repos.length };
    } catch (error) {
        await setStatus({ status: "failed", error: describeFailure(error) });
        throw error;
    }
}

// Connected accounts whose snapshot is older than `syncedBefore` (or missing),
// skipping ones queued in the last 15 minutes.
export async function findStaleSnapshots(db: Database, syncedBefore: Date, limit = 500): Promise<string[]> {
    const recentlyTouched = new Date(Date.now() - 15 * 60_000);
    const rows = await db
        .select({ userId: githubConnections.userId })
        .from(githubConnections)
        .leftJoin(githubSnapshots, eq(githubSnapshots.userId, githubConnections.userId))
        .where(
            or(
                isNull(githubSnapshots.userId),
                and(
                    or(isNull(githubSnapshots.syncedAt), lt(githubSnapshots.syncedAt, syncedBefore)),
                    lt(githubSnapshots.updatedAt, recentlyTouched)
                )
            )
        )
        .orderBy(sql`${githubSnapshots.syncedAt} asc nulls first`)
        .limit(limit);
    return rows.map((r) => r.userId);
}
