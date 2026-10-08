import { DataTable } from "@/components/insights/chart-tip"
import { fitFinding, MIN_SAMPLE, type Insights } from "@/lib/insights"
import { cn } from "@/lib/utils"

const pct = (r: number) => `${Math.round(r * 100)}%`

// Reply rate for each fit band. Bands with too few applications are drawn
// hollow and say so, rather than inviting a comparison they can't support.
export function FitReplies({ byFit }: { byFit: Insights["byFit"] }) {
  const finding = fitFinding(byFit)
  const shown = byFit.filter((b) => b.sent > 0)

  return (
    <div className="flex flex-col gap-5">
      <p className={cn("text-[15px] leading-relaxed", finding ? "font-medium" : "text-ink-soft")}>
        {finding ?? `Once you have ${MIN_SAMPLE} or more applications in both the strong and the stretch band, this compares their reply rates.`}
      </p>
      <ul className="flex flex-col gap-4">
        {shown.map((b) => {
          const thin = b.sent < MIN_SAMPLE
          return (
            <li key={b.band} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1.5 sm:grid-cols-[minmax(0,9.5rem)_minmax(0,1fr)_auto]">
              <span className="col-span-2 text-sm font-semibold sm:col-span-1">{b.label}</span>
              <span className="relative h-2.5 rounded-[4px] bg-raised" aria-hidden="true">
                {b.rate ? (
                  <span
                    className={cn("absolute inset-y-0 left-0 rounded-[4px]", thin ? "border-[1.5px] border-brand bg-brand/15" : "bg-brand")}
                    style={{ width: `${Math.max(2, b.rate * 100)}%` }}
                  />
                ) : null}
              </span>
              <span className="text-right text-sm tabular">
                <span className="font-semibold">{b.rate === null ? "—" : pct(b.rate)}</span>
                <span className="text-muted"> · {b.replied} of {b.sent}</span>
              </span>
              {thin ? <span className="text-[12px] text-muted sm:col-start-2">Too few to read much into yet</span> : null}
            </li>
          )
        })}
      </ul>
      <DataTable
        caption="Reply rate by fit score"
        head={["Fit", "Sent", "Answered", "Rate"]}
        rows={byFit.map((b) => [b.label, b.sent, b.replied, b.rate === null ? "—" : pct(b.rate)])}
      />
    </div>
  )
}
