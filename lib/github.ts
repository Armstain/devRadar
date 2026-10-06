const GITHUB_API = "https://api.github.com";

export function githubFetch(token: string, path: string): Promise<Response> {
    return fetch(`${GITHUB_API}${path}`, {
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github+json",
        },
    });
}
