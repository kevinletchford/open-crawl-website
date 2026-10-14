/**
 * Shared by the split-flap request boards: how a request reads on a board,
 * and how big the tiles can be. No DOM, so it runs at build time and in the
 * boards' scripts.
 */
import type { LogEntry } from '@/data/demo'
import { formatMs } from '@/lib/chart'

export interface Column {
  key: string
  head: string
  /** Tiles; a word board shows the value on one tile this many characters wide. */
  width: number
  /** Tiles shown on small screens; 0 hides the column. All of them when unset. */
  mobile?: number
  align?: 'left' | 'right'
  muted?: boolean
}

/** A request's values by column key; `time` is added when it's shown. */
export const values = (entry: LogEntry): Record<string, string> => ({
  path: entry.path.toUpperCase(),
  status: String(entry.status),
  ms: formatMs(entry.ms).toUpperCase(),
  worker: `W${entry.worker}`,
})

/** Fits `text` to `width` characters, cutting or padding on the right (or the left, for numbers). */
export const fit = (text: string, width: number, align = 'left') =>
  align === 'right'
    ? text.slice(-width).padStart(width)
    : text.slice(0, width).padEnd(width)

/** Build-time clock for the rows a board starts with, `gap` seconds apart. */
export function startTime(i: number, gap = 4) {
  const s = 14 * 3600 + 32 * 60 + 8 - i * gap
  const pad = (v: number) => String(v).padStart(2, '0')
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`
}

// In ems, from FlapText.astro: a tile is 1.05em wide with 0.12em between tiles,
// a word tile 0.6em a character plus 0.9em, and columns sit 1em apart.
function ems(columns: Column[], mobile: boolean, words: boolean) {
  const shown = columns
    .map((c) => (mobile ? (c.mobile ?? c.width) : c.width))
    .filter((n) => n > 0)
  const tiles = words
    ? shown.reduce((sum, n) => sum + n * 0.6 + 0.9, 0)
    : shown.reduce((sum, n) => sum + n * 1.05 + (n - 1) * 0.12, 0)
  return (tiles + (shown.length - 1)) * 1.03
}

/**
 * CSS variables for a `.flap-fit` row of `columns`: tiles grow to fill the
 * board's width, up to `max` pixels of type.
 */
export const fitStyle = (columns: Column[], max: number, words = false) =>
  `--n:${ems(columns, true, words).toFixed(2)};--n-sm:${ems(columns, false, words).toFixed(2)};--max:${max}px`
