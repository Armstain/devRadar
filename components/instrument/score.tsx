import { cn } from "@/lib/utils"

export interface ScoreCounts {
  strong: number
  some: number
  related: number
  gap: number
  unverifiable: number
}

const positive = (verdict: string) => verdict === "Strong fit" || verdict === "Good fit"

// A score that shows its working: the number, the verdict in words, and the
// requirements behind it as a stacked bar with a legend. The gap segment has
// its own shape in the legend so it reads without colour.
export function ScoreReadout({
  score,
  verdict,
  counts,
  size = "lg",
  className,
}: {
  score: number | null
  verdict: string
  counts?: ScoreCounts
  size?: "md" | "lg"
  className?: string
}) {
  const parts = counts
    ? [
        { key: "strong", n: counts.strong, label: "in your code", bar: "bg-brand" },
        { key: "some", n: counts.some, label: "partly shown", bar: "bg-brand/45" },
        { key: "related", n: counts.related, label: "close", bar: "bg-brand/20" },
        { key: "gap", n: counts.gap, label: counts.gap === 1 ? "gap" : "gaps", bar: "bg-warn" },
      ].filter((p) => p.n > 0)
    : []
  const total = parts.reduce((sum, p) => sum + p.n, 0)

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <p className="flex items-baseline gap-2">
        <span
          className={cn(
            "font-semibold leading-[0.85] tracking-[-0.06em] tabular",
            size === "lg" ? "text-[clamp(4.5rem,9vw,7rem)]" : "text-5xl"
          )}
        >
          {score ?? "—"}
        </span>
        {score !== null ? <span className="text-muted">/100</span> : null}
      </p>
      <p className={cn("font-semibold", size === "lg" ? "text-lg" : "text-base", score !== null && !positive(verdict) && "text-warn-ink")}>
        {verdict}
      </p>
      {total ? (
        <>
          <div className="flex h-2.5 gap-0.5" aria-hidden="true">
            {parts.map((p) => (
              <span key={p.key} className={cn("h-full rounded-[3px]", p.bar)} style={{ flex: p.n }} />
            ))}
          </div>
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-ink-soft">
            {parts.map((p) => (
              <li key={p.key} className="inline-flex items-center gap-1.5">
                {p.key === "gap" ? (
                  <span aria-hidden="true" className="tri inline-block h-[9px] w-[10px] bg-warn" />
                ) : (
                  <span aria-hidden="true" className={cn("inline-block size-2.5 rounded-full", p.bar)} />
                )}
                <span className="tabular">{p.n}</span> {p.label}
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  )
}
