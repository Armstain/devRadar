import * as React from "react"

import { cn } from "@/lib/utils"

interface FieldProps {
  label: string
  htmlFor: string
  error?: string
  hint?: string
  className?: string
  children: React.ReactNode
}

// Label, control and an error or hint line, wired up for screen readers.
export function Field({ label, htmlFor, error, hint, className, children }: FieldProps) {
  const messageId = `${htmlFor}-message`
  const control = React.isValidElement<Record<string, unknown>>(children)
    ? React.cloneElement(children, {
        "aria-invalid": error ? true : undefined,
        "aria-describedby": error || hint ? messageId : undefined,
      })
    : children

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-[13px] font-medium">
        {label}
      </label>
      {control}
      {error ? (
        <p id={messageId} className="text-[13px] text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={messageId} className="text-[13px] text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
