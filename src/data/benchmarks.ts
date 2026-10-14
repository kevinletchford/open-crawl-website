/**
 * Benchmark results, copied by hand from the reports the open-crawl harness
 * writes to `exports/report_*.md`. Only real runs go in here — when a new
 * report lands, add or replace a run rather than editing numbers.
 */

export interface BenchmarkResult {
  runtime: 'Go' | 'Rust' | 'TypeScript'
  /** Requests per second. */
  rps: number
  /** Wall-clock time for the crawl, as reported. */
  time: string
}

export interface BenchmarkRun {
  id: string
  title: string
  summary: string
  /** ISO date of the report. */
  date: string
  report: string
  target: string
  maxUrls: number
  passes: number
  results: BenchmarkResult[]
}

export const SYNTHETIC: BenchmarkRun = {
  id: 'synthetic',
  title: 'Synthetic site',
  summary:
    'A local benchmark server with no network latency, so the only bottleneck is the crawler itself: parsing, link extraction, deduplication and scheduling.',
  date: '2026-03-15',
  report: 'report_20260315_225421.md',
  target: 'Local synthetic site (localhost)',
  maxUrls: 10_000,
  passes: 1,
  results: [
    { runtime: 'Go', rps: 33450.07, time: '301ms' },
    { runtime: 'Rust', rps: 32404.53, time: '309ms' },
    { runtime: 'TypeScript', rps: 14230.47, time: '710ms' },
  ],
}

export const LIVE: BenchmarkRun = {
  id: 'live',
  title: 'Live website',
  summary:
    'A same-domain crawl of a live production website, averaged over 20 passes. Here the network sets the pace, and every runtime reaches the same ceiling.',
  date: '2026-04-26',
  report: 'report_20260426_160643.md',
  target: 'Live production website, same-domain crawl',
  maxUrls: 100_000,
  passes: 20,
  results: [
    { runtime: 'Go', rps: 285.65, time: '2.661s' },
    { runtime: 'TypeScript', rps: 283.8, time: '2.662s' },
    { runtime: 'Rust', rps: 277.75, time: '2.760s' },
  ],
}

export const RUNS = [SYNTHETIC, LIVE]

/** Pages finished by `t` milliseconds into each crawl. */
export interface ModeSample {
  t: number
  html: number
  rendered: number
}

export interface CrawlMode {
  label: string
  /** Requests or Chrome tabs in flight at once. */
  concurrency: number
  pages: number
  /** Milliseconds to the last page. */
  ms: number
  /** Milliseconds to the first page. */
  first: number
}

/**
 * The same breadth-first crawl of the synthetic site, run twice: once
 * fetching raw HTML, once rendering every page in headless Chrome with the
 * engine's settle rule (text length stable for three checks, 250ms apart).
 * Measured outside the harness, so it has no report file; each crawl had a
 * 60-second budget. Samples are log-spaced, cumulative page counts.
 */
export const CRAWL_MODES = {
  date: '2026-10-14',
  target: 'Local synthetic site (localhost)',
  html: {
    label: 'HTML crawl',
    concurrency: 100,
    pages: 10_000,
    ms: 265.51,
    first: 3.95,
  } satisfies CrawlMode,
  rendered: {
    label: 'JS rendering',
    concurrency: 8,
    pages: 790,
    ms: 54_261.69,
    first: 556.79,
  } satisfies CrawlMode,
  samples: (
    [
      [1.0, 0, 0],
      [1.21, 0, 0],
      [1.47, 0, 0],
      [1.78, 0, 0],
      [2.16, 0, 0],
      [2.63, 0, 0],
      [3.18, 0, 0],
      [3.86, 0, 0],
      [4.68, 3, 0],
      [5.68, 4, 0],
      [6.89, 4, 0],
      [8.36, 12, 0],
      [10.14, 16, 0],
      [12.3, 30, 0],
      [14.91, 58, 0],
      [18.09, 83, 0],
      [21.94, 88, 0],
      [26.61, 128, 0],
      [32.28, 313, 0],
      [39.15, 531, 0],
      [47.48, 861, 0],
      [57.59, 1304, 0],
      [69.86, 1851, 0],
      [84.73, 2452, 0],
      [102.77, 3185, 0],
      [124.65, 4105, 0],
      [151.18, 5207, 0],
      [183.37, 6523, 0],
      [222.41, 8164, 0],
      [269.77, 10000, 0],
      [327.2, 10000, 0],
      [396.87, 10000, 0],
      [481.36, 10000, 0],
      [583.85, 10000, 1],
      [708.15, 10000, 1],
      [858.92, 10000, 1],
      [1041.79, 10000, 1],
      [1263.59, 10000, 9],
      [1532.62, 10000, 9],
      [1858.92, 10000, 14],
      [2254.7, 10000, 17],
      [2734.74, 10000, 25],
      [3316.98, 10000, 33],
      [4023.19, 10000, 44],
      [4879.75, 10000, 57],
      [5918.68, 10000, 73],
      [7178.8, 10000, 92],
      [8707.21, 10000, 113],
      [10561.03, 10000, 143],
      [12809.54, 10000, 176],
      [15536.77, 10000, 217],
      [18844.65, 10000, 265],
      [22856.79, 10000, 326],
      [27723.14, 10000, 397],
      [33625.57, 10000, 484],
      [40784.66, 10000, 589],
      [49467.96, 10000, 719],
      [60000.0, 10000, 790],
    ] as const
  ).map(([t, html, rendered]): ModeSample => ({ t, html, rendered })),
}
