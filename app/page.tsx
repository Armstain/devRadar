import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/logo";
import { Scope } from "@/components/scope";
import { Button } from "@/components/ui/button";

const steps = [
  "Connect GitHub — your skills, read from your code",
  "Track every application from first send to offer",
  "Know which ones have gone quiet and when to follow up",
];

export default async function LandingPage() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  return (
    <div className="flex min-h-dvh flex-col bg-[radial-gradient(ellipse_60%_70%_at_72%_50%,var(--panel)_0%,var(--ground)_70%)]">
      <header className="flex items-center gap-6 px-6 py-5 sm:px-12">
        <Logo />
        <nav aria-label="Account" className="ml-auto flex items-center gap-2">
          <Button asChild variant="ghost">
            <Link href="/sign-in">Sign in</Link>
          </Button>
        </nav>
      </header>

      <main className="mx-auto flex w-full max-w-[1360px] flex-1 flex-wrap items-center gap-12 px-6 py-10 sm:px-12">
        <section className="flex min-w-0 max-w-[560px] flex-[1_1_440px] flex-col gap-6">
          <span className="label-mono text-signal">Skill radar for developers</span>
          <h1 className="text-5xl font-semibold leading-[1.02] tracking-[-0.04em] sm:text-6xl">
            See your skills the way a hiring manager will.
          </h1>
          <p className="max-w-[500px] text-lg text-muted">
            DevRadar maps your skills from the code you’ve shipped, tracks every application you send, and tells you when it’s
            time to follow up.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/sign-up">
                Get started
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href="/sign-in">I have an account</Link>
            </Button>
          </div>
        </section>
        <div className="flex min-w-0 flex-[1_1_380px] justify-center">
          <Scope className="max-w-[540px]" />
        </div>
      </main>

      <footer className="border-t border-line">
        <ol className="mx-auto flex max-w-[1360px] flex-wrap gap-x-10 gap-y-3 px-6 py-5 text-sm text-muted sm:px-12">
          {steps.map((step, i) => (
            <li key={step}>
              <span className="font-mono text-signal">{String(i + 1).padStart(2, "0")}</span> {step}
            </li>
          ))}
        </ol>
      </footer>
    </div>
  );
}
