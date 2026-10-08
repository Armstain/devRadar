import { and, asc, desc, eq } from "drizzle-orm";
import type { Database } from "@/server/db/client";
import { applicationEvents, applications, jobPosts, type ApplicationEventRow, type ApplicationRow } from "@/server/db/schema";
import { ensureUser } from "@/server/services/users";
import type {
    Application,
    ApplicationEvent,
    ApplicationInput,
    ApplicationUpdate,
    ApplicationWithEvents,
} from "@/lib/applications";

// Every query is scoped by userId: a user can only ever read or change their
// own applications, whatever id they send.

export function toApplication(row: ApplicationRow): Application {
    return {
        id: row.id,
        company: row.company,
        position: row.position,
        status: row.status,
        link: row.link,
        notes: row.notes,
        followedUpAt: row.followedUpAt?.toISOString() ?? null,
        snoozedUntil: row.snoozedUntil?.toISOString() ?? null,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
    };
}

export function toEvent(row: ApplicationEventRow): ApplicationEvent {
    return {
        id: row.id,
        type: row.type,
        fromStatus: row.fromStatus,
        toStatus: row.toStatus,
        createdAt: row.createdAt.toISOString(),
    };
}

const ownedBy = (userId: string, id: string) => and(eq(applications.id, id), eq(applications.userId, userId));

export async function listApplications(db: Database, userId: string): Promise<Application[]> {
    const rows = await db
        .select()
        .from(applications)
        .where(eq(applications.userId, userId))
        .orderBy(desc(applications.updatedAt));
    return rows.map(toApplication);
}

export async function getApplication(db: Database, userId: string, id: string): Promise<ApplicationWithEvents | null> {
    const [row] = await db.select().from(applications).where(ownedBy(userId, id));
    if (!row) return null;
    const events = await db
        .select()
        .from(applicationEvents)
        .where(eq(applicationEvents.applicationId, id))
        .orderBy(asc(applicationEvents.createdAt));
    const [jobPost] = await db.select({ id: jobPosts.id }).from(jobPosts).where(eq(jobPosts.applicationId, id));
    return { ...toApplication(row), events: events.map(toEvent), jobPostId: jobPost?.id ?? null };
}

export async function createApplications(db: Database, userId: string, inputs: ApplicationInput[]): Promise<Application[]> {
    if (!inputs.length) return [];
    return db.transaction(async (tx) => {
        await ensureUser(tx, userId);
        const rows = await tx
            .insert(applications)
            .values(inputs.map((input) => ({ ...input, userId })))
            .returning();
        await tx.insert(applicationEvents).values(
            rows.map((row) => ({ applicationId: row.id, userId, type: "created" as const, toStatus: row.status }))
        );
        return rows.map(toApplication);
    });
}

export async function createApplication(db: Database, userId: string, input: ApplicationInput): Promise<Application> {
    const [created] = await createApplications(db, userId, [input]);
    return created;
}

// Returns null when the application doesn't exist or belongs to someone else.
export async function updateApplication(
    db: Database,
    userId: string,
    id: string,
    update: ApplicationUpdate
): Promise<Application | null> {
    return db.transaction(async (tx) => {
        const [current] = await tx.select().from(applications).where(ownedBy(userId, id)).for("update");
        if (!current) return null;

        const [row] = await tx
            .update(applications)
            .set({ ...update, updatedAt: new Date() })
            .where(ownedBy(userId, id))
            .returning();

        if (update.status && update.status !== current.status) {
            await tx.insert(applicationEvents).values({
                applicationId: id,
                userId,
                type: "status_changed",
                fromStatus: current.status,
                toStatus: update.status,
            });
        }
        return toApplication(row);
    });
}

export async function deleteApplication(db: Database, userId: string, id: string): Promise<boolean> {
    const deleted = await db.delete(applications).where(ownedBy(userId, id)).returning({ id: applications.id });
    return deleted.length > 0;
}
