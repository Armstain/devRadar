export const GITHUB_CONFIG = {
    CLIENT_ID: process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID,
    SCOPES: ['read:user', 'user:email', 'repo'].join(' '),
    REDIRECT_URI: 'http://localhost:3000/api/auth/github/callback'
};

export function getGithubAuthUrl() {
    const params = new URLSearchParams({
        client_id: process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID!,
        redirect_uri: 'http://localhost:3000/api/auth/github/callback',
        scope: ['read:user', 'user:email', 'repo'].join(' '),
        state: Math.random().toString(36).substring(7)
    });

    return `https://github.com/login/oauth/authorize?${params}`;
}