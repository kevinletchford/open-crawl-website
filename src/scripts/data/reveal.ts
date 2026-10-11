/**
 * Marks each `[data-reveal]` element with `data-revealed` the first time it
 * scrolls into view, and fires a `reveal` event on it. The CSS in
 * `global.css` keys its draw/grow/fade transitions off the attribute; scripts
 * that animate in JavaScript listen for the event via `onReveal`.
 *
 * With reduced motion everything is revealed at once.
 *
 * `Figure.astro` calls `scan()` from its script, so each render (including
 * Storybook's re-renders, which reuse this cached module) is picked up.
 */

export const still = window.matchMedia(
  '(prefers-reduced-motion: reduce)',
).matches

const observer = still
  ? undefined
  : new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          observer!.unobserve(entry.target)
          reveal(entry.target as HTMLElement)
        }
      },
      { threshold: 0.35 },
    )

function reveal(el: HTMLElement) {
  if (el.dataset.revealed !== undefined) return
  el.dataset.revealed = ''
  el.dispatchEvent(new CustomEvent('reveal'))
}

/** Runs `callback` once `el` has been revealed (immediately if it has). */
export function onReveal(el: HTMLElement, callback: () => void) {
  if (el.dataset.revealed !== undefined) callback()
  else el.addEventListener('reveal', callback, { once: true })
}

export function scan() {
  for (const el of document.querySelectorAll<HTMLElement>('[data-reveal]')) {
    if (el.dataset.revealWatched !== undefined) continue
    el.dataset.revealWatched = ''
    if (observer) observer.observe(el)
    else reveal(el)
  }
}
