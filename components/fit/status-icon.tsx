import { AlertTriangle, Check } from "lucide-react"
import type { RequirementStatus } from "@/lib/fit/score"
import { cn } from "@/lib/utils"

export const STATUS_LABELS: Record<RequirementStatus, string> = {
  strong: "In your code",
  some: "Some evidence",
  related: "Related skill",
  gap: "Gap",
  unverifiable: "Not in code",
}

// Each status has its own shape, so the list reads without colour:
// filled check, half-filled, dashed ring, warning triangle, empty dashed.
export function StatusIcon({ status, className }: { status: RequirementStatus; className?: string }) {
  const base = cn("inline-flex size-[18px] shrink-0 items-center justify-center rounded-full", className)
  switch (status) {
    case "strong":
      return (
        <span aria-hidden="true" className={cn(base, "bg-signal text-signal-ink")}>
          <Check className="size-3" strokeWidth={3} />
        </span>
      )
    case "some":
      return (
        <span
          aria-hidden="true"
          className={cn(base, "border-[1.5px] border-signal")}
          style={{ background: "linear-gradient(90deg, var(--signal) 50%, transparent 50%)" }}
        />
      )
    case "related":
      return <span aria-hidden="true" className={cn(base, "border-[1.5px] border-dashed border-signal")} />
    case "gap":
      return (
        <span aria-hidden="true" className={cn(base, "rounded-none text-caution")}>
          <AlertTriangle className="size-[17px]" strokeWidth={2.25} />
        </span>
      )
    default:
      return <span aria-hidden="true" className={cn(base, "border-[1.5px] border-dashed border-muted/60")} />
  }
}
