"use client"

import Link from "next/link"
import { ArrowRight, ExternalLink, Github, MapPin, Plus, RefreshCw, Sparkles } from "lucide-react"
import { Markdown } from "@/components/markdown"
import { AreaRadar } from "@/components/skills/area-radar"
import { StatusIcon, STATUS_LABELS } from "@/components/fit/status-icon"
import { Button } from "@/components/ui/button"
import { Panel, PanelHeader } from "@/components/ui/panel"
import { Skeleton } from "@/components/ui/skeleton"
import { useGenerateJobPrep, useJobPrep, useSaveToPipeline, type JobPostView } from "@/hooks/use-job-posts"
import type { RequirementFit, RequirementStatus } from "@/lib/fit/score"
import { cn } from "@/lib/utils"

const SCORED: RequirementStatus[] = ["strong", "some", "related", "gap"]

function salaryLine(salary: JobPostView["extraction"]["salary"]): string | null {
  if (!salary || (salary.min === null && salary.max === null)) return null
  const fmt = (n: number) => (n >= 1000 ? `${Math.round(n / 1000)}k` : String(n))
  const range = salary.min !== null && salary.max !== null ? `${fmt(salary.min)}–${fmt(salary.max)}` : fmt((salary.min ?? salary.max)!)
  return `${salary.currency ?? ""} ${range}${salary.period ? ` / ${salary.period}` : ""}`.trim()
}

export function FitReport({ view }: { view: JobPostView }) {
  const { extraction, fit } = view
  const facts = [
    extraction.company,
    extraction.location,
    extraction.workplace && extraction.workplace[0].toUpperCase() + extraction.workplace.slice(1),
    extraction.seniority && extraction.seniority[0].toUpperCase() + extraction.seniority.slice(1),
    salaryLine(extraction.salary),
  ].filter(Boolean) as string[]

  const required = fit.requirements.filter((r) => r.importance === "required")
  const preferred = fit.requirements.filter((r) => r.importance === "preferred")
  const toClose = fit.requirements.filter((r) => r.status === "gap" || r.status === "related")

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-5">
        <div className="flex min-w-0 flex-col gap-2">
          <span className="label-mono">Fit report</span>
          <h1 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">{extraction.title}</h1>
          {facts.length ? (
            <p className="flex flex-wrap items-center gap-x-2 text-muted">
              <MapPin className="size-4" aria-hidden="true" />
              {facts.join(" · ")}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {view.url ? (
            <Button asChild variant="secondary">
              <a href={view.url} target="_blank" rel="noopener noreferrer">
                Job post <ExternalLink aria-hidden="true" />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            </Button>
          ) : null}
          <SaveButton view={view} />
        </div>
      </header>

      <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-12">
        <ScorePanel view={view} className="lg:col-span-5" />
        <Panel className="lg:col-span-7">
          <div className="flex h-full flex-col gap-4 p-6">
            <PanelHeader title="You vs. the role" description="Filled: your code. Dashed: how much the role leans on each area." />
            {view.areas ? (
              <AreaRadar areas={view.areas} targets={fit.areaTargets} />
            ) : (
              <div className="flex flex-1 flex-col items-start justify-center gap-3">
                <p className="max-w-sm text-muted">Connect GitHub to see your skill areas against what this role asks for.</p>
                <Button asChild variant="secondary">
                  <a href="/api/auth/github">
                    <Github aria-hidden="true" />
                    Connect GitHub
                  </a>
                </Button>
              </div>
            )}
          </div>
        </Panel>
      </div>

      <Panel>
        <div className="flex flex-col gap-2 p-6">
          <PanelHeader
            title="Requirements"
            description="Each one read from the post and checked against your repositories"
            action={<StatusLegend />}
          />
          <RequirementGroup title="Required" items={required} />
          <RequirementGroup title="Nice to have" items={preferred} />
        </div>
      </Panel>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <Panel className="lg:col-span-7">
          <div className="flex flex-col gap-4 p-6">
            <PanelHeader title="Closing the gaps" description="What would make your application stronger, most important first" />
            {toClose.length ? (
              <ol className="flex flex-col gap-4">
                {toClose
                  .sort((a, b) => Number(b.importance === "required") - Number(a.importance === "required") || Number(a.status === "related") - Number(b.status === "related"))
                  .map((r) => (
                    <li key={r.skill} className="flex gap-3">
                      <StatusIcon status={r.status} className="mt-0.5" />
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium">
                          {r.technology?.name ?? r.skill}
                          <span className="ml-2 font-mono text-[11px] uppercase tracking-wide text-muted">{r.importance}</span>
                        </span>
                        <span className="text-[14px] text-muted">{r.note}</span>
                      </div>
                    </li>
                  ))}
              </ol>
            ) : (
              <p className="text-muted">
                {fit.score === null ? "Nothing to close yet." : "No gaps your code can’t already speak to. Lead with the evidence above."}
              </p>
            )}
          </div>
        </Panel>
        <Panel className="lg:col-span-5">
          <div className="flex flex-col gap-4 p-6">
            <PanelHeader title="The role" />
            <p className="text-[15px] leading-relaxed">{extraction.summary}</p>
            {extraction.responsibilities.length ? (
              <ul className="flex list-disc flex-col gap-1.5 pl-5 text-[14px] text-muted marker:text-line">
                {extraction.responsibilities.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            ) : null}
          </div>
        </Panel>
      </div>

      <PrepPanel view={view} />
    </div>
  )
}

function SaveButton({ view }: { view: JobPostView }) {
  const save = useSaveToPipeline(view.id)
  if (view.applicationId) {
    return (
      <Button asChild>
        <Link href={`/applications/${view.applicationId}`}>
          Open in pipeline <ArrowRight aria-hidden="true" />
        </Link>
      </Button>
    )
  }
  return (
    <Button onClick={() => save.mutate()} disabled={save.isPending}>
      <Plus aria-hidden="true" />
      {save.isPending ? "Adding…" : "Add to pipeline"}
    </Button>
  )
}

function ScorePanel({ view, className }: { view: JobPostView; className?: string }) {
  const { fit } = view
  const scored = SCORED.reduce((sum, s) => sum + fit.counts[s], 0)
  const positive = fit.verdict === "Strong fit" || fit.verdict === "Good fit"

  return (
    <Panel className={className}>
      <div className="flex h-full flex-col gap-5 p-6">
        <span className="label-mono">Fit score</span>
        <div className="flex flex-wrap items-end gap-4">
          <p className="flex items-baseline gap-1">
            <span className="font-mono text-7xl font-medium leading-none tracking-tighter tabular">{fit.score ?? "—"}</span>
            {fit.score !== null ? <span className="font-mono text-xl text-muted">/100</span> : null}
          </p>
          <span
            className={cn(
              "mb-1.5 rounded-full px-3 py-1 text-sm font-medium",
              fit.score === null ? "bg-raised text-muted" : positive ? "bg-signal-soft text-signal" : "bg-caution-soft text-caution"
            )}
          >
            {fit.verdict}
          </span>
        </div>
        <p className="text-[15px] leading-relaxed">{fit.summary}</p>
        {fit.score !== null && fit.confidence === "low" ? (
          <p className="text-[13px] text-muted">Only a few requirements could be checked against code, so treat this as a rough read.</p>
        ) : null}

        {scored ? (
          <div className="mt-auto flex flex-col gap-3">
            <div className="flex h-2 gap-[3px] overflow-hidden rounded-full" aria-hidden="true">
              {SCORED.filter((s) => fit.counts[s]).map((s) => (
                <span
                  key={s}
                  className={cn(
                    "h-full first:rounded-l-full last:rounded-r-full",
                    s === "strong" && "bg-signal",
                    s === "some" && "bg-signal/55",
                    s === "related" && "bg-signal/25",
                    s === "gap" && "bg-caution"
                  )}
                  style={{ width: `${(fit.counts[s] / scored) * 100}%` }}
                />
              ))}
            </div>
            <dl className="flex flex-wrap gap-x-5 gap-y-2 text-[13px]">
              {(["strong", "some", "related", "gap", "unverifiable"] as const)
                .filter((s) => fit.counts[s])
                .map((s) => (
                  <div key={s} className="flex items-center gap-2">
                    <StatusIcon status={s} className="size-3.5" />
                    <dt className="whitespace-nowrap text-muted">{STATUS_LABELS[s]}</dt>
                    <dd className="font-mono tabular">{fit.counts[s]}</dd>
                  </div>
                ))}
            </dl>
          </div>
        ) : null}
      </div>
    </Panel>
  )
}

function StatusLegend() {
  return (
    <ul className="hidden flex-wrap gap-x-4 gap-y-1 text-[12px] text-muted md:flex" aria-label="Legend">
      {(["strong", "some", "related", "gap", "unverifiable"] as const).map((s) => (
        <li key={s} className="flex items-center gap-1.5">
          <StatusIcon status={s} className="size-3.5" />
          {STATUS_LABELS[s]}
        </li>
      ))}
    </ul>
  )
}

function RequirementGroup({ title, items }: { title: string; items: RequirementFit[] }) {
  if (!items.length) return null
  return (
    <section className="flex flex-col pt-3">
      <h3 className="label-mono pb-1">{title}</h3>
      <ul className="flex flex-col">
        {items.map((r) => (
          <li
            key={r.skill}
            className="grid grid-cols-[18px_minmax(0,1fr)] gap-x-3 gap-y-1 border-b border-line py-3.5 last:border-b-0 md:grid-cols-[18px_minmax(0,1fr)_minmax(0,1.15fr)] md:gap-x-6"
          >
            <StatusIcon status={r.status} className="mt-0.5" />
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="font-medium">
                {r.skill}
                <span className="sr-only">: {STATUS_LABELS[r.status]}</span>
              </span>
              <q className="truncate text-[13px] italic text-muted" title={r.quote}>
                {r.quote}
              </q>
            </div>
            <div className="col-start-2 min-w-0 text-[13px] md:col-start-auto">
              <Evidence requirement={r} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

function Evidence({ requirement: r }: { requirement: RequirementFit }) {
  if ((r.status === "strong" || r.status === "some") && r.technology) {
    return (
      <span className="flex flex-col gap-0.5">
        <span>
          {r.technology.name} <span className="font-mono text-muted">· strength {r.technology.strength}</span>
        </span>
        <span className="truncate text-muted">
          {r.technology.evidence.slice(0, 3).map((e, i) => (
            <span key={e.repo}>
              {i ? ", " : ""}
              <a href={e.url} target="_blank" rel="noopener noreferrer" className="font-mono hover:text-ink hover:underline">
                {e.repo}
              </a>
            </span>
          ))}
          {r.technology.repoCount > 3 ? ` +${r.technology.repoCount - 3}` : ""}
        </span>
      </span>
    )
  }
  return <span className={r.status === "gap" ? "text-ink" : "text-muted"}>{r.note}</span>
}

function PrepPanel({ view }: { view: JobPostView }) {
  const prep = useJobPrep(view.id, view.hasPrep)
  const generate = useGenerateJobPrep(view.id)
  const text = generate.data ?? prep.data

  return (
    <Panel>
      <div className="flex flex-col gap-5 p-6">
        <PanelHeader
          title="Interview prep for this role"
          description="Questions this team is likely to ask, weighted to its requirements, and how to talk about your gaps"
          action={
            text ? (
              <Button variant="ghost" size="sm" onClick={() => generate.mutate(true)} disabled={generate.isPending}>
                <RefreshCw className={generate.isPending ? "animate-spin" : undefined} aria-hidden="true" />
                Regenerate
              </Button>
            ) : null
          }
        />
        <div aria-live="polite" aria-busy={generate.isPending || prep.isLoading}>
          {generate.isPending || (view.hasPrep && prep.isLoading) ? (
            <div className="flex flex-col gap-3">
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          ) : text ? (
            <article className="max-w-3xl">
              <Markdown>{text}</Markdown>
            </article>
          ) : (
            <Button onClick={() => generate.mutate(false)}>
              <Sparkles aria-hidden="true" />
              Prepare me for this interview
            </Button>
          )}
        </div>
      </div>
    </Panel>
  )
}
