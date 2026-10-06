import { NextResponse } from "next/server";
import { getCollection } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { applicationImportSchema } from "@/lib/applications";
import { readJson, validationError } from "@/lib/api";

export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const parsed = applicationImportSchema.safeParse(await readJson(req));
        if (!parsed.success) {
            return validationError(parsed.error);
        }

        const now = new Date();
        const collection = await getCollection("applications");
        const result = await collection.insertMany(
            parsed.data.applications.map((app) => ({
                ...app,
                userId,
                createdAt: now,
                updatedAt: now,
            }))
        );

        return NextResponse.json({
            success: true,
            imported: result.insertedCount,
        });
    } catch (error) {
        console.error("[APPLICATIONS_IMPORT]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
