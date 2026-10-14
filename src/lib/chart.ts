/**
 * Small helpers for the hand-built SVG charts in `src/components/data/`.
 * No DOM, so they run in frontmatter at build time and in client scripts.
 */

export type Scale = (value: number) => number

/** Maps [d0, d1] onto [r0, r1]. */
export function linearScale(
  [d0, d1]: [number, number],
  [r0, r1]: [number, number],
): Scale {
  const span = d1 - d0 || 1
  return (value) => r0 + ((value - d0) / span) * (r1 - r0)
}

/** Maps [d0, d1] onto [r0, r1] by order of magnitude. Domain must be > 0. */
export function logScale(
  [d0, d1]: [number, number],
  [r0, r1]: [number, number],
): Scale {
  const inner = linearScale([Math.log10(d0), Math.log10(d1)], [r0, r1])
  return (value) => inner(Math.log10(value))
}

/** About `count` round tick values covering [0, max]. */
export function niceTicks(max: number, count = 3): number[] {
  if (max <= 0) return [0]
  const raw = max / count
  const magnitude = 10 ** Math.floor(Math.log10(raw))
  const step =
    [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= raw) ?? raw
  const ticks: number[] = []
  for (let v = 0; v <= max + step * 1e-9; v += step) ticks.push(v)
  if (ticks[ticks.length - 1] < max) ticks.push(ticks[ticks.length - 1] + step)
  return ticks
}

const n = (value: number) => Number(value.toFixed(2))

/** A polyline through the points. */
export function linePath(points: [number, number][]) {
  return points
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${n(x)} ${n(y)}`)
    .join('')
}

/** The line closed down to the baseline at `y0`, for an area fill. */
export function areaPath(points: [number, number][], y0: number) {
  if (points.length === 0) return ''
  const first = points[0]
  const last = points[points.length - 1]
  return `${linePath(points)}L${n(last[0])} ${n(y0)}L${n(first[0])} ${n(y0)}Z`
}

const integer = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 })
const compact = new Intl.NumberFormat('en-GB', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

export const formatNumber = (value: number) => integer.format(value)
export const formatCompact = (value: number) => compact.format(value)
export const formatPct = (value: number, digits = 0) =>
  `${value.toFixed(digits)}%`
export const formatMs = (ms: number) =>
  ms >= 1000 ? `${Number((ms / 1000).toFixed(1))}s` : `${Math.round(ms)}ms`

export type MetricFormat = 'number' | 'pct' | 'ms' | 'score'

export function formatMetric(value: number, format: MetricFormat) {
  switch (format) {
    case 'pct':
      return formatPct(value, 1)
    case 'ms':
      return formatMs(value)
    default:
      return formatNumber(value)
  }
}

/** Relative change from `previous` to `current`, as a percentage. */
export function delta(current: number, previous: number) {
  if (previous === 0) return 0
  return ((current - previous) / previous) * 100
}

/** `+4.2%` / `−3.1%`, with a real minus sign. */
export function formatDelta(change: number, digits = 1) {
  const sign = change > 0 ? '+' : change < 0 ? '−' : '±'
  return `${sign}${Math.abs(change).toFixed(digits)}%`
}
