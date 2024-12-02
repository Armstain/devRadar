import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { ObjectId } from 'mongodb';
import { auth } from '@clerk/nextjs/server';

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const db = await getDb();
        const result = await db.collection("applications").deleteOne({
            _id: new ObjectId(params.id),
            userId
        });

        if (result.deletedCount === 0) {
            return new NextResponse("Application not found", { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[APPLICATIONS_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
} 