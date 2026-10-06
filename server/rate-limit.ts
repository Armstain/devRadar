import { Ratelimit, type Duration } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { logger } from "@/server/logger";

export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    retryAfterSeconds: number;
}

export interface RateLimiter {
    limit(key: string): Promise<RateLimitResult>;
}

interface Policy {
    // Unique per use, so different limits don't share counters
    prefix: string;
    requests: number;
    window: Duration;
}

const windowMs = (window: Duration): number => {
    const [, amount, unit] = /^(\d+)\s*(ms|s|m|h|d)$/.exec(window.replace(" ", "")) ?? [];
    const ms = { ms: 1, s: 1_000, m: 60_000, h: 3_600_000, d: 86_400_000 }[unit as "ms"] ?? 1_000;
    return Number(amount) * ms;
};

// Sliding-window limits in Upstash Redis, shared across every serverless
// instance. Without Upstash credentials (local development) it falls back to
// an in-memory fixed window, which is per-process only.
export function createRateLimiter(policy: Policy): RateLimiter {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (url && token) {
        const ratelimit = new Ratelimit({
            redis: new Redis({ url, token }),
            limiter: Ratelimit.slidingWindow(policy.requests, policy.window),
            prefix: `devradar:${policy.prefix}`,
            analytics: false,
        });
        return {
            async limit(key) {
                const result = await ratelimit.limit(key);
                return {
                    allowed: result.success,
                    remaining: result.remaining,
                    retryAfterSeconds: Math.max(0, Math.ceil((result.reset - Date.now()) / 1000)),
                };
            },
        };
    }

    if (process.env.NODE_ENV === "production") {
        logger.warn({ prefix: policy.prefix }, "Upstash Redis isn't configured; rate limits are per instance only");
    }
    return createMemoryRateLimiter(policy.requests, windowMs(policy.window));
}

export function createMemoryRateLimiter(requests: number, ms: number, now: () => number = Date.now): RateLimiter {
    const windows = new Map<string, { start: number; count: number }>();
    return {
        async limit(key) {
            const t = now();
            const current = windows.get(key);
            const window = current && t - current.start < ms ? current : { start: t, count: 0 };
            window.count++;
            windows.set(key, window);
            return {
                allowed: window.count <= requests,
                remaining: Math.max(0, requests - window.count),
                retryAfterSeconds: Math.ceil((window.start + ms - t) / 1000),
            };
        },
    };
}
