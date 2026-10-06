import { randomUUID } from "node:crypto";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { Database } from "@/server/db/client";
import { createTestDb } from "@/server/db/test-db";

// Route handlers run for real against an in-process Postgres; only Clerk's
// session lookup is replaced.
const session = vi.hoisted(() => ({ userId: null as string | null }));
vi.mock("@clerk/nextjs/server", () => ({ auth: async () => ({ userId: session.userId }) }));

let db: Database;
vi.mock("@/server/db/client", () => ({ getDb: () => db }));

const { GET: list, POST: create } = await import("./route");
const { GET: get, PATCH: patch, DELETE: remove } = await import("./[id]/route");
const { POST: importApps } = await import("./import/route");

beforeAll(async () => {
    db = await createTestDb();
});

beforeEach(() => {
    session.userId = `user_${randomUUID()}`;
});

const noParams = { params: Promise.resolve({} as Record<string, never>) };
const withId = (id: string) => ({ params: Promise.resolve({ id }) });
const jsonRequest = (method: string, body?: unknown) =>
    new Request("http://localhost/api/applications", {
        method,
        headers: { "content-type": "application/json" },
        body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
    });

async function createOne(company = "Lumen Labs") {
    const response = await create(jsonRequest("POST", { company, position: "Engineer" }), noParams);
    return (await response.json()) as { id: string; status: string };
}

describe("applications API", () => {
    it("rejects requests without a session", async () => {
        session.userId = null;
        expect((await list(jsonRequest("GET"), noParams)).status).toBe(401);
        expect((await create(jsonRequest("POST", {}), noParams)).status).toBe(401);
    });

    it("creates with defaults and lists the user's applications", async () => {
        const response = await create(jsonRequest("POST", { company: "Lumen Labs", position: "Engineer" }), noParams);
        expect(response.status).toBe(201);
        expect(await response.json()).toMatchObject({ company: "Lumen Labs", status: "applied", link: "", notes: "" });

        const listed = await (await list(jsonRequest("GET"), noParams)).json();
        expect(listed).toHaveLength(1);
    });

    it("answers 400 for invalid JSON, invalid fields and malformed ids", async () => {
        expect((await create(jsonRequest("POST", "{not json"), noParams)).status).toBe(400);
        const invalid = await create(jsonRequest("POST", { company: "", position: "x", link: "javascript:alert(1)" }), noParams);
        expect(invalid.status).toBe(400);
        expect((await invalid.json()).issues.fieldErrors).toHaveProperty("company");
        expect((await get(jsonRequest("GET"), withId("not-a-uuid"))).status).toBe(400);
    });

    it("updates the stage and returns the history", async () => {
        const app = await createOne();
        const updated = await patch(jsonRequest("PATCH", { status: "in-progress", userId: "someone-else" }), withId(app.id));
        expect(updated.status).toBe(200);

        const detail = await (await get(jsonRequest("GET"), withId(app.id))).json();
        expect(detail.status).toBe("in-progress");
        expect(detail.events.map((e: { type: string }) => e.type)).toEqual(["created", "status_changed"]);
    });

    it("returns 404 for another user's application instead of revealing it", async () => {
        const app = await createOne();
        session.userId = `user_${randomUUID()}`;

        expect((await get(jsonRequest("GET"), withId(app.id))).status).toBe(404);
        expect((await patch(jsonRequest("PATCH", { status: "rejected" }), withId(app.id))).status).toBe(404);
        expect((await remove(jsonRequest("DELETE"), withId(app.id))).status).toBe(404);
    });

    it("deletes an application", async () => {
        const app = await createOne();
        expect((await remove(jsonRequest("DELETE"), withId(app.id))).status).toBe(200);
        expect((await get(jsonRequest("GET"), withId(app.id))).status).toBe(404);
    });

    it("imports in bulk and validates every row", async () => {
        const rows = [{ company: "A", position: "x" }, { company: "B", position: "y" }];
        const ok = await importApps(jsonRequest("POST", { applications: rows }), noParams);
        expect(await ok.json()).toEqual({ success: true, imported: 2 });

        const bad = await importApps(jsonRequest("POST", { applications: [...rows, { company: "" }] }), noParams);
        expect(bad.status).toBe(400);
    });
});
