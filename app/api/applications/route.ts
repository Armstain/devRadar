import { NextResponse } from "next/server";
import { getCollection } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { applicationCreateSchema } from "@/lib/applications";
import { readJson, validationError } from "@/lib/api";

export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const collection = await getCollection('applications');
        const applications = await collection.find({ userId }).sort({ createdAt: -1 }).toArray();
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

        const parsed = applicationCreateSchema.safeParse(await readJson(req));
        if (!parsed.success) {
            return validationError(parsed.error);
        }

        const application = { ...parsed.data, userId, createdAt: new Date() };
        const collection = await getCollection('applications');
        const result = await collection.insertOne(application);

        return NextResponse.json({ ...application, id: result.insertedId }, { status: 201 });
    } catch (error) {
        console.error("[APPLICATIONS_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
