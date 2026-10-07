// GitHub usernames: 1–39 characters, letters, digits and single hyphens,
// not starting or ending with a hyphen.
const LOGIN = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;

export function isGithubLogin(value: string): boolean {
    return LOGIN.test(value);
}

// Accepts "octocat", "@octocat" or a profile URL; returns the lowercase login
// or null.
export function parseGithubLogin(input: string): string | null {
    let value = input.trim();
    const url = /^(?:https?:\/\/)?(?:www\.)?github\.com\/([^/?#\s]+)/i.exec(value);
    if (url) value = url[1];
    value = value.replace(/^@/, "");
    return isGithubLogin(value) ? value.toLowerCase() : null;
}
