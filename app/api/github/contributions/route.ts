import { errorResponse, json } from "@/server/http";
import { authedGithub, githubFetch, summarizeEvents } from "@/server/github";

export const GET = authedGithub("github.contributions", async (_request, { github }) => {
    const response = await githubFetch(github.token, `/users/${encodeURIComponent(github.username)}/events?per_page=100`);
    const events = await response.json();
    if (!response.ok || !Array.isArray(events)) return errorResponse("Failed to fetch events", 502);
    return json(summarizeEvents(events, new Date()));
});
