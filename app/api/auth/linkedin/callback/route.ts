import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { getCollection } from "@/lib/db";

export async function GET(request: Request) {
    try {
        const user = await currentUser();

        if (!user) {
            console.log('No user found, redirecting to sign in');
            return NextResponse.redirect(new URL('/sign-in', request.url));
        }

        const { searchParams } = new URL(request.url);
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
                redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/linkedin/callback`,
            }),
        });

        const data = await tokenResponse.json();

        if (data.error) {
            console.error("LinkedIn token error:", data);
            return NextResponse.json({ error: data.error_description }, { status: 400 });
        }

        // Get user info using OpenID Connect userinfo endpoint
        const userInfoResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
            headers: {
                'Authorization': `Bearer ${data.access_token}`,
            },
        });

        const userInfo = await userInfoResponse.json();

        // Store token and user info in MongoDB
        const collection = await getCollection('users');
        await collection.updateOne(
            { userId: user.id },
            {
                $set: {
                    linkedinToken: data.access_token,
                    linkedinTokenUpdatedAt: new Date(),
                    linkedinUserInfo: userInfo,
                }
            },
            { upsert: true }
        );

        console.log('Successfully stored LinkedIn token and user info');
        return NextResponse.redirect(new URL('/linkedin?connected=true', request.url));

    } catch (error) {
        console.error("Callback error:", error);
        return NextResponse.json({
            error: "Failed to complete LinkedIn authentication",
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 