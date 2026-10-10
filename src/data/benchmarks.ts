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
