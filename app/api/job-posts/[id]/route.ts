import { authed, errorResponse, json } from "@/server/http";
import { getJobPost } from "@/server/services/job-posts";
import { uuidSchema } from "@/lib/applications";

// The analysis, scored against the skill profile as it is now.
export const GET = authed<{ id: string }>("job-posts.get", async (_request, { db, userId, params }) => {
    if (!uuidSchema.safeParse(params.id).success) return errorResponse("Invalid id", 400);
    const view = await getJobPost(db, userId, params.id);
    return view ? json(view) : errorResponse("Job post not found", 404);
});
