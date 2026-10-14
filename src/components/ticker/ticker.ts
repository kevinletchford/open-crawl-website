/**
 * Shared by the request log variations: how a request reads on a line of
 * the log. No DOM, so it runs at build time and in the variations' scripts.
 */
import type { LogEntry } from '@/data/demo'
import { formatMs } from '@/lib/chart'

/** How a status is drawn: by fill and outline, never colour. */
export type Kind = 'ok' | 'redirect' | 'error' | 'pending'

export const kind = (status: number): Kind =>
  status < 300 ? 'ok' : status < 400 ? 'redirect' : 'error'

export interface Line {
  method: string
  path: string
  status: string
  kind: Kind
  worker: string
  ms: string
  /** Milliseconds, for sums and timers. */
  n: number
  error: boolean
}

export const line = (entry: LogEntry): Line => ({
  method: entry.method,
  path: entry.path,
  status: String(entry.status),
  kind: kind(entry.status),
  worker: `worker ${entry.worker}`,
  ms: formatMs(entry.ms),
  n: entry.ms,
  error: entry.status >= 400,
})

/** Build-time clock for the lines a log starts with, newest first, `gap` ms apart. */
export function stamp(i: number, gap = 1700) {
  const d = new Date(14 * 3600e3 + 32 * 60e3 + 8000 - i * gap)
  const pad = (v: number, l = 2) => String(v).padStart(l, '0')
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}.${pad(d.getUTCMilliseconds(), 3)}`
}
