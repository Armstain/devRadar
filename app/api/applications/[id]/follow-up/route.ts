import { followUpActionSchema, uuidSchema } from "@/lib/applications";
import { authed, errorResponse, json, readJson, validationError } from "@/server/http";
import { recordFollowUp } from "@/server/services/follow-ups";

// { action: "followed-up" } or { action: "snooze", days: 3 | 7 | 14 }
export const POST = authed<{ id: string }>("applications.follow-up", async (request, { db, userId, params }) => {
    const id = uuidSchema.safeParse(params.id);
    if (!id.success) return validationError(id.error);
    const action = followUpActionSchema.safeParse(await readJson(request));
    if (!action.success) return validationError(action.error);

    const result = await recordFollowUp(db, userId, id.data, action.data);
    if (result.status === "not-found") return errorResponse("Application not found", 404);
    if (result.status === "closed") return errorResponse("This application is closed; there’s nothing to follow up", 409);
    return json(result.application);
});
