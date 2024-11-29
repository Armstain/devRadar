import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { getCollection } from "@/lib/db";

export async function POST(request: Request) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { text } = await request.json();
        if (!text) {
            return NextResponse.json({ error: "Post content is required" }, { status: 400 });
        }

        const collection = await getCollection('users');
        const userData = await collection.findOne({ userId: user.id });

        if (!userData?.linkedinToken || !userData?.linkedinUserInfo?.id) {
            return NextResponse.json({ error: "LinkedIn not connected" }, { status: 400 });
        }

        // Use the correct format for the Share API
        const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${userData.linkedinToken}`,
                'Content-Type': 'application/json',
                'X-Restli-Protocol-Version': '2.0.0',
            },
            body: JSON.stringify({
                author: `urn:li:person:${userData.linkedinUserInfo.id}`,
                lifecycleState: "PUBLISHED",
                specificContent: {
                    "com.linkedin.ugc.ShareContent": {
                        shareCommentary: {
                            text: text
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
            const errorText = await response.text();
            console.error('LinkedIn post error:', errorText);
            return NextResponse.json({
                error: "Failed to create post",
                details: errorText
            }, { status: 400 });
        }

        const result = await response.json();
        console.log('LinkedIn post success:', result);

        // Return success response
        return NextResponse.json({
            success: true,
            message: "Post created successfully",
            data: result
        });

    } catch (error) {
        console.error("Create post error:", error);
        return NextResponse.json({
            error: "Failed to create post",
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 