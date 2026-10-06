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

        const userDetailsResponse = await githubFetch(github.token, "/user");
        if (!userDetailsResponse.ok) {
            return NextResponse.json({ error: "Failed to fetch GitHub user details" }, { status: 502 });
        }

        return NextResponse.json(await userDetailsResponse.json());

    } catch (error) {
        console.error("GitHub user details fetch error:", error);
        return NextResponse.json({ error: "Failed to fetch GitHub user details" }, { status: 500 });
    }
}
