import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getGithubCredentials } from "@/lib/connections";
import { githubFetch } from "@/lib/github";

interface Repository {
    name: string;
    full_name: string;
    description: string | null;
    language: string | null;
}

export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const github = await getGithubCredentials(userId);
        if (!github) {
            return NextResponse.json({ error: "GitHub not connected" }, { status: 400 });
        }
        if (!github.username) {
            return NextResponse.json({ error: "GitHub username not found" }, { status: 400 });
        }
        const author = encodeURIComponent(github.username);

        // Fetch user's repositories
        const reposResponse = await githubFetch(github.token, "/user/repos?per_page=100");
        const repositories: Repository[] = await reposResponse.json();

        if (!Array.isArray(repositories)) {
            console.error("Failed to fetch repositories:", reposResponse.status);
            return NextResponse.json({ error: "Failed to fetch repositories" }, { status: 502 });
        }

        // Fetch commit counts for each repo
        const commitCounts = await Promise.all(
            repositories.map(async (repo) => {
                const commitsResponse = await githubFetch(
                    github.token,
                    `/repos/${repo.full_name}/commits?author=${author}&per_page=100`
                );
                const commits = await commitsResponse.json();
                return {
                    repo: repo.name,
                    commitCount: Array.isArray(commits) ? commits.length : 0,
                    description: repo.description,
                    language: repo.language
                };
            })
        );

        // Calculate total commits
        const totalCommits = commitCounts.reduce((sum, repo) => sum + repo.commitCount, 0);

        return NextResponse.json({ totalCommits, commitCounts });
    } catch (error) {
        console.error("Commit history error:", error);
        return NextResponse.json({ error: "Failed to fetch commit history" }, { status: 500 });
    }
}
