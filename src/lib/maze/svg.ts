/**
 * SVG path builders for polar mazes. Plain strings, so they work in Astro
 * frontmatter at build time and in client scripts alike.
 *
 * Coordinates are centred on the origin in maze units; angle 0 is 12 o'clock
 * and angles increase clockwise (SVG's y axis points down).
 */
import type { InfiniteMaze, InfiniteRing } from './infinite'
import type { Cell, PolarMaze, Wall } from './polar'
import { mulberry32 } from './rng'

const TAU = Math.PI * 2

const n = (value: number) => Number(value.toFixed(3))

/** Point at radius `r`, angle `a`. */
export function polar(r: number, a: number): [number, number] {
  return [n(r * Math.sin(a)), n(-r * Math.cos(a))]
}

/** A filled annular sector between radii r0 < r1 and angles a0 < a1. */
export function sectorPath(r0: number, r1: number, a0: number, a1: number) {
  if (a1 - a0 >= TAU - 1e-9) {
    // A full ring: the outer circle clockwise and the inner one anticlockwise,
    // so the hole survives the nonzero fill rule.
    const circle = (r: number, sweep: 0 | 1) =>
      `M${n(-r)} 0A${n(r)} ${n(r)} 0 1 ${sweep} ${n(r)} 0A${n(r)} ${n(r)} 0 1 ${sweep} ${n(-r)} 0Z`
    return circle(r1, 1) + (r0 > 0 ? circle(r0, 0) : '')
  }
  const large = a1 - a0 > Math.PI ? 1 : 0
  const [ox0, oy0] = polar(r1, a0)
  const [ox1, oy1] = polar(r1, a1)
  const [ix1, iy1] = polar(r0, a1)
  const [ix0, iy0] = polar(r0, a0)
  return (
    `M${ox0} ${oy0}A${n(r1)} ${n(r1)} 0 ${large} 1 ${ox1} ${oy1}` +
    `L${ix1} ${iy1}A${n(r0)} ${n(r0)} 0 ${large} 0 ${ix0} ${iy0}Z`
  )
}

/** A filled rectangle `width` wide along the ray at angle `a`. */
export function rayPath(a: number, r0: number, r1: number, width: number) {
  const ux = Math.sin(a)
  const uy = -Math.cos(a)
  const nx = -uy * (width / 2)
  const ny = ux * (width / 2)
  const p = (r: number, s: number) =>
    `${n(r * ux + s * nx)} ${n(r * uy + s * ny)}`
  // Wound clockwise on screen, like the sectors, so overlapping walls in one
  // path add up under the nonzero fill rule instead of cancelling out.
  return `M${p(r0, -1)}L${p(r1, -1)}L${p(r1, 1)}L${p(r0, 1)}Z`
}

export function wallPath(wall: Wall, thickness: number) {
  const half = thickness / 2
  return wall.kind === 'arc'
    ? sectorPath(wall.r - half, wall.r + half, wall.a0, wall.a1)
    : rayPath(wall.a, wall.r0, wall.r1, thickness)
}

/**
 * Every wall of a maze as a single path, for one fill. All shapes share one
 * winding direction, so the default nonzero fill rule unions them.
 */
export function mazeWallsPath(maze: PolarMaze) {
  return maze.walls.map((wall) => wallPath(wall, maze.wall)).join('')
}

/** The corridor floor of a cell (walls are drawn over its edges). */
export function cellFloorPath(maze: PolarMaze, cell: Cell) {
  return sectorPath(
    maze.radius(cell.ring),
    maze.radius(cell.ring + 1),
    cell.a0,
    cell.a1,
  )
}

/** The floor of one cross-channel segment. */
export function channelFloorPath(maze: PolarMaze, arm: number, ring: number) {
  return rayPath(
    (arm * TAU) / 4,
    maze.radius(ring),
    maze.radius(ring + 1),
    maze.channel * 2 + maze.wall,
  )
}

/**
 * The first `rings` rings of an infinite maze, as one walls path and the
 * corridor floors, in units where the outermost ring's outer edge is 1.
 *
 * `zoom` zooms in by that many rings, so ring `zoom` has its outer edge at 1
 * and the rings outside it are larger; rings lying wholly outside `view`
 * (a radius) are left out.
 */
export function infiniteMazePaths(
  maze: InfiniteMaze,
  rings: number,
  { zoom = 0, view = Infinity }: { zoom?: number; view?: number } = {},
): {
  walls: string
  floors: { d: string; distance: number }[]
  rings: InfiniteRing[]
} {
  let walls = ''
  const floors: { d: string; distance: number }[] = []
  const generated: InfiniteRing[] = []
  for (let k = 0; k < rings; k++) {
    const ring = maze.next()
    generated.push(ring)
    const scale = maze.ratio ** (k - zoom)
    if (scale * maze.ratio > view) continue
    for (const w of ring.walls) {
      walls += sectorPath(w.r0 * scale, w.r1 * scale, w.a0, w.a1)
    }
    for (const cell of ring.cells) {
      floors.push({
        d: sectorPath(maze.ratio * scale, scale, cell.a0, cell.a1),
        distance: cell.distance,
      })
    }
  }
  return { walls, floors, rings: generated }
}

/** One corridor step of a search, drawn from the cell it leaves. */
export interface WalkEdge {
  d: string
  /** Distance along the walk at which the line starts down this edge. */
  forward: number
  /** Distance at which it starts back out, or -1 if it never does. */
  back: number
  /**
   * Distance from the entrance to this edge through the corridors, for
   * flooding every tried corridor at once instead of one after another.
   */
  flow: number
  length: number
  /** The corridor's width here, for drawing the edge as a fill. */
  width: number
  /** Keep the edge inside a circle of this radius at the centre. */
  clip?: number
  /** True for a wrong turn: an edge off the route to the centre. */
  detour?: boolean
}

/**
 * A search for the centre of the drawn rings, as the line a crawler would
 * leave: down the corridors from the entrance, into some wrong turns and
 * back out of them, until it finds the way in. Distances are along the
 * line, so it can be played back at a constant speed.
 *
 * Wrong turns are taken with chance `detours` at each junction on the way,
 * and followed at most `depth` cells before turning back. With `fill`, the
 * walk ends by filling the open middle from the bottom up, rather than a
 * line into it.
 */
export function mazeWalk(
  maze: InfiniteMaze,
  rings: InfiniteRing[],
  {
    zoom = 0,
    seed = 1,
    detours = 0.6,
    depth = 5,
    fill = false,
  }: {
    zoom?: number
    seed?: number
    detours?: number
    depth?: number
    fill?: boolean
  } = {},
): { edges: WalkEdge[]; length: number; flowLength: number } {
  const count = maze.cells
  const step = TAU / count
  const radius = (k: number) =>
    (maze.ratio ** (k - zoom) * (1 + maze.ratio)) / 2
  const angle = (i: number) => (i + 0.5) * step
  const rng = mulberry32(seed)
  const key = (k: number, i: number) => k * count + i

  const last = rings.length - 1
  let goal = -1
  for (const [j, cell] of rings[last].cells.entries()) {
    if (
      cell.down &&
      (goal < 0 || cell.distance < rings[last].cells[goal].distance)
    )
      goal = j
  }
  if (goal < 0) return { edges: [], length: 0, flowLength: 0 }

  // The true route, walked back from the goal one crawl step at a time.
  const route = new Set<number>()
  for (let k = last, i = goal; ;) {
    route.add(key(k, i))
    const d = rings[k].cells[i].distance
    if (d === 0) break
    const above = rings[k - 1]?.cells[i]
    const prev = (i - 1 + count) % count
    if (above?.down && above.distance === d - 1) k--
    else if (
      rings[k].cells[prev].open &&
      rings[k].cells[prev].distance === d - 1
    )
      i = prev
    else i = (i + 1) % count
  }

  const neighbours = (k: number, i: number) => {
    const cells = rings[k].cells
    const prev = (i - 1 + count) % count
    const out: [number, number][] = []
    if (cells[i].open) out.push([k, (i + 1) % count])
    if (cells[prev].open) out.push([k, prev])
    if (k > 0 && rings[k - 1].cells[i].down) out.push([k - 1, i])
    if (k < last && cells[i].down) out.push([k + 1, i])
    return out
  }

  const edges: WalkEdge[] = []
  let at = 0
  let flow = 0
  const add = (d: string, length: number, width: number) => {
    const edge: WalkEdge = {
      d,
      forward: at,
      back: -1,
      flow,
      length,
      width: n(width),
    }
    edges.push(edge)
    at += length
    return edge
  }
  const move = (
    k: number,
    i: number,
    nk: number,
    ni: number,
    start: number,
  ) => {
    flow = start
    const from = polar(radius(k), angle(i)).join(' ')
    const r = radius(nk)
    const to = polar(r, angle(ni)).join(' ')
    if (k === nk) {
      const sweep = (ni - i + count) % count === 1 ? 1 : 0
      return add(
        `M${from}A${n(r)} ${n(r)} 0 0 ${sweep} ${to}`,
        r * step,
        maze.ratio ** (k - zoom) * (1 - maze.ratio),
      )
    }
    return add(
      `M${from}L${to}`,
      Math.abs(radius(k) - r),
      Math.min(radius(k), r) * step,
    )
  }

  // In through the doorway.
  const outer = maze.ratio ** -zoom * (1 + (maze.wall * (1 - maze.ratio)) / 2)
  add(
    `M${polar(outer, angle(0)).join(' ')}L${polar(radius(0), angle(0)).join(' ')}`,
    outer - radius(0),
    radius(0) * step,
  )
  const door = flow + edges[0].length

  const seen = new Set([key(0, 0)])
  let arrived = 0
  const explore = (k: number, i: number, off: number, t: number): boolean => {
    if (k === last && i === goal) {
      arrived = t
      return true
    }
    const next = neighbours(k, i)
      .filter(([nk, ni]) => !seen.has(key(nk, ni)))
      .map((cell) => ({ cell, order: rng() }))
      .sort((x, y) => x.order - y.order)
    for (const {
      cell: [nk, ni],
    } of next) {
      const onRoute = route.has(key(nk, ni))
      if (!onRoute && (off >= depth || (off === 0 && rng() > detours))) continue
      seen.add(key(nk, ni))
      const edge = move(k, i, nk, ni, t)
      if (!onRoute) edge.detour = true
      if (explore(nk, ni, onRoute ? 0 : off + 1, t + edge.length)) return true
      edge.back = at
      at += edge.length
    }
    return false
  }
  explore(0, 0, 0, door)
  flow = arrived

  // On into the middle: a line to the centre, or as a fill, the open middle
  // filling up from the bottom.
  const end = maze.ratio ** (last + 1 - zoom)
  const inner = polar(end, angle(goal)).join(' ')
  add(
    `M${polar(radius(last), angle(goal)).join(' ')}L${inner}` +
      (fill ? '' : 'L0 0'),
    radius(last) - (fill ? end : 0),
    radius(last) * step,
  )
  if (fill) {
    // A level rising from the bottom, as wide as the middle: the edge's
    // `clip` keeps it to the circle.
    add(`M0 ${n(end)}V${n(-end)}`, end * 2, end * 2)
    const centre = edges[edges.length - 1]
    centre.flow = arrived + edges[edges.length - 2].length
    centre.clip = n(end)
  }
  return {
    edges,
    length: at,
    flowLength: Math.max(...edges.map((e) => e.flow + e.length)),
  }
}

/**
 * A standalone SVG, as a data URI, that is opaque in the maze's corridors and
 * transparent on its walls and outside it — for CSS `mask-image`, so whatever
 * is masked shows through the corridors only.
 */
export function corridorMaskUri(walls: string, radius: number) {
  const r = n(radius)
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-r} ${-r} ${r * 2} ${r * 2}">` +
    `<mask id="m"><circle r="${r}" fill="#fff"/><path d="${walls}" fill="#000"/></mask>` +
    `<circle r="${r}" fill="#000" mask="url(#m)"/></svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}
