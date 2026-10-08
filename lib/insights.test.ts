import { describe, expect, it } from "vitest";
import type { Application, ApplicationEvent, ApplicationStatus } from "./applications";
import { computeInsights, fitBand, fitFinding, weekStart, type Insights } from "./insights";

const now = new Date("2026-10-08T12:00:00Z"); // a Thursday
const DAY = 24 * 60 * 60 * 1000;
const at = (daysAgo: number) => new Date(now.getTime() - daysAgo * DAY).toISOString();

let n = 0;
function app(status: ApplicationStatus, createdDaysAgo: number): Application {
    n++;
    return {
        id: `app-${n}`,
        company: `Company ${n}`,
        position: "Engineer",
        status,
        link: "",
        notes: "",
        followedUpAt: null,
        snoozedUntil: null,
        createdAt: at(createdDaysAgo),
        updatedAt: at(createdDaysAgo),
    };
}
const move = (from: ApplicationStatus, to: ApplicationStatus, daysAgo: number): ApplicationEvent => ({
    id: `e-${++n}`,
    type: "status_changed",
    fromStatus: from,
    toStatus: to,
    createdAt: at(daysAgo),
});
const followedUp = (daysAgo: number): ApplicationEvent => ({ id: `e-${++n}`, type: "followed_up", fromStatus: null, toStatus: null, createdAt: at(daysAgo) });

describe("computeInsights", () => {
    const a = app("in-progress", 30); // replied after 6 days, still interviewing
    const b = app("rejected", 20); // rejected after 10 days
    const c = app("offer", 40); // interview after 2 days, offer 14 days later
    const d = app("applied", 12); // followed up, still waiting
    const e = app("applied", 3);
    const f = app("in-progress", 25); // imported as in progress: answered, no timing
    const events = {
        [a.id]: [move("applied", "in-progress", 24)],
        [b.id]: [move("applied", "rejected", 10)],
        [c.id]: [move("applied", "in-progress", 38), move("in-progress", "offer", 24)],
        [d.id]: [followedUp(1)],
    };
    const insights = computeInsights({ applications: [a, b, c, d, e, f], events, fitScores: { [a.id]: 82, [b.id]: 40, [c.id]: 90 } }, now);

    it("counts replies, interviews and offers", () => {
        expect(insights.total).toBe(6);
        expect(insights.replied).toBe(4);
        expect(insights.responseRate).toBeCloseTo(4 / 6);
        expect(insights.interviews).toBe(3);
        expect(insights.offers).toBe(1);
    });

    it("times the first reply from the day the application was added", () => {
        expect(insights.replyTimes.map((r) => [r.company, r.days, r.outcome])).toEqual([
            [c.company, 2, "interview"],
            [a.company, 6, "interview"],
            [b.company, 10, "rejected"],
        ]);
        expect(insights.medianDaysToReply).toBe(6);
    });

    it("measures time in each stage, separating finished from open", () => {
        const [waiting, interviewing] = insights.stages;
        expect(waiting).toMatchObject({ medianDays: 6, finished: 3, open: 2 });
        // Only c has left interviews (14 days); a and f are still in them, but f has no history
        expect(interviewing).toMatchObject({ medianDays: 14, finished: 1, open: 1 });
    });

    it("groups applications into the weeks they were sent", () => {
        expect(insights.weekly).toHaveLength(12);
        expect(insights.weekly.at(-1)).toMatchObject({ weekStart: "2026-10-05T00:00:00.000Z", sent: 1, replied: 0 });
        expect(insights.weekly.reduce((sum, w) => sum + w.sent, 0)).toBe(6);
    });

    it("splits reply rates by fit score", () => {
        const band = (id: string) => insights.byFit.find((b) => b.band === id)!;
        expect(band("strong")).toMatchObject({ sent: 2, replied: 2, rate: 1 });
        expect(band("stretch")).toMatchObject({ sent: 1, replied: 1 });
        expect(band("unscored")).toMatchObject({ sent: 3, replied: 1 });
        expect(band("good")).toMatchObject({ sent: 0, rate: null });
    });

    it("credits a reply to a follow-up only if it came after it", () => {
        expect(insights.followUps).toEqual({ followedUp: 1, answered: 0 });
        const g = app("in-progress", 30);
        const later = computeInsights(
            { applications: [g], events: { [g.id]: [followedUp(15), move("applied", "in-progress", 10)] }, fitScores: {} },
            now
        );
        expect(later.followUps).toEqual({ followedUp: 1, answered: 1 });
    });

    it("handles an empty pipeline", () => {
        const empty = computeInsights({ applications: [], events: {}, fitScores: {} }, now);
        expect(empty).toMatchObject({ total: 0, responseRate: null, medianDaysToReply: null });
    });
});

describe("helpers", () => {
    it("starts weeks on Monday in UTC", () => {
        expect(weekStart(new Date("2026-10-11T23:00:00Z")).toISOString()).toBe("2026-10-05T00:00:00.000Z");
        expect(weekStart(new Date("2026-10-05T00:00:00Z")).toISOString()).toBe("2026-10-05T00:00:00.000Z");
    });

    it("bands fit scores like the fit verdicts", () => {
        expect([fitBand(90), fitBand(75), fitBand(60), fitBand(54), fitBand(10), fitBand(null)]).toEqual([
            "strong",
            "strong",
            "good",
            "stretch",
            "stretch",
            "unscored",
        ]);
    });
});

describe("fitFinding", () => {
    const bands = (strong: [number, number], stretch: [number, number]): Insights["byFit"] => [
        { band: "strong", label: "", sent: strong[0], replied: strong[1], rate: strong[0] ? strong[1] / strong[0] : null },
        { band: "good", label: "", sent: 0, replied: 0, rate: null },
        { band: "stretch", label: "", sent: stretch[0], replied: stretch[1], rate: stretch[0] ? stretch[1] / stretch[0] : null },
        { band: "unscored", label: "", sent: 0, replied: 0, rate: null },
    ];

    it("compares only when both bands have enough applications", () => {
        expect(fitFinding(bands([2, 2], [5, 1]))).toBeNull();
        expect(fitFinding(bands([4, 3], [6, 2]))).toBe("Strong-fit applications got replies 2.3× as often as stretches (75% vs 33%).");
    });

    it("says so when fit makes no difference, or the other way round", () => {
        expect(fitFinding(bands([4, 2], [4, 2]))).toMatch(/^Fit score hasn’t changed/);
        expect(fitFinding(bands([4, 1], [4, 3]))).toMatch(/^Stretches are getting more replies/);
        expect(fitFinding(bands([3, 2], [3, 0]))).toMatch(/stretches haven’t had one yet/);
    });
});
