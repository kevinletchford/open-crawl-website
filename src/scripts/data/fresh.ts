/**
 * The elements matching `selector` that haven't been set up yet, marking
 * them as set up. Component scripts loop over these rather than every match,
 * so running a script again (Storybook re-runs them on each story render)
 * doesn't bind the same listeners twice.
 */
export function fresh<T extends HTMLElement = HTMLElement>(selector: string) {
  return [...document.querySelectorAll<T>(selector)].filter((el) => {
    if (el.dataset.ready !== undefined) return false
    el.dataset.ready = ''
    return true
  })
}
