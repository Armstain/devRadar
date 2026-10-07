"use client";

import Link from "next/link";
import { SignIn, SignUp } from "@clerk/nextjs";
import { Logo } from "@/components/logo";
import { Scope } from "@/components/scope";
import { useClerkAppearance } from "@/lib/clerk-appearance";

export function AuthFrame({ mode }: { mode: "sign-in" | "sign-up" }) {
  const appearance = useClerkAppearance();

  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="flex flex-col px-6 py-6 sm:px-10">
        <Link href="/" className="w-fit" aria-label="DevRadar home">
          <Logo />
        </Link>
        <main className="flex flex-1 items-center justify-center py-10">
          {mode === "sign-in" ? <SignIn appearance={appearance} /> : <SignUp appearance={appearance} />}
        </main>
      </div>
      <aside className="relative hidden overflow-hidden border-l border-line bg-panel lg:flex lg:flex-col lg:justify-center lg:gap-10 lg:p-16">
        <div className="flex max-w-md flex-col gap-3">
          <span className="label-mono text-signal">Skill radar for developers</span>
          <p className="text-3xl font-semibold leading-tight tracking-tight">
            {mode === "sign-in" ? "Welcome back. Your pipeline’s been waiting." : "See your skills the way a hiring manager will."}
          </p>
        </div>
        <Scope className="max-w-[420px]" />
      </aside>
    </div>
  );
}
