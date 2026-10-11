/**
 * Layout for a one-way funnel drawn as a Sankey: a main stream through
 * successive stages, top-aligned, with each stage's losses peeling off
 * downward to a node of their own between the columns.
 *
 * Pure geometry, run at build time. Units are SVG user units in a
 * `width` × `height` box.
 */

export interface FunnelInput {
  stages: { id: string; value: number }[]
  losses: { id: string; from: string; value: number }[]
}

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

export interface FunnelBand {
  id: string
  /** 'main' joins two stages; 'loss' runs from a stage to a loss node. */
  kind: 'main' | 'loss'
  d: string
  value: number
  /** Column the band leaves from, for staggering the reveal. */
  column: number
}

export interface FunnelLayout {
  width: number
  height: number
  stages: (Rect & { id: string; value: number })[]
  losses: (Rect & { id: string; value: number })[]
  bands: FunnelBand[]
}

const n = (v: number) => Number(v.toFixed(2))

/** A band of thickness `h` from (x0, y0) to (x1, y1), as a smooth S. */
export function bandPath(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  h: number,
) {
  const cx = (x0 + x1) / 2
  return (
    `M${n(x0)} ${n(y0)}C${n(cx)} ${n(y0)} ${n(cx)} ${n(y1)} ${n(x1)} ${n(y1)}` +
    `L${n(x1)} ${n(y1 + h)}C${n(cx)} ${n(y1 + h)} ${n(cx)} ${n(y0 + h)} ${n(x0)} ${n(y0 + h)}Z`
  )
}

export function layoutFunnel(
  input: FunnelInput,
  {
    width = 960,
    height = 400,
    top = 72,
    stream = 180,
    lossTop = 296,
    node = 6,
  } = {},
): FunnelLayout {
  const { stages, losses } = input
  const k = stream / stages[0].value
  const columnX = (i: number) => (i / (stages.length - 1)) * (width - node)

  const stageRects = stages.map((stage, i) => ({
    id: stage.id,
    value: stage.value,
    x: columnX(i),
    y: top,
    w: node,
    h: stage.value * k,
  }))

  const bands: FunnelBand[] = []
  const lossRects: FunnelLayout['losses'] = []

  stages.forEach((stage, i) => {
    const next = stages[i + 1]
    if (!next) return
    const from = stageRects[i]
    const to = stageRects[i + 1]
    bands.push({
      id: `${stage.id}-${next.id}`,
      kind: 'main',
      d: bandPath(from.x + node, from.y, to.x, to.y, next.value * k),
      value: next.value,
      column: i,
    })

    // Losses leave from the bottom of the stage, below what flows on.
    let y = from.y + next.value * k
    for (const loss of losses.filter((l) => l.from === stage.id)) {
      const h = loss.value * k
      const x = (from.x + to.x) / 2
      lossRects.push({
        id: loss.id,
        value: loss.value,
        x,
        y: lossTop,
        w: node,
        h,
      })
      bands.push({
        id: loss.id,
        kind: 'loss',
        d: bandPath(from.x + node, y, x, lossTop, h),
        value: loss.value,
        column: i,
      })
      y += h
    }
  })

  return { width, height, stages: stageRects, losses: lossRects, bands }
}
