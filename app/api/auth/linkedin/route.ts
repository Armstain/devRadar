import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createOAuthState, getCallbackUrl } from "@/lib/oauth";

const SCOPES = ["openid", "profile", "email", "w_member_social"];

export async function GET(request: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const clientId = process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID;
        if (!clientId) {
            console.error("LinkedIn client ID is not configured");
            return NextResponse.json({ error: "LinkedIn configuration missing" }, { status: 500 });
        }

        const params = new URLSearchParams({
            response_type: "code",
            client_id: clientId,
            redirect_uri: getCallbackUrl(request, "linkedin"),
            state: await createOAuthState("linkedin"),
            scope: SCOPES.join(" "),
        });

        return NextResponse.redirect(`https://www.linkedin.com/oauth/v2/authorization?${params}`);

    } catch (error) {
        console.error("LinkedIn auth error:", error);
        return NextResponse.json({ error: "Failed to initiate LinkedIn auth" }, { status: 500 });
    }
}
