import { SKILL_AREAS, TECHNOLOGY_BY_ID, type SkillAreaId } from "@/lib/skills/catalog";
import type { Evidence, SkillProfile } from "@/lib/skills/types";
import type { JobRequirement } from "@/lib/job-posts";
import { matchTechnologies } from "./match";

// Scores a job's requirements against a skill profile. Deterministic and
// explainable: every requirement gets a status, the evidence behind it and,
// for gaps, a concrete next step. The model only extracted the requirements.

export type RequirementStatus = "strong" | "some" | "related" | "gap" | "unverifiable";

export interface RequirementFit {
    skill: string;
    importance: JobRequirement["importance"];
    quote: string;
    status: RequirementStatus;
    // The technology that best covers it, or the one asked for on a gap
    technology: { id: string; name: string; strength: number; repoCount: number; evidence: Evidence[] } | null;
    // For "related": the technology you do use that's close to the one asked for
    related: { id: string; name: string; strength: number } | null;
    note: string;
}

export interface FitResult {
    // null when nothing in the post can be checked against code
    score: number | null;
    verdict: "Strong fit" | "Good fit" | "Stretch" | "Long shot" | "Not enough to score";
    // Low when fewer than three requirements could be checked
    confidence: "high" | "low";
    summary: string;
    requirements: RequirementFit[];
    // 0–100 per area: how much the role leans on it, for the radar overlay
    areaTargets: Record<SkillAreaId, number>;
    counts: Record<RequirementStatus, number>;
}

// A technology at or above this strength is established in your work.
export const STRONG = 55;

// "some" scales with strength: from 0.3 for a trace to nearly full credit
// just below STRONG.
export function credit(fit: RequirementFit): number {
    switch (fit.status) {
        case "strong":
            return 1;
        case "some":
            return 0.3 + 0.6 * Math.min(1, (fit.technology?.strength ?? 0) / STRONG);
        case "related":
            return 0.35;
        default:
            return 0;
    }
}
export const WEIGHT = { required: 2, preferred: 1 };

// Technologies close enough that one is a credible stepping stone to the other.
const RELATED_GROUPS: string[][] = [
    ["react", "vue", "svelte", "angular", "solid", "nextjs", "nuxt", "remix", "astro"],
    ["react", "react-native", "flutter"],
    ["typescript", "javascript"],
    ["nodejs", "express", "fastify", "nestjs", "hono"],
    ["django", "flask", "fastapi"],
    ["rails", "laravel", "symfony", "django"],
    ["spring", "java", "kotlin", "scala", "csharp"],
    ["go", "rust", "gin", "axum"],
    ["postgres", "mysql", "sqlite", "sql", "supabase"],
    ["prisma", "drizzle", "orm"],
    ["mongodb", "firebase", "supabase"],
    ["redis", "jobs", "kafka"],
    ["graphql", "trpc", "rest"],
    ["aws", "gcp", "azure"],
    ["vercel", "edge", "hosting", "aws"],
    ["docker", "kubernetes"],
    ["github-actions", "ci"],
    ["terraform", "aws", "gcp", "azure"],
    ["unit-tests", "testing-library", "e2e"],
    ["tailwind", "css", "css-in-js", "radix"],
    ["redux", "zustand", "tanstack-query"],
    ["llm-apis", "ai-sdk", "langchain", "mcp", "vector-db"],
    ["pytorch", "tensorflow", "huggingface", "scikit-learn"],
    ["pandas", "data-pipelines", "jupyter"],
];

// Using any of these is direct evidence of the key: an Express API is a REST
// API, TypeScript is JavaScript, an ORM means you write SQL.
const IMPLIED_BY: Record<string, string[]> = {
    rest: ["express", "fastify", "nestjs", "hono", "django", "flask", "fastapi", "rails", "laravel", "symfony", "spring", "gin", "axum"],
    sql: ["postgres", "mysql", "sqlite", "orm", "prisma", "drizzle", "supabase"],
    javascript: ["typescript"],
    css: ["tailwind", "css-in-js"],
    html: ["react", "vue", "svelte", "angular", "astro", "nextjs"],
    nodejs: ["express", "fastify", "nestjs", "hono", "nextjs"],
    python: ["django", "flask", "fastapi", "pandas", "pytorch"],
};

const RELATED = new Map<string, Set<string>>();
for (const group of RELATED_GROUPS) {
    for (const id of group) {
        const set = RELATED.get(id) ?? new Set<string>();
        group.filter((other) => other !== id).forEach((other) => set.add(other));
        RELATED.set(id, set);
    }
}

function list(names: string[]): string {
    if (names.length <= 1) return names.join("");
    return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

export function verdictFor(score: number | null): FitResult["verdict"] {
    if (score === null) return "Not enough to score";
    if (score >= 75) return "Strong fit";
    if (score >= 55) return "Good fit";
    if (score >= 35) return "Stretch";
    return "Long shot";
}

export function scoreFit(requirements: JobRequirement[], profile: SkillProfile | null): FitResult {
    const techs = new Map((profile?.technologies ?? []).map((t) => [t.id, t]));
    const topRepo = profile?.repos[0]?.name;

    const fits: RequirementFit[] = requirements.map((requirement) => {
        const base = { skill: requirement.skill, importance: requirement.importance, quote: requirement.quote };
        const ids = matchTechnologies(requirement.skill);
        if (!ids.length) {
            return { ...base, status: "unverifiable", technology: null, related: null, note: "Not something code can show. Cover it in your CV or interviews." };
        }

        // "React or Vue": the best match among the options counts, including
        // technologies that imply one of them
        const best = ids
            .flatMap((id) => [id, ...(IMPLIED_BY[id] ?? [])])
            .map((id) => techs.get(id))
            .filter((t) => t !== undefined)
            .sort((a, b) => b.strength - a.strength)[0];

        if (best) {
            const technology = { id: best.id, name: best.name, strength: best.strength, repoCount: best.repoCount, evidence: best.evidence };
            const where = `${best.repoCount} ${best.repoCount === 1 ? "repository" : "repositories"}`;
            if (best.strength >= STRONG) {
                const implied = !ids.includes(best.id);
                return { ...base, status: "strong", technology, related: null, note: implied ? `Shown through ${best.name} in ${where}.` : `Established: ${best.name} in ${where}.` };
            }
            return {
                ...base,
                status: "some",
                technology,
                related: null,
                note: `${best.name} shows up in ${where}, but not prominently. Point to it in your application so it isn’t missed.`,
            };
        }

        const asked = TECHNOLOGY_BY_ID.get(ids[0])!;
        const technology = { id: asked.id, name: asked.name, strength: 0, repoCount: 0, evidence: [] };
        const close = ids
            .flatMap((id) => [...(RELATED.get(id) ?? [])])
            .map((id) => techs.get(id))
            .filter((t) => t !== undefined)
            .sort((a, b) => b.strength - a.strength)[0];

        if (close && close.strength >= 25) {
            return {
                ...base,
                status: "related",
                technology,
                related: { id: close.id, name: close.name, strength: close.strength },
                note: `You use ${close.name}, which carries over. A small ${asked.name} project would show the jump is short.`,
            };
        }
        return {
            ...base,
            status: "gap",
            technology,
            related: null,
            note: topRepo
                ? `No repository uses ${asked.name}. Adding it to ${topRepo}, or a small focused project, would make it visible.`
                : `No repository uses ${asked.name} yet. A small focused project would make it visible.`,
        };
    });

    const counts: Record<RequirementStatus, number> = { strong: 0, some: 0, related: 0, gap: 0, unverifiable: 0 };
    let earned = 0;
    let possible = 0;
    for (const fit of fits) {
        counts[fit.status]++;
        if (fit.status === "unverifiable") continue;
        possible += WEIGHT[fit.importance];
        earned += WEIGHT[fit.importance] * credit(fit);
    }
    const checkable = fits.length - counts.unverifiable;
    const score = profile && possible > 0 ? Math.round((100 * earned) / possible) : null;

    const areaTargets = Object.fromEntries(SKILL_AREAS.map((a) => [a.id, 0])) as Record<SkillAreaId, number>;
    const areaCounts = new Map<SkillAreaId, { required: number; preferred: number }>();
    for (const fit of fits) {
        const area = fit.technology ? TECHNOLOGY_BY_ID.get(fit.technology.id)?.area : null;
        if (!area) continue;
        const entry = areaCounts.get(area) ?? { required: 0, preferred: 0 };
        entry[fit.importance]++;
        areaCounts.set(area, entry);
    }
    for (const [area, { required, preferred }] of areaCounts) {
        areaTargets[area] = Math.min(100, 35 + 20 * required + 10 * preferred);
    }

    const requiredGaps = fits.filter((f) => f.importance === "required" && f.status === "gap").map((f) => f.technology!.name);
    const matched = counts.strong + counts.some;
    const summary = !profile
        ? "Connect GitHub to score this role against your code."
        : checkable === 0
          ? "Nothing in this post can be checked against code, so there’s no score."
          : `Your code covers ${matched} of ${checkable} requirements it can speak to` +
            (counts.related ? `, with ${counts.related} more close` : "") +
            (requiredGaps.length ? `. Required gaps: ${list(requiredGaps)}.` : ". No required gaps.");

    return {
        score,
        verdict: verdictFor(score),
        confidence: checkable >= 3 ? "high" : "low",
        summary,
        requirements: fits,
        areaTargets,
        counts,
    };
}
