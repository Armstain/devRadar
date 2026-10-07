"use client"

import Link from "next/link"
import { Github } from "lucide-react"
import { AreaRadar } from "@/components/skills/area-radar"
import { Scope } from "@/components/scope"
import { Button } from "@/components/ui/button"
import { Panel, PanelHeader } from "@/components/ui/panel"
import { Skeleton } from "@/components/ui/skeleton"
import { syncInProgress, useGithubProfile } from "@/hooks/use-github"

export function SkillRadarCard({ className }: { className?: string }) {
  const { data: state, isLoading, isError } = useGithubProfile()
  const profile = state?.profile

  return (
    <Panel className={className}>
      <div className="flex h-full flex-col gap-4 p-6">
        <PanelHeader
          title="Skill radar"
          description={profile ? profile.archetype : undefined}
          action={state?.connected ? <Link href="/github" className="text-[13px] text-signal hover:underline">Open profile</Link> : null}
        />
        {isLoading ? (
          <Skeleton className="mx-auto aspect-[9/8] w-full max-w-[360px] rounded-full" />
        ) : profile ? (
          <>
            <AreaRadar areas={profile.areas} />
            <p className="text-[13px] text-muted">{profile.headline}</p>
          </>
        ) : state?.connected ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 py-2 text-center">
            <Scope className="max-w-[180px]" />
            <p className="max-w-xs text-sm text-muted">
              {isError
                ? "Couldn’t load your skill profile right now."
                : syncInProgress(state)
                  ? "Reading your repositories. Your radar appears here in a minute."
                  : state.error ?? "Your first sync hasn’t run yet."}
            </p>
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 py-2 text-center">
            <Scope className="max-w-[200px]" />
            <div className="flex flex-col gap-1">
              <p className="font-medium">Your radar is waiting for a signal</p>
              <p className="max-w-xs text-sm text-muted">Connect GitHub and DevRadar maps your skills from the code you’ve shipped.</p>
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
