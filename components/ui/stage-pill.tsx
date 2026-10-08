import { cn } from "@/lib/utils"
import { STATUS_LABELS, type ApplicationStatus } from "@/lib/applications"

// Each stage differs by shape as well as colour, so it reads without colour.
const dotClasses: Record<ApplicationStatus, string> = {
  applied: "border-[1.5px] border-muted",
  "in-progress": "bg-brand",
  offer: "bg-brand ring-2 ring-brand-soft",
  rejected: "bg-muted [clip-path:polygon(0_40%,100%_40%,100%_60%,0_60%)]",
}

export function StageDot({ status, className }: { status: ApplicationStatus; className?: string }) {
  return <span aria-hidden="true" className={cn("inline-block size-[7px] shrink-0 rounded-full", dotClasses[status], className)} />
}

export function StagePill({ status, className }: { status: ApplicationStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-line px-2.5 py-0.5 text-[13px]",
        status === "rejected" && "text-muted",
        className
      )}
    >
      <StageDot status={status} />
      {STATUS_LABELS[status]}
    </span>
  )
}
