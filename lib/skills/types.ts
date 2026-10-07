import type { Ecosystem, SkillAreaId } from "./catalog";

// What a GitHub sync stores. It keeps signals (dependency names, root file
// names, language sizes), not conclusions: technologies are detected and
// scored when the profile is read, so improving the catalog or the scoring
// applies to every stored snapshot without re-syncing.
export interface GithubSnapshot {
    version: 1;
    fetchedAt: string;
    // Whether private repositories were included (only for the owner's own
    // connected account, never for public scans).
    includesPrivate: boolean;
    user: {
        login: string;
        name: string | null;
        avatarUrl: string;
        bio: string | null;
        url: string;
        company: string | null;
        location: string | null;
        followers: number;
        createdAt: string;
    };
    // Every non-fork repository the user owns, including ones not analysed.
    repoCount: number;
    repos: SnapshotRepo[];
    calendar: {
        total: number;
        // One entry per day, oldest first, starting on a Sunday.
        days: { date: string; count: number }[];
    };
}

export interface SnapshotRepo {
    name: string;
    url: string;
    description: string | null;
    isPrivate: boolean;
    isArchived: boolean;
    stars: number;
    pushedAt: string;
    createdAt: string;
    topics: string[];
    // By size, largest first
    languages: { name: string; color: string | null; bytes: number }[];
    deps: Partial<Record<Ecosystem, string[]>>;
    // Names at the repository root, plus ".github/workflows" when it holds workflows
    files: string[];
}

export interface Evidence {
    repo: string;
    url: string;
    pushedAt: string;
}

export interface TechnologySkill {
    id: string;
    name: string;
    area: SkillAreaId | null;
    kind: "language" | "framework" | "tool";
    // 0–100: how established it is across your repositories, weighted by recency
    strength: number;
    repoCount: number;
    lastUsed: string;
    evidence: Evidence[];
}

export interface AreaSkill {
    id: SkillAreaId;
    label: string;
    description: string;
    // 0–100
    score: number;
    // Strongest first
    technologies: { id: string; name: string; strength: number }[];
    repoCount: number;
}

export interface Insight {
    tone: "signal" | "caution" | "neutral";
    text: string;
}

export interface SkillProfile {
    user: GithubSnapshot["user"];
    fetchedAt: string;
    includesPrivate: boolean;
    archetype: string;
    headline: string;
    areas: AreaSkill[];
    technologies: TechnologySkill[];
    languages: { name: string; color: string | null; bytes: number; share: number }[];
    insights: Insight[];
    activity: {
        total: number;
        currentStreak: number;
        longestStreak: number;
        activeDays: number;
        busiestWeekday: string | null;
        days: { date: string; count: number }[];
    };
    repos: {
        name: string;
        url: string;
        description: string | null;
        isPrivate: boolean;
        stars: number;
        pushedAt: string;
        primaryLanguage: string | null;
        technologies: string[];
    }[];
    stats: {
        reposAnalyzed: number;
        repoCount: number;
        technologyCount: number;
        stars: number;
    };
}
