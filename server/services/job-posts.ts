import { and, desc, eq } from "drizzle-orm";
import type { Database } from "@/server/db/client";
import { jobPosts, type JobPostRow } from "@/server/db/schema";
import { createApplications, getApplication } from "@/server/services/applications";
import { getGithubProfileState } from "@/server/services/github-snapshots";
import { ensureUser } from "@/server/services/users";
import type { Application } from "@/lib/applications";
import { scoreFit, type FitResult } from "@/lib/fit/score";
import type { JobExtraction } from "@/lib/job-posts";
import type { SkillProfile } from "@/lib/skills/types";

export interface JobPostView {
    id: string;
    url: string;
    applicationId: string | null;
    extraction: JobExtraction;
    fit: FitResult;
    // The user's skill areas, for drawing the role over them
    areas: SkillProfile["areas"] | null;
    hasPrep: boolean;
    createdAt: string;
}

const ownedBy = (userId: string, id: string) => and(eq(jobPosts.id, id), eq(jobPosts.userId, userId));

function toView(row: JobPostRow, profile: SkillProfile | null): JobPostView {
    return {
        id: row.id,
        url: row.url,
        applicationId: row.applicationId,
        extraction: row.extraction,
        fit: scoreFit(row.extraction.requirements, profile),
        areas: profile?.areas ?? null,
        hasPrep: Boolean(row.prep),
        createdAt: row.createdAt.toISOString(),
    };
}

export async function createJobPost(
    db: Database,
    userId: string,
    input: { text: string; url: string; extraction: JobExtraction; model: string }
): Promise<JobPostView> {
    const row = await db.transaction(async (tx) => {
        await ensureUser(tx, userId);
        const [created] = await tx.insert(jobPosts).values({ userId, ...input }).returning();
        return created;
    });
    const { profile } = await getGithubProfileState(db, userId);
    return toView(row, profile);
}

export interface JobPostSummary {
    id: string;
    title: string;
    company: string | null;
    applicationId: string | null;
    score: number | null;
    verdict: FitResult["verdict"];
    createdAt: string;
}

// Recent analyses, each scored against the current profile.
export async function listJobPosts(db: Database, userId: string, limit = 20): Promise<JobPostSummary[]> {
    const rows = await db.select().from(jobPosts).where(eq(jobPosts.userId, userId)).orderBy(desc(jobPosts.createdAt)).limit(limit);
    if (!rows.length) return [];
    const { profile } = await getGithubProfileState(db, userId);
    return rows.map((row) => {
        const fit = scoreFit(row.extraction.requirements, profile);
        return {
            id: row.id,
            title: row.extraction.title,
            company: row.extraction.company,
            applicationId: row.applicationId,
            score: fit.score,
            verdict: fit.verdict,
            createdAt: row.createdAt.toISOString(),
        };
    });
}

export async function getJobPostRow(db: Database, userId: string, id: string): Promise<JobPostRow | null> {
    const [row] = await db.select().from(jobPosts).where(ownedBy(userId, id));
    return row ?? null;
}

// Scored against the profile as it is now.
export async function getJobPost(db: Database, userId: string, id: string): Promise<JobPostView | null> {
    const row = await getJobPostRow(db, userId, id);
    if (!row) return null;
    const { profile } = await getGithubProfileState(db, userId);
    return toView(row, profile);
}

// Adds the post to the pipeline as an application, once. Calling it again
// returns the same application.
export async function saveJobPostToPipeline(
    db: Database,
    userId: string,
    id: string,
    overrides: { company?: string; position?: string } = {}
): Promise<{ application: Application; created: boolean } | null> {
    return db.transaction(async (tx) => {
        const [row] = await tx.select().from(jobPosts).where(ownedBy(userId, id)).for("update");
        if (!row) return null;
        if (row.applicationId) {
            const existing = await getApplication(tx, userId, row.applicationId);
            if (existing) {
                const { id, company, position, status, link, notes, createdAt, updatedAt } = existing;
                return { application: { id, company, position, status, link, notes, createdAt, updatedAt }, created: false };
            }
        }
        const { extraction } = row;
        const [application] = await createApplications(tx, userId, [
            {
                company: (overrides.company ?? extraction.company ?? "").trim() || "Unknown company",
                position: (overrides.position ?? extraction.title).trim() || "Untitled role",
                status: "applied",
                link: row.url,
                notes: extraction.summary,
            },
        ]);
        await tx.update(jobPosts).set({ applicationId: application.id }).where(eq(jobPosts.id, id));
        return { application, created: true };
    });
}

export async function savePrep(db: Database, userId: string, id: string, prep: string): Promise<void> {
    await db.update(jobPosts).set({ prep }).where(ownedBy(userId, id));
}
