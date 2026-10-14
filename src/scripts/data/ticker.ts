/**
 * The motion for the request log variations: a line opens, then its text
 * rolls up into place a character at a time, left to right, and its numbers
 * turn like an odometer. Changing text in place rolls the old characters up
 * and out as the new ones come in, and only the characters that changed
 * move.
 *
 * Text is plain until it moves, and goes back to plain text once it settles.
 * Styles are in `TickerStyles.astro`. With reduced motion values change in
 * place, and `tick` never runs.
 */
import { onReveal, still } from './reveal'

const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'
const show = (c: string) => (c === ' ' ? ' ' : c)

export interface RollOptions {
  /** Milliseconds before the first character moves. */
  delay?: number
  /** Milliseconds between one character starting and the next. */
  stagger?: number
  /** Milliseconds each character takes. */
  duration?: number
}

function glyph(c: string) {
  const g = document.createElement('span')
  g.className = 'tk-g'
  g.textContent = show(c)
  return g
}

function cell(c: string) {
  const el = document.createElement('span')
  el.className = 'tk-c'
  el.append(glyph(c))
  return el
}

// Back to plain text once nothing under `el` is moving.
function settle(el: HTMLElement, text: string) {
  if (el.dataset.text !== text) return
  if (
    el.getAnimations({ subtree: true }).some((a) => a.playState === 'running')
  )
    return
  el.textContent = text
}

/** Rolls `el`'s text to `text`. Resolves when it has settled. */
export async function roll(
  el: HTMLElement,
  text: string,
  { delay = 0, stagger = 16, duration = 620 }: RollOptions = {},
) {
  const from = el.dataset.text ?? el.textContent?.trim() ?? ''
  el.dataset.text = text
  if (still || from === text) {
    if (still) el.textContent = text
    return
  }

  let cells = [...el.querySelectorAll<HTMLElement>(':scope > .tk-c')]
  if (!cells.length) {
    cells = [...from].map(cell)
    el.replaceChildren(...cells)
  }
  while (cells.length < text.length) {
    const c = cell(' ')
    el.append(c)
    cells.push(c)
  }

  let moved = 0
  const runs = cells.map((c, i) => {
    const to = text[i] ?? ' '
    const old = c.lastElementChild as HTMLElement
    if (old.textContent === show(to)) return
    const next = glyph(to)
    c.append(next)
    const at = delay + moved++ * stagger
    const timing = {
      duration,
      delay: at,
      easing: EASE,
      fill: 'backwards' as const,
    }
    old
      .animate(
        [
          { transform: 'translateY(0)', opacity: 1 },
          { transform: 'translateY(-100%)', opacity: 0 },
        ],
        { ...timing, fill: 'forwards' },
      )
      .finished.then(
        () => old.remove(),
        () => {},
      )
    return next.animate(
      [
        { transform: 'translateY(100%)', opacity: 0, filter: 'blur(2px)' },
        { transform: 'translateY(0)', opacity: 1, filter: 'blur(0)' },
      ],
      timing,
    ).finished
  })
  await Promise.allSettled(runs)
  settle(el, text)
}

/**
 * Turns `el`'s digits to `text` like an odometer, each digit rolling along
 * 0–9 to its place, the right-hand ones first. A new shape of number (more
 * digits, or a new unit) starts from zero.
 */
export function count(
  el: HTMLElement,
  text: string,
  { delay = 0, duration = 1100 }: { delay?: number; duration?: number } = {},
) {
  if (still) {
    el.textContent = text
    return
  }
  const shape = text.replace(/\d/g, '0')
  if (el.dataset.shape !== shape) {
    // Wheels start on the number already showing, if it's the same shape.
    const before = (
      el.getAttribute('aria-label') ??
      el.textContent ??
      ''
    ).trim()
    const start =
      before.replace(/\d/g, '0') === shape ? before.replace(/\D/g, '') : ''
    el.dataset.shape = shape
    let d = 0
    el.replaceChildren(
      ...[...text].map((c) => {
        if (!/\d/.test(c)) return document.createTextNode(c)
        const wheel = document.createElement('span')
        wheel.className = 'tk-c tk-wheel'
        const strip = document.createElement('span')
        strip.className = 'tk-strip'
        strip.textContent = '0123456789'
        strip.style.transform = `translateY(${-Number(start[d++] ?? 0)}lh)`
        wheel.append(strip)
        return wheel
      }),
    )
    void el.offsetWidth
  }
  const strips = [...el.querySelectorAll<HTMLElement>('.tk-strip')]
  const digits = text.replace(/\D/g, '')
  strips.forEach((strip, i) => {
    strip.style.transitionDuration = `${duration}ms`
    strip.style.transitionDelay = `${delay + (strips.length - 1 - i) * 45}ms`
    strip.style.transform = `translateY(${-Number(digits[i])}lh)`
  })
  el.setAttribute('aria-label', text)
}

/**
 * Writes `values` into a line's `[data-f]` fields: text rolls, `ms` and any
 * field marked `data-count` turns like an odometer. The fields start one
 * after another, left to right, so the line reads in as one.
 */
export function fill(
  line: HTMLElement,
  values: object,
  {
    delay = 0,
    gap = 70,
    stagger = 16,
  }: { delay?: number; gap?: number; stagger?: number } = {},
) {
  const fields = values as Record<string, unknown>
  const kind = typeof fields.kind === 'string' ? fields.kind : undefined
  let at = delay
  for (const el of line.querySelectorAll<HTMLElement>('[data-f]')) {
    const value = fields[el.dataset.f!]
    if (typeof value !== 'string') continue
    const pill = el.dataset.f === 'status' && kind
    // Fields hidden at this width just take the value.
    if (el.offsetParent === null) {
      el.textContent = value
      el.dataset.text = value
      delete el.dataset.shape
      if (pill) el.dataset.kind = kind
      continue
    }
    if (el.dataset.count !== undefined) count(el, value, { delay: at })
    else roll(el, value, { delay: at, stagger })
    if (pill) window.setTimeout(() => (el.dataset.kind = kind), still ? 0 : at)
    at += gap
  }
}

/** Opens a new line from nothing, with a wash that fades once it's in. */
export function enter(line: HTMLElement) {
  if (still) return
  const h = line.offsetHeight
  line.animate(
    [
      { height: '0px', opacity: 0 },
      { height: `${h}px`, opacity: 1 },
    ],
    { duration: 760, easing: EASE },
  )
  line.animate(
    [
      { backgroundColor: 'oklch(1 0 0 / 0.045)' },
      { backgroundColor: 'oklch(1 0 0 / 0)' },
    ],
    { duration: 2600, delay: 400, easing: 'ease-out', fill: 'backwards' },
  )
}

/** A soft wash over a line that changed in place. */
export function wash(line: HTMLElement) {
  if (still) return
  line.animate(
    [
      { backgroundColor: 'oklch(1 0 0 / 0)' },
      { backgroundColor: 'oklch(1 0 0 / 0.04)', offset: 0.15 },
      { backgroundColor: 'oklch(1 0 0 / 0)' },
    ],
    { duration: 2400, easing: 'ease-out' },
  )
}

/**
 * Calls `fn` every `min`–`max` milliseconds from when `root` (or the figure
 * it's in) is revealed, but only while it's on screen, not hovered, and the
 * tab is visible. Never runs with reduced motion.
 */
export function tick(
  root: HTMLElement,
  min: number,
  max: number,
  fn: () => void,
) {
  if (still) return
  let visible = false
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting
  }).observe(root)
  const loop = () =>
    window.setTimeout(
      () => {
        if (visible && !document.hidden && !root.matches(':hover')) fn()
        loop()
      },
      min + Math.random() * (max - min),
    )
  onReveal(root.closest<HTMLElement>('[data-reveal]') ?? root, loop)
}

/**
 * Once `root` (or its figure) is revealed, rolls its build-time clocks
 * (`[data-f="time"]`) down to the last few seconds, `gap` ms apart.
 */
export function wake(root: HTMLElement, gap = 1700) {
  if (still) return
  onReveal(root.closest<HTMLElement>('[data-reveal]') ?? root, () =>
    root
      .querySelectorAll<HTMLElement>('[data-f="time"]')
      .forEach((el, i) =>
        roll(el, now((i + 1) * gap), { delay: 200 + i * 70, stagger: 12 }),
      ),
  )
}

/** The time of day, `HH:MM:SS.mmm`, `ago` milliseconds back. */
export function now(ago = 0) {
  const d = new Date(Date.now() - ago)
  const pad = (v: number, l = 2) => String(v).padStart(l, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`
}

/** Prepends a copy of `template`'s line to `list`, keeping `keep` lines once it's in. */
export function prepend(
  list: HTMLElement,
  template: HTMLTemplateElement,
  keep: number,
) {
  const line = template.content.firstElementChild!.cloneNode(
    true,
  ) as HTMLElement
  list.prepend(line)
  enter(line)
  window.setTimeout(
    () => [...list.children].slice(keep).forEach((el) => el.remove()),
    still ? 0 : 900,
  )
  return line
}
