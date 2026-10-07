import { SKILL_AREAS, TECHNOLOGY_BY_ID, type SkillAreaId } from "./catalog";
import { detectTechnologies } from "./detect";
import type { AreaSkill, Evidence, GithubSnapshot, Insight, SkillProfile, SnapshotRepo, TechnologySkill } from "./types";

// Turns a snapshot into a skill profile. Everything here is deterministic and
// explainable: every score can be traced back to the repositories behind it.

const DAY = 86_400_000;
const MONTH = 30.44 * DAY;
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

// What "your stack" means in a sentence: frameworks and tools you build with,
// not practices like CI or linting that nearly every repository shares.
const STACK_AREAS = new Set<SkillAreaId | null>(["frontend", "backend", "data", "ai"]);
const isStack = (id: string) => {
    const tech = TECHNOLOGY_BY_ID.get(id);
    return Boolean(tech && tech.kind !== "language" && STACK_AREAS.has(tech.area));
};
const saturate = (evidence: number, k: number) => 1 - Math.exp(-evidence / k);

// Recent work counts most: a repository's weight halves for every year since
// its last push (never below 0.15), and tiny repositories count for less.
export function repoWeight(repo: Pick<SnapshotRepo, "pushedAt" | "languages">, now: Date): number {
    const months = Math.max(0, (now.getTime() - new Date(repo.pushedAt).getTime()) / MONTH);
    const recency = Math.max(0.15, 0.5 ** (months / 12));
    const bytes = repo.languages.reduce((sum, l) => sum + l.bytes, 0);
    const substance = clamp((Math.log10(bytes + 1) - 2) / 4, 0.25, 1);
    return recency * substance;
}

function list(names: string[]): string {
    if (names.length <= 1) return names.join("");
    return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

// Frontend, backend and AI describe the work; data, DevOps and quality
// usually support it, so they only name the profile when they clearly lead.
function archetypeFor(areas: AreaSkill[]): string {
    const score = (id: SkillAreaId) => areas.find((a) => a.id === id)?.score ?? 0;
    const [top] = [...areas].sort((a, b) => b.score - a.score);
    if (!top || top.score < 15) return "Getting started";
    const frontend = score("frontend");
    const backend = score("backend");
    if (frontend >= 30 && backend >= 30 && Math.abs(frontend - backend) <= 25) return "Full-stack engineer";
    const titles: Record<SkillAreaId, string> = {
        frontend: "Frontend engineer",
        backend: "Backend engineer",
        data: "Data engineer",
        devops: "Platform engineer",
        testing: "Quality engineer",
        ai: "AI engineer",
    };
    const [primary] = areas.filter((a) => a.id === "frontend" || a.id === "backend" || a.id === "ai").sort((a, b) => b.score - a.score);
    return titles[primary && primary.score >= 0.6 * top.score ? primary.id : top.id];
}

function activityStats(days: { date: string; count: number }[], now: Date) {
    const byDate = new Map(days.map((d) => [d.date, d.count]));
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const key = (date: Date) => date.toISOString().slice(0, 10);

    // Ends today, or yesterday if today has nothing yet
    let currentStreak = 0;
    const cursor = new Date(today);
    if (!byDate.get(key(cursor))) cursor.setUTCDate(cursor.getUTCDate() - 1);
    while ((byDate.get(key(cursor)) ?? 0) > 0) {
        currentStreak++;
        cursor.setUTCDate(cursor.getUTCDate() - 1);
    }

    let longestStreak = 0;
    let run = 0;
    const weekdays = new Array(7).fill(0);
    for (const day of days) {
        run = day.count > 0 ? run + 1 : 0;
        longestStreak = Math.max(longestStreak, run);
        weekdays[new Date(`${day.date}T00:00:00Z`).getUTCDay()] += day.count;
    }
    const busiest = weekdays.indexOf(Math.max(...weekdays));

    return {
        currentStreak,
        longestStreak,
        activeDays: days.filter((d) => d.count > 0).length,
        busiestWeekday: weekdays[busiest] > 0 ? WEEKDAYS[busiest] : null,
    };
}

export function buildSkillProfile(snapshot: GithubSnapshot, now: Date = new Date()): SkillProfile {
    const repos = snapshot.repos.map((repo) => ({ repo, weight: repoWeight(repo, now), techIds: detectTechnologies(repo) }));
    const evidenceFor = (repo: SnapshotRepo): Evidence => ({ repo: repo.name, url: repo.url, pushedAt: repo.pushedAt });
    const byRecency = <T extends { repo: SnapshotRepo }>(a: T, b: T) => b.repo.pushedAt.localeCompare(a.repo.pushedAt);

    // Technologies: strength saturates with recency-weighted evidence, so one
    // big recent project scores about 55, three score about 90.
    const technologies: TechnologySkill[] = [];
    for (const [id, tech] of TECHNOLOGY_BY_ID) {
        const using = repos.filter((r) => r.techIds.includes(id)).sort(byRecency);
        if (!using.length) continue;
        const evidence = using.reduce((sum, r) => sum + r.weight, 0);
        technologies.push({
            id,
            name: tech.name,
            area: tech.area,
            kind: tech.kind,
            strength: Math.round(100 * saturate(evidence, 1.2)),
            repoCount: using.length,
            lastUsed: using[0].repo.pushedAt,
            evidence: using.slice(0, 5).map((r) => evidenceFor(r.repo)),
        });
    }
    technologies.sort((a, b) => b.strength - a.strength || b.repoCount - a.repoCount || a.name.localeCompare(b.name));

    // Areas: three quarters depth (repositories that use the area, each
    // counting fully once it uses two of its technologies), one quarter
    // breadth (distinct technologies, up to six).
    const areas: AreaSkill[] = SKILL_AREAS.map((area) => {
        let depth = 0;
        let repoCount = 0;
        for (const r of repos) {
            const inArea = r.techIds.filter((id) => TECHNOLOGY_BY_ID.get(id)?.area === area.id).length;
            if (!inArea) continue;
            repoCount++;
            depth += r.weight * Math.min(1, inArea / 2);
        }
        const areaTechs = technologies.filter((t) => t.area === area.id);
        const breadth = Math.min(1, areaTechs.length / 6);
        return {
            id: area.id,
            label: area.label,
            description: area.description,
            score: Math.round(100 * (0.75 * saturate(depth, 3) + 0.25 * breadth)),
            technologies: areaTechs.map((t) => ({ id: t.id, name: t.name, strength: t.strength })),
            repoCount,
        };
    });

    // Languages by total size across repositories
    const languageTotals = new Map<string, { color: string | null; bytes: number }>();
    for (const { repo } of repos) {
        for (const l of repo.languages) {
            const entry = languageTotals.get(l.name) ?? { color: l.color, bytes: 0 };
            entry.bytes += l.bytes;
            languageTotals.set(l.name, entry);
        }
    }
    const totalBytes = [...languageTotals.values()].reduce((sum, l) => sum + l.bytes, 0);
    const languages = [...languageTotals.entries()]
        .map(([name, l]) => ({ name, color: l.color, bytes: l.bytes, share: totalBytes ? l.bytes / totalBytes : 0 }))
        .sort((a, b) => b.bytes - a.bytes)
        .slice(0, 8);

    const ranked = [...areas].sort((a, b) => b.score - a.score);
    const archetype = archetypeFor(areas);
    const frameworks = technologies.filter((t) => isStack(t.id)).slice(0, 4).map((t) => t.name);
    const headline =
        ranked[0] && ranked[0].score >= 15
            ? `Strongest in ${list(ranked.filter((a) => a.score >= 40).slice(0, 2).map((a) => a.label)) || ranked[0].label}` +
              (frameworks.length ? `, shipping with ${list(frameworks)}.` : ".")
            : "Not enough public code yet to read a clear skill profile.";

    const activity = activityStats(snapshot.calendar.days, now);
    const insights = buildInsights({ repos, ranked, technologies, calendarTotal: snapshot.calendar.total, activity, now });

    const strengthOf = new Map(technologies.map((t) => [t.id, t.strength]));
    const profileRepos = repos
        .filter((r) => !r.repo.isArchived)
        .sort(byRecency)
        .slice(0, 8)
        .map(({ repo, techIds }) => ({
            name: repo.name,
            url: repo.url,
            description: repo.description,
            isPrivate: repo.isPrivate,
            stars: repo.stars,
            pushedAt: repo.pushedAt,
            primaryLanguage: repo.languages[0]?.name ?? null,
            technologies: techIds
                .filter((id) => TECHNOLOGY_BY_ID.get(id)?.kind !== "language")
                // The stack first (Next.js, PostgreSQL…), then practices (CI, linting…)
                .sort((a, b) => Number(isStack(b)) - Number(isStack(a)) || (strengthOf.get(b) ?? 0) - (strengthOf.get(a) ?? 0))
                .slice(0, 5)
                .map((id) => TECHNOLOGY_BY_ID.get(id)!.name),
        }));

    return {
        user: snapshot.user,
        fetchedAt: snapshot.fetchedAt,
        includesPrivate: snapshot.includesPrivate,
        archetype,
        headline,
        areas,
        technologies,
        languages,
        insights,
        activity: { total: snapshot.calendar.total, ...activity, days: snapshot.calendar.days },
        repos: profileRepos,
        stats: {
            reposAnalyzed: repos.length,
            repoCount: snapshot.repoCount,
            technologyCount: technologies.filter((t) => t.kind !== "language").length,
            stars: repos.reduce((sum, r) => sum + r.repo.stars, 0),
        },
    };
}

function buildInsights(input: {
    repos: { repo: SnapshotRepo; techIds: string[] }[];
    ranked: AreaSkill[];
    technologies: TechnologySkill[];
    calendarTotal: number;
    activity: ReturnType<typeof activityStats>;
    now: Date;
}): Insight[] {
    const { repos, ranked, technologies, calendarTotal, activity, now } = input;
    const insights: Insight[] = [];
    const count = repos.length;
    const reposWith = (ids: string[]) => repos.filter((r) => r.techIds.some((id) => ids.includes(id))).length;

    const top = ranked[0];
    if (top && top.score >= 15 && top.technologies.length) {
        insights.push({
            tone: "signal",
            text: `${top.label} is your strongest signal: ${list(top.technologies.slice(0, 3).map((t) => t.name))} across ${top.repoCount} of ${count} repositories.`,
        });
    }

    const recentIds = new Map<string, number>();
    for (const r of repos) {
        if (now.getTime() - new Date(r.repo.pushedAt).getTime() > 90 * DAY) continue;
        for (const id of r.techIds) if (isStack(id)) recentIds.set(id, (recentIds.get(id) ?? 0) + 1);
    }
    const recent = [...recentIds.entries()]
        .sort((a, b) => b[1] - a[1] || (technologies.findIndex((t) => t.id === a[0]) - technologies.findIndex((t) => t.id === b[0])))
        .slice(0, 3)
        .map(([id]) => TECHNOLOGY_BY_ID.get(id)!.name);
    if (recent.length) insights.push({ tone: "neutral", text: `Lately you’ve been shipping with ${list(recent)}.` });

    if (count >= 3) {
        const tested = reposWith(["unit-tests", "e2e", "testing-library"]);
        if (tested / count < 0.3) {
            insights.push({
                tone: "caution",
                text: tested
                    ? `Only ${tested} of ${count} repositories have automated tests — the gap a reviewer is most likely to notice.`
                    : `None of your ${count} repositories has automated tests — the gap a reviewer is most likely to notice.`,
            });
        }
        if (!reposWith(["github-actions", "ci"])) {
            insights.push({ tone: "caution", text: "No CI pipeline in any repository. A workflow that runs your tests on every push is a quick win." });
        }
    }

    if (calendarTotal > 0) {
        insights.push({
            tone: "neutral",
            text:
                `${calendarTotal.toLocaleString("en-US")} contributions in the last year` +
                (activity.busiestWeekday ? `, most often on ${activity.busiestWeekday}s.` : "."),
        });
    }

    const starred = [...repos].sort((a, b) => b.repo.stars - a.repo.stars)[0];
    if (starred && starred.repo.stars >= 10) {
        insights.push({ tone: "signal", text: `${starred.repo.name} is your most starred project, with ${starred.repo.stars.toLocaleString("en-US")} stars.` });
    }

    return insights.slice(0, 5);
}
