import { drizzle } from "drizzle-orm/postgres-js";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import postgres from "postgres";
import * as schema from "./schema";

// Any Drizzle Postgres database with this schema: postgres.js in the app,
// PGlite in tests. Services take it as a parameter so both work.
export type Database = PgDatabase<PgQueryResultHKT, typeof schema>;

const globalForDb = globalThis as typeof globalThis & { __devradarDb?: Database };

// Lazily connects, so importing this module (e.g. during `next build`) needs
// no DATABASE_URL. In development the instance survives hot reloads.
export function getDb(): Database {
    if (globalForDb.__devradarDb) return globalForDb.__devradarDb;

    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");

    const client = postgres(url, {
        // Neon's pooled endpoint runs PgBouncer in transaction mode, which
        // doesn't support prepared statements.
        prepare: false,
        max: process.env.NODE_ENV === "production" ? 5 : 3,
    });
    const db = drizzle(client, { schema }) as unknown as Database;
    globalForDb.__devradarDb = db;
    return db;
}
