import type { NextRequest } from "next/server";
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { errorResponse, json } from "@/server/http";
import { inngest, userDeleted } from "@/server/jobs/client";
import { logger } from "@/server/logger";

// Clerk account events, signed with CLERK_WEBHOOK_SIGNING_SECRET. Deleting an
// account deletes the user's data in a background job, so a slow database
// never makes Clerk retry the webhook.
export async function POST(request: NextRequest) {
    let event;
    try {
        event = await verifyWebhook(request);
    } catch (error) {
        logger.warn({ err: error }, "rejected Clerk webhook with an invalid signature");
        return errorResponse("Invalid signature", 400);
    }

    if (event.type === "user.deleted" && event.data.id) {
        await inngest.send(userDeleted.create({ userId: event.data.id }));
        logger.info({ userId: event.data.id }, "queued user data deletion");
    }

    return json({ received: true });
}
