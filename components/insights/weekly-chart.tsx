import { ChartTip, DataTable } from "@/components/insights/chart-tip"
import type { Insights } from "@/lib/insights"

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
// Week starts are UTC midnights; format them in UTC so no time zone shifts the day
const day = (iso: string) => {
  const d = new Date(iso)
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`
}

const HEIGHT = 160

// Applications sent each week, split into the ones that have had an answer
// and the ones still waiting. A single baseline, one value axis.
export function WeeklyChart({ weekly }: { weekly: Insights["weekly"] }) {
  const max = Math.max(4, ...weekly.map((w) => w.sent))
  const step = max <= 6 ? 2 : max <= 12 ? 4 : 5
  const top = Math.ceil(max / step) * step
  const ticks = Array.from({ length: top / step + 1 }, (_, i) => i * step)
  const px = (n: number) => (n / top) * HEIGHT

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex gap-4 text-[13px] text-ink-soft" aria-label="Legend">
        <li className="flex items-center gap-1.5">
          <span aria-hidden="true" className="size-2.5 rounded-[3px] bg-brand" />
          Answered
        </li>
        <li className="flex items-center gap-1.5">
          <span aria-hidden="true" className="size-2.5 rounded-[3px] bg-muted/50" />
          No answer yet
        </li>
      </ul>
      <div className="grid grid-cols-[24px_minmax(0,1fr)] gap-x-2">
        <div className="relative" style={{ height: HEIGHT }} aria-hidden="true">
          {ticks.map((t) => (
            <span key={t} className="absolute right-0 translate-y-1/2 text-[11px] text-muted tabular" style={{ bottom: px(t) }}>
              {t}
            </span>
          ))}
        </div>
        <div className="relative" style={{ height: HEIGHT }}>
          {ticks.map((t) => (
            <span key={t} aria-hidden="true" className="absolute inset-x-0 h-px bg-line" style={{ bottom: px(t) }} />
          ))}
          <ol className="absolute inset-0 grid grid-cols-12" aria-label="Applications per week">
            {weekly.map((w) => {
              const waiting = w.sent - w.replied
              return (
                <li key={w.weekStart} className="flex items-end justify-center">
                  <span
                    tabIndex={0}
                    aria-label={`Week of ${day(w.weekStart)}: ${w.sent} sent, ${w.replied} answered`}
                    className="group relative flex h-full w-full max-w-10 flex-col items-center justify-end rounded-md outline-none hover:bg-raised/60 focus-visible:bg-raised/60"
                  >
                    {w.sent ? (
                      <span className="flex w-full max-w-6 flex-col gap-0.5">
                        {waiting ? <span className="rounded-t-[4px] bg-muted/50" style={{ height: px(waiting) - (w.replied ? 2 : 0) }} /> : null}
                        {w.replied ? (
                          <span className={waiting ? "bg-brand" : "rounded-t-[4px] bg-brand"} style={{ height: px(w.replied) }} />
                        ) : null}
                      </span>
                    ) : null}
                    <ChartTip value={`${w.sent} sent · ${w.replied} answered`} label={`Week of ${day(w.weekStart)}`} />
                  </span>
                </li>
              )
            })}
          </ol>
        </div>
        <span />
        <ol className="mt-2 grid grid-cols-12 text-center text-[11px] text-muted" aria-hidden="true">
          {weekly.map((w, i) => (
            <li key={w.weekStart} className="truncate">
              {i % 3 === 0 || i === weekly.length - 1 ? day(w.weekStart) : ""}
            </li>
          ))}
        </ol>
      </div>
      <DataTable
        caption="Applications sent per week"
        head={["Week of", "Sent", "Answered"]}
        rows={weekly.map((w) => [day(w.weekStart), w.sent, w.replied])}
      />
    </div>
  )
}
