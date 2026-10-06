import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { getLinkedinCredentials } from "@/lib/connections";
import { readJson, validationError } from "@/lib/api";

// LinkedIn's limit for post commentary
const postSchema = z.object({
    text: z.string().trim().min(1, "Post content is required").max(3000),
});

export async function POST(request: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const parsed = postSchema.safeParse(await readJson(request));
        if (!parsed.success) {
            return validationError(parsed.error);
        }

        const linkedin = await getLinkedinCredentials(userId);
        if (!linkedin?.memberId) {
            return NextResponse.json({ error: "LinkedIn not connected" }, { status: 400 });
        }

        // Use the correct format for the Share API
        const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${linkedin.token}`,
                'Content-Type': 'application/json',
                'X-Restli-Protocol-Version': '2.0.0',
            },
            body: JSON.stringify({
                author: `urn:li:person:${linkedin.memberId}`,
                lifecycleState: "PUBLISHED",
                specificContent: {
                    "com.linkedin.ugc.ShareContent": {
                        shareCommentary: {
                            text: parsed.data.text
                        },
                        shareMediaCategory: "NONE"
                    }
                },
                visibility: {
                    "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
                }
            })
        });

        if (!response.ok) {
            console.error('LinkedIn post error:', response.status, await response.text());
            return NextResponse.json({ error: "Failed to create post" }, { status: 502 });
        }

        return NextResponse.json({
            success: true,
            message: "Post created successfully",
            data: await response.json()
        });

    } catch (error) {
        console.error("Create post error:", error);
        return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
    }
}
