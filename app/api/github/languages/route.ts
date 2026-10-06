import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getGithubCredentials } from "@/lib/connections";
import { githubFetch } from "@/lib/github";

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

        // Fetch user's repositories
        const reposResponse = await githubFetch(github.token, "/user/repos?per_page=100");
        const repos: { full_name: string }[] = await reposResponse.json();
        if (!Array.isArray(repos)) {
            return NextResponse.json({ error: "Failed to fetch repositories" }, { status: 502 });
        }

        // Fetch languages for each repository
        const languageStats: Record<string, number> = {};
        await Promise.all(
            repos.map(async (repo) => {
                const languagesResponse = await githubFetch(github.token, `/repos/${repo.full_name}/languages`);
                if (!languagesResponse.ok) return;
                const languages: Record<string, number> = await languagesResponse.json();

                // Sum up bytes of code for each language
                Object.entries(languages).forEach(([language, bytes]) => {
                    languageStats[language] = (languageStats[language] || 0) + bytes;
                });
            })
        );

        // Convert bytes to percentages and sort
        const total = Object.values(languageStats).reduce((a, b) => a + b, 0);
        const languagesPercentage = Object.entries(languageStats)
            .map(([language, bytes]) => ({
                language,
                percentage: total ? Math.round((bytes / total) * 100) : 0,
                bytes
            }))
            .sort((a, b) => b.bytes - a.bytes)
            .slice(0, 5); // Top 5 languages

        return NextResponse.json({ languages: languagesPercentage });
    } catch (error) {
        console.error("Language stats error:", error);
        return NextResponse.json({ error: "Failed to fetch language statistics" }, { status: 500 });
    }
} 