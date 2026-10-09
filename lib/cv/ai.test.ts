import { describe, expect, it } from "vitest";
import { applyAiRead, cvReadSchema } from "./ai";
import { parseCv } from "./parse";

const now = new Date("2026-10-08T12:00:00Z");

describe("applyAiRead", () => {
    const local = parseCv("A two-column CV the rules couldn’t follow, mentioning React and Docker somewhere in it.", "cv.pdf", now);

    it("rebuilds roles, experience and technology time from the AI's roles", () => {
        const cv = applyAiRead(
            local,
            {
                roles: [
                    { title: "Senior Frontend Engineer", company: "Parcel", start: "2023-01", end: null, technologies: ["React", "TypeScript"] },
                    { title: "Frontend Developer", company: null, start: "2020-03", end: "2022-12", technologies: ["React.js", "Docker"] },
                ],
            },
            now
        );
        expect(cv.source).toBe("ai");
        expect(cv.roles).toHaveLength(2);
        expect(cv.totalMonths).toBe(46 + 34);
        expect(cv.seniority).toBe("senior");
        expect(cv.technologies.find((t) => t.id === "react")?.months).toBe(80);
        expect(cv.technologies.find((t) => t.id === "docker")?.months).toBe(34);
        // The text and file name stay as they were
        expect(cv.text).toBe(local.text);
    });

    it("rejects malformed dates from the model", () => {
        expect(cvReadSchema.safeParse({ roles: [{ title: "Dev", company: null, start: "2023", end: null, technologies: [] }] }).success).toBe(false);
    });
});
