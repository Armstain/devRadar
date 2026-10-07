import { describe, expect, it, vi } from "vitest";
import { fetchGithubSnapshot, GithubApiError, GithubUserNotFoundError, type RawRepo, type RawUser } from "./snapshot";

function rawRepo(name: string, overrides: Partial<RawRepo> = {}): RawRepo {
    return {
        name,
        url: `https://github.com/octocat/${name}`,
        description: null,
        isPrivate: false,
        isArchived: false,
        stargazerCount: 1,
        pushedAt: "2026-09-01T00:00:00Z",
        createdAt: "2025-01-01T00:00:00Z",
        repositoryTopics: { nodes: [{ topic: { name: "nextjs" } }] },
        languages: { edges: [{ size: 120_000, node: { name: "TypeScript", color: "#3178c6" } }] },
        root: { entries: [{ name: "package.json" }, { name: "Dockerfile" }] },
        workflows: { entries: [{ name: "ci.yml" }] },
        packageJson: { text: JSON.stringify({ dependencies: { next: "16", react: "19" } }) },
        requirements: null,
        ...overrides,
    };
}

function rawUser(repos: RawRepo[], page: { hasNextPage?: boolean; endCursor?: string | null; totalCount?: number } = {}): RawUser {
    return {
        login: "octocat",
        name: "The Octocat",
        avatarUrl: "https://avatars.githubusercontent.com/u/583231",
        bio: null,
        url: "https://github.com/octocat",
        company: null,
        location: "San Francisco",
        createdAt: "2011-01-25T18:44:36Z",
        followers: { totalCount: 42 },
        contributionsCollection: {
            contributionCalendar: {
                totalContributions: 5,
                weeks: [
                    {
                        contributionDays: [
                            { date: "2026-09-27", contributionCount: 2 },
                            { date: "2026-09-28", contributionCount: 3 },
                        ],
                    },
                ],
            },
        },
        repositories: {
            totalCount: page.totalCount ?? repos.length,
            pageInfo: { hasNextPage: page.hasNextPage ?? false, endCursor: page.endCursor ?? null },
            nodes: repos,
        },
    };
}

const respond = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

describe("fetchGithubSnapshot", () => {
    it("pages through repositories and normalises signals", async () => {
        const fetch = vi
            .fn<typeof globalThis.fetch>()
            .mockResolvedValueOnce(respond({ data: { user: rawUser([rawRepo("one")], { hasNextPage: true, endCursor: "c1", totalCount: 2 }) } }))
            .mockResolvedValueOnce(respond({ data: { user: { ...rawUser([rawRepo("two", { workflows: null, pushedAt: null })]), contributionsCollection: undefined } } }));

        const snapshot = await fetchGithubSnapshot({ token: "t", login: "octocat", includePrivate: false, fetch, now: new Date("2026-10-01T00:00:00Z") });

        expect(fetch).toHaveBeenCalledTimes(2);
        const firstVariables = JSON.parse(fetch.mock.calls[0][1]!.body as string).variables;
        const secondVariables = JSON.parse(fetch.mock.calls[1][1]!.body as string).variables;
        expect(firstVariables).toEqual({ login: "octocat", cursor: null, privacy: "PUBLIC", first: true });
        expect(secondVariables).toMatchObject({ cursor: "c1", first: false });

        expect(snapshot).toMatchObject({
            version: 1,
            fetchedAt: "2026-10-01T00:00:00.000Z",
            includesPrivate: false,
            repoCount: 2,
            user: { login: "octocat", followers: 42 },
            calendar: { total: 5, days: [{ date: "2026-09-27", count: 2 }, { date: "2026-09-28", count: 3 }] },
        });
        expect(snapshot.repos[0]).toMatchObject({
            name: "one",
            topics: ["nextjs"],
            deps: { npm: ["next", "react"] },
            files: ["package.json", "Dockerfile", ".github/workflows"],
            languages: [{ name: "TypeScript", color: "#3178c6", bytes: 120_000 }],
        });
        // No workflows folder; a repository that was never pushed falls back to its creation date
        expect(snapshot.repos[1].files).not.toContain(".github/workflows");
        expect(snapshot.repos[1].pushedAt).toBe("2025-01-01T00:00:00Z");
    });

    it("includes private repositories only when asked", async () => {
        const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(respond({ data: { user: rawUser([]) } }));
        await fetchGithubSnapshot({ token: "t", login: "octocat", includePrivate: true, fetch });
        expect(JSON.parse(fetch.mock.calls[0][1]!.body as string).variables.privacy).toBeNull();
    });

    it("distinguishes an unknown user from GitHub errors", async () => {
        const notFound = vi.fn<typeof globalThis.fetch>().mockResolvedValue(
            respond({ data: { user: null }, errors: [{ type: "NOT_FOUND", message: "Could not resolve to a User" }] })
        );
        await expect(fetchGithubSnapshot({ token: "t", login: "nobody", includePrivate: false, fetch: notFound })).rejects.toBeInstanceOf(
            GithubUserNotFoundError
        );

        const unauthorized = vi.fn<typeof globalThis.fetch>().mockResolvedValue(respond({ message: "Bad credentials" }, 401));
        await expect(fetchGithubSnapshot({ token: "t", login: "octocat", includePrivate: false, fetch: unauthorized })).rejects.toMatchObject({
            name: "GithubApiError",
            status: 401,
        });
        expect(new GithubApiError("x", 500)).toBeInstanceOf(Error);
    });
});
