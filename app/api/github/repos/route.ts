import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { getCollection } from "@/lib/db";

export async function GET() {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get GitHub token from MongoDB
        const collection = await getCollection('users');
        const userData = await collection.findOne({ userId: user.id });

        if (!userData?.githubToken) {
            return NextResponse.json({ error: "GitHub not connected" }, { status: 400 });
        }

        // Fetch user's repositories
        const reposResponse = await fetch("https://api.github.com/user/repos?sort=updated", {
            headers: {
                Authorization: `Bearer ${userData.githubToken}`,
                Accept: "application/vnd.github.v3+json",
            },
        });

        const repos = await reposResponse.json();
        return NextResponse.json(repos);

    } catch (error) {
        console.error("GitHub repos fetch error:", error);
        return NextResponse.json({ error: "Failed to fetch GitHub repos" }, { status: 500 });
    }
} 