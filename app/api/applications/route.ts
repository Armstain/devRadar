import { applicationCreateSchema } from "@/lib/applications";
import { authed, json, readJson, validationError } from "@/server/http";
import { createApplication, listApplications } from "@/server/services/applications";

export const GET = authed("applications.list", async (_request, { db, userId }) => {
    return json(await listApplications(db, userId));
});

export const POST = authed("applications.create", async (request, { db, userId }) => {
    const parsed = applicationCreateSchema.safeParse(await readJson(request));
    if (!parsed.success) return validationError(parsed.error);
    return json(await createApplication(db, userId, parsed.data), 201);
});
