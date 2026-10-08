import { z } from "zod";
import { errorResponse, json, readJson } from "@/server/http";
import { logger } from "@/server/logger";
import { createRateLimiter } from "@/server/rate-limit";

// Errors that happen in the browser never reach the server's logs on their
// own. The error pages post them here so they show up next to everything
// else. Public (a crash can happen before sign-in), so it's rate-limited and
// only takes a few short fields.
const limiter = createRateLimiter({ prefix: "client-errors", requests: 30, window: "1 h" });

const reportSchema = z.object({
    message: z.string().max(500),
    digest: z.string().max(100).optional(),
    path: z.string().max(300),
});

export async function POST(request: Request) {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (!(await limiter.limit(ip)).allowed) return errorResponse("Too many reports", 429);
    const report = reportSchema.safeParse(await readJson(request));
    if (!report.success) return errorResponse("Invalid report", 400);
    logger.error({ client: report.data }, "client error");
    return json({ ok: true });
}
