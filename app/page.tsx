import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { SAMPLE_AXES, SAMPLE_GAP, SAMPLE_LABEL } from "@/components/landing/sample";
import { ScanForm } from "@/components/landing/scan-form";
import { Logo } from "@/components/logo";
import { RadarChart } from "@/components/radar-chart";
import { Button } from "@/components/ui/button";

const SOURCE_URL = "https://github.com/armstain/devradar";

const MANIFESTS = ["package.json", "pyproject.toml", "go.mod", "Cargo.toml", "Gemfile", "pom.xml", "Dockerfile", ".github/workflows"];

export default async function LandingPage() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex h-16 items-center gap-6 px-5 sm:px-12">
        <Logo />
        <nav aria-label="Site" className="ml-auto flex items-center gap-1 sm:gap-2">
          <a href="#how" className="hidden rounded-lg px-3 py-2 text-[14.5px] text-ink-soft hover:text-ink md:inline">
            How the score works
          </a>
          <a href={SOURCE_URL} className="hidden rounded-lg px-3 py-2 text-[14.5px] text-ink-soft hover:text-ink md:inline">
            Source on GitHub
          </a>
          <Button asChild variant="ghost">
            <Link href="/sign-in">Sign in</Link>
          </Button>
          <Button asChild className="max-sm:hidden">
            <Link href="/sign-up">Create account</Link>
          </Button>
        </nav>
      </header>

      <main className="mx-auto grid w-full max-w-[1360px] flex-1 grid-cols-1 items-start gap-10 px-5 pb-10 pt-10 sm:px-12 sm:pt-16 lg:grid-cols-[minmax(0,600px)_minmax(0,1fr)]">
        <section className="flex min-w-0 flex-col gap-6 lg:pt-6">
          <h1 className="text-[44px] font-semibold leading-[1.02] tracking-[-0.04em] sm:text-[62px]">
            Which jobs does your code already qualify you for?
          </h1>
          <p className="max-w-[520px] text-lg leading-relaxed text-ink-soft sm:text-[19px]">
            DevRadar reads the dependency files and configs in your GitHub repositories, works out what you actually build with, and
            checks it against any job post you paste in.
          </p>
          <div className="mt-4 flex max-w-[540px] flex-col gap-2.5">
            <ScanForm label="Try it on a GitHub profile" />
            <p className="text-[13.5px] text-muted">
              Public repositories only, no account needed. Or try{" "}
              <Link href="/scan/octocat" className="text-ink-soft underline decoration-line underline-offset-[3px] hover:text-ink">
                octocat
              </Link>
              .
            </p>
          </div>
        </section>

        <figure className="relative min-w-0" aria-label="A sample reading">
          <figcaption className="absolute left-0 top-0 text-[12.5px] text-muted sm:left-4">Sample scan · 9 repositories</figcaption>
          <RadarChart
            axes={SAMPLE_AXES}
            gap={SAMPLE_GAP}
            className="mx-auto w-full max-w-[640px]"
            label={SAMPLE_LABEL}
          />
          <div className="absolute right-0 top-6 text-right sm:right-4">
            <p className="text-[64px] font-semibold leading-[0.85] tracking-[-0.06em] tabular sm:text-[84px]">92</p>
            <p className="mt-2 text-sm text-ink-soft">
              fit for Senior Frontend
              <br />
              at Lumen Labs
            </p>
          </div>
        </figure>
      </main>

      <section id="how" className="mx-auto w-full max-w-[1360px] scroll-mt-6 px-5 sm:px-12">
        <div className="grid grid-cols-1 gap-10 border-t border-line pb-16 pt-10 md:grid-cols-[1.25fr_1fr_1fr] md:gap-14">
          <div className="flex flex-col gap-2">
            <h2 className="text-[17px] font-semibold tracking-[-0.01em]">A skill counts only when the code declares it</h2>
            <p className="max-w-[420px] text-[17px] leading-relaxed text-ink-soft">
              No keyword stuffing, no self-rated stars. A technology shows up on your radar when a repository depends on it, configures
              it, or is written in it, and every score links back to those repositories.
            </p>
            <ul className="mt-2 flex flex-wrap gap-x-3.5 gap-y-1.5 font-mono text-[13px] text-muted" aria-label="Files DevRadar reads">
              {MANIFESTS.map((file) => (
                <li key={file}>{file}</li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="text-[17px] font-semibold tracking-[-0.01em]">Recent work counts most</h2>
            <p className="max-w-[420px] text-[15px] leading-relaxed text-ink-soft">
              A repository’s weight halves for every year since its last push, so a framework you used in 2019 doesn’t outrank the one
              you shipped last month.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="text-[17px] font-semibold tracking-[-0.01em]">Gaps come with a next step</h2>
            <p className="max-w-[420px] text-[15px] leading-relaxed text-ink-soft">
              Paste a job post and each requirement is quoted, checked and graded. Where you fall short, DevRadar says which of your
              projects could close it.
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-[1360px] flex-wrap items-center justify-between gap-3 px-5 py-5 text-[13px] text-muted sm:px-12">
          <span>DevRadar · job search, measured against your code</span>
          <a href={SOURCE_URL} className="hover:text-ink hover:underline">
            Source on GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}
