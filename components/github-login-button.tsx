import { Button } from "@/components/ui/button";

export function GitHubLoginButton() {
    // A full-page navigation, so the server can set the OAuth state cookie
    // and redirect to GitHub.
    return (
        <Button asChild className="flex items-center gap-2">
            <a href="/api/auth/github">
                <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
                    <path fill="currentColor" d="M12 2A10 10 0 0 0 2 12a10 10 0 0 0 6.8 9.5c.5 0 .7-.2.7-.5v-1.7C6.7 20 6.1 18 6.1 18c-.4-1.2-1-1.5-1-1.5-1-.6 0-.6 0-.6 1 0 1.5 1 1.5 1 .9 1.5 2.3 1 2.8.8.1-.6.4-1 .6-1.2-2.2-.3-4.5-1.1-4.5-5 0-1.1.4-2 1-2.7 0-.3-.4-1.3.1-2.7 0 0 .8-.3 2.7 1a9.4 9.4 0 0 1 5 0c2-1.3 2.8-1 2.8-1 .5 1.4.1 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.9-2.3 4.7-4.5 5 .3.3.6.8.6 1.7v2.5c0 .3.2.6.7.5A10 10 0 0 0 22 12 10 10 0 0 0 12 2z"/>
                </svg>
                Login with GitHub
            </a>
        </Button>
    );
}
