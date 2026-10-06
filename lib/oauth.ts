import { cookies } from "next/headers";
import { randomBytes, timingSafeEqual } from "node:crypto";

export type OAuthProvider = "github" | "linkedin";

const STATE_TTL_SECONDS = 10 * 60;

function stateCookieName(provider: OAuthProvider) {
    return `oauth_state_${provider}`;
}

function callbackPath(provider: OAuthProvider) {
    return `/api/auth/${provider}/callback`;
}

export function getAppUrl(request: Request): string {
    const configured = process.env.NEXT_PUBLIC_APP_URL;
    return configured ? configured.replace(/\/+$/, "") : new URL(request.url).origin;
}

export function getCallbackUrl(request: Request, provider: OAuthProvider): string {
    return `${getAppUrl(request)}${callbackPath(provider)}`;
}

// Creates a random state value and stores it in an httpOnly cookie scoped to
// the callback route, so the callback can reject forged (CSRF) redirects.
export async function createOAuthState(provider: OAuthProvider): Promise<string> {
    const state = randomBytes(32).toString("base64url");
    const cookieStore = await cookies();
    cookieStore.set(stateCookieName(provider), state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: callbackPath(provider),
        maxAge: STATE_TTL_SECONDS,
    });
    return state;
}

// Checks the state returned by the provider against the cookie, then clears it
// so each state value can be used only once.
export async function consumeOAuthState(provider: OAuthProvider, received: string | null): Promise<boolean> {
    const cookieStore = await cookies();
    const name = stateCookieName(provider);
    const expected = cookieStore.get(name)?.value;
    cookieStore.delete({ name, path: callbackPath(provider) });

    if (!expected || !received) {
        return false;
    }
    const a = Buffer.from(expected);
    const b = Buffer.from(received);
    return a.length === b.length && timingSafeEqual(a, b);
}
