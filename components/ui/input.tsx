import * as React from "react"

import { cn } from "@/lib/utils"

export const fieldClasses =
  "w-full rounded-lg border border-line bg-ground text-ink placeholder:text-muted transition-colors focus-visible:border-signal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-soft disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-danger"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(fieldClasses, "h-11 px-3 text-[15px]", className)}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
