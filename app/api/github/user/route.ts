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

        // Fetch GitHub user data
        const userResponse = await fetch("https://api.github.com/user", {
            headers: {
                Authorization: `Bearer ${userData.githubToken}`,
                Accept: "application/vnd.github.v3+json",
            },
        });

        const githubData = await userResponse.json();
        return NextResponse.json(githubData);

    } catch (error) {
        console.error("GitHub data fetch error:", error);
        return NextResponse.json({ error: "Failed to fetch GitHub data" }, { status: 500 });
    }
} 