import { CvReadFailed, getCvReader } from "@/server/ai/read-cv";
import { authed, errorResponse, json, readJson, validationError } from "@/server/http";
import { createRateLimiter } from "@/server/rate-limit";
import { cvReadRequestSchema } from "@/lib/cv/ai";
import { redact } from "@/lib/cv/parse";

// Reading a CV with Gemini can take longer than the default function limit
export const maxDuration = 60;

const limiter = createRateLimiter({ prefix: "cv-read", requests: 5, window: "1 h" });

// Opt-in: reads roles from a redacted CV and returns them. Nothing is stored,
// and the CV text is never logged (only the outcome and timing are).
export const POST = authed("cv.read", async (request, { userId, log }) => {
    const parsed = cvReadRequestSchema.safeParse(await readJson(request));
    if (!parsed.success) return validationError(parsed.error);

    const read = getCvReader();
    if (!read) {
        log.error("GEMINI_API_KEY is not configured");
        return errorResponse("Reading with AI is not configured.", 503);
    }
    const limit = await limiter.limit(userId);
    if (!limit.allowed) {
        return errorResponse("You’ve reached the hourly limit for AI reads. Please try again later.", 429, {
            "Retry-After": String(limit.retryAfterSeconds),
        });
    }

    const started = performance.now();
    try {
        // The browser already redacted it; doing it again here means a
        // modified client still can't send contact details on to the model
        const result = await read(redact(parsed.data.text));
        log.info({ roles: result.roles.length, ms: Math.round(performance.now() - started) }, "cv read");
        return json(result);
    } catch (error) {
        if (error instanceof CvReadFailed) {
            log.warn({ reason: error.message, ms: Math.round(performance.now() - started) }, "cv read failed");
            return errorResponse("The AI couldn’t read that CV. Your local reading is unchanged.", 422);
        }
        // The model API refused or failed. Log its status and message only:
        // the error never carries the CV text, but don't rely on that
        const status = (error as { status?: number }).status;
        log.error({ status, reason: error instanceof Error ? error.message.slice(0, 300) : "unknown", ms: Math.round(performance.now() - started) }, "cv read: model call failed");
        return errorResponse("The AI read isn’t available right now. Your local reading is unchanged.", 502);
    }
});
