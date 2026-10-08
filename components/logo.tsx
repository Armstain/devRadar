import { cn } from "@/lib/utils"

// The mark: a dial with its inner ring, the sweep line and one petrol reading.
export function LogoMark({ className, sweeping }: { className?: string; sweeping?: boolean }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className={cn("size-5", className)}>
      <circle cx="10" cy="10" r="8.5" className="stroke-ink" strokeWidth="1.5" />
      <circle cx="10" cy="10" r="4" className="stroke-ink" strokeWidth="1.2" opacity="0.45" />
      <g className={cn(sweeping && "animate-sweep")} style={{ transformOrigin: "10px 10px" }}>
        <path d="M10 10 16 4.5" className="stroke-ink" strokeWidth="1.5" strokeLinecap="round" />
      </g>
      <circle cx="13.6" cy="12.4" r="1.8" className="fill-brand" />
    </svg>
  )
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <LogoMark />
      <span className="text-[17px] font-bold tracking-[-0.02em]">devradar</span>
    </span>
  )
}
