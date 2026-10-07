import { errorResponse, json } from "@/server/http";
import { authedGithub, githubFetch } from "@/server/github";

export const GET = authedGithub("github.user", async (_request, { github }) => {
    const response = await githubFetch(github.token, "/user");
    if (!response.ok) return errorResponse("Failed to fetch GitHub user details", 502);
    return json(await response.json());
});
