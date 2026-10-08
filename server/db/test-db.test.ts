import { describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { createTestDb } from "./test-db";

describe("test database", () => {
    it("applies the migrations", async () => {
        const db = await createTestDb();
        const result = await db.execute<{ table_name: string }>(
            sql`select table_name from information_schema.tables where table_schema = 'public' order by table_name`
        );
        const rows = Array.isArray(result) ? result : (result as { rows: { table_name: string }[] }).rows;
        expect(rows.map((r) => r.table_name)).toEqual(["application_events", "applications", "follow_up_reminders", "github_connections", "github_scans", "github_snapshots", "job_posts", "users"]);
    });
});
