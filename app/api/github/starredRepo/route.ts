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

        // Fetch starred repositories
        const starredResponse = await fetch("https://api.github.com/user/starred", {
            headers: {
                Authorization: `Bearer ${userData.githubToken}`,
                Accept: "application/vnd.github.v3+json",
            },
        });

        const starredRepos = await starredResponse.json();
        return NextResponse.json(starredRepos);

    } catch (error) {
        console.error("GitHub starred repos fetch error:", error);
        return NextResponse.json({ error: "Failed to fetch GitHub starred repos" }, { status: 500 });
    }
}
