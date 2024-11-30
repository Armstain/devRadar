import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { getCollection } from "@/lib/db";

export async function GET(request: Request) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const collection = await getCollection('users');
        const userData = await collection.findOne({ userId: user.id });

        if (!userData?.githubToken) {
            return NextResponse.json({ error: "GitHub not connected" }, { status: 400 });
        }

        // Fetch user's repositories
        const reposResponse = await fetch("https://api.github.com/user/repos", {
            headers: {
                Authorization: `Bearer ${userData.githubToken}`,
            },
        });
        const repos = await reposResponse.json();

        // Fetch languages for each repository
        const languageStats: { [key: string]: number } = {};
        await Promise.all(
            repos.map(async (repo: any) => {
                const languagesUrl = `https://api.github.com/repos/${repo.full_name}/languages`;
                const languagesResponse = await fetch(languagesUrl, {
                    headers: {
                        Authorization: `Bearer ${userData.githubToken}`,
                    },
                });
                const languages = await languagesResponse.json();

                // Sum up bytes of code for each language
                Object.entries(languages).forEach(([language, bytes]: [string, any]) => {
                    languageStats[language] = (languageStats[language] || 0) + bytes;
                });
            })
        );

        // Convert bytes to percentages and sort
        const total = Object.values(languageStats).reduce((a, b) => a + b, 0);
        const languagesPercentage = Object.entries(languageStats)
            .map(([language, bytes]) => ({
                language,
                percentage: Math.round((bytes / total) * 100),
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