import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { consumeOAuthState, getCallbackUrl } from "@/lib/oauth";
import { saveLinkedinConnection } from "@/lib/connections";

export async function GET(request: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.redirect(new URL('/sign-in', request.url));
        }

        const { searchParams } = new URL(request.url);
        if (!(await consumeOAuthState("linkedin", searchParams.get("state")))) {
            return NextResponse.json({ error: "Invalid or expired OAuth state" }, { status: 400 });
        }

        const code = searchParams.get("code");
        if (!code) {
            return NextResponse.json({ error: "No code provided" }, { status: 400 });
        }

        // Exchange code for access token
        const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                client_id: process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID!,
                client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
                redirect_uri: getCallbackUrl(request, "linkedin"),
            }),
        });

        const data = await tokenResponse.json();

        if (data.error || !data.access_token) {
            console.error("LinkedIn token error:", data.error);
            return NextResponse.json({ error: "LinkedIn authorization failed" }, { status: 400 });
        }

        // Get user info using OpenID Connect userinfo endpoint
        const userInfoResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
            headers: {
                'Authorization': `Bearer ${data.access_token}`,
            },
        });

        if (!userInfoResponse.ok) {
            console.error("LinkedIn userinfo fetch failed:", userInfoResponse.status);
            return NextResponse.json({ error: "Failed to fetch LinkedIn profile" }, { status: 502 });
        }

        const userInfo = await userInfoResponse.json();
        await saveLinkedinConnection(userId, data.access_token, userInfo);

        return NextResponse.redirect(new URL('/linkedin?connected=true', request.url));

    } catch (error) {
        console.error("Callback error:", error);
        return NextResponse.json({ error: "Failed to complete LinkedIn authentication" }, { status: 500 });
    }
}
