import { cn } from "@/lib/utils"
import { percent, plural } from "@/lib/format"
import type { PipelineStats } from "@/lib/pipeline"

interface Kpi {
  label: string
  value: string
  note: string
  positive?: boolean
}

// The pipeline in four numbers, as a quiet ruled row rather than tiles: the
// numbers support the page, they aren't its point.
export function KpiStrip({ stats }: { stats: PipelineStats }) {
  const heardBack = stats.inProgress + stats.offers + stats.rejected
  const kpis: Kpi[] = [
    {
      label: "Active applications",
      value: String(stats.active),
      note: stats.addedThisWeek ? `${stats.addedThisWeek} added this week` : "None added this week",
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
    <section aria-label="Key numbers" className="grid grid-cols-2 border-y border-line lg:grid-cols-4">
      {kpis.map((kpi, i) => (
        <div
          key={kpi.label}
          className={cn("flex flex-col gap-0.5 py-4", i % 2 === 1 && "pl-5 max-lg:border-l max-lg:border-line", i > 0 && "lg:border-l lg:border-line lg:pl-6", i >= 2 && "max-lg:border-t max-lg:border-line")}
        >
          <span className="label-quiet">{kpi.label}</span>
          <span className="text-3xl font-semibold tracking-[-0.04em] tabular">{kpi.value}</span>
          <span className={cn("text-[13px]", kpi.positive ? "text-brand" : "text-muted")}>{kpi.note}</span>
        </div>
      ))}
    </section>
  )
}
