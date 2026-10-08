import { cn } from "@/lib/utils"

// Strength as ten dots: filled dots are evidence. The same dots fill the dial,
// so a number and its meter read as one instrument.
export function DotMeter({ value, gap, className }: { value: number; gap?: boolean; className?: string }) {
  const on = Math.round(Math.max(0, Math.min(100, value)) / 10)
  return (
    <span className={cn("inline-flex gap-[3px]", className)} aria-hidden="true">
      {Array.from({ length: 10 }, (_, i) => (
        <span
          key={i}
          className={cn("size-[5px] rounded-full", gap && i === 0 ? "bg-warn" : i < on ? "bg-brand" : "bg-raised")}
        />
      ))}
    </span>
  )
}
