import { RadarChart } from "@/components/radar-chart"
import type { AreaSkill } from "@/lib/skills/types"

// The six skill areas as a radar. `targets` (0–100 per area) draws a dashed
// comparison shape, e.g. what a job post asks for.
export function AreaRadar({
  areas,
  targets,
  className,
  gap,
  compact,
}: {
  areas: AreaSkill[]
  targets?: Partial<Record<AreaSkill["id"], number>>
  className?: string
  // Marks the area where the biggest missing requirement sits
  gap?: { area: AreaSkill["id"]; label: string }
  compact?: boolean
}) {
  const axes = areas.map((a) => ({
    label: a.label,
    value: a.score / 100,
    detail: String(a.score),
    // A small floor keeps the dashed shape a shape: an area the role doesn't
    // mention sits near the centre instead of collapsing onto it
    ...(targets ? { target: Math.max(0.08, (targets[a.id] ?? 0) / 100) } : {}),
  }))
  return (
    <RadarChart
      axes={axes}
      className={className}
      compact={compact}
      gap={gap && areas.some((a) => a.id === gap.area) ? { axis: areas.findIndex((a) => a.id === gap.area), label: gap.label } : undefined}
      label={`Skill areas, scored 0 to 100: ${areas.map((a) => `${a.label} ${a.score}`).join(", ")}.`}
    />
  )
}
