/**
 * Letters for a maze to carve: G, T and R, for the engine's three runtimes.
 *
 * Each glyph is a union of bars, rings and slants in the logo's vocabulary,
 * drawn in a unit disc (y down, as in SVG) so it scales to any maze. Pass
 * `glyphRegion` to `generateMaze` as its `region`: the cells under the letter
 * become one walled sub-maze, entered by a single doorway, which a crawl
 * floods once it finds the way in.
 */

export type Glyph = 'G' | 'T' | 'R'

type Point = [number, number]
type Shape = (p: Point) => boolean

const DEG = Math.PI / 180

/** Axis-aligned bar between two corners. */
const bar =
  (x0: number, y0: number, x1: number, y1: number): Shape =>
  ([x, y]) =>
    x >= x0 && x <= x1 && y >= y0 && y <= y1

/**
 * Ring around `centre` between radii `r0` and `r1`, from angle `a0` clockwise
 * to `a1` (degrees, 0 = 12 o'clock, as in `polar.ts`).
 */
const ring =
  ([cx, cy]: Point, r0: number, r1: number, a0 = 0, a1 = 360): Shape =>
  ([x, y]) => {
    const dx = x - cx
    const dy = y - cy
    const r = Math.hypot(dx, dy)
    if (r < r0 || r > r1) return false
    const a = (Math.atan2(dx, -dy) / DEG + 360) % 360
    return (a - a0 + 360) % 360 <= (a1 - a0 + 360) % 360 || a1 - a0 >= 360
  }

/** A stroke `width` wide from `a` to `b`. */
const slant =
  ([ax, ay]: Point, [bx, by]: Point, width: number): Shape =>
  ([x, y]) => {
    const dx = bx - ax
    const dy = by - ay
    const t = ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)
    if (t < 0 || t > 1) return false
    return Math.hypot(x - ax - t * dx, y - ay - t * dy) <= width / 2
  }

const union =
  (...shapes: Shape[]): Shape =>
  (p) =>
    shapes.some((shape) => shape(p))

// Loose and heavy: wide strokes leave room for a maze inside each letter,
// and a ring of open floor keeps each one off the rim.
const GLYPHS: Record<Glyph, Shape> = {
  // A ring open at the top right, with its bar turned in at three o'clock.
  G: union(ring([0, 0], 0.4, 0.78, 90, 20), bar(0, -0.14, 0.78, 0.18)),
  T: union(bar(-0.72, -0.78, 0.72, -0.36), bar(-0.22, -0.78, 0.22, 0.8)),
  // The bowl is half a ring on the stem; the leg slants out from its foot.
  R: union(
    bar(-0.66, -0.78, -0.28, 0.76),
    bar(-0.66, -0.78, -0.1, -0.44),
    bar(-0.66, -0.06, -0.1, 0.24),
    ring([-0.1, -0.27], 0.17, 0.51, 0, 180),
    slant([0, 0.1], [0.5, 0.72], 0.38),
  ),
}

/** The cells under `glyph`, as a `region` for `generateMaze`. */
export function glyphRegion(glyph: Glyph) {
  const shape = GLYPHS[glyph]
  return (x: number, y: number) => shape([x, y])
}
