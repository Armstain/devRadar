import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { getCollection } from "@/lib/db";

export async function GET() {
    try {
        const user = await currentUser();
        if (!user) {
            console.log("No user found");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get GitHub token from MongoDB
        const collection = await getCollection('users');
        const userData = await collection.findOne({ userId: user.id });

        console.log("User data found:", {
            hasToken: !!userData?.githubToken,
            hasUsername: !!userData?.githubUsername,
            userId: user.id
        });

        if (!userData?.githubToken) {
            console.log("No GitHub token found for user");
            return NextResponse.json({ error: "GitHub not connected" }, { status: 400 });
        }

        const githubUsername = userData.githubUsername;
        if (!githubUsername) {
            console.log("No GitHub username found for user");
            return NextResponse.json({ error: "GitHub username not found" }, { status: 400 });
        }

        // Log the API requests we're about to make
        console.log(`Fetching repos for user: ${githubUsername}`);

        // Fetch user's repositories
        const reposResponse = await fetch("https://api.github.com/user/repos", {
            headers: {
                Authorization: `Bearer ${userData.githubToken}`,
            },
        });
        const repositories = await reposResponse.json();

        if (!Array.isArray(repositories)) {
            console.error("Repositories response:", repositories);
            return NextResponse.json({ error: "Failed to fetch repositories" }, { status: 500 });
        }

        console.log(`Found ${repositories.length} repositories`);

        // Fetch commit counts for each repo
        const commitCounts = await Promise.all(
            repositories.map(async (repo) => {
                const commitUrl = `https://api.github.com/repos/${githubUsername}/${repo.name}/commits?author=${githubUsername}`;


                const commitsResponse = await fetch(commitUrl, {
                    headers: {
                        Authorization: `Bearer ${userData.githubToken}`,
                    },
                });
                const commits = await commitsResponse.json();
                return {
                    repo: repo.name,
                    commitCount: Array.isArray(commits) ? commits.length : 0,
                    description: repo.description,
                    language: repo.language
                };
            })
        );

        console.log("Commit counts:", commitCounts);

        // Calculate total commits
        const totalCommits = commitCounts.reduce((sum, repo) => sum + repo.commitCount, 0);

        return NextResponse.json({ totalCommits, commitCounts });
    } catch (error) {
        console.error("Detailed error in commit history:", error);
        return NextResponse.json({
            error: "Failed to fetch commit history",
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
