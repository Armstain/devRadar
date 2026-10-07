import { eq } from "drizzle-orm";
import type { Database } from "@/server/db/client";
import { githubConnections } from "@/server/db/schema";
import { ensureUser } from "@/server/services/users";
import { decryptToken, encryptToken } from "@/lib/crypto";

export interface GithubCredentials {
    token: string;
    username: string;
}

export interface GithubConnectionSummary {
    connected: boolean;
    username: string | null;
    connectedAt: string | null;
}

export async function getGithubCredentials(db: Database, userId: string): Promise<GithubCredentials | null> {
    const [row] = await db.select().from(githubConnections).where(eq(githubConnections.userId, userId));
    return row ? { token: decryptToken(row.accessToken), username: row.username } : null;
}

// Never exposes the token.
export async function getGithubConnection(db: Database, userId: string): Promise<GithubConnectionSummary> {
    const [row] = await db
        .select({ username: githubConnections.username, updatedAt: githubConnections.updatedAt })
        .from(githubConnections)
        .where(eq(githubConnections.userId, userId));
    return {
        connected: Boolean(row),
        username: row?.username ?? null,
        connectedAt: row?.updatedAt.toISOString() ?? null,
    };
}

export async function saveGithubConnection(
    db: Database,
    userId: string,
    connection: { token: string; username: string; scopes: string }
): Promise<void> {
    const values = {
        username: connection.username,
        accessToken: encryptToken(connection.token),
        scopes: connection.scopes,
        updatedAt: new Date(),
    };
    await db.transaction(async (tx) => {
        await ensureUser(tx, userId);
        await tx
            .insert(githubConnections)
            .values({ userId, ...values })
            .onConflictDoUpdate({ target: githubConnections.userId, set: values });
    });
}

export async function deleteGithubConnection(db: Database, userId: string): Promise<void> {
    await db.delete(githubConnections).where(eq(githubConnections.userId, userId));
}
