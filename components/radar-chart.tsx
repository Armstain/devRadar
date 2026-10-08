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

export const RADAR_W = 400
const W = RADAR_W
export const RADAR_H = 380
const H = RADAR_H
const CX = W / 2
const CY = H / 2
const R = 118
const LABEL_R = R + 46

const fmt = (n: number) => n.toFixed(1)
const clamp = (n: number) => Math.min(1, Math.max(0, n))

function point(index: number, count: number, radius: number): [number, number] {
  const angle = -Math.PI / 2 + (index * 2 * Math.PI) / count
  return [CX + Math.cos(angle) * radius, CY + Math.sin(angle) * radius]
}

function insidePolygon(x: number, y: number, pts: [number, number][]): boolean {
  let inside = false
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i]
    const [xj, yj] = pts[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

// The evidence stipple: dots on a jittered grid, kept inside the shape. A
// seeded generator makes it identical on the server and in the browser.
export function stipplePoints(pts: [number, number][], step = 7.5, seed = 11): [number, number][] {
  let s = seed
  const rand = () => {
    s = (s * 16807) % 2147483647
    return s / 2147483647
  }
  const out: [number, number][] = []
  for (let y = CY - R; y <= CY + R; y += step) {
    for (let x = CX - R; x <= CX + R; x += step) {
      const jx = x + (rand() - 0.5) * step * 0.5
      const jy = y + (rand() - 0.5) * step * 0.5
      if (insidePolygon(jx, jy, pts)) out.push([jx, jy])
    }
  }
  return out
}

export function radarGeometry(axes: RadarAxis[]) {
  const n = axes.length
  const shapePts = axes.map((a, i) => point(i, n, R * clamp(a.value)))
  const ticks: { x1: number; y1: number; x2: number; y2: number; major: boolean }[] = []
  for (let d = 0; d < 360; d += 6) {
    const a = ((d - 90) * Math.PI) / 180
    const major = d % (360 / n) === 0
    const r1 = R + 12
    const r2 = R + (major ? 22 : 16)
    ticks.push({ x1: CX + Math.cos(a) * r1, y1: CY + Math.sin(a) * r1, x2: CX + Math.cos(a) * r2, y2: CY + Math.sin(a) * r2, major })
  }
  return {
    ticks,
    spokes: axes.map((_, i) => point(i, n, R)),
    shape: shapePts.map((p) => p.map(fmt).join(",")).join(" "),
    vertices: shapePts,
    stipple: stipplePoints(shapePts),
    target: axes.every((a) => a.target !== undefined)
      ? axes.map((a, i) => point(i, n, R * clamp(a.target ?? 0)).map(fmt).join(",")).join(" ")
      : null,
    labels: axes.map((_, i) => {
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
  // Mark one axis as the place a gap sits (e.g. a missing requirement)
  gap?: { axis: number; label: string }
  // Drop the bezel and stipple for small placements
  compact?: boolean
}

// The instrument dial: a bezel of ticks, the user's shape filled with an
// evidence stipple, and an optional dashed shape for what a role asks for.
// Shapes differ in fill and stroke, not only colour.
export function RadarChart({ axes, label, className, gap, compact }: RadarChartProps) {
  if (axes.length < 3) return null
  const g = radarGeometry(axes)
  const gapPoint = gap ? point(gap.axis, axes.length, R * 0.94) : null

  return (
    <figure className={cn("relative mx-auto aspect-[400/380] w-full max-w-[420px]", className)}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} className="absolute inset-0 size-full overflow-visible">
        {!compact
          ? g.ticks.map((t, i) => (
              <line key={i} x1={fmt(t.x1)} y1={fmt(t.y1)} x2={fmt(t.x2)} y2={fmt(t.y2)} className={t.major ? "stroke-ink" : "stroke-scope"} strokeWidth={t.major ? 1.5 : 1} />
            ))
          : null}
        {[0.25, 0.5, 0.75, 1].map((k) => (
          <circle key={k} cx={CX} cy={CY} r={R * k} fill="none" className={k === 1 ? "stroke-scope" : "stroke-line"} strokeWidth="1" />
        ))}
        {g.spokes.map(([x, y], i) => (
          <line key={i} x1={CX} y1={CY} x2={fmt(x)} y2={fmt(y)} className="stroke-line" strokeWidth="1" />
        ))}
        {!compact
          ? g.stipple.map(([x, y], i) => <circle key={i} cx={fmt(x)} cy={fmt(y)} r="1.3" className="fill-brand" opacity="0.55" />)
          : null}
        <polygon points={g.shape} className="fill-brand/[0.07] stroke-brand" strokeWidth="2" strokeLinejoin="round" />
        {g.target ? (
          <polygon points={g.target} className="stroke-ink-soft" fill="none" strokeWidth="1.25" strokeDasharray="5 4" strokeLinejoin="round" />
        ) : null}
        {g.vertices.map(([x, y], i) => (
          <circle key={i} cx={fmt(x)} cy={fmt(y)} r="4.5" className="fill-brand stroke-ground" strokeWidth="2" />
        ))}
        {gapPoint ? (
          <path
            d={`M${fmt(gapPoint[0])} ${fmt(gapPoint[1] - 7)} L${fmt(gapPoint[0] + 7)} ${fmt(gapPoint[1] + 5)} L${fmt(gapPoint[0] - 7)} ${fmt(gapPoint[1] + 5)} Z`}
            className="fill-warn stroke-ink"
            strokeWidth="1"
          />
        ) : null}
      </svg>
      {axes.map((axis, i) => (
        <div
          key={axis.label}
          aria-hidden="true"
          className="absolute flex w-24 -translate-x-1/2 -translate-y-1/2 flex-col items-center text-center leading-tight"
          style={g.labels[i]}
        >
          <span className="text-[13px] font-semibold">{axis.label}</span>
          <span className="text-[12px] text-muted tabular">{axis.detail ?? Math.round(clamp(axis.value) * 100)}</span>
        </div>
      ))}
      {gap && gapPoint ? (
        <span
          aria-hidden="true"
          className="absolute translate-x-3 -translate-y-1/2 whitespace-nowrap text-[12px] font-semibold"
          style={{ left: `${((gapPoint[0] / W) * 100).toFixed(2)}%`, top: `${((gapPoint[1] / H) * 100).toFixed(2)}%` }}
        >
          Gap: {gap.label}
        </span>
      ) : null}
    </figure>
  )
}
