import { parseManifests } from "@/lib/skills/manifests";
import type { GithubSnapshot, SnapshotRepo } from "@/lib/skills/types";

// Everything DevRadar needs from GitHub comes from one GraphQL query per page
// of repositories: profile, contribution calendar, language sizes, root file
// names and dependency manifests. The REST equivalent takes 10+ requests per
// repository.

const GRAPHQL_URL = "https://api.github.com/graphql";
const PAGE_SIZE = 20;
const MAX_REPOS = 100;

const MANIFESTS = {
    packageJson: "package.json",
    requirements: "requirements.txt",
    pyproject: "pyproject.toml",
    pipfile: "Pipfile",
    goMod: "go.mod",
    cargo: "Cargo.toml",
    gemfile: "Gemfile",
    composer: "composer.json",
    pom: "pom.xml",
    gradle: "build.gradle",
    gradleKts: "build.gradle.kts",
} as const;

const blob = (alias: string, path: string) => `${alias}: object(expression: "HEAD:${path}") { ... on Blob { text } }`;

export const SNAPSHOT_QUERY = `
query DevRadarSnapshot($login: String!, $cursor: String, $privacy: RepositoryPrivacy, $first: Boolean!) {
  user(login: $login) {
    login
    name
    avatarUrl(size: 256)
    bio
    url
    company
    location
    createdAt
    followers { totalCount }
    contributionsCollection @include(if: $first) {
      contributionCalendar {
        totalContributions
        weeks { contributionDays { date contributionCount } }
      }
    }
    repositories(
      first: ${PAGE_SIZE}
      after: $cursor
      ownerAffiliations: [OWNER]
      isFork: false
      privacy: $privacy
      orderBy: { field: PUSHED_AT, direction: DESC }
    ) {
      totalCount
      pageInfo { hasNextPage endCursor }
      nodes {
        name
        url
        description
        isPrivate
        isArchived
        stargazerCount
        pushedAt
        createdAt
        repositoryTopics(first: 10) { nodes { topic { name } } }
        languages(first: 10, orderBy: { field: SIZE, direction: DESC }) {
          edges { size node { name color } }
        }
        root: object(expression: "HEAD:") { ... on Tree { entries { name } } }
        workflows: object(expression: "HEAD:.github/workflows") { ... on Tree { entries { name } } }
        ${Object.entries(MANIFESTS)
            .map(([alias, path]) => blob(alias, path))
            .join("\n        ")}
      }
    }
  }
}`;

type Blob = { text: string | null } | null;

export interface RawRepo {
    name: string;
    url: string;
    description: string | null;
    isPrivate: boolean;
    isArchived: boolean;
    stargazerCount: number;
    pushedAt: string | null;
    createdAt: string;
    repositoryTopics: { nodes: { topic: { name: string } }[] };
    languages: { edges: { size: number; node: { name: string; color: string | null } }[] } | null;
    root: { entries?: { name: string }[] } | null;
    workflows: { entries?: { name: string }[] } | null;
    [manifest: string]: unknown;
}

export interface RawUser {
    login: string;
    name: string | null;
    avatarUrl: string;
    bio: string | null;
    url: string;
    company: string | null;
    location: string | null;
    createdAt: string;
    followers: { totalCount: number };
    contributionsCollection?: {
        contributionCalendar: {
            totalContributions: number;
            weeks: { contributionDays: { date: string; contributionCount: number }[] }[];
        };
    };
    repositories: {
        totalCount: number;
        pageInfo: { hasNextPage: boolean; endCursor: string | null };
        nodes: RawRepo[];
    };
}

export function normalizeRepo(raw: RawRepo): SnapshotRepo {
    const text = (alias: keyof typeof MANIFESTS) => (raw[alias] as Blob)?.text ?? null;
    const files = (raw.root?.entries ?? []).map((entry) => entry.name);
    if (raw.workflows?.entries?.some((entry) => /\.ya?ml$/.test(entry.name))) files.push(".github/workflows");
    return {
        name: raw.name,
        url: raw.url,
        description: raw.description,
        isPrivate: raw.isPrivate,
        isArchived: raw.isArchived,
        stars: raw.stargazerCount,
        pushedAt: raw.pushedAt ?? raw.createdAt,
        createdAt: raw.createdAt,
        topics: raw.repositoryTopics.nodes.map((n) => n.topic.name),
        languages: (raw.languages?.edges ?? []).map((e) => ({ name: e.node.name, color: e.node.color, bytes: e.size })),
        deps: parseManifests({
            packageJson: text("packageJson"),
            requirements: text("requirements"),
            pyproject: text("pyproject"),
            pipfile: text("pipfile"),
            goMod: text("goMod"),
            cargo: text("cargo"),
            gemfile: text("gemfile"),
            composer: text("composer"),
            pom: text("pom"),
            gradle: [text("gradle"), text("gradleKts")].filter(Boolean).join("\n") || null,
        }),
        files,
    };
}

export function normalizeSnapshot(pages: RawUser[], options: { includesPrivate: boolean; fetchedAt: Date }): GithubSnapshot {
    const [first] = pages;
    const calendar = first.contributionsCollection?.contributionCalendar;
    return {
        version: 1,
        fetchedAt: options.fetchedAt.toISOString(),
        includesPrivate: options.includesPrivate,
        user: {
            login: first.login,
            name: first.name,
            avatarUrl: first.avatarUrl,
            bio: first.bio,
            url: first.url,
            company: first.company,
            location: first.location,
            followers: first.followers.totalCount,
            createdAt: first.createdAt,
        },
        repoCount: first.repositories.totalCount,
        repos: pages.flatMap((page) => page.repositories.nodes).map(normalizeRepo),
        calendar: {
            total: calendar?.totalContributions ?? 0,
            days: (calendar?.weeks ?? []).flatMap((w) => w.contributionDays.map((d) => ({ date: d.date, count: d.contributionCount }))),
        },
    };
}

export class GithubUserNotFoundError extends Error {
    constructor(login: string) {
        super(`GitHub user "${login}" not found`);
        this.name = "GithubUserNotFoundError";
    }
}

export class GithubApiError extends Error {
    constructor(
        message: string,
        readonly status: number
    ) {
        super(message);
        this.name = "GithubApiError";
    }
}

export interface FetchSnapshotOptions {
    token: string;
    login: string;
    // Private repositories are only ever included for the owner's own account.
    includePrivate: boolean;
    fetch?: typeof fetch;
    now?: Date;
}

export type SnapshotFetcher = (options: FetchSnapshotOptions) => Promise<GithubSnapshot>;

export const fetchGithubSnapshot: SnapshotFetcher = async ({ token, login, includePrivate, fetch: doFetch = fetch, now = new Date() }) => {
    const pages: RawUser[] = [];
    let cursor: string | null = null;

    do {
        const response = await doFetch(GRAPHQL_URL, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "User-Agent": "devradar" },
            body: JSON.stringify({
                query: SNAPSHOT_QUERY,
                variables: { login, cursor, privacy: includePrivate ? null : "PUBLIC", first: pages.length === 0 },
            }),
            signal: AbortSignal.timeout(25_000),
        });
        if (!response.ok) throw new GithubApiError(`GitHub GraphQL responded ${response.status}`, response.status);

        const body = (await response.json()) as { data?: { user: RawUser | null }; errors?: { type?: string; message: string }[] };
        if (body.errors?.some((e) => e.type === "NOT_FOUND") || body.data?.user === null) throw new GithubUserNotFoundError(login);
        // Partial errors (e.g. one unreadable repository) still return data
        if (!body.data?.user) throw new GithubApiError(body.errors?.[0]?.message ?? "Empty GitHub response", 502);

        pages.push(body.data.user);
        const { pageInfo } = body.data.user.repositories;
        cursor = pageInfo.hasNextPage ? pageInfo.endCursor : null;
    } while (cursor && pages.length * PAGE_SIZE < MAX_REPOS);

    return normalizeSnapshot(pages, { includesPrivate: includePrivate, fetchedAt: now });
};
