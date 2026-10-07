import { authed, errorResponse, json } from "@/server/http";
import { githubSyncRequested, inngest } from "@/server/jobs/client";
import { createRateLimiter } from "@/server/rate-limit";
import { getGithubConnection } from "@/server/services/github-connections";
import { markSyncQueued } from "@/server/services/github-snapshots";

const limiter = createRateLimiter({ prefix: "github-sync", requests: 3, window: "10 m" });

// Queues a sync of the connected account. The nightly job keeps snapshots
// fresh, so this is only for "I just pushed something".
export const POST = authed("github.sync", async (_request, { db, userId, log }) => {
    if (!(await getGithubConnection(db, userId)).connected) return errorResponse("GitHub not connected", 400);

    const limit = await limiter.limit(userId);
    if (!limit.allowed) {
        return errorResponse(`Synced recently. Try again in ${Math.ceil(limit.retryAfterSeconds / 60)} min.`, 429, {
            "Retry-After": String(limit.retryAfterSeconds),
        });
    }

    await markSyncQueued(db, userId);
    await inngest.send(githubSyncRequested.create({ userId, reason: "manual" }));
    log.info("queued GitHub sync");
    return json({ status: "queued" }, 202);
});
