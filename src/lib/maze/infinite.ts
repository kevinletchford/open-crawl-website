/**
 * An infinite circular maze: one continuous maze whose rings shrink
 * geometrically toward a vanishing point, generated one ring at a time.
 *
 * Every ring has the same number of cells and is `ratio` times the radius of
 * the ring outside it, so each ring is an exact scaled copy of its parent's
 * proportions: zooming in by one ring looks just like where you started. That
 * is what lets the hero zoom forever with no seams.
 *
 * Rings are carved with Eller's algorithm, which only needs the previous
 * ring's state, so the maze can stream inward indefinitely while every
 * corridor stays connected to the ones around it. Like the logo, the maze can
 * be split into quadrants by an open cross channel running all the way in.
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
  /** Crawl steps from the entrances; -1 if not reached from outside. */
  distance: number
}

export interface InfiniteRing {
  index: number
  walls: Sector[]
  cells: RingCell[]
}

const TAU = Math.PI * 2
/** Set id shared by every cell touching the cross channel. */
const CHANNEL = 0

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
  /** Per cell of the next ring: inherited set id, or -1 if not linked. */
  private inherited: Int32Array
  /** Per cell of the next ring: crawl distance arriving from outside. */
  private arriving: Float64Array

  constructor(options: InfiniteMazeOptions) {
    // Defaults follow the reference maze (public/maze.png): a few wide rings
    // of long arcs, walls as thick as the corridors between them.
    this.cells = options.cells ?? 24
    this.ratio = options.ratio ?? 0.78
    this.wall = options.wall ?? 0.5
    this.cross = options.cross ?? true
    this.horizontal = options.horizontal ?? 0.7
    this.vertical = options.vertical ?? 0.18
    this.rng = mulberry32(options.seed)
    if (this.cross && this.cells % 4 !== 0) {
      throw new Error('cells must be a multiple of 4 when cross is on')
    }
    const width = 1 - this.ratio
    this.wedge = this.wall * width
    this.channel = ((1 - this.wall) * width) / 2
    this.inherited = new Int32Array(this.cells).fill(-1)
    // Ring 0 is entered from outside: through the cross channel, or by a
    // doorway at 12 o'clock without it.
    this.arriving = new Float64Array(this.cells).fill(Infinity)
    if (!this.cross) this.arriving[0] = 0
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

    // Sets: cells on the cross share the channel's set; cells linked from the
    // ring outside inherit its set; the rest start their own.
    const sets = new Int32Array(n)
    for (let i = 0; i < n; i++) {
      sets[i] = this.touchesCross(i)
        ? CHANNEL
        : this.inherited[i] >= 0
          ? this.inherited[i]
          : this.nextSet++
    }
    const merge = (from: number, to: number) => {
      for (let i = 0; i < n; i++) if (sets[i] === from) sets[i] = to
    }

    // Horizontal links. The cross is always open: it's the channel.
    const openAfter = new Uint8Array(n)
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n
      if (this.onCross(i)) {
        openAfter[i] = 1
      } else if (sets[i] !== sets[j] && rng() < this.horizontal) {
        openAfter[i] = 1
        merge(sets[j], sets[i])
      }
    }

    // Vertical links: every set (except the channel, which carries on by
    // itself) needs at least one way further in.
    const down = new Uint8Array(n)
    const members = new Map<number, number[]>()
    for (let i = 0; i < n; i++) {
      if (sets[i] === CHANNEL) continue
      const list = members.get(sets[i]) ?? []
      list.push(i)
      members.set(sets[i], list)
    }
    for (const list of members.values()) {
      down[list[Math.floor(rng() * list.length)]] = 1
      for (const i of list) if (rng() < this.vertical) down[i] = 1
    }
    for (let i = 0; i < n; i++) {
      if (sets[i] === CHANNEL && rng() < this.vertical / 2) down[i] = 1
    }

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
    this.inherited = new Int32Array(n).fill(-1)
    this.arriving = new Float64Array(n).fill(Infinity)
    for (let i = 0; i < n; i++) {
      if (!down[i]) continue
      this.inherited[i] = sets[i] === CHANNEL ? -1 : sets[i]
      this.arriving[i] = distance[i] + 1
    }

    return {
      index: k,
      walls: this.walls(k, openAfter, down),
      cells: Array.from({ length: n }, (_, i) => ({
        a0: i * step,
        a1: (i + 1) * step,
        distance: Number.isFinite(distance[i]) ? distance[i] : -1,
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
