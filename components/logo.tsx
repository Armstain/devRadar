import { cn } from "@/lib/utils"

// The radar mark: two rings, a sweep line and a single blip.
export function LogoMark({ className, sweeping }: { className?: string; sweeping?: boolean }) {
  return (
    <svg viewBox="0 0 28 28" fill="none" aria-hidden="true" className={cn("size-7", className)}>
      <circle cx="14" cy="14" r="12.5" className="stroke-muted" strokeWidth="1.25" />
      <circle cx="14" cy="14" r="7.5" className="stroke-muted" strokeWidth="1.25" opacity="0.6" />
      <g className={cn("origin-center", sweeping && "animate-sweep")} style={{ transformBox: "view-box" }}>
        <path d="M14 14 L23.5 6.5" className="stroke-signal" strokeWidth="1.75" strokeLinecap="round" />
      </g>
      <circle cx="19" cy="17.5" r="2" className="fill-signal" />
    </svg>
  )
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="text-lg font-bold tracking-tight">DevRadar</span>
    </span>
  )
}
