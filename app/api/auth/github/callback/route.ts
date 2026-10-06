import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { consumeOAuthState, getCallbackUrl } from "@/lib/oauth";
import { saveGithubConnection } from "@/lib/connections";

export async function GET(request: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.redirect(new URL('/sign-in', request.url));
        }

        const { searchParams } = new URL(request.url);
        if (!(await consumeOAuthState("github", searchParams.get("state")))) {
            return NextResponse.json({ error: "Invalid or expired OAuth state" }, { status: 400 });
        }

        const code = searchParams.get("code");
        if (!code) {
            return NextResponse.json({ error: "No code provided" }, { status: 400 });
        }

        // Exchange code for access token
        const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                client_id: process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID,
                client_secret: process.env.GITHUB_CLIENT_SECRET,
                code,
                redirect_uri: getCallbackUrl(request, "github"),
            }),
        });

        const data = await tokenResponse.json();

        if (data.error || !data.access_token) {
            console.error("GitHub token error:", data.error);
            return NextResponse.json({ error: "GitHub authorization failed" }, { status: 400 });
        }

        // Fetch GitHub user data to get username
        const userResponse = await fetch('https://api.github.com/user', {
            headers: {
                'Authorization': `Bearer ${data.access_token}`,
                'Accept': 'application/json',
            },
        });

        if (!userResponse.ok) {
            console.error("GitHub user fetch failed:", userResponse.status);
            return NextResponse.json({ error: "Failed to fetch GitHub profile" }, { status: 502 });
        }

        const githubUser = await userResponse.json();
        await saveGithubConnection(userId, data.access_token, githubUser.login);

        return NextResponse.redirect(new URL('/dashboard?github=connected', request.url));

    } catch (error) {
        console.error("Callback error:", error);
        return NextResponse.json({ error: "Failed to complete GitHub authentication" }, { status: 500 });
    }
}
