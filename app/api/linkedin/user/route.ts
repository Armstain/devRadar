import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { getCollection } from "@/lib/db";

export async function GET() {
    try {
        // Get current user from Clerk
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get user's LinkedIn token from our database
        const collection = await getCollection('users');
        const userData = await collection.findOne({ userId: user.id });

        if (!userData?.linkedinToken) {
            return NextResponse.json({ error: "LinkedIn not connected" }, { status: 400 });
        }

        try {
            // Get user's basic profile using OpenID Connect
            const userInfoResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
                headers: {
                    'Authorization': `Bearer ${userData.linkedinToken}`,
                },
            });

            if (!userInfoResponse.ok) {
                console.error('LinkedIn userinfo error:', await userInfoResponse.text());
                // If token is invalid, we should prompt user to reconnect
                if (userInfoResponse.status === 401) {
                    await collection.updateOne(
                        { userId: user.id },
                        { $unset: { linkedinToken: "", linkedinUserInfo: "" } }
                    );
                    return NextResponse.json({ error: "LinkedIn token expired" }, { status: 401 });
                }
                return NextResponse.json({ error: "Failed to fetch LinkedIn profile" }, { status: 400 });
            }

            const userInfo = await userInfoResponse.json();

            // Try to get user's posts (w_member_social scope)
            let posts = { elements: [] };
            try {
                const postsResponse = await fetch(
                    `https://api.linkedin.com/v2/ugcPosts?q=authors&authors[0]=urn:li:person:${userInfo.sub}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${userData.linkedinToken}`,
                            'X-Restli-Protocol-Version': '2.0.0',
                            'LinkedIn-Version': '202304',
                        },
                    }
                );

                if (postsResponse.ok) {
                    posts = await postsResponse.json();
                    console.log('LinkedIn posts:', posts);
                }
            } catch (error) {
                console.error('Error fetching posts:', error);
            }

            // Combine all available data
            const enrichedProfile = {
                id: userInfo.sub,
                name: userInfo.name,
                email: userInfo.email,
                picture: userInfo.picture,
                locale: userInfo.locale,
                given_name: userInfo.given_name,
                family_name: userInfo.family_name,
                posts: posts.elements || [],
                isConnected: true,
                lastUpdated: new Date()
            };

            // Store the updated profile in our database
            await collection.updateOne(
                { userId: user.id },
                {
                    $set: {
                        linkedinUserInfo: enrichedProfile,
                        lastUpdated: new Date()
                    }
                }
            );

            return NextResponse.json(enrichedProfile);

        } catch (error) {
            console.error('LinkedIn API error:', error);
            return NextResponse.json({
                error: "Failed to fetch LinkedIn data",
                details: error instanceof Error ? error.message : 'Unknown error'
            }, { status: 500 });
        }

    } catch (error) {
        console.error("LinkedIn data fetch error:", error);
        return NextResponse.json({
            error: "Failed to fetch LinkedIn data",
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}