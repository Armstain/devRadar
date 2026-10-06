import { applicationImportSchema } from "@/lib/applications";
import { authed, json, readJson, validationError } from "@/server/http";
import { createApplications } from "@/server/services/applications";

export const POST = authed("applications.import", async (request, { db, userId, log }) => {
    const parsed = applicationImportSchema.safeParse(await readJson(request));
    if (!parsed.success) return validationError(parsed.error);

    const created = await createApplications(db, userId, parsed.data.applications);
    log.info({ count: created.length }, "applications imported");
    return json({ success: true, imported: created.length });
});
