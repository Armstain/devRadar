import { ExtractionError, getJobPostExtractor } from "@/server/ai/extract-job-post";
import { authed, errorResponse, json, readJson, validationError } from "@/server/http";
import { createRateLimiter } from "@/server/rate-limit";
import { createJobPost, listJobPosts } from "@/server/services/job-posts";
import { jobPostInputSchema } from "@/lib/job-posts";

const limiter = createRateLimiter({ prefix: "job-posts", requests: 15, window: "1 h" });

export const GET = authed("job-posts.list", async (_request, { db, userId }) => {
    return json(await listJobPosts(db, userId));
});

// Analyses a pasted job post: the model extracts the role and its
// requirements, then the fit is scored against the user's skill profile.
export const POST = authed("job-posts.create", async (request, { db, userId, log }) => {
    const parsed = jobPostInputSchema.safeParse(await readJson(request));
    if (!parsed.success) return validationError(parsed.error);

    const extract = getJobPostExtractor();
    if (!extract) {
        log.error("GEMINI_API_KEY is not configured");
        return errorResponse("Job post analysis is not configured.", 503);
    }

    const limit = await limiter.limit(userId);
    if (!limit.allowed) {
        return errorResponse("You’ve reached the hourly limit for analysing job posts. Please try again later.", 429, {
            "Retry-After": String(limit.retryAfterSeconds),
        });
    }

    try {
        const started = performance.now();
        const { extraction, dropped, model } = await extract(parsed.data.text);
        log.info(
            { model, requirements: extraction.requirements.length, dropped: dropped.length, ms: Math.round(performance.now() - started) },
            "extracted job post"
        );
        const view = await createJobPost(db, userId, { ...parsed.data, extraction, model });
        return json(view, 201);
    } catch (error) {
        if (error instanceof ExtractionError) {
            log.warn({ err: error }, "job post extraction failed");
            return errorResponse("Couldn’t read that job post. Try pasting just the post itself.", 422);
        }
        throw error;
    }
});
