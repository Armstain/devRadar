"use client"

import Link from "next/link"
import { Github } from "lucide-react"
import { AreaRadar } from "@/components/skills/area-radar"
import { Scope } from "@/components/scope"
import { Button } from "@/components/ui/button"
import { Panel, PanelHeader } from "@/components/ui/panel"
import { Skeleton } from "@/components/ui/skeleton"
import { syncInProgress, useGithubProfile } from "@/hooks/use-github"
import { useJobPosts } from "@/hooks/use-job-posts"
import { useHydrated } from "@/hooks/use-hydrated"
import { timeAgo } from "@/lib/format"

export function SkillRadarCard({ className }: { className?: string }) {
  const { data: state, isLoading, isError } = useGithubProfile()
  const { data: posts } = useJobPosts()
  const hydrated = useHydrated()
  const profile = state?.profile
  const best = (posts ?? []).filter((p) => p.score !== null).sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0]

  return (
    <Panel className={className}>
      <div className="flex h-full flex-col gap-3 p-5 sm:p-6">
        <PanelHeader
          title="Your radar"
          description={
            profile && hydrated && state?.syncedAt
              ? `Read from ${profile.stats.reposAnalyzed} repositories, ${timeAgo(state.syncedAt)}`
              : profile
                ? profile.archetype
                : undefined
          }
          action={state?.connected ? <Link href="/github" className="text-[13px] text-brand hover:underline">Skills</Link> : null}
        />
        {isLoading ? (
          <Skeleton className="mx-auto aspect-square w-full max-w-[300px] rounded-full" />
        ) : profile ? (
          <>
            <AreaRadar areas={profile.areas} compact className="max-w-[320px]" />
            {best ? (
              <Link href={`/fit/${best.id}`} className="group mt-auto flex items-end gap-3 border-t border-line pt-4">
                <span className="text-5xl font-semibold leading-[0.85] tracking-[-0.06em] tabular">{best.score}</span>
                <span className="flex min-w-0 flex-col">
                  <span className="font-semibold group-hover:underline">Best current fit</span>
                  <span className="truncate text-[13px] text-muted">
                    {best.title}
                    {best.company ? ` at ${best.company}` : ""}
                  </span>
                </span>
              </Link>
            ) : (
              <p className="mt-auto border-t border-line pt-4 text-[13px] text-muted">{profile.headline}</p>
            )}
          </>
        ) : state?.connected ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 py-2 text-center">
            <Scope className="max-w-[180px]" sweeping={syncInProgress(state)} />
            <p className="max-w-xs text-sm text-muted">
              {isError
                ? "Couldn’t load your skill profile right now."
                : syncInProgress(state)
                  ? "Reading your repositories. Your radar appears here in about a minute."
                  : state.error ?? "Your first sync hasn’t run yet."}
            </p>
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 py-2 text-center">
            <Scope className="max-w-[200px]" />
            <div className="flex flex-col gap-1">
              <p className="font-semibold">Nothing measured yet</p>
              <p className="max-w-xs text-sm text-muted">Connect GitHub and DevRadar reads your repositories in about a minute.</p>
            </div>
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
  )
}
