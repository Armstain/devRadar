import { authed, json } from "@/server/http";
import { getInsights } from "@/server/services/insights";

export const GET = authed("insights.get", async (_request, { db, userId }) => json(await getInsights(db, userId)));
