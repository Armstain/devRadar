"use client"

import Link from "next/link"
import { Github } from "lucide-react"
import { RadarChart } from "@/components/radar-chart"
import { Scope } from "@/components/scope"
import { Button } from "@/components/ui/button"
import { Panel, PanelHeader } from "@/components/ui/panel"
import { Skeleton } from "@/components/ui/skeleton"
import { useMe } from "@/hooks/use-applications"
import { useGithubLanguages } from "@/hooks/use-github"
import { radarScale } from "@/lib/format"

export function SkillRadarCard({ className }: { className?: string }) {
  const { data: me, isLoading: loadingMe } = useMe()
  const connected = Boolean(me?.github.connected)
  const { data: languages, isLoading, isError } = useGithubLanguages(connected)

  const top = languages?.slice(0, 6) ?? []
  const max = Math.max(1, ...top.map((l) => l.percentage))
  const axes = top.map((l) => ({ label: l.language, value: radarScale(l.percentage, max), detail: `${l.percentage}%` }))

  return (
    <Panel className={className}>
      <div className="flex h-full flex-col gap-4 p-6">
        <PanelHeader
          title="Skill radar"
          description={connected ? "Languages by share of your code" : undefined}
          action={connected ? <Link href="/github" className="text-[13px] text-signal hover:underline">Open profile</Link> : null}
        />
        {loadingMe || (connected && isLoading) ? (
          <Skeleton className="mx-auto aspect-[9/8] w-full max-w-[360px] rounded-full" />
        ) : connected && axes.length >= 3 ? (
          <>
            <RadarChart
              axes={axes}
              label={`Languages across your repositories: ${top.map((l) => `${l.language} ${l.percentage}%`).join(", ")}`}
            />
            <p className="text-[13px] text-muted">
              Strongest in {top.slice(0, 2).map((l) => l.language).join(" and ")}, across your public repositories.
            </p>
          </>
        ) : connected ? (
          <p className="text-sm text-muted">
            {isError ? "Couldn’t reach GitHub right now. Try again in a minute." : "Not enough code in your public repositories to draw a radar yet."}
          </p>
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
