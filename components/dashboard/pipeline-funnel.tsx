import Link from "next/link"
import { Panel, PanelHeader } from "@/components/ui/panel"
import { percent } from "@/lib/format"
import type { PipelineStats } from "@/lib/pipeline"

// Later stages get a stronger fill: one hue, ordered by lightness.
const fills = ["opacity-40", "opacity-70", "opacity-100"]

export function PipelineFunnel({ stats, className }: { stats: PipelineStats; className?: string }) {
  const max = Math.max(1, stats.funnel[0]?.count ?? 0)

  return (
    <Panel className={className}>
      <div className="flex flex-col gap-5 p-6">
        <PanelHeader
          title="Pipeline"
          description="How far your applications get"
          action={<Link href="/applications" className="text-[13px] text-brand hover:underline">View all</Link>}
        />
        <ol className="flex flex-col">
          {stats.funnel.map((stage, i) => (
            <li key={stage.label} className="flex flex-col gap-2">
              {stage.conversion !== null ? (
                <span className="py-2.5 text-xs text-muted">↓ <span className="tabular">{percent(stage.conversion)}</span> moved on</span>
              ) : null}
              <div className="flex items-baseline gap-3">
                <span className="font-medium">{stage.label}</span>
                <span className="ml-auto text-xl font-semibold tabular">{stage.count}</span>
              </div>
              <div className="h-3 rounded-[3px] bg-raised">
                <div
                  className={`h-3 rounded-[3px] bg-brand ${fills[i] ?? ""}`}
                  style={{ width: `${(stage.count / max) * 100}%`, minWidth: stage.count ? 6 : 0 }}
                />
              </div>
            </li>
          ))}
        </ol>
        {stats.rejected ? (
          <p className="text-[13px] text-muted">
            {stats.rejected} closed without an offer. Rejections still count as a response.
          </p>
        ) : null}
      </div>
    </Panel>
  )
}
