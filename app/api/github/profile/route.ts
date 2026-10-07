import { authed, json } from "@/server/http";
import { getGithubProfileState } from "@/server/services/github-snapshots";

// The connected account's skill profile, from the stored snapshot.
export const GET = authed("github.profile", async (_request, { db, userId }) => {
    return json(await getGithubProfileState(db, userId));
});
