import { cn } from "@/lib/utils"

export interface RadarAxis {
  label: string
  // 0–1
  value: number
  // Optional comparison value (e.g. what a role asks for), 0–1
  target?: number
  // Small text under the label; defaults to the value as a score out of 100
  detail?: string
}

const W = 360
const H = 320
const CX = W / 2
const CY = H / 2
const R = 100
const LABEL_R = R + 30

function point(index: number, count: number, radius: number): [number, number] {
  const angle = -Math.PI / 2 + (index * 2 * Math.PI) / count
  return [CX + Math.cos(angle) * radius, CY + Math.sin(angle) * radius]
}

const fmt = (n: number) => n.toFixed(1)
const clamp = (n: number) => Math.min(1, Math.max(0, n))

export function radarGeometry(axes: RadarAxis[]) {
  const n = axes.length
  const ring = (k: number) =>
    "M" + axes.map((_, i) => point(i, n, R * k).map(fmt).join(" ")).join(" L") + " Z"
  return {
    rings: [0.25, 0.5, 0.75, 1].map(ring).join(" "),
    spokes: axes
      .map((_, i) => {
        const [x, y] = point(i, n, R)
        return `M${CX} ${CY} L${fmt(x)} ${fmt(y)}`
      })
      .join(" "),
    shape: axes.map((a, i) => point(i, n, R * clamp(a.value)).map(fmt).join(",")).join(" "),
    target: axes.every((a) => a.target !== undefined)
      ? axes.map((a, i) => point(i, n, R * clamp(a.target ?? 0)).map(fmt).join(",")).join(" ")
      : null,
    labels: axes.map((a, i) => {
      const [x, y] = point(i, n, LABEL_R)
      return { left: `${((x / W) * 100).toFixed(2)}%`, top: `${((y / H) * 100).toFixed(2)}%` }
    }),
  }
}

interface RadarChartProps {
  axes: RadarAxis[]
  // Accessible summary of what the chart shows
  label: string
  className?: string
}

// A radar with your shape (filled, solid) and an optional target shape
// (outline, dashed) — the two differ in fill and stroke, not just colour.
export function RadarChart({ axes, label, className }: RadarChartProps) {
  if (axes.length < 3) return null
  const g = radarGeometry(axes)

  return (
    <figure className={cn("relative mx-auto aspect-[9/8] w-full max-w-[360px]", className)}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} className="absolute inset-0 size-full overflow-visible">
        <path d={g.rings} className="stroke-scope" fill="none" strokeWidth="1" />
        <path d={g.spokes} className="stroke-scope" fill="none" strokeWidth="1" />
        <polygon points={g.shape} className="fill-signal-soft stroke-signal" strokeWidth="2" strokeLinejoin="round" />
        {g.target ? (
          <polygon points={g.target} className="stroke-ink" fill="none" strokeWidth="1.5" strokeDasharray="5 4" strokeLinejoin="round" />
        ) : null}
      </svg>
      {axes.map((axis, i) => (
        <div
          key={axis.label}
          aria-hidden="true"
          className="absolute flex w-24 -translate-x-1/2 -translate-y-1/2 flex-col items-center text-center leading-tight"
          style={g.labels[i]}
        >
          <span className="text-[13px] font-medium">{axis.label}</span>
          <span className="font-mono text-[11px] text-muted">{axis.detail ?? Math.round(clamp(axis.value) * 100)}</span>
        </div>
      ))}
    </figure>
  )
}
