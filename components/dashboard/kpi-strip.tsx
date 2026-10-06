import { cn } from "@/lib/utils"
import { percent, plural } from "@/lib/format"
import type { PipelineStats } from "@/lib/pipeline"

interface Kpi {
  label: string
  value: string
  note: string
  positive?: boolean
}

export function KpiStrip({ stats }: { stats: PipelineStats }) {
  const heardBack = stats.inProgress + stats.offers + stats.rejected
  const kpis: Kpi[] = [
    {
      label: "Active applications",
      value: String(stats.active),
      note: stats.addedThisWeek ? `+${stats.addedThisWeek} this week` : "None added this week",
      positive: stats.addedThisWeek > 0,
    },
    {
      label: "Response rate",
      value: stats.responseRate === null ? "—" : percent(stats.responseRate),
      note: `${heardBack} of ${plural(stats.total, "application")} heard back`,
    },
    {
      label: "In interviews",
      value: String(stats.inProgress),
      note: stats.inProgress ? "Keep the momentum" : "None yet",
    },
    {
      label: "Offers",
      value: String(stats.offers),
      note: stats.rejected ? `${stats.rejected} rejected` : "No rejections",
    },
  ]

  return (
    <section aria-label="Key numbers" className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line lg:grid-cols-4">
      {kpis.map((kpi) => (
        <div key={kpi.label} className="flex flex-col gap-1 bg-panel px-5 py-4 sm:px-6 sm:py-5">
          <span className="text-[13px] text-muted">{kpi.label}</span>
          <span className="font-mono text-3xl font-medium tracking-tight tabular sm:text-[34px] sm:leading-tight">{kpi.value}</span>
          <span className={cn("text-[13px]", kpi.positive ? "text-signal" : "text-muted")}>{kpi.note}</span>
        </div>
      ))}
    </section>
  )
}
