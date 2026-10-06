import { cn } from "@/lib/utils"

export function Kbd({ className, ...props }: React.ComponentProps<"kbd">) {
  return (
    <kbd
      className={cn("rounded-md border border-line px-1.5 py-0.5 font-mono text-xs text-muted", className)}
      {...props}
    />
  )
}
