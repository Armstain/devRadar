import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/db';
import { ObjectId } from 'mongodb';
import { auth } from '@clerk/nextjs/server';
import { applicationUpdateSchema, objectIdSchema } from '@/lib/applications';
import { readJson, validationError } from '@/lib/api';

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const id = objectIdSchema.safeParse((await params).id);
        if (!id.success) {
            return validationError(id.error);
        }

        // The schema only lets through editable fields, so a request
        // can't overwrite userId, _id or timestamps.
        const update = applicationUpdateSchema.safeParse(await readJson(request));
        if (!update.success) {
            return validationError(update.error);
        }

        const collection = await getCollection('applications');
        const updated = await collection.findOneAndUpdate(
            { _id: new ObjectId(id.data), userId },
            { $set: { ...update.data, updatedAt: new Date() } },
            { returnDocument: 'after' }
        );

        if (!updated) {
            return new NextResponse("Application not found", { status: 404 });
        }

        return NextResponse.json(updated);
    } catch (error) {
        console.error("[APPLICATIONS_PATCH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const id = objectIdSchema.safeParse((await params).id);
        if (!id.success) {
            return validationError(id.error);
        }

        const collection = await getCollection('applications');
        const result = await collection.deleteOne({
            _id: new ObjectId(id.data),
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
