import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createOAuthState, getCallbackUrl } from "@/lib/oauth";

// `repo` is needed to include private repositories in the stats; GitHub OAuth
// apps have no read-only scope for them.
const SCOPES = ["read:user", "repo"];

export async function GET(request: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
        if (!clientId) {
            console.error("GitHub client ID is not configured");
            return NextResponse.json({ error: "GitHub configuration missing" }, { status: 500 });
        }

        const params = new URLSearchParams({
            client_id: clientId,
            redirect_uri: getCallbackUrl(request, "github"),
            scope: SCOPES.join(" "),
            state: await createOAuthState("github"),
        });

        return NextResponse.redirect(`https://github.com/login/oauth/authorize?${params}`);
    } catch (error) {
        console.error("GitHub auth error:", error);
        return NextResponse.json({ error: "Failed to initiate GitHub auth" }, { status: 500 });
    }
}
