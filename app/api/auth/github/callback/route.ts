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
            }),
        });

        const data = await tokenResponse.json();

        if (data.error) {
            console.error("GitHub token error:", data);
            return NextResponse.json({ error: data.error_description }, { status: 400 });
        }

        // Store token in MongoDB
        const collection = await getCollection('users');
        await collection.updateOne(
            { userId: user.id },
            {
                $set: {
                    githubToken: data.access_token,
                    githubTokenUpdatedAt: new Date()
                }
            },
            { upsert: true }
        );

        console.log('Successfully stored GitHub token');
        return NextResponse.redirect(new URL('/dashboard?github=connected', request.url));

    } catch (error) {
        console.error("Callback error:", error);
        return NextResponse.json({
            error: "Failed to complete GitHub authentication",
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 