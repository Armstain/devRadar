import { errorResponse, json } from "@/server/http";
import { authedGithub, githubFetch } from "@/server/github";

export const GET = authedGithub("github.repos", async (_request, { github }) => {
    const response = await githubFetch(github.token, "/user/repos?sort=pushed&per_page=100");
    if (!response.ok) return errorResponse("Failed to fetch GitHub repos", 502);
    return json(await response.json());
});
