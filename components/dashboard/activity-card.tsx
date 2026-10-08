"use client"

import { Panel, PanelHeader } from "@/components/ui/panel"
import { dailySeries, useGithubProfile } from "@/hooks/use-github"
import { useHydrated } from "@/hooks/use-hydrated"
import { shortDate } from "@/lib/format"

const DAYS = 30

// Daily GitHub contributions for the last 30 days, from the stored snapshot.
// Only rendered once a profile exists; the radar card handles the prompt.
export function ActivityCard({ className }: { className?: string }) {
  const { data: state } = useGithubProfile()
  const hydrated = useHydrated()
  const profile = state?.profile
  if (!profile || !hydrated) return null

  const series = dailySeries(profile.activity.days, DAYS, new Date())
  const max = Math.max(1, ...series.map((d) => d.count))
  const total = series.reduce((sum, d) => sum + d.count, 0)

  return (
    <Panel className={className}>
      <div className="flex h-full flex-col gap-5 p-6">
        <PanelHeader
          title="Shipping activity"
          action={
            <span className="text-[13px] text-muted tabular">
              Last {DAYS} days · {total} contributions · {profile.activity.currentStreak}d streak
            </span>
          }
        />
        <div
          role="img"
          aria-label={`${total} contributions in the last ${DAYS} days; busiest day had ${max}.`}
          className="flex min-h-24 flex-1 items-end gap-[3px]"
        >
          {series.map((day, i) => (
            <span
              key={day.date}
              title={`${shortDate(day.date)}: ${day.count}`}
              className={i === series.length - 1 ? "flex-1 rounded-[2px] bg-brand" : "flex-1 rounded-[2px] bg-brand-dim"}
              style={{ height: `${Math.max(4, (day.count / max) * 100)}%` }}
            />
          ))}
        </div>
      </div>
    </Panel>
  )
}
