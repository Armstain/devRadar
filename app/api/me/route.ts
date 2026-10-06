import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getCollection } from "@/lib/db";

// Lightweight account summary for the app shell; never returns tokens.
export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const users = await getCollection("users");
        const user = await users.findOne(
            { userId },
            { projection: { githubToken: 1, githubUsername: 1, githubTokenUpdatedAt: 1 } }
        );

        return NextResponse.json({
            github: {
                connected: Boolean(user?.githubToken),
                username: user?.githubUsername ?? null,
                connectedAt: user?.githubTokenUpdatedAt ?? null,
            },
        });
    } catch (error) {
        console.error("[ME_GET]", error);
        return NextResponse.json({ error: "Failed to load account" }, { status: 500 });
    }
}
