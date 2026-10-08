"use client";

import { useEffect } from "react";
import Link from "next/link";
import { reportClientError } from "@/components/error-report";
import { Logo } from "@/components/logo";
import { Scope } from "@/components/scope";
import { Button } from "@/components/ui/button";

// Shown when a page fails while rendering. Server errors carry a digest that
// matches the server log entry; browser errors are reported so they're logged
// too.
export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
    reportClientError(error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex h-16 items-center px-5 sm:px-12">
        <Link href="/" aria-label="DevRadar home">
          <Logo />
        </Link>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center gap-8 px-5 pb-16 text-center">
        <Scope className="max-w-[200px]" />
        <div className="flex max-w-md flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-[-0.02em]">Something went wrong on this page</h1>
          <p className="text-ink-soft">It’s been logged. Trying again usually works; if it doesn’t, come back in a minute.</p>
          {error.digest ? <p className="text-[13px] text-muted">Reference: <span className="font-mono">{error.digest}</span></p> : null}
        </div>
        <div className="flex gap-3">
          <Button onClick={() => retry()}>Try again</Button>
          <Button asChild variant="secondary">
            <Link href="/">Go home</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
