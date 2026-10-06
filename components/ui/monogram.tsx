import { cn } from "@/lib/utils"

const sizes = {
  sm: "size-[22px] rounded-md text-[11px]",
  md: "size-8 rounded-lg text-sm",
  lg: "size-14 rounded-2xl text-2xl",
}

// A company's initial on a neutral tile; decorative, so hidden from screen readers.
export function Monogram({ name, size = "md", inverted, className }: {
  name: string
  size?: keyof typeof sizes
  inverted?: boolean
  className?: string
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center font-bold",
        inverted ? "bg-ink text-ground" : "bg-raised",
        sizes[size],
        className
      )}
    >
      {name.trim().charAt(0).toUpperCase() || "?"}
    </span>
  )
}
