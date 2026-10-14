/**
 * Plays a feature graphic as a run of numbered steps. Anything inside the
 * `[data-steps]` root with `data-at="n"` gets `data-on` from step n on, or
 * only up to `data-until="m"` when that's set. While a pass plays the root
 * has `data-playing`, and the graphics only hide things under it, so
 * between passes, before script, or with reduced motion, the CSS shows the
 * finished picture. Who plays when is up to the caller (FeatureCards).
 */
export interface Steps {
  /**
   * One pass from the start, holding on the last step. Resolves true when
   * it ran to the end, false when `stop` cut it short.
   */
  play(): Promise<boolean>
  /** Back to the finished picture, stopping a pass under way. */
  stop(): void
}

/** Null with reduced motion: the graphic stays finished. */
export function steps(root: HTMLElement): Steps | null {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return null

  const items = [...root.querySelectorAll('[data-at]')]
  const at = (el: Element) => Number(el.getAttribute('data-at'))
  const last = Math.max(0, ...items.map(at))
  const interval = Number(root.dataset.interval ?? 600)
  const hold = Number(root.dataset.hold ?? 1500)
  let timer: number | undefined
  let cancel: (() => void) | undefined

  const show = (step: number) => {
    for (const el of items) {
      const until = el.getAttribute('data-until')
      el.toggleAttribute(
        'data-on',
        at(el) <= step && (until === null || step <= Number(until)),
      )
    }
  }

  const stop = () => {
    clearTimeout(timer)
    cancel?.()
    cancel = undefined
    root.removeAttribute('data-playing')
    for (const el of items) el.removeAttribute('data-on')
  }

  const play = () =>
    new Promise<boolean>((resolve) => {
      stop()
      cancel = () => resolve(false)
      root.setAttribute('data-playing', '')
      let step = 0
      const tick = () => {
        show(step)
        if (step === last) {
          timer = window.setTimeout(() => {
            cancel = undefined
            resolve(true)
          }, hold)
          return
        }
        step += 1
        timer = window.setTimeout(tick, interval)
      }
      tick()
    })

  return { play, stop }
}
