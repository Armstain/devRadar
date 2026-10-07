import { describe, expect, it } from "vitest";
import { heatmapLayout } from "./heatmap";

const day = (date: string, count: number) => ({ date, count });

describe("heatmapLayout", () => {
    it("places days in week columns with Sunday on top", () => {
        // 2026-09-27 is a Sunday
        const days = Array.from({ length: 8 }, (_, i) => day(`2026-${i < 4 ? "09" : "10"}-${String(i < 4 ? 27 + i : i - 3).padStart(2, "0")}`, 0));
        const { cells, weeks } = heatmapLayout(days);
        expect(cells[0]).toMatchObject({ date: "2026-09-27", week: 0, weekday: 0 });
        expect(cells[6]).toMatchObject({ date: "2026-10-03", week: 0, weekday: 6 });
        expect(cells[7]).toMatchObject({ date: "2026-10-04", week: 1, weekday: 0 });
        expect(weeks).toBe(2);
    });

    it("starts mid-week when the calendar does", () => {
        // 2026-10-01 is a Thursday
        const { cells } = heatmapLayout(["01", "02", "03", "04"].map((d) => day(`2026-10-${d}`, 0)));
        expect(cells.map((c) => [c.week, c.weekday])).toEqual([
            [0, 4],
            [0, 5],
            [0, 6],
            [1, 0],
        ]);
    });

    it("splits active days into quartile levels", () => {
        const counts = [0, 1, 2, 3, 4, 5, 6, 7, 40];
        const { cells } = heatmapLayout(counts.map((c, i) => day(`2026-09-${String(i + 10).padStart(2, "0")}`, c)));
        expect(cells.map((c) => c.level)).toEqual([0, 1, 1, 1, 2, 2, 3, 3, 4]);
    });

    it("labels months at the first week that starts in them", () => {
        const days = Array.from({ length: 77 }, (_, i) => day(new Date(Date.UTC(2026, 6, 5) + i * 86_400_000).toISOString().slice(0, 10), 0));
        expect(heatmapLayout(days).months.map((m) => m.label)).toEqual(["Jul", "Aug", "Sep"]);
    });

    it("drops a month label that would be cut off at the right edge", () => {
        // Ends on the first Monday of October, a column after the "Oct" label
        const days = Array.from({ length: 65 }, (_, i) => day(new Date(Date.UTC(2026, 7, 2) + i * 86_400_000).toISOString().slice(0, 10), 0));
        expect(heatmapLayout(days).months.map((m) => m.label)).toEqual(["Aug", "Sep"]);
    });
});
