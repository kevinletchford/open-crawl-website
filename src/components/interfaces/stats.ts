/**
 * The running numbers behind the Switchboard's outputs: one illustrative
 * crawl that grows as pages flow through. The page renders the starting
 * state with these formatters, and the script reuses them as it counts on,
 * so the two can't disagree.
 */
export interface CrawlStats {
  pages: number
  errors: number
  rendered: number
  /** The most recent page that came back 404. */
  missing: string
  /** The page that just went through. */
  current: string
}

export const START: CrawlStats = {
  pages: 1742,
  errors: 23,
  rendered: 138,
  missing: '/careers/2019',
  current: '/docs/',
}

const pct = (n: number, of: number) => `${((n / of) * 100).toFixed(1)}%`

/** Each `data-stat` key, as it reads on the page. */
export const SHOW: Record<string, (s: CrawlStats) => string> = {
  fetched: (s) => pct(s.pages - s.errors, s.pages),
  rendered: (s) => pct(s.rendered, s.pages),
  errors: (s) => pct(s.errors, s.pages),
  'error-count': (s) => String(s.errors),
  missing: (s) => s.missing,
  current: (s) => s.current,
  rows: (s) => s.pages.toLocaleString('en-US'),
  // About 1.2 KB a page.
  size: (s) => `${((s.pages * 1.23) / 1024).toFixed(2)} MB`,
}
