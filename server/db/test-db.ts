import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import type { Database } from "./client";
import * as schema from "./schema";

// A fresh in-process Postgres with the real migrations applied, for tests.
export async function createTestDb(): Promise<Database> {
    const client = new PGlite();
    const db = drizzle(client, { schema });
    await migrate(db, { migrationsFolder: path.join(__dirname, "migrations") });
    return db as unknown as Database;
}
