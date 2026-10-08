import { ChartTip } from "@/components/insights/chart-tip"
import type { Insights } from "@/lib/insights"
import { cn } from "@/lib/utils"

const OUTCOME: Record<Insights["replyTimes"][number]["outcome"], { label: string; mark: string }> = {
  interview: { label: "Interview", mark: "bg-brand" },
  offer: { label: "Offer", mark: "bg-brand ring-2 ring-brand-dim" },
  rejected: { label: "Rejection", mark: "border-2 border-muted bg-panel" },
}

const DOT = 12
const fmtDays = (d: number) => (d < 1 ? "same day" : `${Math.round(d)} day${Math.round(d) === 1 ? "" : "s"}`)

// Every first reply as a dot on a days axis: a strip, so the spread shows as
// well as the median. Dots on the same day stack upwards. Shape tells an
// interview from a rejection without relying on colour.
export function ReplyTimes({ replyTimes, median }: { replyTimes: Insights["replyTimes"]; median: number | null }) {
  const span = Math.max(21, Math.ceil(Math.max(0, ...replyTimes.map((r) => r.days)) / 7) * 7)
  const stacks = new Map<number, number>()
  const placed = replyTimes.map((r) => {
    const key = Math.round(r.days)
    const level = stacks.get(key) ?? 0
    stacks.set(key, level + 1)
    return { ...r, level }
  })
  const tallest = Math.max(1, ...stacks.values())
  const height = Math.max(56, tallest * (DOT + 4) + 20)
  const left = (d: number) => `${(d / span) * 100}%`
  const ticks = Array.from({ length: span / 7 + 1 }, (_, i) => i * 7)

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-wrap gap-4 text-[13px] text-ink-soft" aria-label="Legend">
        {(["interview", "offer", "rejected"] as const).map((o) => (
          <li key={o} className="flex items-center gap-1.5">
            <span aria-hidden="true" className={cn("size-2.5 rounded-full", OUTCOME[o].mark)} />
            {OUTCOME[o].label}
          </li>
        ))}
      </ul>
      <div className="px-1.5">
        <div className="relative" style={{ height }}>
          <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-px bg-line" />
          {median !== null ? (
            <span aria-hidden="true" className="absolute bottom-0 top-0 w-px bg-ink-soft" style={{ left: left(median) }}>
              <span className="absolute -top-0.5 left-1.5 whitespace-nowrap text-[12px] font-semibold text-ink">median {fmtDays(median)}</span>
            </span>
          ) : null}
          <ul aria-label="Days to first reply">
            {placed.map((r) => (
              <li
                key={r.id}
                tabIndex={0}
                aria-label={`${r.company}: ${OUTCOME[r.outcome].label.toLowerCase()} after ${fmtDays(r.days)}`}
                className="group absolute -translate-x-1/2 rounded-full p-1.5 outline-none focus-visible:ring-2 focus-visible:ring-brand"
                style={{ left: left(r.days), bottom: 2 + r.level * (DOT + 4) - 6 }}
              >
                <span className={cn("block rounded-full transition-transform group-hover:scale-125", OUTCOME[r.outcome].mark)} style={{ width: DOT, height: DOT }} />
                <ChartTip value={fmtDays(r.days)} label={`${r.company} · ${OUTCOME[r.outcome].label.toLowerCase()}`} />
              </li>
            ))}
          </ul>
        </div>
        <div className="relative mt-1.5 h-4 text-[11px] text-muted tabular" aria-hidden="true">
          {ticks.map((t) => (
            <span key={t} className="absolute -translate-x-1/2" style={{ left: left(t) }}>
              {t === 0 ? "0" : `${t}d`}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
