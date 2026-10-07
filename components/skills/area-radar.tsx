import { RadarChart } from "@/components/radar-chart"
import type { AreaSkill } from "@/lib/skills/types"

// The six skill areas as a radar. `targets` (0–100 per area) draws a dashed
// comparison shape, e.g. what a job post asks for.
export function AreaRadar({
  areas,
  targets,
  className,
}: {
  areas: AreaSkill[]
  targets?: Partial<Record<AreaSkill["id"], number>>
  className?: string
}) {
  const axes = areas.map((a) => ({
    label: a.label,
    value: a.score / 100,
    detail: String(a.score),
    ...(targets ? { target: (targets[a.id] ?? 0) / 100 } : {}),
  }))
  return (
    <RadarChart
      axes={axes}
      className={className}
      label={`Skill areas, scored 0 to 100: ${areas.map((a) => `${a.label} ${a.score}`).join(", ")}.`}
    />
  )
}
