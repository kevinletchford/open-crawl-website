/**
 * SVG path builders for polar mazes. Plain strings, so they work in Astro
 * frontmatter at build time and in client scripts alike.
 *
 * Coordinates are centred on the origin in maze units; angle 0 is 12 o'clock
 * and angles increase clockwise (SVG's y axis points down).
 */
import type { InfiniteMaze } from './infinite'
import type { Cell, PolarMaze, Wall } from './polar'

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
 * The first `rings` rings of an infinite maze, closed off by the eye at the
 * centre, as one walls path and the corridor floors, in units where the
 * outermost ring's outer edge is 1.
 */
export function infiniteMazePaths(
  maze: InfiniteMaze,
  rings: number,
): { walls: string; floors: { d: string; distance: number }[] } {
  const eye = maze.eye(rings)
  let walls = sectorPath(eye.r0, eye.r1, eye.a0, eye.a1)
  const floors: { d: string; distance: number }[] = []
  for (let k = 0; k < rings; k++) {
    const ring = maze.next()
    const scale = maze.ratio ** k
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
  return { walls, floors }
}
