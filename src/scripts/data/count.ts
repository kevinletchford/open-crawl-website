/**
 * Rolls numbers up from zero when their panel is revealed. Mark the number
 * with `data-count="<value>"` and `data-format` (a `MetricFormat`); it must
 * sit inside a `[data-reveal]` element. Components with counters call
 * `countUp()` from their script. Use `tabular-nums` on it so the width
 * doesn't jitter as the digits change.
 */
import { formatMetric, type MetricFormat } from '@/lib/chart'
import { fresh } from './fresh'
import { onReveal, still } from './reveal'

const DURATION = 900
const easeOut = (t: number) => 1 - (1 - t) ** 3

export function rollUp(el: HTMLElement, to: number, format: MetricFormat) {
  if (still) {
    el.textContent = formatMetric(to, format)
    return
  }
  const start = performance.now()
  const tick = (now: number) => {
    const t = Math.min(1, (now - start) / DURATION)
    const value = to * easeOut(t)
    el.textContent = formatMetric(
      format === 'pct' ? value : Math.round(value),
      format,
    )
    if (t < 1) requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}

export function countUp() {
  for (const el of fresh('[data-count]')) {
    const panel = el.closest<HTMLElement>('[data-reveal]')
    if (!panel) continue
    const to = Number(el.dataset.count)
    const format = (el.dataset.format ?? 'number') as MetricFormat
    if (!still) el.textContent = formatMetric(0, format)
    onReveal(panel, () => rollUp(el, to, format))
  }
}
