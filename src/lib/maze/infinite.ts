/**
 * An infinite circular maze: one continuous maze whose rings shrink
 * geometrically toward a vanishing point, generated one ring at a time.
 *
 * Every ring has the same number of cells and is `ratio` times the radius of
 * the ring outside it, so each ring is an exact scaled copy of its parent's
 * proportions: zooming in by one ring looks just like where you started. That
 * is what lets the hero zoom forever with no seams.
 *
 * Rings are carved one at a time from the previous ring's state alone, so
 * the maze can stream inward indefinitely. Every cell is joined to the
 * corridors reachable from the entrance, exactly once, so the whole maze is
 * one connected tree: no loops, no sealed-off pockets. Like the logo, it can
 * optionally be split into quadrants by an open cross channel running in.
 *
 * Units are ring-local: a ring's outer edge is radius 1 and its inner edge is
 * radius `ratio`. Scale ring k by `ratio ** k` to place it in the maze.
 * Angles are radians clockwise from 12 o'clock, as in polar.ts.
 */
import { mulberry32, type Rng } from './rng'

export interface InfiniteMazeOptions {
  seed: number
  /** Cells per ring; a multiple of 4 when `cross` is on. */
  cells?: number
  /** Inner radius of a ring relative to its outer radius. */
  ratio?: number
  /** Wall thickness as a fraction of the ring width. */
  wall?: number
  cross?: boolean
  /** Chance of opening a wall between neighbours in a ring (longer arcs). */
  horizontal?: number
  /** Chance of opening extra passages to the next ring in. */
  vertical?: number
}

/** A wall or floor as an annular sector, in ring-local units. */
export interface Sector {
  r0: number
  r1: number
  a0: number
  a1: number
}

export interface RingCell {
  a0: number
  a1: number
  /** Crawl steps from the entrance. */
  distance: number
  /** A passage clockwise into the next cell of this ring. */
  open: boolean
  /** A passage inward into the same cell of the next ring. */
  down: boolean
}

export interface InfiniteRing {
  index: number
  walls: Sector[]
  cells: RingCell[]
}

const TAU = Math.PI * 2
/** Set id of every cell already connected to the entrance. */
const ROOT = 0

export class InfiniteMaze {
  readonly cells: number
  readonly ratio: number
  readonly wall: number
  readonly cross: boolean
  /** Angular width of a radial wall. */
  readonly wedge: number
  /** Angular half-width of the open cross channel. */
  readonly channel: number

  private readonly rng: Rng
  private readonly horizontal: number
  private readonly vertical: number
  private index = 0
  private nextSet = 1
  /** Per cell of the next ring: 1 if a passage leads in from outside. */
  private linked: Uint8Array
  /** Per cell of the next ring: crawl distance arriving from outside. */
  private arriving: Float64Array

  constructor(options: InfiniteMazeOptions) {
    // Defaults follow the reference maze (public/maze.png): a few wide rings
    // of long arcs, walls as thick as the corridors between them.
    this.cells = options.cells ?? 24
    this.ratio = options.ratio ?? 0.78
    this.wall = options.wall ?? 0.5
    this.cross = options.cross ?? false
    this.horizontal = options.horizontal ?? 0.7
    this.vertical = options.vertical ?? 0.2
    this.rng = mulberry32(options.seed)
    if (this.cross && this.cells % 4 !== 0) {
      throw new Error('cells must be a multiple of 4 when cross is on')
    }
    const width = 1 - this.ratio
    this.wedge = this.wall * width
    this.channel = ((1 - this.wall) * width) / 2
    // Ring 0 is entered from outside: through the cross channel, or by a
    // doorway at 12 o'clock without it.
    this.linked = new Uint8Array(this.cells)
    this.arriving = new Float64Array(this.cells).fill(Infinity)
    if (!this.cross) {
      this.linked[0] = 1
      this.arriving[0] = 0
    }
  }

  /** True if the boundary after cell `i` lies on the cross. */
  private onCross(i: number) {
    return this.cross && (i + 1) % (this.cells / 4) === 0
  }

  /** True if cell `i` touches the cross channel on either side. */
  private touchesCross(i: number) {
    const n = this.cells
    return this.onCross(i) || this.onCross((i - 1 + n) % n)
  }

  /** Generate the next ring inward. */
  next(): InfiniteRing {
    const { cells: n, rng } = this
    const k = this.index++
    const step = TAU / n

    // Sets: cells reached from outside (or the cross channel) are already
    // connected to the entrance; the rest start out on their own.
    const sets = new Int32Array(n)
    for (let i = 0; i < n; i++) {
      sets[i] = this.linked[i] || this.touchesCross(i) ? ROOT : this.nextSet++
    }
    const merge = (from: number, to: number) => {
      for (let i = 0; i < n; i++) if (sets[i] === from) sets[i] = to
    }
    const openAfter = new Uint8Array(n)
    const link = (i: number) => {
      const j = (i + 1) % n
      openAfter[i] = 1
      // Keep ROOT as the surviving id, so "connected" stays easy to test.
      if (sets[j] === ROOT) merge(sets[i], ROOT)
      else merge(sets[j], sets[i])
    }

    // Horizontal links between cells not yet connected to each other, so
    // there are no loops. The cross is always open: it's the channel.
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n
      if (this.onCross(i)) openAfter[i] = 1
      else if (sets[i] !== sets[j] && rng() < this.horizontal) link(i)
    }
    // Then join any pocket still cut off from the entrance through a random
    // wall on its edge, until the whole ring is connected.
    for (;;) {
      const edges: number[] = []
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n
        if (sets[i] !== sets[j] && (sets[i] !== ROOT || sets[j] !== ROOT)) {
          edges.push(i)
        }
      }
      if (!edges.length) break
      link(edges[Math.floor(rng() * edges.length)])
    }

    // Vertical links: random passages further in, at least one per ring.
    const down = new Uint8Array(n)
    for (let i = 0; i < n; i++) if (rng() < this.vertical) down[i] = 1
    down[Math.floor(rng() * n)] = 1

    // Crawl distances: arrivals from outside, the channel (one step per
    // ring), then spread around the ring through its open links.
    const distance = Float64Array.from(this.arriving)
    if (this.cross) {
      for (let i = 0; i < n; i++) {
        if (this.touchesCross(i)) distance[i] = Math.min(distance[i], k)
      }
    }
    for (let changed = true; changed;) {
      changed = false
      for (let i = 0; i < n; i++) {
        if (!openAfter[i]) continue
        const j = (i + 1) % n
        if (distance[i] + 1 < distance[j]) {
          distance[j] = distance[i] + 1
          changed = true
        }
        if (distance[j] + 1 < distance[i]) {
          distance[i] = distance[j] + 1
          changed = true
        }
      }
    }

    // Hand state to the next ring in.
    this.linked = down
    this.arriving = new Float64Array(n).fill(Infinity)
    for (let i = 0; i < n; i++) {
      if (down[i]) this.arriving[i] = distance[i] + 1
    }

    return {
      index: k,
      walls: this.walls(k, openAfter, down),
      cells: Array.from({ length: n }, (_, i) => ({
        a0: i * step,
        a1: (i + 1) * step,
        distance: Number.isFinite(distance[i]) ? distance[i] : -1,
        open: openAfter[i] === 1,
        down: down[i] === 1,
      })),
    }
  }

  private walls(k: number, openAfter: Uint8Array, down: Uint8Array) {
    const { cells: n, ratio: q, wedge, channel } = this
    const step = TAU / n
    const width = 1 - q
    const walls: Sector[] = []

    /** Arc wall centred on radius r, over the cells [from, to). */
    const arc = (r: number, from: number, to: number) => {
      const half = (this.wall * width * r) / 2
      // Trim ends at the cross back to the channel; extend the rest by half
      // a wall so corners and dead ends come out square.
      const a0 = this.onCross((from - 1 + n) % n)
        ? from * step + channel
        : from * step - wedge / 2
      const a1 = this.onCross(to - 1)
        ? to * step - channel
        : to * step + wedge / 2
      if (a1 > a0) walls.push({ r0: r - half, r1: r + half, a0, a1 })
    }
    /** Merge runs of closed cells into single arcs. */
    const arcs = (r: number, closed: (i: number) => boolean) => {
      let start = -1
      for (let i = 0; i < n; i++) {
        if (closed(i)) {
          if (start < 0) start = i
        } else if (start >= 0) {
          arc(r, start, i)
          start = -1
        }
        // Break runs at the cross so each quadrant's arcs get trimmed.
        if (start >= 0 && this.onCross(i)) {
          arc(r, start, i + 1)
          start = -1
        }
      }
      if (start >= 0) arc(r, start, n)
    }

    // The outermost ring is closed except for its entrances.
    if (k === 0) arcs(1, (i) => this.cross || i !== 0)
    // Its inner edge: closed wherever there's no passage further in.
    arcs(q, (i) => !down[i])

    // Radial walls between neighbours that aren't linked: constant-angle
    // wedges, so they thicken with the radius just like the arcs.
    for (let i = 0; i < n; i++) {
      if (openAfter[i]) continue
      const a = (i + 1) * step
      walls.push({
        r0: q - (this.wall * width * q) / 2,
        r1: 1 + (this.wall * width) / 2,
        a0: a - wedge / 2,
        a1: a + wedge / 2,
      })
    }
    return walls
  }
}
