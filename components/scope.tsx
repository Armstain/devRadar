import { cn } from "@/lib/utils"

const TICKS = Array.from({ length: 60 }, (_, i) => i * 6)

// An empty dial: the "nothing measured yet" state. The sweep only turns while
// something is actually happening (a scan or a sync), never as decoration.
export function Scope({ className, sweeping, children }: { className?: string; sweeping?: boolean; children?: React.ReactNode }) {
  return (
    <div className={cn("relative aspect-square w-full", className)} aria-hidden="true">
      <svg viewBox="0 0 200 200" fill="none" className="absolute inset-0 size-full">
        {TICKS.map((d) => {
          const a = ((d - 90) * Math.PI) / 180
          const major = d % 60 === 0
          const r1 = 88
          const r2 = major ? 97 : 93
          return (
            <line
              key={d}
              x1={(100 + Math.cos(a) * r1).toFixed(1)}
              y1={(100 + Math.sin(a) * r1).toFixed(1)}
              x2={(100 + Math.cos(a) * r2).toFixed(1)}
              y2={(100 + Math.sin(a) * r2).toFixed(1)}
              className={major ? "stroke-ink" : "stroke-scope"}
              strokeWidth={major ? 1.25 : 0.75}
            />
          )
        })}
        {[80, 60, 40, 20].map((r) => (
          <circle key={r} cx="100" cy="100" r={r} className={r === 80 ? "stroke-scope" : "stroke-line"} strokeWidth="0.75" />
        ))}
      </svg>
      {sweeping ? (
        <div
          className="absolute inset-[10%] animate-sweep rounded-full"
          style={{ background: "conic-gradient(from 0deg, transparent 0deg, transparent 300deg, var(--brand-dim) 360deg)" }}
        >
          <span className="absolute left-1/2 top-0 h-1/2 w-px -translate-x-1/2 bg-brand" />
        </div>
      ) : null}
      {children}
    </div>
  )
}
