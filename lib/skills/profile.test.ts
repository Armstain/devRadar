import { describe, expect, it } from "vitest";
import { TECHNOLOGIES } from "./catalog";
import { detectTechnologies, significantLanguages } from "./detect";
import { makeRepo, makeSnapshot } from "./fixtures";
import { buildSkillProfile, repoWeight } from "./profile";

const now = new Date("2026-10-01T00:00:00Z");

const webApp = makeRepo({
    name: "storefront",
    stars: 42,
    languages: [
        { name: "TypeScript", color: "#3178c6", bytes: 400_000 },
        { name: "CSS", color: "#663399", bytes: 60_000 },
    ],
    deps: { npm: ["next", "react", "tailwindcss", "drizzle-orm", "postgres", "@clerk/nextjs", "vitest", "@playwright/test", "eslint"] },
    files: ["next.config.ts", "drizzle.config.ts", ".github/workflows", "Dockerfile"],
});

const api = makeRepo({
    name: "billing-api",
    pushedAt: "2026-08-15T00:00:00Z",
    languages: [{ name: "Go", color: "#00ADD8", bytes: 250_000 }],
    deps: { go: ["github.com/gin-gonic/gin", "github.com/jackc/pgx/v5", "github.com/redis/go-redis/v9"] },
    files: ["Dockerfile", "go.mod"],
});

const notebook = makeRepo({
    name: "churn-model",
    pushedAt: "2023-02-01T00:00:00Z",
    languages: [{ name: "Jupyter Notebook", color: "#DA5B0B", bytes: 900_000 }],
    deps: { pypi: ["pandas", "scikit-learn", "torch"] },
});

describe("detectTechnologies", () => {
    it("detects from dependencies, root files and languages", () => {
        const found = detectTechnologies(webApp);
        expect(found).toEqual(
            expect.arrayContaining(["nextjs", "react", "tailwind", "drizzle", "postgres", "auth", "unit-tests", "e2e", "linting", "github-actions", "docker", "typescript", "css"])
        );
        expect(found).not.toContain("vue");
        expect(detectTechnologies(api)).toEqual(expect.arrayContaining(["go", "gin", "postgres", "redis", "docker"]));
    });

    it("matches wildcard dependency names and normalised Python names", () => {
        expect(detectTechnologies(makeRepo({ name: "a", deps: { npm: ["@nestjs/core"] } }))).toContain("nestjs");
        expect(detectTechnologies(makeRepo({ name: "b", deps: { pypi: ["langchain-openai"] } }))).toContain("langchain");
        expect(detectTechnologies(makeRepo({ name: "c", deps: { pypi: ["psycopg2-binary"] } }))).toContain("postgres");
    });

    it("ignores languages that are only a sliver of a repository", () => {
        const repo = makeRepo({
            name: "mostly-ts",
            languages: [
                { name: "TypeScript", color: null, bytes: 500_000 },
                { name: "Shell", color: null, bytes: 2_000 },
            ],
        });
        expect(significantLanguages(repo)).toEqual(["TypeScript"]);
        expect(detectTechnologies(repo)).not.toContain("shell");
    });

    it("only references areas and ids that exist", () => {
        const ids = new Set<string>();
        for (const tech of TECHNOLOGIES) {
            expect(ids.has(tech.id), `duplicate id ${tech.id}`).toBe(false);
            ids.add(tech.id);
            expect(tech.deps || tech.files || tech.languages, `${tech.id} has no detection rule`).toBeTruthy();
        }
    });
});

describe("repoWeight", () => {
    it("halves each year since the last push and favours substantial repositories", () => {
        const fresh = repoWeight(makeRepo({ name: "x", pushedAt: now.toISOString() }), now);
        const yearOld = repoWeight(makeRepo({ name: "x", pushedAt: "2025-10-01T00:00:00Z" }), now);
        expect(yearOld / fresh).toBeCloseTo(0.5, 1);
        const tiny = repoWeight(makeRepo({ name: "x", pushedAt: now.toISOString(), languages: [{ name: "Go", color: null, bytes: 300 }] }), now);
        expect(tiny).toBeLessThan(fresh / 2);
        expect(repoWeight(makeRepo({ name: "x", pushedAt: "2010-01-01T00:00:00Z" }), now)).toBeGreaterThan(0);
    });
});

describe("buildSkillProfile", () => {
    const calendarDays = Array.from({ length: 14 }, (_, i) => ({
        date: new Date(now.getTime() - (13 - i) * 86_400_000).toISOString().slice(0, 10),
        // Active the last 4 days and on day 2–4
        count: i >= 10 || (i >= 2 && i <= 4) ? 3 : 0,
    }));
    const profile = buildSkillProfile(makeSnapshot([webApp, api, notebook], { calendar: { total: 21, days: calendarDays } }), now);

    it("scores areas from the evidence, strongest where the recent work is", () => {
        const score = (id: string) => profile.areas.find((a) => a.id === id)!.score;
        expect(score("frontend")).toBeGreaterThan(score("ai"));
        expect(score("backend")).toBeGreaterThan(0);
        expect(score("data")).toBeGreaterThan(score("ai"));
        for (const area of profile.areas) {
            expect(area.score).toBeGreaterThanOrEqual(0);
            expect(area.score).toBeLessThanOrEqual(100);
        }
    });

    it("explains each technology with the repositories behind it", () => {
        const postgres = profile.technologies.find((t) => t.id === "postgres")!;
        expect(postgres.repoCount).toBe(2);
        expect(postgres.evidence.map((e) => e.repo)).toEqual(["storefront", "billing-api"]);
        expect(postgres.lastUsed).toBe(webApp.pushedAt);
        // Old work still counts, but less
        const torch = profile.technologies.find((t) => t.id === "pytorch")!;
        expect(torch.strength).toBeLessThan(postgres.strength);
    });

    it("summarises activity from the contribution calendar", () => {
        expect(profile.activity).toMatchObject({ total: 21, currentStreak: 4, longestStreak: 4, activeDays: 7 });
    });

    it("writes a headline, archetype and insights", () => {
        expect(profile.archetype).toBe("Full-stack engineer");
        expect(profile.headline).toMatch(/^Strongest in /);
        // Names the stack, not shared practices like CI or linting
        expect(profile.headline).toMatch(/Next\.js|React|PostgreSQL/);
        expect(profile.headline).not.toMatch(/GitHub Actions|Linting|Unit testing/);
        expect(profile.insights.length).toBeGreaterThan(0);
        expect(profile.insights.some((i) => i.text.includes("storefront is your most starred project"))).toBe(true);
    });

    it("flags missing tests and CI as gaps", () => {
        const untested = buildSkillProfile(
            makeSnapshot([makeRepo({ name: "a" }), makeRepo({ name: "b" }), makeRepo({ name: "c", deps: { npm: ["react"] } })]),
            now
        );
        const cautions = untested.insights.filter((i) => i.tone === "caution").map((i) => i.text);
        expect(cautions).toEqual([expect.stringMatching(/^None of your 3 repositories has automated tests/), expect.stringMatching(/^No CI pipeline/)]);
    });

    it("names the profile after the work, not the supporting areas", () => {
        const api = (name: string) =>
            makeRepo({ name, languages: [{ name: "Go", color: null, bytes: 300_000 }], deps: { go: ["github.com/gin-gonic/gin", "github.com/jackc/pgx/v5", "github.com/redis/go-redis/v9"] } });
        expect(buildSkillProfile(makeSnapshot([api("a"), api("b")]), now).archetype).toBe("Backend engineer");

        const pipeline = (name: string) => makeRepo({ name, languages: [{ name: "Python", color: null, bytes: 300_000 }], deps: { pypi: ["pandas", "apache-airflow", "psycopg2"] } });
        expect(buildSkillProfile(makeSnapshot([pipeline("a"), pipeline("b")]), now).archetype).toBe("Data engineer");
    });

    it("handles an account with no repositories", () => {
        const empty = buildSkillProfile(makeSnapshot([]), now);
        expect(empty.archetype).toBe("Getting started");
        expect(empty.areas.every((a) => a.score === 0)).toBe(true);
        expect(empty.headline).toMatch(/Not enough public code/);
        expect(empty.repos).toEqual([]);
    });
});
