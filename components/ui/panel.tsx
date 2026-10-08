import * as React from "react"

import { cn } from "@/lib/utils"

export function Panel({ className, ...props }: React.ComponentProps<"section">) {
  return (
    <section
      className={cn("rounded-xl border border-line bg-panel", className)}
      {...props}
    />
  )
}

interface PanelHeaderProps {
  title: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  className?: string
  as?: "h2" | "h3"
}

export function PanelHeader({ title, description, action, className, as: Heading = "h2" }: PanelHeaderProps) {
  return (
    <div className={cn("flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1", className)}>
      <div className="flex min-w-0 flex-col gap-0.5">
        <Heading className="text-lg font-semibold tracking-tight">{title}</Heading>
        {description ? <p className="text-[13px] text-muted">{description}</p> : null}
      </div>
      {action}
    </div>
  )
}
