import type { Application, ApplicationEvent } from "@/lib/applications";
import { verdictFor } from "@/lib/fit/score";

// Search analytics from the application history. Everything here is derived
// from stage-change events, so it's only as good as the history: an
// application imported already past "applied" counts as answered, but has no
// reply time.

const DAY_MS = 24 * 60 * 60 * 1000;
// A reply this soon after a follow-up is credited to it
const FOLLOW_UP_WINDOW_DAYS = 21;
// Below this, a rate is shown but not compared
export const MIN_SAMPLE = 3;
export const WEEKS = 12;

export interface InsightsInput {
    applications: Application[];
    events: Record<string, ApplicationEvent[]>;
    // Current fit score of the job post each application came from
    fitScores: Record<string, number | null>;
}

export type FitBand = "strong" | "good" | "stretch" | "unscored";

export interface Insights {
    total: number;
    replied: number;
    responseRate: number | null;
    interviews: number;
    offers: number;
    // One entry per application with a known reply time, fastest first
    replyTimes: { id: string; company: string; days: number; outcome: "interview" | "rejected" | "offer" }[];
    medianDaysToReply: number | null;
    stages: { id: "waiting" | "interviewing"; label: string; medianDays: number | null; finished: number; open: number }[];
    weekly: { weekStart: string; sent: number; replied: number }[];
    byFit: { band: FitBand; label: string; sent: number; replied: number; rate: number | null }[];
    followUps: { followedUp: number; answered: number };
}

const firstReply = (events: ApplicationEvent[]) =>
    events.find((e) => e.type === "status_changed" && e.fromStatus === "applied" && e.toStatus !== "applied");

function median(values: number[]): number | null {
    if (!values.length) return null;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

const days = (from: string | Date, to: string | Date) => Math.max(0, (new Date(to).getTime() - new Date(from).getTime()) / DAY_MS);

// Monday 00:00 UTC of the week containing `date`
export function weekStart(date: Date): Date {
    const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
    return d;
}

export function fitBand(score: number | null | undefined): FitBand {
    if (score === null || score === undefined) return "unscored";
    const verdict = verdictFor(score);
    return verdict === "Strong fit" ? "strong" : verdict === "Good fit" ? "good" : "stretch";
}

const BAND_LABELS: Record<FitBand, string> = {
    strong: "Strong fit (75+)",
    good: "Good fit (55–74)",
    stretch: "Stretch (under 55)",
    unscored: "No fit report",
};

export function computeInsights({ applications, events, fitScores }: InsightsInput, now: Date): Insights {
    const answered = (app: Application) => app.status !== "applied";
    const replied = applications.filter(answered);

    const replyTimes: Insights["replyTimes"] = [];
    const waitingFinished: number[] = [];
    const interviewingFinished: number[] = [];
    let interviewingOpen = 0;
    let followedUp = 0;
    let answeredAfterFollowUp = 0;

    for (const app of applications) {
        const history = events[app.id] ?? [];
        const reply = firstReply(history);
        if (reply) {
            const d = days(app.createdAt, reply.createdAt);
            waitingFinished.push(d);
            replyTimes.push({
                id: app.id,
                company: app.company,
                days: d,
                outcome: reply.toStatus === "rejected" ? "rejected" : reply.toStatus === "offer" ? "offer" : "interview",
            });
        }

        // Interviewing: from entering "in progress" to an offer or a rejection
        const entered = history.find((e) => e.toStatus === "in-progress");
        if (entered) {
            const left = history.find(
                (e) => e.type === "status_changed" && e.fromStatus === "in-progress" && new Date(e.createdAt) >= new Date(entered.createdAt)
            );
            if (left) interviewingFinished.push(days(entered.createdAt, left.createdAt));
            else if (app.status === "in-progress") interviewingOpen++;
        }

        const firstFollowUp = history.find((e) => e.type === "followed_up");
        if (firstFollowUp) {
            followedUp++;
            const after = history.find(
                (e) =>
                    e.type === "status_changed" &&
                    new Date(e.createdAt) > new Date(firstFollowUp.createdAt) &&
                    days(firstFollowUp.createdAt, e.createdAt) <= FOLLOW_UP_WINDOW_DAYS
            );
            if (after) answeredAfterFollowUp++;
        }
    }
    replyTimes.sort((a, b) => a.days - b.days);

    const thisWeek = weekStart(now).getTime();
    const weekly = Array.from({ length: WEEKS }, (_, i) => {
        const start = thisWeek - (WEEKS - 1 - i) * 7 * DAY_MS;
        const sent = applications.filter((a) => {
            const t = new Date(a.createdAt).getTime();
            return t >= start && t < start + 7 * DAY_MS;
        });
        return { weekStart: new Date(start).toISOString(), sent: sent.length, replied: sent.filter(answered).length };
    });

    const bands: FitBand[] = ["strong", "good", "stretch", "unscored"];
    const byFit = bands.map((band) => {
        const inBand = applications.filter((a) => fitBand(fitScores[a.id]) === band);
        const r = inBand.filter(answered).length;
        return { band, label: BAND_LABELS[band], sent: inBand.length, replied: r, rate: inBand.length ? r / inBand.length : null };
    });

    return {
        total: applications.length,
        replied: replied.length,
        responseRate: applications.length ? replied.length / applications.length : null,
        interviews: applications.filter((a) => a.status === "in-progress" || a.status === "offer" || (events[a.id] ?? []).some((e) => e.toStatus === "in-progress")).length,
        offers: applications.filter((a) => a.status === "offer").length,
        replyTimes,
        medianDaysToReply: median(waitingFinished),
        stages: [
            {
                id: "waiting",
                label: "Waiting for a first reply",
                medianDays: median(waitingFinished),
                finished: waitingFinished.length,
                open: applications.filter((a) => a.status === "applied").length,
            },
            {
                id: "interviewing",
                label: "Interviewing, to an answer",
                medianDays: median(interviewingFinished),
                finished: interviewingFinished.length,
                open: interviewingOpen,
            },
        ],
        weekly,
        byFit,
        followUps: { followedUp, answered: answeredAfterFollowUp },
    };
}

// One plain sentence about fit and replies, only when both ends have enough
// applications to compare.
export function fitFinding(byFit: Insights["byFit"]): string | null {
    const strong = byFit.find((b) => b.band === "strong")!;
    const stretch = byFit.find((b) => b.band === "stretch")!;
    if (strong.sent < MIN_SAMPLE || stretch.sent < MIN_SAMPLE || strong.rate === null || stretch.rate === null) return null;
    const pct = (r: number) => `${Math.round(r * 100)}%`;
    if (stretch.rate === 0) return `Strong-fit applications got replies ${pct(strong.rate)} of the time; stretches haven’t had one yet.`;
    const ratio = strong.rate / stretch.rate;
    if (ratio >= 1.25) return `Strong-fit applications got replies ${ratio.toFixed(1)}× as often as stretches (${pct(strong.rate)} vs ${pct(stretch.rate)}).`;
    if (ratio <= 0.8) return `Stretches are getting more replies than strong fits (${pct(stretch.rate)} vs ${pct(strong.rate)}), so your reach roles are landing.`;
    return `Fit score hasn’t changed your reply rate much so far (${pct(strong.rate)} for strong fits, ${pct(stretch.rate)} for stretches).`;
}
