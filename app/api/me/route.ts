import { authed, json } from "@/server/http";
import { getGithubConnection } from "@/server/services/github-connections";

// Lightweight account summary for the app shell; never returns tokens.
export const GET = authed("me", async (_request, { db, userId }) => {
    return json({ github: await getGithubConnection(db, userId) });
});
