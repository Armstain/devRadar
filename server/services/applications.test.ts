import { randomUUID } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import type { Database } from "@/server/db/client";
import { applicationEvents } from "@/server/db/schema";
import { createTestDb } from "@/server/db/test-db";
import {
    createApplication,
    createApplications,
    deleteApplication,
    getApplication,
    listApplications,
    updateApplication,
} from "./applications";
import { deleteUserData } from "./users";

let db: Database;
beforeAll(async () => {
    db = await createTestDb();
});

const user = () => `user_${randomUUID()}`;
const input = (company = "Lumen Labs") => ({ company, position: "Engineer", status: "applied" as const, link: "", notes: "" });

describe("applications service", () => {
    it("creates an application and records a created event", async () => {
        const u = user();
        const app = await createApplication(db, u, input());
        expect(app).toMatchObject({ company: "Lumen Labs", status: "applied" });

        const detail = await getApplication(db, u, app.id);
        expect(detail?.events).toEqual([
            expect.objectContaining({ type: "created", fromStatus: null, toStatus: "applied" }),
        ]);
    });

    it("lists only the user's applications, most recently active first", async () => {
        const u = user();
        const first = await createApplication(db, u, input("First"));
        await createApplication(db, u, input("Second"));
        await createApplication(db, user(), input("Someone else's"));
        await updateApplication(db, u, first.id, { notes: "followed up" });

        const list = await listApplications(db, u);
        expect(list.map((a) => a.company)).toEqual(["First", "Second"]);
    });

    it("records stage changes, but not other edits, as events", async () => {
        const u = user();
        const app = await createApplication(db, u, input());
        await updateApplication(db, u, app.id, { notes: "Spoke to the recruiter" });
        await updateApplication(db, u, app.id, { status: "in-progress" });
        await updateApplication(db, u, app.id, { status: "in-progress" });
        await updateApplication(db, u, app.id, { status: "offer" });

        const detail = await getApplication(db, u, app.id);
        expect(detail?.notes).toBe("Spoke to the recruiter");
        expect(detail?.events.map((e) => [e.type, e.fromStatus, e.toStatus])).toEqual([
            ["created", null, "applied"],
            ["status_changed", "applied", "in-progress"],
            ["status_changed", "in-progress", "offer"],
        ]);
    });

    it("moves updatedAt forward on every change", async () => {
        const u = user();
        const app = await createApplication(db, u, input());
        await new Promise((r) => setTimeout(r, 10));
        const updated = await updateApplication(db, u, app.id, { notes: "x" });
        expect(new Date(updated!.updatedAt!).getTime()).toBeGreaterThan(new Date(app.updatedAt!).getTime());
    });

    it("never lets one user read, change or delete another user's application", async () => {
        const owner = user();
        const intruder = user();
        const app = await createApplication(db, owner, input());

        expect(await getApplication(db, intruder, app.id)).toBeNull();
        expect(await updateApplication(db, intruder, app.id, { status: "rejected" })).toBeNull();
        expect(await deleteApplication(db, intruder, app.id)).toBe(false);

        const untouched = await getApplication(db, owner, app.id);
        expect(untouched?.status).toBe("applied");
        expect(untouched?.events).toHaveLength(1);
    });

    it("returns null for an unknown id", async () => {
        expect(await getApplication(db, user(), randomUUID())).toBeNull();
        expect(await updateApplication(db, user(), randomUUID(), { notes: "x" })).toBeNull();
    });

    it("deletes an application together with its events", async () => {
        const u = user();
        const app = await createApplication(db, u, input());
        await updateApplication(db, u, app.id, { status: "offer" });

        expect(await deleteApplication(db, u, app.id)).toBe(true);
        expect(await getApplication(db, u, app.id)).toBeNull();
        const events = await db.select().from(applicationEvents).where(eq(applicationEvents.applicationId, app.id));
        expect(events).toHaveLength(0);
    });

    it("imports many applications in one transaction", async () => {
        const u = user();
        const created = await createApplications(db, u, [input("A"), input("B"), input("C")]);
        expect(created).toHaveLength(3);
        expect(await listApplications(db, u)).toHaveLength(3);
        expect(await createApplications(db, u, [])).toEqual([]);
    });

    it("removes everything a user owns when the user is deleted", async () => {
        const u = user();
        const other = user();
        const app = await createApplication(db, u, input());
        await createApplication(db, other, input());

        expect(await deleteUserData(db, u)).toBe(true);
        expect(await listApplications(db, u)).toEqual([]);
        const events = await db.select().from(applicationEvents).where(eq(applicationEvents.applicationId, app.id));
        expect(events).toHaveLength(0);
        expect(await listApplications(db, other)).toHaveLength(1);
    });
});
