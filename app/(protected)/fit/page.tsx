"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Github, ScanSearch } from "lucide-react";
import { Scanning } from "@/components/skills/scanning";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Textarea } from "@/components/ui/textarea";
import { useGithubProfile } from "@/hooks/use-github";
import { jobPostErrorMessage, useAnalyzeJobPost, useJobPosts } from "@/hooks/use-job-posts";
import { useHydrated } from "@/hooks/use-hydrated";
import { jobPostInputSchema } from "@/lib/job-posts";
import { shortDate } from "@/lib/format";
import { cn } from "@/lib/utils";

const STEPS = ["Reading the post", "Pulling out each requirement", "Checking quotes against the post", "Scoring against your repositories"];

export default function JobFitPage() {
  const router = useRouter();
  const id = useId();
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [errors, setErrors] = useState<{ text?: string; url?: string; form?: string }>({});
  const analyze = useAnalyzeJobPost();
  const { data: github } = useGithubProfile();
  const hydrated = useHydrated();

  const submit = () => {
    const parsed = jobPostInputSchema.safeParse({ text, url });
    if (!parsed.success) {
      const fields = parsed.error.flatten().fieldErrors;
      setErrors({ text: fields.text?.[0], url: fields.url?.[0] });
      return;
    }
    setErrors({});
    analyze.mutate(parsed.data, {
      onSuccess: (view) => router.push(`/fit/${view.id}`),
      onError: (error) => setErrors({ form: jobPostErrorMessage(error, "Couldn’t analyse that post. Please try again.") }),
    });
  };

  return (
    <div className="flex flex-col gap-7">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold tracking-tight">Job fit</h1>
        <p className="max-w-2xl text-muted">
          Paste a job post. DevRadar pulls out every requirement, checks each one against the code you’ve shipped, and tells you where
          you’re strong and what to close before you apply.
        </p>
      </header>

      {hydrated && github && !github.profile ? (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-panel px-4 py-3 text-sm">
          <Github className="size-4 text-muted" aria-hidden="true" />
          <span className="flex-1">
            {github.connected
              ? "Your skill profile is still syncing. You’ll get the requirements now and the score once it’s ready."
              : "Connect GitHub to get a fit score. Without it you’ll still get the extracted requirements."}
          </span>
          {!github.connected ? (
            <Button asChild size="sm" variant="secondary">
              <a href="/api/auth/github">Connect GitHub</a>
            </Button>
          ) : null}
        </div>
      ) : null}

      <Panel>
        {analyze.isPending ? (
          <Scanning title="Reading the job post" subtitle="This takes about ten seconds." className="py-14" />
        ) : (
          <form
            className="flex flex-col gap-4 p-6"
            onSubmit={(event) => {
              event.preventDefault();
              submit();
            }}
          >
            <Field label="Job post" htmlFor={`${id}-text`} error={errors.text} hint="Paste the whole post: title, description and requirements.">
              <Textarea
                id={`${id}-text`}
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={12}
                maxLength={20_000}
                placeholder="Senior Frontend Engineer — Lumen Labs (Remote)…"
                className="font-[inherit]"
              />
            </Field>
            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
              <Field label="Link to the post (optional)" htmlFor={`${id}-url`} error={errors.url}>
                <Input id={`${id}-url`} type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" />
              </Field>
              <Button type="submit" size="lg" disabled={!text.trim()}>
                <ScanSearch aria-hidden="true" />
                Analyse fit
              </Button>
            </div>
            {errors.form ? (
              <p role="alert" className="text-sm text-danger">
                {errors.form}
              </p>
            ) : null}
            <ol className="flex flex-wrap gap-x-6 gap-y-1 border-t border-line pt-4 text-[13px] text-muted">
              {STEPS.map((step, i) => (
                <li key={step}>
                  <span className="font-mono text-signal">{String(i + 1).padStart(2, "0")}</span> {step}
                </li>
              ))}
            </ol>
          </form>
        )}
      </Panel>

      <RecentAnalyses />
    </div>
  );
}

function RecentAnalyses() {
  const { data, isLoading } = useJobPosts();
  if (isLoading || !data?.length) return null;
  return (
    <Panel className="overflow-hidden">
      <div className="px-6 pb-3 pt-6">
        <PanelHeader title="Recent analyses" description="Scored against your profile as it is today" />
      </div>
      <ul>
        {data.map((post) => (
          <li key={post.id} className="border-t border-line">
            <Link
              href={`/fit/${post.id}`}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-6 gap-y-1 px-6 py-3.5 transition-colors hover:bg-raised/50"
            >
              <span className="flex min-w-0 flex-col">
                <span className="truncate font-medium">{post.title}</span>
                <span className="truncate text-[13px] text-muted">
                  {post.company ?? "Company not named"} · {shortDate(post.createdAt)}
                  {post.applicationId ? " · In pipeline" : ""}
                </span>
              </span>
              <span className="flex items-center gap-3">
                <span className="hidden text-[13px] text-muted sm:inline">{post.verdict}</span>
                <span
                  className={cn(
                    "min-w-12 rounded-md px-2 py-1 text-center font-mono text-sm tabular",
                    post.score === null ? "bg-raised text-muted" : post.score >= 55 ? "bg-signal-soft text-signal" : "bg-caution-soft text-caution"
                  )}
                >
                  {post.score ?? "—"}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
