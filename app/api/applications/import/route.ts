import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { applications } = body;

        if (!Array.isArray(applications)) {
            return new NextResponse("Invalid request body", { status: 400 });
        }

        const db = await getDb();
        const collection = db.collection("applications");

        // Prepare applications with userId and timestamps
        const preparedApplications = applications.map(app => ({
            ...app,
            userId,
            createdAt: new Date(),
            updatedAt: new Date(),
        }));

        // Insert all applications
        const result = await collection.insertMany(preparedApplications);

        return NextResponse.json({
            success: true,
            imported: result.insertedCount,
        });
    } catch (error) {
        console.error("[APPLICATIONS_IMPORT]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
