import { z } from "zod";
import { authed, errorResponse, json, readJson, validationError } from "@/server/http";
import { saveJobPostToPipeline } from "@/server/services/job-posts";
import { uuidSchema } from "@/lib/applications";

const bodySchema = z
    .object({
        company: z.string().trim().min(1).max(200).optional(),
        position: z.string().trim().min(1).max(200).optional(),
    })
    .default({});

// Saves the analysed post to the pipeline (once; repeat calls return the
// same application).
export const POST = authed<{ id: string }>("job-posts.application", async (request, { db, userId, params }) => {
    if (!uuidSchema.safeParse(params.id).success) return errorResponse("Invalid id", 400);
    const body = await readJson(request);
    const parsed = bodySchema.safeParse(body ?? {});
    if (!parsed.success) return validationError(parsed.error);

    const result = await saveJobPostToPipeline(db, userId, params.id, parsed.data);
    if (!result) return errorResponse("Job post not found", 404);
    return json(result.application, result.created ? 201 : 200);
});
