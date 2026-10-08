import { heatmapLayout } from "@/lib/skills/heatmap"
import { shortDate } from "@/lib/format"
import { cn } from "@/lib/utils"

const CELL = 11
const STEP = 14
const TOP = 18

const levelClass = ["fill-raised", "fill-brand/25", "fill-brand/45", "fill-brand/70", "fill-brand"]

// A year of contributions, one square per day. Levels are quartiles of the
// active days; the legend explains them and every square has a tooltip.
export function ContributionHeatmap({
  days,
  total,
  className,
}: {
  days: { date: string; count: number }[]
  total: number
  className?: string
}) {
  const { cells, months, weeks } = heatmapLayout(days)
  if (!cells.length) return <p className="text-sm text-muted">No contribution data yet.</p>

  const width = weeks * STEP
  const height = TOP + 7 * STEP

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`${total.toLocaleString("en-US")} contributions between ${shortDate(cells[0].date)} and ${shortDate(cells[cells.length - 1].date)}.`}
        className="h-auto w-full"
      >
        {months.map((m) => (
          <text key={`${m.week}-${m.label}`} x={m.week * STEP} y={11} className="fill-muted text-[10px]">
            {m.label}
          </text>
        ))}
        {cells.map((c) => (
          <rect
            key={c.date}
            x={c.week * STEP}
            y={TOP + c.weekday * STEP}
            width={CELL}
            height={CELL}
            rx={2.5}
            className={levelClass[c.level]}
          >
            <title>{`${shortDate(c.date)}: ${c.count} contribution${c.count === 1 ? "" : "s"}`}</title>
          </rect>
        ))}
      </svg>
      <div className="flex items-center justify-end gap-1.5 text-[11px] text-muted" aria-hidden="true">
        <span className="mr-1">Less</span>
        {levelClass.map((cls) => (
          <svg key={cls} viewBox="0 0 11 11" className="size-[11px]">
            <rect width="11" height="11" rx="2.5" className={cls} />
          </svg>
        ))}
        <span className="ml-1">More</span>
      </div>
    </div>
  )
}
