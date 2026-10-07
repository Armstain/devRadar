import type { GithubSnapshot, SnapshotRepo } from "./types";

// Builders for tests and previews.

export function makeRepo(overrides: Partial<SnapshotRepo> & { name: string }): SnapshotRepo {
    return {
        url: `https://github.com/octocat/${overrides.name}`,
        description: null,
        isPrivate: false,
        isArchived: false,
        stars: 0,
        pushedAt: "2026-09-01T00:00:00Z",
        createdAt: "2025-01-01T00:00:00Z",
        topics: [],
        languages: [{ name: "TypeScript", color: "#3178c6", bytes: 200_000 }],
        deps: {},
        files: [],
        ...overrides,
    };
}

export function makeSnapshot(repos: SnapshotRepo[], overrides: Partial<GithubSnapshot> = {}): GithubSnapshot {
    return {
        version: 1,
        fetchedAt: "2026-10-01T00:00:00Z",
        includesPrivate: false,
        user: {
            login: "octocat",
            name: "The Octocat",
            avatarUrl: "https://avatars.githubusercontent.com/u/583231",
            bio: null,
            url: "https://github.com/octocat",
            company: null,
            location: null,
            followers: 10,
            createdAt: "2015-01-01T00:00:00Z",
        },
        repoCount: repos.length,
        repos,
        calendar: { total: 0, days: [] },
        ...overrides,
    };
}
