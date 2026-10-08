import { and, asc, eq, isNotNull } from "drizzle-orm";
import type { Database } from "@/server/db/client";
import { applicationEvents, jobPosts } from "@/server/db/schema";
import { listApplications, toEvent } from "@/server/services/applications";
import { getGithubProfileState } from "@/server/services/github-snapshots";
import type { ApplicationEvent } from "@/lib/applications";
import { scoreFit } from "@/lib/fit/score";
import { computeInsights, type Insights } from "@/lib/insights";

// Everything the insights page needs, in three queries: applications, their
// whole event history, and the job posts they came from. Fit scores are
// computed against the profile as it is now, like everywhere else.
export async function getInsights(db: Database, userId: string, now = new Date()): Promise<Insights> {
    const [applications, eventRows, posts, { profile }] = await Promise.all([
        listApplications(db, userId),
        db.select().from(applicationEvents).where(eq(applicationEvents.userId, userId)).orderBy(asc(applicationEvents.createdAt)),
        db
            .select({ applicationId: jobPosts.applicationId, extraction: jobPosts.extraction })
            .from(jobPosts)
            .where(and(eq(jobPosts.userId, userId), isNotNull(jobPosts.applicationId))),
        getGithubProfileState(db, userId, now),
    ]);

    const events: Record<string, ApplicationEvent[]> = {};
    for (const row of eventRows) (events[row.applicationId] ??= []).push(toEvent(row));

    const fitScores: Record<string, number | null> = {};
    for (const post of posts) fitScores[post.applicationId!] = scoreFit(post.extraction.requirements, profile).score;

    return computeInsights({ applications, events, fitScores }, now);
}
