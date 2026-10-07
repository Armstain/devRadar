import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { ScanForm } from "@/components/landing/scan-form";
import { Logo } from "@/components/logo";
import { Scanning } from "@/components/skills/scanning";
import { SkillProfileView } from "@/components/skills/skill-profile-view";
import { Scope } from "@/components/scope";
import { Button } from "@/components/ui/button";
import { getDb } from "@/server/db/client";
import { createRateLimiter } from "@/server/rate-limit";
import { scanGithubUser } from "@/server/services/github-scans";
import { parseGithubLogin } from "@/lib/github-login";
import { timeAgo } from "@/lib/format";

// Scans hit GitHub only on a cache miss; this caps how many a visitor can
// trigger.
const limiter = createRateLimiter({ prefix: "github-scan", requests: 10, window: "1 h" });

type Props = { params: Promise<{ login: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const login = parseGithubLogin(decodeURIComponent((await params).login));
  if (!login) return { title: "Scan not found" };
  return {
    title: `@${login}’s skill radar`,
    description: `Six skill areas scored from @${login}’s public GitHub repositories, with the evidence behind every score.`,
  };
}

export default async function ScanPage({ params }: Props) {
  const raw = decodeURIComponent((await params).login);
  const login = parseGithubLogin(raw);
  if (!login) notFound();
  if (raw !== login) redirect(`/scan/${login}`);

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-10 border-b border-line bg-ground/85 backdrop-blur">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-8">
          <Link href="/" aria-label="DevRadar home">
            <Logo />
          </Link>
          <ScanForm key={login} size="md" className="order-last w-full sm:order-none sm:ml-auto sm:w-80" />
          <Button asChild size="sm" className="ml-auto sm:ml-0">
            <Link href="/sign-up">Get your own</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-8 sm:px-8 sm:py-10">
        <Suspense fallback={<Scanning title={`Scanning @${login}`} subtitle="Reading public repositories on GitHub. This takes a few seconds." />}>
          <ScanResult login={login} />
        </Suspense>
      </main>
    </div>
  );
}

async function ScanResult({ login }: { login: string }) {
  const requestHeaders = await headers();
  const requester = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || requestHeaders.get("x-real-ip") || "unknown";
  const result = await scanGithubUser(getDb(), login, { requester, limiter, token: process.env.GITHUB_SCAN_TOKEN });

  if (result.status === "not-found") {
    return <Empty title={`No GitHub user called @${login}`} body="Check the spelling, or try another username." />;
  }
  if (result.status === "rate-limited") {
    return (
      <Empty
        title="That’s a lot of scanning"
        body={`You’ve run the maximum number of new scans for now. Try again in ${Math.ceil(result.retryAfterSeconds / 60)} minutes, or sign up to keep your own profile synced.`}
      />
    );
  }
  if (result.status === "unavailable") {
    return <Empty title="GitHub didn’t answer" body="Scanning is unavailable right now. Please try again in a minute." />;
  }

  return (
    <div className="flex flex-col gap-10">
      <SkillProfileView
        profile={result.profile}
        notice={
          <p className="font-mono text-[12px] text-muted">
            Public repositories only · scanned {timeAgo(result.scannedAt)}
          </p>
        }
      />
      <section className="flex flex-col items-start gap-4 rounded-2xl border border-line bg-panel p-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold tracking-tight">Is this you?</h2>
          <p className="max-w-xl text-muted">
            Sign up to include private repositories, keep the radar synced every night, and track your job applications against it.
          </p>
        </div>
        <Button asChild size="lg">
          <Link href="/sign-up">
            Get started
            <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
      </section>
    </div>
  );
}

function Empty({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-col items-center gap-6 py-16 text-center">
      <Scope className="max-w-[200px]" />
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="max-w-md text-muted">{body}</p>
      </div>
    </div>
  );
}
