"use client"

import { AlarmClockOff, Check, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useFollowUp } from "@/hooks/use-applications"
import { SNOOZE_DAYS, type Application } from "@/lib/applications"

const SNOOZE_LABELS: Record<(typeof SNOOZE_DAYS)[number], string> = { 3: "3 days", 7: "1 week", 14: "2 weeks" }

// The two answers to "this has gone quiet": say you chased it, or put the
// reminder off for a while.
export function FollowUpActions({ application, size = "sm" }: { application: Application; size?: "sm" | "md" }) {
  const followUp = useFollowUp()
  const pending = followUp.isPending

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        size={size}
        onClick={() => followUp.mutate({ id: application.id, action: { action: "followed-up" } })}
        disabled={pending}
      >
        <Check aria-hidden="true" />
        I followed up
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size={size} variant="secondary" disabled={pending}>
            <AlarmClockOff aria-hidden="true" />
            Snooze
            <ChevronDown aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-44">
          <DropdownMenuLabel className="label-quiet px-3 py-2">Remind me in</DropdownMenuLabel>
          {SNOOZE_DAYS.map((days) => (
            <DropdownMenuItem key={days} onSelect={() => followUp.mutate({ id: application.id, action: { action: "snooze", days } })}>
              {SNOOZE_LABELS[days]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
