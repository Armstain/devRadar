import { describe, expect, it } from "vitest";
import { dateLine, greeting, isoWeek, plural, radarScale, shortDate, timeAgo } from "./format";

describe("greeting", () => {
    it("follows the time of day", () => {
        expect(greeting(6)).toBe("Good morning");
        expect(greeting(13)).toBe("Good afternoon");
        expect(greeting(19)).toBe("Good evening");
        expect(greeting(2)).toBe("Working late");
    });
});

describe("isoWeek", () => {
    it("matches ISO 8601, including year boundaries", () => {
        expect(isoWeek(new Date(2026, 9, 6))).toBe(41);
        expect(isoWeek(new Date(2026, 0, 1))).toBe(1);
        expect(isoWeek(new Date(2027, 0, 1))).toBe(53);
        expect(isoWeek(new Date(2024, 11, 30))).toBe(1);
    });
});

describe("dateLine", () => {
    it("formats the dashboard overline", () => {
        expect(dateLine(new Date(2026, 9, 6))).toBe("Tue 06 Oct · Week 41");
    });
});

describe("shortDate", () => {
    it("uses fixed three-letter months", () => {
        expect(shortDate(new Date(2026, 8, 16))).toBe("16 Sep");
        expect(shortDate(new Date(2026, 0, 3))).toBe("3 Jan");
    });
});

describe("plural", () => {
    it("handles one and many", () => {
        expect(plural(1, "application")).toBe("1 application");
        expect(plural(3, "application")).toBe("3 applications");
    });
});

describe("radarScale", () => {
    it("keeps order and lifts small shares", () => {
        expect(radarScale(58, 58)).toBe(1);
        expect(radarScale(4, 58)).toBeCloseTo(0.263, 2);
        expect(radarScale(14, 58)).toBeGreaterThan(radarScale(4, 58));
        expect(radarScale(1, 0)).toBe(0);
    });
});

describe("timeAgo", () => {
    it("rounds down to the largest sensible unit", () => {
        const now = new Date("2026-10-07T12:00:00Z");
        expect(timeAgo("2026-10-07T11:59:30Z", now)).toBe("just now");
        expect(timeAgo("2026-10-07T11:48:00Z", now)).toBe("12 min ago");
        expect(timeAgo("2026-10-07T08:30:00Z", now)).toBe("3 h ago");
        expect(timeAgo("2026-10-02T12:00:00Z", now)).toBe("5 d ago");
        expect(timeAgo("2026-07-01T12:00:00Z", now)).toBe("1 Jul");
    });
});
