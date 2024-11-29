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

        // Use the newer Share API endpoint
        const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${userData.linkedinToken}`,
                'LinkedIn-Version': '202304',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                author: `urn:li:person:${userData.linkedinUserInfo.id}`,
                commentary: text,
                visibility: "PUBLIC",
                distribution: {
                    feedDistribution: "MAIN_FEED",
                    targetEntities: [],
                    thirdPartyDistributionChannels: []
                },
                lifecycleState: "PUBLISHED",
                isReshareDisabledByAuthor: false
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
        return NextResponse.json(result);

    } catch (error) {
        console.error("Create post error:", error);
        return NextResponse.json({
            error: "Failed to create post",
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 