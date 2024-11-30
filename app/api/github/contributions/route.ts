import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { getCollection } from "@/lib/db";

export async function GET(request: Request) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const collection = await getCollection('users');
        const userData = await collection.findOne({ userId: user.id });

        if (!userData?.githubToken || !userData?.githubUsername) {
            return NextResponse.json({ error: "GitHub not connected" }, { status: 400 });
        }

        // Fetch user's events (includes commits, PRs, etc.)
        const eventsResponse = await fetch(
            `https://api.github.com/users/${userData.githubUsername}/events`,
            {
                headers: {
                    Authorization: `Bearer ${userData.githubToken}`,
                },
            }
        );
        const events = await eventsResponse.json();

        if (!Array.isArray(events)) {
            return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
        }

        // Calculate contributions in the last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        let currentStreak = 0;
        let totalContributions = 0;
        const contributionsByDay = new Map();

        // Process events
        events.forEach(event => {
            const eventDate = new Date(event.created_at);
            if (eventDate > thirtyDaysAgo) {
                // Count PushEvent (commits) and CreateEvent (repos/branches)
                if (event.type === 'PushEvent' || event.type === 'CreateEvent') {
                    const dateKey = eventDate.toISOString().split('T')[0];
                    const currentCount = contributionsByDay.get(dateKey) || 0;
                    contributionsByDay.set(dateKey, currentCount + 1);
                    totalContributions++;
                }
            }
        });

        // Calculate current streak
        const today = new Date().toISOString().split('T')[0];
        const checkDate = new Date();
        let streakActive = false;

        // Check last 30 days for streak
        for (let i = 0; i < 30; i++) {
            const dateKey = checkDate.toISOString().split('T')[0];
            const hasContribution = contributionsByDay.get(dateKey);

            if (hasContribution) {
                currentStreak++;
                streakActive = true;
            } else if (streakActive || dateKey === today) {
                break;
            }

            checkDate.setDate(checkDate.getDate() - 1);
        }

        // Calculate average contributions per day
        const averagePerDay = Math.round(totalContributions / 30);

        // Get recent daily contributions
        const recentContributions = Array.from(contributionsByDay.entries())
            .map(([date, count]) => ({
                date,
                count
            }))
            .sort((a, b) => b.date.localeCompare(a.date))
            .slice(0, 30);

        return NextResponse.json({
            totalContributions,
            currentStreak,
            averagePerDay,
            recentContributions
        });

    } catch (error) {
        console.error("Contributions error:", error);
        return NextResponse.json({
            error: "Failed to fetch contribution statistics",
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 