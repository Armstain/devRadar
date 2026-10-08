import { randomUUID } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import type { Database } from "@/server/db/client";
import { createTestDb } from "@/server/db/test-db";
import { createApplication, deleteApplication, getApplication, updateApplication } from "./applications";
import { collectDueReminders, listUnseenReminders, markRemindersSeen, recordFollowUp } from "./follow-ups";

let db: Database;
beforeAll(async () => {
    db = await createTestDb();
});

const DAY = 24 * 60 * 60 * 1000;
const user = () => `user_${randomUUID()}`;
const input = (company = "Lumen Labs") => ({ company, position: "Engineer", status: "applied" as const, link: "", notes: "" });
const inDays = (n: number) => new Date(Date.now() + n * DAY);

describe("recordFollowUp", () => {
    it("restarts the quiet clock and records the follow-up in the history", async () => {
        const u = user();
        const app = await createApplication(db, u, input());
        const now = inDays(12);

        const result = await recordFollowUp(db, u, app.id, { action: "followed-up" }, now);
        expect(result.status).toBe("ok");
        if (result.status !== "ok") return;
        expect(result.application.followedUpAt).toBe(now.toISOString());
        expect(result.application.updatedAt).toBe(now.toISOString());

        const detail = await getApplication(db, u, app.id);
        expect(detail?.events.map((e) => e.type)).toEqual(["created", "followed_up"]);
    });

    it("snoozes without touching the activity date", async () => {
        const u = user();
        const app = await createApplication(db, u, input());
        const now = inDays(11);

        const result = await recordFollowUp(db, u, app.id, { action: "snooze", days: 7 }, now);
        if (result.status !== "ok") throw new Error(result.status);
        expect(result.application.snoozedUntil).toBe(new Date(now.getTime() + 7 * DAY).toISOString());
        expect(result.application.updatedAt).toBe(app.updatedAt);
    });

    it("clears a snooze when the user follows up", async () => {
        const u = user();
        const app = await createApplication(db, u, input());
        await recordFollowUp(db, u, app.id, { action: "snooze", days: 14 }, inDays(11));
        const result = await recordFollowUp(db, u, app.id, { action: "followed-up" }, inDays(12));
        if (result.status !== "ok") throw new Error(result.status);
        expect(result.application.snoozedUntil).toBeNull();
    });

    it("refuses closed applications and other users' applications", async () => {
        const u = user();
        const app = await createApplication(db, u, input());
        expect((await recordFollowUp(db, user(), app.id, { action: "followed-up" })).status).toBe("not-found");
        await updateApplication(db, u, app.id, { status: "rejected" });
        expect((await recordFollowUp(db, u, app.id, { action: "followed-up" })).status).toBe("closed");
    });
});

describe("follow-up reminders", () => {
    it("creates one reminder per quiet spell, however often the job runs", async () => {
        const u = user();
        const quiet = await createApplication(db, u, input("Quiet"));
        await createApplication(db, u, input("Fresh"));
        const closed = await createApplication(db, u, input("Closed"));
        await updateApplication(db, u, closed.id, { status: "offer" });

        // Nothing is due yet
        await collectDueReminders(db, inDays(5));
        expect(await listUnseenReminders(db, u)).toEqual([]);

        // Ten days on, the two active applications are due; the offer isn't
        await collectDueReminders(db, inDays(11));
        await collectDueReminders(db, inDays(11));
        const due = await listUnseenReminders(db, u);
        expect(due).toHaveLength(2);
        expect(due.map((r) => r.applicationId)).toContain(quiet.id);
    });

    it("drops a reminder once the user acts on the application", async () => {
        const u = user();
        const app = await createApplication(db, u, input());
        const other = await createApplication(db, u, input("Other"));
        await collectDueReminders(db, inDays(11));
        expect(await listUnseenReminders(db, u)).toHaveLength(2);

        await recordFollowUp(db, u, app.id, { action: "followed-up" }, inDays(11));
        // A stage change moves the due date, so its reminder no longer applies
        await updateApplication(db, u, other.id, { status: "in-progress" });
        expect(await listUnseenReminders(db, u)).toEqual([]);
    });

    it("reminds again when a snooze runs out", async () => {
        const u = user();
        const app = await createApplication(db, u, input());
        await collectDueReminders(db, inDays(11));
        await recordFollowUp(db, u, app.id, { action: "snooze", days: 3 }, inDays(11));
        expect(await listUnseenReminders(db, u)).toEqual([]);

        await collectDueReminders(db, inDays(13));
        expect(await listUnseenReminders(db, u)).toEqual([]);
        await collectDueReminders(db, inDays(15));
        expect(await listUnseenReminders(db, u)).toHaveLength(1);
    });

    it("marks only the user's own reminders as seen", async () => {
        const [a, b] = [user(), user()];
        await createApplication(db, a, input());
        await createApplication(db, b, input());
        await collectDueReminders(db, inDays(11));

        expect(await markRemindersSeen(db, a)).toBe(1);
        expect(await listUnseenReminders(db, a)).toEqual([]);
        expect(await listUnseenReminders(db, b)).toHaveLength(1);
    });

    it("goes away with the application", async () => {
        const u = user();
        const app = await createApplication(db, u, input());
        await collectDueReminders(db, inDays(11));
        await deleteApplication(db, u, app.id);
        expect(await listUnseenReminders(db, u)).toEqual([]);
    });
});
