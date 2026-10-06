import { describe, expect, it } from "vitest";
import { createMemoryRateLimiter } from "./rate-limit";

describe("in-memory rate limiter", () => {
    it("allows up to the limit per key, then refuses until the window resets", async () => {
        let t = 0;
        const limiter = createMemoryRateLimiter(2, 60_000, () => t);

        expect((await limiter.limit("a")).allowed).toBe(true);
        expect(await limiter.limit("a")).toMatchObject({ allowed: true, remaining: 0 });
        expect(await limiter.limit("a")).toMatchObject({ allowed: false, retryAfterSeconds: 60 });
        expect((await limiter.limit("b")).allowed).toBe(true);

        t = 60_000;
        expect((await limiter.limit("a")).allowed).toBe(true);
    });
});
