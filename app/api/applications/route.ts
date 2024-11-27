import { NextResponse } from "next/server";
import { getCollection, getDb } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const collection = await getCollection('applications');
        const applications = await collection.find({ userId }).toArray();
        return NextResponse.json(applications);
    } catch (error) {
        console.error("[APPLICATIONS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { company, position, status, link, notes } = body;

        const db = await getDb();
        const application = await db.collection("applications").insertOne({
            userId,
            company,
            position,
            status,
            link,
            notes,
            createdAt: new Date(),
        });

        return NextResponse.json({
            id: application.insertedId,
            userId,
            company,
            position,
            status,
            link,
            notes,
            createdAt: new Date()
        });
    } catch (error) {
        console.error("[APPLICATIONS_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}