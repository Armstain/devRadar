import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";

export async function GET() {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const redirectUrl = `https://github.com/login/oauth/authorize?client_id=${process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID}&scope=repo,user&redirect_uri=${encodeURIComponent('http://localhost:3000/api/auth/github/callback')}`;

        console.log('Redirect URL:', redirectUrl); // Debug log
        return NextResponse.json({ url: redirectUrl });

    } catch (error) {
        console.error("GitHub auth error:", error);
        return NextResponse.json({ error: "Failed to initiate GitHub auth" }, { status: 500 });
    }
} 