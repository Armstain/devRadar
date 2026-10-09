import { describe, expect, it } from "vitest";
import { parseCv } from "@/lib/cv/parse";
import type { JobRequirement } from "@/lib/job-posts";
import { makeRepo, makeSnapshot } from "@/lib/skills/fixtures";
import { buildSkillProfile } from "@/lib/skills/profile";
import { combineWithCv } from "./cv";
import { scoreFit } from "./score";

const now = new Date("2026-10-08T12:00:00Z");

const requirements: JobRequirement[] = [
    { skill: "React", importance: "required", quote: "5+ years building with React" },
    { skill: "TypeScript", importance: "required", quote: "TypeScript" },
    { skill: "Kubernetes", importance: "required", quote: "Kubernetes in production" },
    { skill: "GraphQL", importance: "preferred", quote: "Familiarity with GraphQL" },
    { skill: "Mentoring", importance: "required", quote: "Mentor two engineers" },
    { skill: "Public speaking", importance: "preferred", quote: "Speak at meetups" },
];

const CV = `Experience
Senior Frontend Engineer, Parcel
Jan 2020 – Present
Built the dashboard in React; mentored two engineers.

Skills
Kubernetes`;

const profile = buildSkillProfile(
    makeSnapshot([
        makeRepo({ name: "shop", deps: { npm: ["react", "typescript"] } }),
        makeRepo({ name: "admin", deps: { npm: ["react", "typescript"] } }),
    ]),
    now
);

describe("combineWithCv", () => {
    const fit = scoreFit(requirements, profile);
    const cv = parseCv(CV, "cv.pdf", now);
    const combined = combineWithCv(fit, cv, "senior");
    const req = (skill: string) => combined.requirements.find((r) => r.skill === skill)!;

    it("marks where each requirement's evidence comes from", () => {
        expect(req("React").source).toBe("both");
        expect(req("TypeScript").source).toBe("code");
        expect(req("Kubernetes").source).toBe("cv");
        expect(req("GraphQL").source).toBe("neither");
        expect(req("Mentoring").source).toBe("cv");
        expect(req("Public speaking").source).toBe("neither");
        expect(combined.cvOnly).toBe(2);
    });

    it("checks the years a post asks for against the CV", () => {
        expect(req("React").cv).toMatchObject({ found: true, yearsAsked: 5, months: 82 });
        expect(req("React").cv.detail).toMatch(/about 7 years in Senior Frontend Engineer/);
    });

    it("raises the score with CV evidence, never lowers it, and keeps the code score", () => {
        expect(combined.codeScore).toBe(fit.score);
        expect(combined.score!).toBeGreaterThan(fit.score!);
        const empty = combineWithCv(fit, parseCv("Nothing relevant here", "cv.txt", now), null);
        expect(empty.score).toBe(fit.score);
    });

    it("compares seniority with the post", () => {
        expect(combined.experience).toMatchObject({ seniority: "senior", asked: "senior", match: "meets" });
        expect(combineWithCv(fit, cv, "staff").experience.match).toBe("below");
    });

    it("scores from the CV alone when GitHub isn't connected", () => {
        const noCode = combineWithCv(scoreFit(requirements, null), cv, null);
        expect(noCode.codeScore).toBeNull();
        expect(noCode.score).toBeGreaterThan(0);
        expect(noCode.requirements.find((r) => r.skill === "React")!.source).toBe("cv");
    });
});
