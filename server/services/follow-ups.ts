import { and, eq, inArray, isNull, lte, sql } from "drizzle-orm";
import type { Database } from "@/server/db/client";
import { applicationEvents, applications, followUpReminders } from "@/server/db/schema";
import { toApplication } from "@/server/services/applications";
import type { Application, FollowUpAction } from "@/lib/applications";
import { FOLLOW_UP_DAYS } from "@/lib/pipeline";

const DAY_MS = 24 * 60 * 60 * 1000;
const ACTIVE = ["applied", "in-progress"] as const;

// The same due date as followUpDueAt() in lib/pipeline.ts: ten days after the
// last activity, or the end of a snooze if that's later.
const dueAt = sql<Date>`greatest(${applications.updatedAt} + make_interval(days => ${FOLLOW_UP_DAYS}), coalesce(${applications.snoozedUntil}, '-infinity'::timestamptz))`;

export type FollowUpResult = { status: "ok"; application: Application } | { status: "not-found" } | { status: "closed" };

// "I followed up" restarts the quiet clock and clears any snooze; a snooze
// only pushes the reminder back. Both go into the application's history, and
// both settle any reminder the user hasn't seen yet.
export async function recordFollowUp(
    db: Database,
    userId: string,
    id: string,
    action: FollowUpAction,
    now = new Date()
): Promise<FollowUpResult> {
    return db.transaction(async (tx) => {
        const owned = and(eq(applications.id, id), eq(applications.userId, userId));
        const [current] = await tx.select().from(applications).where(owned).for("update");
        if (!current) return { status: "not-found" };
        if (!(ACTIVE as readonly string[]).includes(current.status)) return { status: "closed" };

        const [row] = await tx
            .update(applications)
            .set(
                action.action === "followed-up"
                    ? { followedUpAt: now, snoozedUntil: null, updatedAt: now }
                    : { snoozedUntil: new Date(now.getTime() + action.days * DAY_MS) }
            )
            .where(owned)
            .returning();
        await tx.insert(applicationEvents).values({
            applicationId: id,
            userId,
            type: action.action === "followed-up" ? "followed_up" : "snoozed",
            createdAt: now,
        });
        await tx
            .update(followUpReminders)
            .set({ seenAt: now })
            .where(and(eq(followUpReminders.applicationId, id), isNull(followUpReminders.seenAt)));
        return { status: "ok", application: toApplication(row) };
    });
}

// The daily job: one reminder for every active application that has become
// due. Safe to run any number of times; the (application, due date) key
// means a quiet spell is only ever reminded about once.
export async function collectDueReminders(db: Database, now = new Date()): Promise<number> {
    const at = sql`${now.toISOString()}::timestamptz`;
    // INSERT ... SELECT needs every column, in table order
    const due = db
        .select({
            id: sql`gen_random_uuid()`.as("id"),
            userId: applications.userId,
            applicationId: applications.id,
            dueAt: sql<Date>`${dueAt}`.as("due_at"),
            seenAt: sql`null::timestamptz`.as("seen_at"),
            createdAt: sql`${at}`.as("created_at"),
        })
        .from(applications)
        .where(and(inArray(applications.status, [...ACTIVE]), lte(dueAt, at)));
    const inserted = await db
        .insert(followUpReminders)
        .select(due)
        .onConflictDoNothing()
        .returning({ id: followUpReminders.id });
    return inserted.length;
}

export interface Reminder {
    applicationId: string;
    dueAt: string;
}

// Reminders the user hasn't seen, for applications that are still due on the
// same date (anything they've since acted on drops out).
export async function listUnseenReminders(db: Database, userId: string): Promise<Reminder[]> {
    const rows = await db
        .select({ applicationId: followUpReminders.applicationId, dueAt: followUpReminders.dueAt })
        .from(followUpReminders)
        .innerJoin(applications, eq(applications.id, followUpReminders.applicationId))
        .where(
            and(
                eq(followUpReminders.userId, userId),
                isNull(followUpReminders.seenAt),
                inArray(applications.status, [...ACTIVE]),
                eq(followUpReminders.dueAt, dueAt)
            )
        );
    return rows.map((r) => ({ applicationId: r.applicationId, dueAt: r.dueAt.toISOString() }));
}

export async function markRemindersSeen(db: Database, userId: string, now = new Date()): Promise<number> {
    const rows = await db
        .update(followUpReminders)
        .set({ seenAt: now })
        .where(and(eq(followUpReminders.userId, userId), isNull(followUpReminders.seenAt)))
        .returning({ id: followUpReminders.id });
    return rows.length;
}
