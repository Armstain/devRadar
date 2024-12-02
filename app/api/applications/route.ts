import { NextResponse } from "next/server";
import { getCollection, getDb } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { ObjectId } from "mongodb";

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

export async function PATCH(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { id, ...data } = body;

        console.log('Updating application:', { id, data });

        const db = await getDb();
        const result = await db.collection("applications").updateOne(
            {
                _id: new ObjectId(id),
                userId
            },
            {
                $set: {
                    ...data,
                    updatedAt: new Date()
                }
            }
        );

        if (!result.matchedCount) {
            return new NextResponse("Application not found", { status: 404 });
        }

        return NextResponse.json({ id, ...data });
    } catch (error) {
        console.error("[APPLICATIONS_PATCH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { id } = body;

        const db = await getDb();
        const result = await db.collection("applications").deleteOne({
            _id: new ObjectId(id),
            userId
        });

        return NextResponse.json({ success: result.deletedCount > 0 });
    } catch (error) {
        console.error("[APPLICATIONS_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}