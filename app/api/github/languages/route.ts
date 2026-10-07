import { errorResponse, json } from "@/server/http";
import { authedGithub, githubFetch } from "@/server/github";

// Note: one request per repository. Phase 2 replaces this with a background
// sync that stores a snapshot, so page views don't call GitHub at all.
export const GET = authedGithub("github.languages", async (_request, { github }) => {
    const reposResponse = await githubFetch(github.token, "/user/repos?per_page=100");
    const repos: { full_name: string; fork: boolean }[] = await reposResponse.json();
    if (!reposResponse.ok || !Array.isArray(repos)) return errorResponse("Failed to fetch repositories", 502);

    const totals: Record<string, number> = {};
    await Promise.all(
        repos
            .filter((repo) => !repo.fork)
            .map(async (repo) => {
                const response = await githubFetch(github.token, `/repos/${repo.full_name}/languages`);
                if (!response.ok) return;
                const languages: Record<string, number> = await response.json();
                for (const [language, bytes] of Object.entries(languages)) {
                    totals[language] = (totals[language] ?? 0) + bytes;
                }
            })
    );

    const total = Object.values(totals).reduce((a, b) => a + b, 0);
    const languages = Object.entries(totals)
        .map(([language, bytes]) => ({ language, bytes, percentage: total ? Math.round((bytes / total) * 100) : 0 }))
        .sort((a, b) => b.bytes - a.bytes)
        .slice(0, 6);

    return json({ languages });
});
