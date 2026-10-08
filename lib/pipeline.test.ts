import { describe, expect, it } from "vitest";
import type { Application } from "./applications";
import { byPriority, daysSince, isSnoozed, needsFollowUp, pipelineStats, relativeDays } from "./pipeline";

const now = new Date("2026-10-06T12:00:00Z");
const daysAgo = (n: number) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000).toISOString();

let id = 0;
const app = (status: Application["status"], createdDaysAgo: number, updatedDaysAgo?: number): Application => ({
    id: String(++id),
    company: `Company ${id}`,
    position: "Engineer",
    status,
    link: "",
    notes: "",
    followedUpAt: null,
    snoozedUntil: null,
    createdAt: daysAgo(createdDaysAgo),
    updatedAt: daysAgo(updatedDaysAgo ?? createdDaysAgo),
});

describe("needsFollowUp", () => {
    it("flags active applications quiet for 10+ days", () => {
        expect(needsFollowUp(app("applied", 10), now)).toBe(true);
        expect(needsFollowUp(app("applied", 9), now)).toBe(false);
        expect(needsFollowUp(app("in-progress", 30, 12), now)).toBe(true);
    });

    it("uses the latest update, not the creation date", () => {
        expect(needsFollowUp(app("applied", 30, 2), now)).toBe(false);
    });

    it("holds the reminder back while snoozed", () => {
        const snoozed = { ...app("applied", 20), snoozedUntil: daysAgo(-3) };
        expect(needsFollowUp(snoozed, now)).toBe(false);
        expect(isSnoozed(snoozed, now)).toBe(true);
        expect(needsFollowUp({ ...snoozed, snoozedUntil: daysAgo(1) }, now)).toBe(true);
    });

    it("lets a snooze end before the quiet period without bringing the reminder forward", () => {
        expect(needsFollowUp({ ...app("applied", 4), snoozedUntil: daysAgo(1) }, now)).toBe(false);
    });

    it("never flags finished applications", () => {
        expect(needsFollowUp(app("offer", 40), now)).toBe(false);
        expect(needsFollowUp(app("rejected", 40), now)).toBe(false);
    });
});

describe("pipelineStats", () => {
    const apps = [
        app("applied", 2),
        app("applied", 20),
        app("applied", 12, 11),
        app("in-progress", 15, 1),
        app("in-progress", 8),
        app("offer", 30, 3),
        app("rejected", 25, 10),
        app("rejected", 6),
    ];
    const stats = pipelineStats(apps, now);

    it("counts stages", () => {
        expect(stats).toMatchObject({ total: 8, active: 5, inProgress: 2, offers: 1, rejected: 2, addedThisWeek: 2 });
    });

    it("computes the response rate from any answer", () => {
        expect(stats.responseRate).toBeCloseTo(5 / 8);
    });

    it("builds a cumulative funnel with stage-to-stage conversion", () => {
        expect(stats.funnel).toEqual([
            { label: "Applied", count: 8, conversion: null },
            { label: "In progress", count: 3, conversion: 3 / 8 },
            { label: "Offer", count: 1, conversion: 1 / 3 },
        ]);
    });

    it("lists follow-ups oldest first", () => {
        expect(stats.followUps.map((a) => a.createdAt)).toEqual([daysAgo(20), daysAgo(12)]);
    });

    it("handles an empty pipeline", () => {
        const empty = pipelineStats([], now);
        expect(empty.responseRate).toBeNull();
        expect(empty.funnel.every((s) => s.count === 0 && s.conversion === null)).toBe(true);
    });
});

describe("byPriority", () => {
    it("puts interviews first, then offers, applied, rejected; newest first within a stage", () => {
        const a = app("applied", 5);
        const b = app("in-progress", 9);
        const c = app("applied", 1);
        const d = app("rejected", 1);
        const e = app("offer", 3);
        expect(byPriority([a, b, c, d, e]).map((x) => x.id)).toEqual([b.id, e.id, c.id, a.id, d.id]);
    });
});

describe("relative dates", () => {
    it("formats day counts", () => {
        expect(relativeDays(0)).toBe("Today");
        expect(relativeDays(1)).toBe("Yesterday");
        expect(relativeDays(14)).toBe("14 days ago");
        expect(daysSince(new Date(daysAgo(3)), now)).toBe(3);
    });
});
