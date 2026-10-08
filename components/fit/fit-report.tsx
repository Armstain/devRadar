"use client"

import Link from "next/link"
import { ArrowRight, ExternalLink, Github, Plus, RefreshCw, Sparkles } from "lucide-react"
import { DotMeter } from "@/components/instrument/dot-meter"
import { ScoreReadout } from "@/components/instrument/score"
import { Markdown } from "@/components/markdown"
import { Scope } from "@/components/scope"
import { AreaRadar } from "@/components/skills/area-radar"
import { StatusIcon, STATUS_LABELS } from "@/components/fit/status-icon"
import { Button } from "@/components/ui/button"
import { Panel, PanelHeader } from "@/components/ui/panel"
import { Skeleton } from "@/components/ui/skeleton"
import { useGenerateJobPrep, useJobPrep, useSaveToPipeline, type JobPostView } from "@/hooks/use-job-posts"
import type { RequirementFit } from "@/lib/fit/score"
import { plural } from "@/lib/format"
import { TECHNOLOGY_BY_ID } from "@/lib/skills/catalog"


function salaryLine(salary: JobPostView["extraction"]["salary"]): string | null {
  if (!salary || (salary.min === null && salary.max === null)) return null
  const fmt = (n: number) => (n >= 1000 ? `${Math.round(n / 1000)}k` : String(n))
  const range = salary.min !== null && salary.max !== null ? `${fmt(salary.min)}–${fmt(salary.max)}` : fmt((salary.min ?? salary.max)!)
  return `${salary.currency ?? ""} ${range}${salary.period ? ` / ${salary.period}` : ""}`.trim()
}

// The headline gap: the first required one, else the first nice-to-have.
function topGap(requirements: RequirementFit[]): RequirementFit | undefined {
  const gaps = requirements.filter((r) => r.status === "gap")
  return gaps.find((r) => r.importance === "required") ?? gaps[0]
}

export function FitReport({ view }: { view: JobPostView }) {
  const { extraction, fit } = view
  const facts = [
    extraction.location,
    extraction.workplace && extraction.workplace[0].toUpperCase() + extraction.workplace.slice(1),
    extraction.seniority && extraction.seniority[0].toUpperCase() + extraction.seniority.slice(1),
    salaryLine(extraction.salary),
  ].filter(Boolean) as string[]

  const required = fit.requirements.filter((r) => r.importance === "required")
  const preferred = fit.requirements.filter((r) => r.importance === "preferred")
  const toClose = fit.requirements
    .filter((r) => r.status === "gap" || r.status === "related")
    .sort((a, b) => Number(b.importance === "required") - Number(a.importance === "required") || Number(a.status === "related") - Number(b.status === "related"))
  const gap = topGap(fit.requirements)
  const gapArea = gap?.technology ? TECHNOLOGY_BY_ID.get(gap.technology.id)?.area : null

  return (
    <div className="flex flex-col gap-12">
      <section className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        <div className="flex min-w-0 flex-col gap-5">
          <div className="flex flex-col gap-2">
            <nav aria-label="Breadcrumb" className="flex gap-2 text-sm text-muted">
              <Link href="/fit" className="hover:text-ink hover:underline">Job fit</Link>
              <span aria-hidden="true">/</span>
              <span className="truncate text-ink" aria-current="page">{extraction.company ?? "This role"}</span>
            </nav>
            <h1 className="text-3xl font-semibold leading-[1.1] tracking-[-0.03em] sm:text-[40px]">
              {extraction.title}
              {extraction.company ? <span className="text-ink-soft"> at {extraction.company}</span> : null}
            </h1>
            {facts.length ? <p className="text-ink-soft">{facts.join(" · ")}</p> : null}
          </div>
          <ScoreReadout score={fit.score} verdict={fit.verdict} />
          <p className="max-w-xl text-[15px] leading-relaxed text-ink-soft">{fit.summary}</p>
          {fit.score !== null && fit.confidence === "low" ? (
            <p className="max-w-xl text-[13px] text-muted">Only a few requirements could be checked against code, so treat this as a rough read.</p>
          ) : null}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <SaveButton view={view} />
            <a href="#prep" className="text-sm font-medium text-brand hover:underline">Prepare for the interview</a>
            {view.url ? (
              <a href={view.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm font-medium text-ink-soft hover:text-ink hover:underline">
                Open the post <ExternalLink className="size-3.5" aria-hidden="true" />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            ) : null}
          </div>
        </div>

        <figure className="flex min-w-0 flex-col gap-3">
          {view.areas ? (
            <>
              <AreaRadar
                areas={view.areas}
                targets={fit.areaTargets}
                gap={gap && gapArea ? { area: gapArea, label: gap.technology?.name ?? gap.skill } : undefined}
                className="mx-auto w-full max-w-[560px]"
              />
              <figcaption className="flex flex-wrap justify-center gap-x-5 gap-y-1 text-[13px] text-ink-soft">
                <span className="flex items-center gap-2">
                  <span aria-hidden="true" className="h-0.5 w-4 rounded bg-brand" />
                  Your code
                </span>
                <span className="flex items-center gap-2">
                  <span aria-hidden="true" className="w-4 border-t-[1.5px] border-dashed border-ink-soft" />
                  What the role asks for
                </span>
              </figcaption>
            </>
          ) : (
            <Scope className="mx-auto max-w-[360px]">
              <div className="absolute inset-0 grid place-items-center p-[22%] text-center">
                <div className="flex flex-col items-center gap-3">
                  <p className="text-sm text-ink-soft">Connect GitHub to see your skill areas against what this role asks for.</p>
                  <Button asChild variant="secondary" size="sm">
                    <a href="/api/auth/github">
                      <Github aria-hidden="true" />
                      Connect GitHub
                    </a>
                  </Button>
                </div>
              </div>
            </Scope>
          )}
        </figure>
      </section>

      <section className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-semibold tracking-[-0.02em]">What the post asks for</h2>
          <p className="text-ink-soft">
            {plural(fit.requirements.length, "requirement")}, each quoted from the post and checked against your repositories.
          </p>
        </div>
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <Panel className="overflow-hidden">
            <div
              role="row"
              className="hidden grid-cols-[18px_minmax(0,1fr)_minmax(0,1fr)_72px] gap-x-6 border-b border-line px-5 py-2.5 md:grid"
              aria-hidden="true"
            >
              <span />
              <span className="label-quiet">Requirement</span>
              <span className="label-quiet">Evidence in your code</span>
              <span className="label-quiet">Strength</span>
            </div>
            <RequirementGroup title="Required" items={required} showTitle={preferred.length > 0} />
            <RequirementGroup title="Nice to have" items={preferred} showTitle />
          </Panel>
          <aside className="flex flex-col gap-4">
            {toClose.length ? (
              <section className="flex flex-col gap-3 rounded-xl border border-line bg-panel p-5">
                <h3 className="flex items-center gap-2 font-semibold">
                  <span aria-hidden="true" className="tri inline-block h-[9px] w-[10px] bg-warn" />
                  Before you apply
                </h3>
                <ol className="flex flex-col gap-3">
                  {toClose.slice(0, 3).map((r) => (
                    <li key={r.skill} className="flex flex-col gap-0.5 text-sm">
                      <span className="font-medium">
                        {r.technology?.name ?? r.skill}
                        <span className="ml-1.5 text-[13px] font-normal text-muted">
                          {r.importance === "required" ? "required" : "nice to have"}
                        </span>
                      </span>
                      <span className="text-ink-soft">{r.note}</span>
                    </li>
                  ))}
                </ol>
              </section>
            ) : (
              <section className="flex flex-col gap-2 rounded-xl border border-line bg-panel p-5">
                <h3 className="font-semibold">Nothing to close</h3>
                <p className="text-sm text-ink-soft">
                  {fit.score === null ? "There’s nothing your code can be checked against yet." : "Your code already speaks to every requirement it can. Lead with the evidence."}
                </p>
              </section>
            )}
            <dl className="flex flex-col rounded-xl bg-raised px-5 py-2 text-sm">
              {(["strong", "some", "related", "gap", "unverifiable"] as const)
                .filter((s) => fit.counts[s])
                .map((s) => (
                  <div key={s} className="flex items-center gap-2.5 border-b border-line py-2 last:border-b-0">
                    <StatusIcon status={s} className="size-3.5" />
                    <dt className="text-ink-soft">{STATUS_LABELS[s]}</dt>
                    <dd className="ml-auto font-semibold tabular">{fit.counts[s]}</dd>
                  </div>
                ))}
            </dl>
          </aside>
        </div>
      </section>

      <section className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <PrepPanel view={view} />
        <Panel>
          <div className="flex flex-col gap-4 p-5">
            <PanelHeader title="The role" as="h2" />
            <p className="text-[15px] leading-relaxed">{extraction.summary}</p>
            {extraction.responsibilities.length ? (
              <ul className="flex list-disc flex-col gap-1.5 pl-5 text-[14px] text-ink-soft marker:text-muted">
                {extraction.responsibilities.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            ) : null}
          </div>
        </Panel>
      </section>
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

function RequirementGroup({ title, items, showTitle }: { title: string; items: RequirementFit[]; showTitle: boolean }) {
  if (!items.length) return null
  return (
    <section>
      {showTitle ? <h3 className="label-quiet border-b border-line bg-raised/60 px-5 py-2">{title}</h3> : null}
      <ul className="flex flex-col">
        {items.map((r) => (
          <li
            key={r.skill}
            className="grid grid-cols-[18px_minmax(0,1fr)] gap-x-3 gap-y-1.5 border-b border-line px-5 py-3.5 last:border-b-0 md:grid-cols-[18px_minmax(0,1fr)_minmax(0,1fr)_72px] md:gap-x-6"
          >
            <StatusIcon status={r.status} className="mt-0.5" />
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="font-semibold">
                {r.skill}
                <span className="sr-only">: {STATUS_LABELS[r.status]}</span>
              </span>
              <q className="line-clamp-2 text-[13px] text-muted" title={r.quote}>
                {r.quote}
              </q>
            </div>
            <div className="col-start-2 min-w-0 text-[13px] md:col-start-auto">
              <Evidence requirement={r} />
            </div>
            <div className="col-start-2 flex items-center md:col-start-auto md:items-start md:pt-1.5">
              {r.status === "unverifiable" ? null : (
                <>
                  <DotMeter value={r.status === "related" ? (r.related?.strength ?? 0) / 2 : (r.technology?.strength ?? 0)} gap={r.status === "gap"} />
                  <span className="sr-only">Strength {r.technology?.strength ?? 0} of 100</span>
                </>
              )}
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
          {r.technology.name} <span className="text-muted tabular">· strength {r.technology.strength}</span>
        </span>
        <span className="truncate text-muted">
          {r.technology.evidence.slice(0, 3).map((e, i) => (
            <span key={e.repo}>
              {i ? ", " : ""}
              <a href={e.url} target="_blank" rel="noopener noreferrer" className="font-mono text-[12.5px] hover:text-ink hover:underline">
                {e.repo}
              </a>
            </span>
          ))}
          {r.technology.repoCount > 3 ? ` +${r.technology.repoCount - 3}` : ""}
        </span>
      </span>
    )
  }
  return <span className={r.status === "gap" ? "text-ink-soft" : "text-muted"}>{r.note}</span>
}

function PrepPanel({ view }: { view: JobPostView }) {
  const prep = useJobPrep(view.id, view.hasPrep)
  const generate = useGenerateJobPrep(view.id)
  const text = generate.data ?? prep.data

  return (
    <Panel id="prep" className="scroll-mt-6">
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
