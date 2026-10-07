import { eq } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import type * as schema from "@/server/db/schema";
import { users } from "@/server/db/schema";

// Accepts the database or an open transaction.
type Executor = Pick<PgDatabase<PgQueryResultHKT, typeof schema>, "insert" | "delete">;

// Users are created lazily on their first write, keyed by their Clerk id.
export async function ensureUser(db: Executor, userId: string): Promise<void> {
    await db.insert(users).values({ id: userId }).onConflictDoNothing();
}

// Deletes the user and, through ON DELETE CASCADE, everything they own.
export async function deleteUserData(db: Executor, userId: string): Promise<boolean> {
    const deleted = await db.delete(users).where(eq(users.id, userId)).returning({ id: users.id });
    return deleted.length > 0;
}
