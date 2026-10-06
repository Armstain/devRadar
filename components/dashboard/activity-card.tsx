"use client"

import { Panel, PanelHeader } from "@/components/ui/panel"
import { Skeleton } from "@/components/ui/skeleton"
import { useMe } from "@/hooks/use-applications"
import { dailySeries, useGithubContributions } from "@/hooks/use-github"
import { shortDate } from "@/lib/format"

const DAYS = 30

// Daily GitHub activity (pushes and new repos) for the last 30 days.
// Only rendered once GitHub is connected; the radar card handles the prompt.
export function ActivityCard() {
  const { data: me } = useMe()
  const connected = Boolean(me?.github.connected)
  const { data, isLoading, isError } = useGithubContributions(connected)

  if (!connected || isError) return null

  const series = data ? dailySeries(data.recentContributions, DAYS, new Date()) : []
  const max = Math.max(1, ...series.map((d) => d.count))
  const total = series.reduce((sum, d) => sum + d.count, 0)

  return (
    <Panel>
      <div className="flex flex-col gap-5 p-6">
        <PanelHeader
          title="Shipping activity"
          action={<span className="font-mono text-[13px] text-muted">Last {DAYS} days · {total} pushes</span>}
        />
        {isLoading ? (
          <Skeleton className="h-20" />
        ) : (
          <div
            role="img"
            aria-label={`${total} pushes in the last ${DAYS} days; busiest day had ${max}.`}
            className="flex h-20 items-end gap-[3px]"
          >
            {series.map((day, i) => (
              <span
                key={day.date}
                title={`${shortDate(day.date)}: ${day.count}`}
                className={i === series.length - 1 ? "flex-1 rounded-[2px] bg-signal" : "flex-1 rounded-[2px] bg-signal-dim"}
                style={{ height: `${Math.max(4, (day.count / max) * 80)}px` }}
              />
            ))}
          </div>
        )}
      </div>
    </Panel>
  )
}
