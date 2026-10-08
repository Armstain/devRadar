import type { Application, ApplicationStatus } from "@/lib/applications";

// An application with no activity for this long is flagged for a follow-up.
export const FOLLOW_UP_DAYS = 10;

const DAY_MS = 24 * 60 * 60 * 1000;

const ACTIVE: ApplicationStatus[] = ["applied", "in-progress"];

export function lastActivity(app: Pick<Application, "createdAt" | "updatedAt">): Date {
    return new Date(app.updatedAt ?? app.createdAt);
}

// When an active application is next due a follow-up: 10 days after the last
// activity, or the end of a snooze if that's later. The daily reminders job
// (server/services/follow-ups.ts) computes the same date in SQL.
export function followUpDueAt(app: Pick<Application, "createdAt" | "updatedAt" | "snoozedUntil">): Date {
    const quiet = lastActivity(app).getTime() + FOLLOW_UP_DAYS * DAY_MS;
    const snoozed = app.snoozedUntil ? new Date(app.snoozedUntil).getTime() : 0;
    return new Date(Math.max(quiet, snoozed));
}

export function daysSince(date: Date, now: Date): number {
    return Math.max(0, Math.floor((now.getTime() - date.getTime()) / DAY_MS));
}

export function isActive(app: Pick<Application, "status">): boolean {
    return ACTIVE.includes(app.status);
}

export function needsFollowUp(app: Application, now: Date): boolean {
    return isActive(app) && followUpDueAt(app).getTime() <= now.getTime();
}

export function isSnoozed(app: Application, now: Date): boolean {
    return isActive(app) && Boolean(app.snoozedUntil) && new Date(app.snoozedUntil!).getTime() > now.getTime();
}

export function relativeDays(days: number): string {
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    return `${days} days ago`;
}

export interface PipelineStats {
    total: number;
    active: number;
    addedThisWeek: number;
    inProgress: number;
    offers: number;
    rejected: number;
    // Share of applications that got any answer (progress, offer or rejection), 0–1
    responseRate: number | null;
    followUps: Application[];
    funnel: { label: string; count: number; conversion: number | null }[];
}

export function pipelineStats(apps: Application[], now: Date): PipelineStats {
    const count = (status: ApplicationStatus) => apps.filter((a) => a.status === status).length;
    const inProgress = count("in-progress");
    const offers = count("offer");
    const rejected = count("rejected");
    const total = apps.length;

    // Everything that reached a stage also passed the earlier ones.
    const stages = [
        { label: "Applied", count: total },
        { label: "In progress", count: inProgress + offers },
        { label: "Offer", count: offers },
    ];

    return {
        total,
        active: apps.filter(isActive).length,
        addedThisWeek: apps.filter((a) => daysSince(new Date(a.createdAt), now) < 7).length,
        inProgress,
        offers,
        rejected,
        responseRate: total ? (inProgress + offers + rejected) / total : null,
        followUps: apps
            .filter((a) => needsFollowUp(a, now))
            .sort((a, b) => lastActivity(a).getTime() - lastActivity(b).getTime()),
        funnel: stages.map((stage, i) => ({
            ...stage,
            conversion: i === 0 || !stages[i - 1].count ? null : stage.count / stages[i - 1].count,
        })),
    };
}

// Most relevant first: interviews, then fresh applications, then the rest.
export function byPriority(apps: Application[]): Application[] {
    const rank: Record<ApplicationStatus, number> = { "in-progress": 0, offer: 1, applied: 2, rejected: 3 };
    return [...apps].sort(
        (a, b) => rank[a.status] - rank[b.status] || lastActivity(b).getTime() - lastActivity(a).getTime()
    );
}

export type PipelineView = "follow-up" | "interviews" | "offers";

export function matchesView(app: Application, view: PipelineView, now: Date): boolean {
    switch (view) {
        case "follow-up":
            return needsFollowUp(app, now);
        case "interviews":
            return app.status === "in-progress";
        case "offers":
            return app.status === "offer";
    }
}
