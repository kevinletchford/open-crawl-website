/**
 * Split-flap tiles, like a station departure board. Each `[data-flap]` holds
 * one character (or, on a word board, one word), rendered as plain text at
 * build time. `flip` splits a tile into a top and bottom half and turns it to
 * a new value a flap at a time: the top leaf falls to show the next value,
 * then the bottom leaf swings down to meet it and settles.
 *
 * On the way it passes the few values on the drum just before the target,
 * so a tile visibly rolls into place rather than snapping. Asking a tile for
 * a new value mid-turn retargets it.
 *
 * Styles are in `FlapText.astro`. With reduced motion values change in
 * place, and `every` never runs.
 */
import { fit } from '@/components/board/board'
import { onReveal, still } from './reveal'

/** The order a character tile's flaps come round in. */
export const LETTERS = ' ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-./:'
export const DIGITS = ' 0123456789'

export interface FlipOptions {
  /** Milliseconds before the tile starts turning. */
  delay?: number
  /** At most this many flaps pass before the target shows. */
  spins?: number
  /** Milliseconds for each passing flap. */
  step?: number
  /** Milliseconds for the last flap, which settles. */
  settle?: number
  /** The drum to roll along; a target that isn't on it flips straight in. */
  drum?: string
}

interface Tile {
  value: string
  target: string
  left: number
  top: HTMLElement
  bottom: HTMLElement
  options: Required<Omit<FlipOptions, 'delay'>>
  running?: Promise<void>
}

const tiles = new WeakMap<HTMLElement, Tile>()

const show = (value: string) => value.replace(/ /g, ' ') || ' '

function half(where: 'top' | 'bottom', value: string, leaf = false) {
  const outer = document.createElement('span')
  outer.className = `flap-half flap-${where}${leaf ? ' flap-leaf' : ''}`
  const inner = document.createElement('span')
  inner.textContent = show(value)
  outer.append(inner)
  return outer
}

function tile(cell: HTMLElement) {
  let t = tiles.get(cell)
  if (t) return t
  const value = cell.dataset.flap ?? ''
  const top = half('top', value)
  const bottom = half('bottom', value)
  cell.replaceChildren(top, bottom)
  t = {
    value,
    target: value,
    left: 0,
    top,
    bottom,
    options: { spins: 2, step: 70, settle: 300, drum: LETTERS },
  }
  tiles.set(cell, t)
  return t
}

const wait = (ms: number) => new Promise((done) => setTimeout(done, ms))

// Forward steps round the drum from `from` to `to`.
function distance(drum: string, from: string, to: string) {
  const a = drum.indexOf(from)
  const b = drum.indexOf(to)
  if (b < 0) return 1
  if (a < 0) return Infinity
  return (b - a + drum.length) % drum.length
}

async function turn(cell: HTMLElement, t: Tile, to: string, ms: number) {
  const last = to === t.target
  const fall = half('top', t.value, true)
  const rise = half('bottom', to, true)
  rise.style.transform = 'rotateX(90deg)'
  t.top.firstElementChild!.textContent = show(to)
  cell.append(fall, rise)

  await fall.animate(
    [
      { transform: 'rotateX(0deg)', filter: 'brightness(1)' },
      { transform: 'rotateX(-90deg)', filter: 'brightness(0.5)' },
    ],
    { duration: ms * 0.45, easing: 'cubic-bezier(0.5, 0, 0.9, 0.55)' },
  ).finished
  fall.remove()
  // The last flap overshoots a touch and settles back, like a real leaf.
  await rise.animate(
    last
      ? [
          { transform: 'rotateX(90deg)', filter: 'brightness(1.6)' },
          { transform: 'rotateX(-7deg)', filter: 'brightness(1)', offset: 0.7 },
          { transform: 'rotateX(0deg)', filter: 'brightness(1)' },
        ]
      : [
          { transform: 'rotateX(90deg)', filter: 'brightness(1.6)' },
          { transform: 'rotateX(0deg)', filter: 'brightness(1)' },
        ],
    {
      duration: ms * 0.55,
      easing: last ? 'cubic-bezier(0.2, 0.7, 0.3, 1)' : 'linear',
      fill: 'forwards',
    },
  ).finished
  t.bottom.firstElementChild!.textContent = show(to)
  rise.remove()
  t.value = to
}

async function run(cell: HTMLElement, t: Tile, delay: number) {
  if (delay) await wait(delay)
  while (t.value !== t.target) {
    const { drum, step, settle } = t.options
    const at = drum.indexOf(t.target)
    const next =
      t.left > 0 && at >= 0
        ? drum[(at - t.left + drum.length) % drum.length]
        : t.target
    t.left = Math.max(0, t.left - 1)
    await turn(cell, t, next, next === t.target ? settle : step)
  }
}

/** Turns one tile to `to`. Resolves when it has settled. */
export function flip(cell: HTMLElement, to: string, options: FlipOptions = {}) {
  const t = tile(cell)
  const { delay = 0, ...rest } = options
  t.options = { ...t.options, ...rest }
  t.target = to
  if (still) {
    t.value = to
    t.top.firstElementChild!.textContent = show(to)
    t.bottom.firstElementChild!.textContent = show(to)
    return Promise.resolve()
  }
  const steps = distance(t.options.drum, t.value, to)
  t.left = steps > 1 ? Math.min(t.options.spins, steps - 1) : 0
  t.running ??= run(cell, t, delay).finally(() => (t.running = undefined))
  return t.running
}

export interface WriteOptions extends FlipOptions {
  /** Milliseconds between one tile starting and the next. */
  stagger?: number
}

/** Turns a row of character tiles to spell `text`; tiles already showing their character stay still. */
export function write(
  cells: HTMLElement[],
  text: string,
  { stagger = 24, delay = 0, ...options }: WriteOptions = {},
) {
  return Promise.all(
    cells.map((cell, i) => {
      const to = text[i] ?? ' '
      if (tile(cell).target === to) return
      return flip(cell, to, { ...options, delay: delay + i * stagger })
    }),
  )
}

/**
 * The tile groups (`[data-col]`) under `root`, by column, for one row
 * (`data-r`) or for a board with only one.
 */
export function row(root: ParentNode, r?: number) {
  const sel = r === undefined ? '[data-col]' : `[data-col][data-r="${r}"]`
  return [...root.querySelectorAll<HTMLElement>(sel)]
}

/**
 * Writes `values` (by column key) into a row of groups from `row()`. Each
 * group is fitted to its width, and the stagger runs on across groups, so
 * the row turns over left to right as one line.
 */
export function writeRow(
  groups: HTMLElement[],
  values: Record<string, string>,
  { delay = 0, stagger = 24, ...options }: WriteOptions = {},
) {
  let offset = 0
  return Promise.all(
    groups.map((group) => {
      const value = values[group.dataset.col!]
      if (value === undefined) return
      const cells = [...group.querySelectorAll<HTMLElement>('[data-flap]')]
      const at = delay + offset * stagger
      offset += cells.length
      if (group.dataset.word !== undefined) {
        if (tile(cells[0]).target === value) return
        return flip(cells[0], value, { ...options, drum: '', delay: at })
      }
      return write(cells, fit(value, cells.length, group.dataset.align), {
        ...options,
        stagger,
        delay: at,
      })
    }),
  )
}

/**
 * Calls `fn` every `ms` from when `root` (or the figure it's in) is revealed, but only while it's
 * on screen and the tab is visible. Never runs with reduced motion.
 */
export function every(root: HTMLElement, ms: number, fn: () => void) {
  if (still) return
  let visible = false
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting
  }).observe(root)
  onReveal(root.closest<HTMLElement>('[data-reveal]') ?? root, () => {
    window.setInterval(() => {
      if (visible && !document.hidden) fn()
    }, ms)
  })
}

/** The time of day, `HH:MM:SS`, `ago` milliseconds back. */
export function clock(ago = 0) {
  const d = new Date(Date.now() - ago)
  const pad = (v: number) => String(v).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}
