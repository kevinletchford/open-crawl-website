/**
 * Circular ("theta") maze generator, in the style of the OpenCrawl mark:
 * thick concentric walls around a closed centre "eye", optionally split into
 * four quadrants by an open cross-shaped channel on the cardinal axes.
 *
 * Units: one ring (corridor + wall) is 1 unit wide. Radius R_i is the centre
 * line of the wall between ring i-1 and ring i; ring i is the corridor between
 * R_i and R_(i+1). Angles are radians, measured clockwise from 12 o'clock so
 * that SVG (y down) and the maths agree.
 *
 * Pure TypeScript with no DOM: it runs at build time for SVG and in the
 * browser for WebGL.
 */
import { mulberry32, shuffle } from './rng'

export interface MazeOptions {
  seed: number
  /** Number of corridor rings around the eye. */
  rings?: number
  /** Radius of the eye wall's centre line. */
  eye?: number
  /** Wall thickness as a fraction of the ring width. */
  wall?: number
  /** Split into quadrants by an open cross channel on the cardinal axes. */
  cross?: boolean
  /** Target corridor length per cell, in ring widths. Larger = longer runs. */
  cellLength?: number
  /**
   * 0–1: how strongly the carve prefers running around a ring over turning
   * in or out. High values give the long sweeping arcs of the reference.
   */
  bias?: number
  /**
   * Cells to carve as their own walled sub-maze, joined to the rest by a
   * single doorway: a test on points as fractions of the maze's radius
   * (y down), and a cell is in the region when at least half of it passes.
   * `glyphRegion` turns a letter into one.
   */
  region?: (x: number, y: number) => boolean
  /**
   * Clear every wall outside the region, so only the region's maze stands
   * inside the rim: the letter on an open floor. The rim's doorway leads
   * straight into it, down a corridor of cells if the region stops short.
   */
  regionOnly?: boolean
}

export interface Cell {
  id: number
  ring: number
  /** Index within the ring (clockwise from 12 o'clock). */
  index: number
  a0: number
  a1: number
  /** Ids of the cells this one is open to. */
  links: number[]
  /** Whether the cell lies in the maze's `region`. */
  inRegion: boolean
}

/** A wall along a circle of radius `r`, from angle `a0` to `a1`. */
export interface ArcWall {
  kind: 'arc'
  r: number
  a0: number
  a1: number
}

/** A wall along the ray at angle `a`, from radius `r0` to `r1`. */
export interface RadialWall {
  kind: 'radial'
  a: number
  r0: number
  r1: number
}

export type Wall = ArcWall | RadialWall

export interface PolarMaze {
  seed: number
  rings: number
  eye: number
  wall: number
  cross: boolean
  /** Half-width of the cross channel's open corridor. */
  channel: number
  /** Wall centre-line radius for boundary i (0 = eye, rings = outer edge). */
  radius: (i: number) => number
  /** Outer edge of the outermost wall, i.e. the maze's visual radius. */
  outerRadius: number
  cells: Cell[]
  /** cellsByRing[ring][index] → cell id. */
  cellsByRing: number[][]
  walls: Wall[]
}

const TAU = Math.PI * 2
const QUARTER = Math.PI / 2

export function generateMaze(options: MazeOptions): PolarMaze {
  const {
    seed,
    rings = 5,
    eye = 1,
    wall = 0.55,
    cross = false,
    cellLength = 1.6,
    bias = 0.7,
    region,
    regionOnly = false,
  } = options
  const rng = mulberry32(seed)
  const radius = (i: number) => eye + i
  const channel = (1 - wall) / 2

  // Cells per quadrant, doubling outward whenever the cells get too long.
  const perQuadrant: number[] = []
  for (let ring = 0; ring < rings; ring++) {
    const mid = radius(ring) + 0.5
    const arc = mid * QUARTER
    let q =
      ring === 0
        ? Math.max(1, Math.round(arc / cellLength))
        : perQuadrant[ring - 1]
    while (arc / (q * 2) >= cellLength) q *= 2
    perQuadrant.push(q)
  }

  const cells: Cell[] = []
  const cellsByRing: number[][] = []
  for (let ring = 0; ring < rings; ring++) {
    const count = perQuadrant[ring] * 4
    const row: number[] = []
    for (let index = 0; index < count; index++) {
      const id = cells.length
      cells.push({
        id,
        ring,
        index,
        a0: (index / count) * TAU,
        a1: ((index + 1) / count) * TAU,
        links: [],
        inRegion: false,
      })
      row.push(id)
    }
    cellsByRing.push(row)
  }

  if (region) {
    const outer = radius(rings) + wall / 2
    // Sample each cell on a grid, so long outer cells are judged by their
    // whole length rather than their middle.
    const steps = 5
    for (const cell of cells) {
      let hits = 0
      for (let i = 0; i < steps; i++) {
        for (let j = 0; j < steps; j++) {
          const r = radius(cell.ring) + (i + 0.5) / steps
          const a = cell.a0 + ((j + 0.5) / steps) * (cell.a1 - cell.a0)
          if (region((r * Math.sin(a)) / outer, (-r * Math.cos(a)) / outer)) {
            hits++
          }
        }
      }
      // On an open floor, the outermost ring stays clear so the region
      // never runs into the rim.
      cell.inRegion =
        hits * 2 >= steps * steps && !(regionOnly && cell.ring === rings - 1)
    }
  }

  const quadrantOf = (cell: Cell) =>
    Math.floor(cell.index / perQuadrant[cell.ring])

  /** The cell inward of `cell`, or undefined in the innermost ring. */
  const inward = (cell: Cell) => {
    if (cell.ring === 0) return undefined
    const ratio = perQuadrant[cell.ring] / perQuadrant[cell.ring - 1]
    return cells[cellsByRing[cell.ring - 1][Math.floor(cell.index / ratio)]]
  }

  // Walk in from the rim's doorway until the region is reached, so the way
  // into the maze is the way into the region.
  if (region && regionOnly && !cross) {
    let cell: Cell | undefined = cells[cellsByRing[rings - 1][0]]
    while (cell && !cell.inRegion) {
      cell.inRegion = true
      cell = inward(cell)
    }
  }

  /** Every cell `cell` could open onto, ignoring the region. */
  const neighbours = (cell: Cell): Cell[] => {
    const row = cellsByRing[cell.ring]
    const result: Cell[] = []
    const cw = cells[row[(cell.index + 1) % row.length]]
    const ccw = cells[row[(cell.index - 1 + row.length) % row.length]]
    // With the cross, each quadrant is its own maze; the channel joins them.
    for (const side of [cw, ccw]) {
      if (side !== cell && (!cross || quadrantOf(side) === quadrantOf(cell))) {
        result.push(side)
      }
    }
    const inner = inward(cell)
    if (inner) result.push(inner)
    if (cell.ring < rings - 1) {
      const ratio = perQuadrant[cell.ring + 1] / perQuadrant[cell.ring]
      for (let k = 0; k < ratio; k++) {
        result.push(cells[cellsByRing[cell.ring + 1][cell.index * ratio + k]])
      }
    }
    return result
  }

  const link = (a: Cell, b: Cell) => {
    a.links.push(b.id)
    b.links.push(a.id)
  }

  // Recursive backtracker, run once per quadrant (or once overall), and then
  // from any cell left over: with a region, each run stays on its own side.
  const visited = new Uint8Array(cells.length)
  const starts = cross
    ? [0, 1, 2, 3].map((quadrant) => {
        const ring = Math.floor(rng() * rings)
        const q = perQuadrant[ring]
        return cellsByRing[ring][quadrant * q + Math.floor(rng() * q)]
      })
    : [Math.floor(rng() * cells.length)]
  const carve = (start: number) => {
    if (visited[start]) return
    const stack = [cells[start]]
    visited[start] = 1
    while (stack.length) {
      const current = stack[stack.length - 1]
      const options = shuffle(
        neighbours(current).filter(
          (n) => !visited[n.id] && n.inRegion === current.inRegion,
        ),
        rng,
      )
      if (!options.length) {
        stack.pop()
        continue
      }
      const around = options.filter((n) => n.ring === current.ring)
      const next = around.length && rng() < bias ? around[0] : options[0]
      link(current, next)
      visited[next.id] = 1
      stack.push(next)
    }
  }
  for (const start of starts) carve(start)
  for (const cell of cells) carve(cell.id)

  // Join the separate runs with one doorway each, so the whole is still a
  // perfect maze: the letter is entered once, and a counter (the hole in an
  // R) once more from the letter.
  if (region) {
    const root = cells.map((cell) => cell.id)
    const find = (id: number): number =>
      root[id] === id ? id : (root[id] = find(root[id]))
    for (const cell of cells) {
      for (const other of cell.links) root[find(other)] = find(cell.id)
    }
    const doors = shuffle(
      cells.flatMap((cell) =>
        neighbours(cell)
          .filter((n) => n.id > cell.id && n.inRegion !== cell.inRegion)
          .map((n) => [cell, n] as const),
      ),
      rng,
    )
    for (const [a, b] of doors) {
      if (find(a.id) === find(b.id)) continue
      root[find(a.id)] = find(b.id)
      link(a, b)
    }
  }

  if (region && regionOnly) {
    for (const cell of cells) {
      if (cell.inRegion) continue
      for (const n of neighbours(cell)) {
        if (!n.inRegion && !cell.links.includes(n.id)) link(cell, n)
      }
    }
  }

  const walls = buildWalls({
    cells,
    cellsByRing,
    rings,
    wall,
    cross,
    channel,
    radius,
    inward,
  })

  return {
    seed,
    rings,
    eye,
    wall,
    cross,
    channel,
    radius,
    outerRadius: radius(rings) + wall / 2,
    cells,
    cellsByRing,
    walls,
  }
}

interface WallInput {
  cells: Cell[]
  cellsByRing: number[][]
  rings: number
  wall: number
  cross: boolean
  channel: number
  radius: (i: number) => number
  inward: (cell: Cell) => Cell | undefined
}

function buildWalls(input: WallInput): Wall[] {
  const { cells, cellsByRing, rings, wall, cross, channel, radius, inward } =
    input
  const half = wall / 2
  const walls: Wall[] = []
  const isOnCross = (a: number) =>
    cross && Math.abs(a / QUARTER - Math.round(a / QUARTER)) < 1e-9

  /**
   * Emit an arc wall on boundary `i` from `a0` to `a1`. Ends that meet the
   * cross are trimmed back to the channel edge; every other end is extended by
   * half a wall so corners and dead ends come out square.
   */
  const emitArc = (i: number, a0: number, a1: number) => {
    const r = radius(i)
    const trim = Math.asin(Math.min(1, channel / r))
    const pad = half / r
    const start = isOnCross(a0) ? a0 + trim : a0 - pad
    const end = isOnCross(a1) ? a1 - trim : a1 + pad
    if (end > start) walls.push({ kind: 'arc', r, a0: start, a1: end })
  }

  // Eye: a closed circle with no cross cut, like the reference.
  walls.push({ kind: 'arc', r: radius(0), a0: 0, a1: TAU })

  // Boundaries 1..rings-1: a wall wherever an outer-ring cell is not linked
  // to its inward neighbour. The outer boundary is closed except for the
  // cross, or — without the cross — a doorway at 12 o'clock so the crawl has
  // somewhere to start.
  for (let i = 1; i <= rings; i++) {
    const row = i < rings ? cellsByRing[i] : cellsByRing[rings - 1]
    let spanStart: number | undefined
    let spanEnd = 0
    const flush = () => {
      if (spanStart !== undefined) emitArc(i, spanStart, spanEnd)
      spanStart = undefined
    }
    for (const id of row) {
      const cell = cells[id]
      const open =
        i < rings
          ? cell.links.includes(inward(cell)?.id ?? Number.NaN)
          : !cross && cell.index === 0
      if (isOnCross(cell.a0)) flush()
      if (open) {
        flush()
        continue
      }
      spanStart ??= cell.a0
      spanEnd = cell.a1
    }
    flush()
  }

  // Radial walls between neighbouring cells that are not linked.
  for (let ring = 0; ring < rings; ring++) {
    const row = cellsByRing[ring]
    for (let index = 0; index < row.length; index++) {
      const cell = cells[row[index]]
      const next = cells[row[(index + 1) % row.length]]
      if (isOnCross(cell.a1)) continue
      if (cell.links.includes(next.id)) continue
      walls.push({
        kind: 'radial',
        a: cell.a1,
        r0: radius(ring) - half,
        r1: radius(ring + 1) + half,
      })
    }
  }

  return walls
}
