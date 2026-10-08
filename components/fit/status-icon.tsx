import { Check } from "lucide-react"
import type { RequirementStatus } from "@/lib/fit/score"
import { cn } from "@/lib/utils"

export const STATUS_LABELS: Record<RequirementStatus, string> = {
  strong: "In your code",
  some: "Partly shown",
  related: "Close",
  gap: "Gap",
  unverifiable: "Not in code",
}

// Each status has its own shape, so the list reads without colour: filled
// check, half-filled, dashed ring, outlined triangle, empty dashed.
export function StatusIcon({ status, className }: { status: RequirementStatus; className?: string }) {
  const base = cn("inline-flex size-[16px] shrink-0 items-center justify-center rounded-full", className)
  switch (status) {
    case "strong":
      return (
        <span aria-hidden="true" className={cn(base, "bg-brand text-brand-ink")}>
          <Check className="size-[11px]" strokeWidth={3} />
        </span>
      )
    case "some":
      return (
        <span
          aria-hidden="true"
          className={cn(base, "border-[1.5px] border-brand")}
          style={{ background: "linear-gradient(90deg, var(--brand) 50%, transparent 50%)" }}
        />
      )
    case "related":
      return <span aria-hidden="true" className={cn(base, "border-[1.5px] border-dashed border-brand")} />
    case "gap":
      return (
        <svg aria-hidden="true" viewBox="0 0 16 16" className={cn("size-[16px] shrink-0", className)}>
          <path d="M8 1.5 15 14H1z" className="fill-warn stroke-ink" strokeWidth="1" strokeLinejoin="round" />
        </svg>
      )
    default:
      return <span aria-hidden="true" className={cn(base, "border-[1.5px] border-dashed border-muted")} />
  }
}
