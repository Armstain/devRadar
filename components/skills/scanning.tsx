import { Scope } from "@/components/scope"
import { cn } from "@/lib/utils"

const STEPS = [
  "Reading repositories",
  "Parsing package.json, go.mod, pyproject.toml…",
  "Matching 100+ technologies",
  "Weighting recent work",
  "Scoring six skill areas",
]

// Shown while a scan or sync runs: the radar sweeps and the steps appear one
// by one. Pure CSS, so it works in a streamed server fallback too.
export function Scanning({ title, subtitle, className }: { title: string; subtitle?: string; className?: string }) {
  return (
    <div role="status" className={cn("flex flex-col items-center gap-8 py-10 text-center", className)}>
      <Scope className="max-w-[260px]" />
      <div className="flex flex-col gap-2">
        <p className="text-2xl font-semibold tracking-tight">{title}</p>
        {subtitle ? <p className="max-w-md text-muted">{subtitle}</p> : null}
      </div>
      <ol className="flex flex-col gap-1.5 text-left font-mono text-[13px] text-muted" aria-hidden="true">
        {STEPS.map((step, i) => (
          <li
            key={step}
            className="animate-in fade-in slide-in-from-bottom-1 fill-mode-both duration-500"
            style={{ animationDelay: `${300 + i * 900}ms` }}
          >
            <span className="text-signal">›</span> {step}
          </li>
        ))}
      </ol>
    </div>
  )
}
