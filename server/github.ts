import { authed, errorResponse, type RouteContext } from "@/server/http";
import { getGithubCredentials, type GithubCredentials } from "@/server/services/github-connections";

const GITHUB_API = "https://api.github.com";

export function githubFetch(token: string, path: string): Promise<Response> {
    return fetch(`${GITHUB_API}${path}`, {
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        },
    });
}

// Like `authed`, but also loads the user's GitHub credentials and answers
// 400 when GitHub isn't connected.
export function authedGithub(
    name: string,
    handler: (request: Request, context: RouteContext<Record<string, never>> & { github: GithubCredentials }) => Promise<Response>
) {
    return authed(name, async (request, context) => {
        const github = await getGithubCredentials(context.db, context.userId);
        if (!github) return errorResponse("GitHub not connected", 400);
        return handler(request, { ...context, github });
    });
}

export interface ContributionSummary {
    totalContributions: number;
    currentStreak: number;
    averagePerDay: number;
    recentContributions: { date: string; count: number }[];
}

// Pushes and new repos/branches per UTC day over the last 30 days.
export function summarizeEvents(events: { type: string; created_at: string }[], now: Date): ContributionSummary {
    const DAYS = 30;
    const since = now.getTime() - DAYS * 86_400_000;
    const byDay = new Map<string, number>();
    for (const event of events) {
        const at = new Date(event.created_at);
        if (at.getTime() < since || (event.type !== "PushEvent" && event.type !== "CreateEvent")) continue;
        const day = at.toISOString().slice(0, 10);
        byDay.set(day, (byDay.get(day) ?? 0) + 1);
    }

    // Consecutive active days ending today (or yesterday, if today is still empty).
    let streak = 0;
    const cursor = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    if (!byDay.has(cursor.toISOString().slice(0, 10))) cursor.setUTCDate(cursor.getUTCDate() - 1);
    while (byDay.has(cursor.toISOString().slice(0, 10))) {
        streak++;
        cursor.setUTCDate(cursor.getUTCDate() - 1);
    }

    const total = [...byDay.values()].reduce((sum, n) => sum + n, 0);
    return {
        totalContributions: total,
        currentStreak: streak,
        averagePerDay: Math.round((total / DAYS) * 10) / 10,
        recentContributions: [...byDay.entries()]
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => b.date.localeCompare(a.date)),
    };
}
