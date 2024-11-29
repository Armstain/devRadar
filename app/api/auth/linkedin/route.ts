import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";

export async function GET() {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID) {
            console.error("LinkedIn client ID is not configured");
            return NextResponse.json({ error: "LinkedIn configuration missing" }, { status: 500 });
        }

        const scopes = [
            'openid',
            'profile',
            'email',
            'w_member_social'
        ].join(' ');

        const redirectUrl = `https://www.linkedin.com/oauth/v2/authorization?` +
            `response_type=code&` +
            `client_id=${process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID}&` +
            `redirect_uri=${encodeURIComponent(`${process.env.NEXT_PUBLIC_APP_URL}/api/auth/linkedin/callback`)}&` +
            `state=${Math.random().toString(36).substring(7)}&` +
            `scope=${encodeURIComponent(scopes)}`;

        console.log('LinkedIn Auth URL:', redirectUrl);

        return NextResponse.json({ url: redirectUrl });

    } catch (error) {
        console.error("LinkedIn auth error:", error);
        return NextResponse.json({ error: "Failed to initiate LinkedIn auth" }, { status: 500 });
    }
} 