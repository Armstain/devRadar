import { describe, expect, it } from "vitest";
import { summarizeEvents } from "./github";

const now = new Date("2026-10-06T15:00:00Z");
const ev = (type: string, iso: string) => ({ type, created_at: iso });

describe("summarizeEvents", () => {
    it("counts pushes and creates per UTC day within 30 days", () => {
        const summary = summarizeEvents(
            [
                ev("PushEvent", "2026-10-06T09:00:00Z"),
                ev("PushEvent", "2026-10-06T10:00:00Z"),
                ev("CreateEvent", "2026-10-05T23:59:00Z"),
                ev("WatchEvent", "2026-10-05T12:00:00Z"),
                ev("PushEvent", "2026-08-01T12:00:00Z"),
            ],
            now
        );
        expect(summary.recentContributions).toEqual([
            { date: "2026-10-06", count: 2 },
            { date: "2026-10-05", count: 1 },
        ]);
        expect(summary.totalContributions).toBe(3);
        expect(summary.averagePerDay).toBe(0.1);
    });

    it("counts a streak ending today, or yesterday when today is empty", () => {
        const days = ["2026-10-05", "2026-10-04", "2026-10-03", "2026-10-01"];
        const summary = summarizeEvents(days.map((d) => ev("PushEvent", `${d}T12:00:00Z`)), now);
        expect(summary.currentStreak).toBe(3);
        expect(summarizeEvents([], now).currentStreak).toBe(0);
    });
});
