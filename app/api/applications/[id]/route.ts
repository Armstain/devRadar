import { applicationUpdateSchema, uuidSchema } from "@/lib/applications";
import { authed, errorResponse, json, readJson, validationError } from "@/server/http";
import { deleteApplication, getApplication, updateApplication } from "@/server/services/applications";

type Params = { id: string };

export const GET = authed<Params>("applications.get", async (_request, { db, userId, params }) => {
    const id = uuidSchema.safeParse(params.id);
    if (!id.success) return validationError(id.error);

    const application = await getApplication(db, userId, id.data);
    return application ? json(application) : errorResponse("Application not found", 404);
});

export const PATCH = authed<Params>("applications.update", async (request, { db, userId, params }) => {
    const id = uuidSchema.safeParse(params.id);
    if (!id.success) return validationError(id.error);

    // The schema only lets through editable fields, so a request can't
    // overwrite the owner, id or timestamps.
    const update = applicationUpdateSchema.safeParse(await readJson(request));
    if (!update.success) return validationError(update.error);

    const application = await updateApplication(db, userId, id.data, update.data);
    return application ? json(application) : errorResponse("Application not found", 404);
});

export const DELETE = authed<Params>("applications.delete", async (_request, { db, userId, params }) => {
    const id = uuidSchema.safeParse(params.id);
    if (!id.success) return validationError(id.error);

    return (await deleteApplication(db, userId, id.data))
        ? json({ success: true })
        : errorResponse("Application not found", 404);
});
