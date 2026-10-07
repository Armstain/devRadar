import { describe, expect, it } from "vitest";
import { dailySeries } from "./use-github";

describe("dailySeries", () => {
    it("fills missing days with zero, oldest first, ending today (UTC)", () => {
        const series = dailySeries(
            [
                { date: "2026-10-06", count: 3 },
                { date: "2026-10-04", count: 1 },
            ],
            4,
            new Date("2026-10-06T23:30:00Z")
        );
        expect(series).toEqual([
            { date: "2026-10-03", count: 0 },
            { date: "2026-10-04", count: 1 },
            { date: "2026-10-05", count: 0 },
            { date: "2026-10-06", count: 3 },
        ]);
    });
});
