import { cn } from "@/lib/utils"

// An empty radar scope with a slow sweep: the "nothing detected yet" state.
// The sweep stops for people who prefer reduced motion (see globals.css).
export function Scope({ className, children }: { className?: string; children?: React.ReactNode }) {
  return (
    <div className={cn("relative aspect-square w-full", className)} aria-hidden="true">
      <svg viewBox="0 0 200 200" fill="none" className="absolute inset-0 size-full">
        <circle cx="100" cy="100" r="96" className="stroke-scope" strokeWidth="0.75" />
        <circle cx="100" cy="100" r="72" className="stroke-line" strokeWidth="0.75" />
        <circle cx="100" cy="100" r="48" className="stroke-line" strokeWidth="0.75" />
        <circle cx="100" cy="100" r="24" className="stroke-line" strokeWidth="0.75" />
        <path d="M100 4 V196 M4 100 H196" className="stroke-line" strokeWidth="0.5" />
      </svg>
      <div
        className="absolute inset-[2%] animate-sweep rounded-full"
        style={{
          background:
            "conic-gradient(from 0deg, transparent 0deg, transparent 290deg, var(--signal-dim) 360deg)",
        }}
      >
        <span className="absolute left-1/2 top-0 h-1/2 w-px -translate-x-1/2 bg-gradient-to-t from-transparent to-signal" />
      </div>
      {children}
    </div>
  )
}
