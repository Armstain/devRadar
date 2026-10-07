import { generatePrep } from "@/server/ai/job-prep";
import { authed, errorResponse, json } from "@/server/http";
import { createRateLimiter } from "@/server/rate-limit";
import { getJobPost, getJobPostRow, savePrep } from "@/server/services/job-posts";
import { uuidSchema } from "@/lib/applications";

const limiter = createRateLimiter({ prefix: "job-prep", requests: 20, window: "1 h" });

export const GET = authed<{ id: string }>("job-posts.prep.get", async (_request, { db, userId, params }) => {
    if (!uuidSchema.safeParse(params.id).success) return errorResponse("Invalid id", 400);
    const row = await getJobPostRow(db, userId, params.id);
    return row ? json({ prep: row.prep }) : errorResponse("Job post not found", 404);
});

// Generates interview prep for this role from its requirements and the
// current fit. `?refresh=1` regenerates it.
export const POST = authed<{ id: string }>("job-posts.prep.create", async (request, { db, userId, params, log }) => {
    if (!uuidSchema.safeParse(params.id).success) return errorResponse("Invalid id", 400);
    const view = await getJobPost(db, userId, params.id);
    if (!view) return errorResponse("Job post not found", 404);

    const refresh = new URL(request.url).searchParams.get("refresh") === "1";
    if (view.hasPrep && !refresh) {
        const row = await getJobPostRow(db, userId, params.id);
        return json({ prep: row?.prep ?? null });
    }

    const limit = await limiter.limit(userId);
    if (!limit.allowed) {
        return errorResponse("You’ve reached the hourly limit for interview prep. Please try again later.", 429, {
            "Retry-After": String(limit.retryAfterSeconds),
        });
    }

    const prep = await generatePrep(view.extraction, view.fit);
    if (prep === null) {
        log.error("interview prep unavailable: no Gemini key or empty response");
        return errorResponse("Couldn’t generate prep right now.", 503);
    }
    await savePrep(db, userId, params.id, prep);
    return json({ prep });
});
