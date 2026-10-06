import { MongoServerError } from "mongodb";
import { getCollection } from "@/lib/db";

export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    retryAfterSeconds: number;
}

// Fixed-window limiter backed by MongoDB, so the limit holds across
// serverless instances. Old windows are removed by a TTL index on expiresAt.
export async function consumeRateLimit(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
    const now = Date.now();
    const windowStart = Math.floor(now / windowMs) * windowMs;
    const windowEnd = windowStart + windowMs;

    const collection = await getCollection("rate_limits");
    const increment = () =>
        collection.findOneAndUpdate(
            { key, windowStart: new Date(windowStart) },
            { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date(windowEnd) } },
            { upsert: true, returnDocument: "after" }
        );

    let doc;
    try {
        doc = await increment();
    } catch (error) {
        // Two concurrent upserts for a new window can race on the unique
        // index; the loser retries and increments the winner's document.
        if (!(error instanceof MongoServerError && error.code === 11000)) throw error;
        doc = await increment();
    }

    const count: number = doc?.count ?? 1;
    return {
        allowed: count <= limit,
        remaining: Math.max(0, limit - count),
        retryAfterSeconds: Math.ceil((windowEnd - now) / 1000),
    };
}
