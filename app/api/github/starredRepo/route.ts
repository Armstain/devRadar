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

        const starredResponse = await githubFetch(github.token, "/user/starred");
        if (!starredResponse.ok) {
            return NextResponse.json({ error: "Failed to fetch GitHub starred repos" }, { status: 502 });
        }

        return NextResponse.json(await starredResponse.json());

    } catch (error) {
        console.error("GitHub starred repos fetch error:", error);
        return NextResponse.json({ error: "Failed to fetch GitHub starred repos" }, { status: 500 });
    }
}
