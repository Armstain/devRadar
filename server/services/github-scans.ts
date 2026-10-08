import { eq, lt } from "drizzle-orm";
import type { Database } from "@/server/db/client";
import { githubScans } from "@/server/db/schema";
import { fetchGithubSnapshot, GithubUserNotFoundError, type SnapshotFetcher } from "@/server/github/snapshot";
import type { RateLimiter } from "@/server/rate-limit";
import { logger } from "@/server/logger";
import { buildSkillProfile } from "@/lib/skills/profile";
import type { GithubSnapshot, SkillProfile } from "@/lib/skills/types";

// Scans of public repositories for any username, cached for a day.
export const SCAN_TTL_MS = 24 * 60 * 60 * 1000;
// A scan runs inside a page request, so it reads what it can in this long and
// leaves headroom under the function's time limit (maxDuration on the page).
export const SCAN_BUDGET_MS = 35_000;

export type ScanResult =
    | { status: "ok"; profile: SkillProfile; scannedAt: string; cached: boolean }
    | { status: "not-found" }
    | { status: "rate-limited"; retryAfterSeconds: number }
    | { status: "unavailable" };

export async function getCachedScan(db: Database, login: string): Promise<{ data: GithubSnapshot; scannedAt: Date } | null> {
    const [row] = await db.select().from(githubScans).where(eq(githubScans.login, login.toLowerCase()));
    return row ?? null;
}

export async function saveScan(db: Database, data: GithubSnapshot, scannedAt: Date): Promise<void> {
    const login = data.user.login.toLowerCase();
    await db
        .insert(githubScans)
        .values({ login, data, scannedAt })
        .onConflictDoUpdate({ target: githubScans.login, set: { data, scannedAt } });
}

export async function pruneScans(db: Database, olderThan: Date): Promise<number> {
    const deleted = await db.delete(githubScans).where(lt(githubScans.scannedAt, olderThan)).returning({ login: githubScans.login });
    return deleted.length;
}

interface ScanOptions {
    // Who's asking, for the rate limit (an IP address)
    requester: string;
    limiter: RateLimiter;
    token: string | undefined;
    fetchSnapshot?: SnapshotFetcher;
    now?: Date;
}

// Serves a fresh cached scan when there is one; otherwise scans GitHub,
// rate-limited per requester. When GitHub can't be asked (limit hit, no token,
// GitHub down), an older cached scan beats an error.
export async function scanGithubUser(db: Database, login: string, options: ScanOptions): Promise<ScanResult> {
    const { requester, limiter, token, fetchSnapshot = fetchGithubSnapshot, now = new Date() } = options;
    const cached = await getCachedScan(db, login);
    const fromCache = (): ScanResult | null =>
        cached ? { status: "ok", profile: buildSkillProfile(cached.data, now), scannedAt: cached.scannedAt.toISOString(), cached: true } : null;

    if (cached && now.getTime() - cached.scannedAt.getTime() < SCAN_TTL_MS) return fromCache()!;

    if (!token) {
        logger.warn("GITHUB_SCAN_TOKEN isn't set; public scans only serve cached results");
        return fromCache() ?? { status: "unavailable" };
    }

    const limit = await limiter.limit(requester);
    if (!limit.allowed) return fromCache() ?? { status: "rate-limited", retryAfterSeconds: limit.retryAfterSeconds };

    const started = Date.now();
    try {
        const data = await fetchSnapshot({ token, login, includePrivate: false, now, deadline: started + SCAN_BUDGET_MS });
        await saveScan(db, data, now);
        logger.info({ login, ms: Date.now() - started, repos: data.repos.length, of: data.repoCount }, "public GitHub scan");
        return { status: "ok", profile: buildSkillProfile(data, now), scannedAt: now.toISOString(), cached: false };
    } catch (error) {
        if (error instanceof GithubUserNotFoundError) return { status: "not-found" };
        logger.error({ err: error, login, ms: Date.now() - started }, "public GitHub scan failed");
        return fromCache() ?? { status: "unavailable" };
    }
}
