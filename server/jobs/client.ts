import { Inngest, eventType } from "inngest";
import { z } from "zod";

// Background jobs run on Inngest: durable steps with automatic retries,
// invoked over HTTP at /api/inngest. Locally, run `npm run inngest:dev`.
export const inngest = new Inngest({ id: "devradar" });

// Typed events, validated against their schemas when sent.
export const userDeleted = eventType("devradar/user.deleted", {
    schema: z.object({ userId: z.string().min(1) }),
});

export const githubSyncRequested = eventType("devradar/github.sync.requested", {
    schema: z.object({
        userId: z.string().min(1),
        reason: z.enum(["connected", "manual", "scheduled"]),
    }),
});
