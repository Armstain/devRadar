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

        const reposResponse = await githubFetch(github.token, "/user/repos?sort=updated");
        if (!reposResponse.ok) {
            return NextResponse.json({ error: "Failed to fetch GitHub repos" }, { status: 502 });
        }

        return NextResponse.json(await reposResponse.json());

    } catch (error) {
        console.error("GitHub repos fetch error:", error);
        return NextResponse.json({ error: "Failed to fetch GitHub repos" }, { status: 500 });
    }
}
