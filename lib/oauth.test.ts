import { beforeEach, describe, expect, it, vi } from "vitest";

const jar = new Map<string, { value: string; options?: Record<string, unknown> }>();

vi.mock("next/headers", () => ({
    cookies: async () => ({
        get: (name: string) => (jar.has(name) ? { name, value: jar.get(name)!.value } : undefined),
        set: (name: string, value: string, options?: Record<string, unknown>) => jar.set(name, { value, options }),
        delete: (arg: string | { name: string }) => jar.delete(typeof arg === "string" ? arg : arg.name),
    }),
}));

const { consumeOAuthState, createOAuthState, getCallbackUrl } = await import("./oauth");

describe("OAuth state", () => {
    beforeEach(() => jar.clear());

    it("stores the state in an httpOnly cookie scoped to the callback", async () => {
        const state = await createOAuthState("github");
        const cookie = jar.get("oauth_state_github");
        expect(cookie?.value).toBe(state);
        expect(cookie?.options).toMatchObject({ httpOnly: true, sameSite: "lax", path: "/api/auth/github/callback" });
        expect(state.length).toBeGreaterThanOrEqual(43);
    });

    it("accepts the matching state exactly once", async () => {
        const state = await createOAuthState("github");
        expect(await consumeOAuthState("github", state)).toBe(true);
        expect(await consumeOAuthState("github", state)).toBe(false);
    });

    it("rejects a missing or forged state", async () => {
        await createOAuthState("linkedin");
        expect(await consumeOAuthState("linkedin", "forged")).toBe(false);
        expect(await consumeOAuthState("linkedin", null)).toBe(false);
    });

    it("does not accept one provider's state for another", async () => {
        const state = await createOAuthState("github");
        expect(await consumeOAuthState("linkedin", state)).toBe(false);
    });
});

describe("getCallbackUrl", () => {
    it("uses NEXT_PUBLIC_APP_URL when set", () => {
        vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://devradar.example.com/");
        expect(getCallbackUrl(new Request("http://internal:3000/x"), "github")).toBe(
            "https://devradar.example.com/api/auth/github/callback"
        );
        vi.unstubAllEnvs();
    });

    it("falls back to the request origin", () => {
        vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
        expect(getCallbackUrl(new Request("https://preview.example.com/api/auth/linkedin"), "linkedin")).toBe(
            "https://preview.example.com/api/auth/linkedin/callback"
        );
        vi.unstubAllEnvs();
    });
});
