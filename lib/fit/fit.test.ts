import { describe, expect, it } from "vitest";
import { groundRequirements, quoteAppearsIn, type JobExtraction } from "@/lib/job-posts";
import { makeRepo, makeSnapshot } from "@/lib/skills/fixtures";
import { buildSkillProfile } from "@/lib/skills/profile";
import { matchTechnologies } from "./match";
import { scoreFit } from "./score";

describe("matchTechnologies", () => {
    it.each([
        ["PostgreSQL", ["postgres"]],
        ["Experience with Postgres", ["postgres"]],
        ["React or Vue", ["react", "vue"]],
        ["React Native", ["react-native"]],
        ["Next.js", ["nextjs"]],
        ["Node.js", ["nodejs"]],
        ["TypeScript", ["typescript"]],
        ["CI/CD pipelines", ["github-actions"]],
        ["REST APIs", ["rest"]],
        ["Go", ["go"]],
        ["Golang", ["go"]],
        ["Go, Rust or Java", ["rust", "java", "go"]],
        ["C#/.NET", ["csharp"]],
        ["AWS (Lambda, S3)", ["aws"]],
        ["Kubernetes", ["kubernetes"]],
        ["LLM APIs such as OpenAI or Anthropic", ["llm-apis"]],
    ])("maps %s", (skill, ids) => {
        expect(matchTechnologies(skill).sort()).toEqual([...ids].sort());
    });

    it.each(["System design", "Good communication skills", "Mentoring junior engineers", "Ability to go deep on problems", "A bachelor's degree"])(
        "leaves %s unmatched",
        (skill) => {
            expect(matchTechnologies(skill)).toEqual([]);
        }
    );
});

describe("grounding", () => {
    const post = `We’re hiring a **Senior Engineer**.\n\nYou have:\n• 5+ years with TypeScript and React\n• Experience with “Postgres” at scale`;

    it("finds quotes despite case, whitespace, curly quotes and markdown", () => {
        expect(quoteAppearsIn("5+ years with TypeScript and React", post)).toBe(true);
        expect(quoteAppearsIn('Experience with "postgres" at scale', post)).toBe(true);
        expect(quoteAppearsIn("Senior Engineer", post)).toBe(true);
        expect(quoteAppearsIn("Experience with Kubernetes", post)).toBe(false);
    });

    it("drops requirements whose quote isn't in the post, and duplicates", () => {
        const extraction = {
            requirements: [
                { skill: "React", importance: "required", quote: "TypeScript and React" },
                { skill: "Kubernetes", importance: "required", quote: "Kubernetes experience" },
                { skill: "react", importance: "preferred", quote: "React" },
            ],
        } as JobExtraction;
        const { extraction: grounded, dropped } = groundRequirements(extraction, post);
        expect(grounded.requirements.map((r) => r.skill)).toEqual(["React"]);
        expect(dropped.map((r) => r.skill)).toEqual(["Kubernetes"]);
    });
});

describe("scoreFit", () => {
    const now = new Date("2026-10-01T00:00:00Z");
    const profile = buildSkillProfile(
        makeSnapshot([
            makeRepo({ name: "shop", deps: { npm: ["react", "next", "postgres", "vitest"] }, files: [".github/workflows"] }),
            makeRepo({ name: "admin", deps: { npm: ["react", "postgres"] } }),
            makeRepo({ name: "api", deps: { npm: ["express", "postgres"] } }),
            makeRepo({ name: "experiment", pushedAt: "2022-01-01T00:00:00Z", languages: [{ name: "Go", color: null, bytes: 2_000 }], deps: { go: ["github.com/gin-gonic/gin"] } }),
        ]),
        now
    );
    const req = (skill: string, importance: "required" | "preferred" = "required") => ({ skill, importance, quote: skill });

    it("grades each requirement against the profile", () => {
        const fit = scoreFit([req("React"), req("PostgreSQL"), req("Gin"), req("Vue"), req("Kubernetes"), req("Mentoring")], profile);
        const status = Object.fromEntries(fit.requirements.map((r) => [r.skill, r.status]));
        expect(status).toEqual({ React: "strong", PostgreSQL: "strong", Gin: "some", Vue: "related", Kubernetes: "gap", Mentoring: "unverifiable" });
        expect(fit.requirements.find((r) => r.skill === "Vue")?.related?.name).toBe("React");
        expect(fit.requirements.find((r) => r.skill === "React")?.technology?.evidence.map((e) => e.repo)).toContain("shop");
    });

    it("counts implied evidence: an Express API is a REST API, an ORM means SQL", () => {
        const fit = scoreFit([req("REST APIs"), req("SQL")], profile);
        expect(fit.requirements.map((r) => [r.status, r.technology?.name])).toEqual([
            ["some", "Express"],
            ["strong", "PostgreSQL"],
        ]);
    });

    it("weights required over preferred and ignores what code can't show", () => {
        const allRequired = scoreFit([req("React"), req("Kubernetes")], profile);
        const gapPreferred = scoreFit([req("React"), req("Kubernetes", "preferred")], profile);
        expect(allRequired.score).toBe(50);
        expect(gapPreferred.score).toBe(67);
        expect(scoreFit([req("React"), req("Kubernetes"), req("Communication")], profile).score).toBe(50);
    });

    it("explains the result and marks low confidence", () => {
        const fit = scoreFit([req("React"), req("Kubernetes")], profile);
        expect(fit.confidence).toBe("low");
        expect(fit.summary).toMatch(/Required gaps: Kubernetes\./);
        expect(fit.verdict).toBe("Stretch");
        expect(fit.areaTargets.frontend).toBe(55);
        expect(fit.areaTargets.devops).toBe(55);
        expect(fit.areaTargets.ai).toBe(0);
    });

    it("doesn't score without a profile or anything checkable", () => {
        expect(scoreFit([req("React")], null)).toMatchObject({ score: null, verdict: "Not enough to score" });
        expect(scoreFit([req("Communication")], profile)).toMatchObject({ score: null, summary: expect.stringMatching(/Nothing in this post/) });
    });
});
