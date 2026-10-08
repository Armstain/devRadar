"use client"

import { useId, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { parseGithubLogin } from "@/lib/github-login"
import { cn } from "@/lib/utils"

// "github.com/ [username] [Scan]". Accepts a username, @username or a
// profile URL, and opens the public scan for it.
export function ScanForm({
  defaultValue = "",
  size = "lg",
  label,
  className,
}: {
  defaultValue?: string
  size?: "md" | "lg"
  // A visible label; without one the label is for screen readers only
  label?: string
  className?: string
}) {
  const router = useRouter()
  const [value, setValue] = useState(defaultValue)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const id = useId()

  return (
    <form
      className={cn("flex flex-col gap-2", className)}
      onSubmit={(event) => {
        event.preventDefault()
        const login = parseGithubLogin(value)
        if (!login) {
          setError("Enter a GitHub username, like octocat.")
          return
        }
        setError(null)
        setPending(true)
        router.push(`/scan/${login}`)
      }}
    >
      <label htmlFor={id} className={label ? "text-[13.5px] font-semibold" : "sr-only"}>
        {label ?? "GitHub username"}
      </label>
      <div
        className={cn(
          "flex items-center gap-2 rounded-[10px] border-[1.5px] bg-panel p-1.5 pl-4 transition-colors focus-within:border-brand focus-within:ring-4 focus-within:ring-brand-soft",
          error ? "border-danger" : "border-scope"
        )}
      >
        <span className="hidden font-mono text-muted sm:inline" aria-hidden="true">
          github.com/
        </span>
        <input
          id={id}
          value={value}
          onChange={(event) => {
            setValue(event.target.value)
            setError(null)
          }}
          placeholder="username"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn("min-w-0 flex-1 bg-transparent font-mono text-ink placeholder:text-muted focus:outline-none", size === "lg" ? "h-11 text-base" : "h-9 text-sm")}
        />
        <Button type="submit" size={size === "lg" ? "md" : "sm"} disabled={pending}>
          {pending ? "Scanning…" : "Scan"}
          <ArrowRight aria-hidden="true" />
        </Button>
      </div>
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
    </form>
  )
}
