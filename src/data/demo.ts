/**
 * Illustrative data for the components in `src/components/data/`. None of
 * this is a real crawl: every panel that uses it says "Illustrative example".
 * Real results live in `src/data/benchmarks.ts` and nowhere else.
 *
 * Noise comes from a seeded generator, so the numbers are the same on every
 * build.
 */
import { mulberry32 } from '@/lib/maze/rng'
import type { MetricFormat } from '@/lib/chart'

export const AGENTS = [
  'GPTBot',
  'ClaudeBot',
  'PerplexityBot',
  'Google-Extended',
] as const
export type Agent = (typeof AGENTS)[number]

// 1. Metric strip ------------------------------------------------------------

export interface Metric {
  label: string
  value: number
  previous: number
  format: MetricFormat
  /** Whether a rise is an improvement (false for latency, say). */
  higherIsBetter: boolean
  /** The value over the last crawls, oldest first; ends at `value`. */
  series: number[]
}

function walk(seed: number, from: number, to: number, length = 14) {
  const rng = mulberry32(seed)
  return Array.from({ length }, (_, i) => {
    const t = i / (length - 1)
    const wobble = i === 0 || i === length - 1 ? 0 : (rng() - 0.5) * 0.08
    return Math.round((from + (to - from) * t) * (1 + wobble) * 10) / 10
  })
}

export const METRICS: Metric[] = [
  {
    label: 'Pages crawled',
    value: 12480,
    previous: 11962,
    format: 'number',
    higherIsBetter: true,
    series: walk(1, 9210, 12480),
  },
  {
    label: 'Fetched without error',
    value: 97.4,
    previous: 95.8,
    format: 'pct',
    higherIsBetter: true,
    series: walk(2, 93.1, 97.4),
  },
  {
    label: 'Median response',
    value: 182,
    previous: 214,
    format: 'ms',
    higherIsBetter: false,
    series: walk(3, 268, 182),
  },
  {
    label: 'Pages a second',
    value: 208,
    previous: 186,
    format: 'number',
    higherIsBetter: true,
    series: walk(4, 151, 208),
  },
]

// 2. Crawl progress ----------------------------------------------------------

export interface ProgressSample {
  /** Seconds since the crawl started. */
  t: number
  discovered: number
  fetched: number
}

function progress(seed: number, total: number, seconds: number, step = 2) {
  const rng = mulberry32(seed)
  const samples: ProgressSample[] = []
  let discovered = 0
  let fetched = 0
  for (let t = 0; t <= seconds; t += step) {
    // Discovery is logistic: slow at the root, fast through the middle of
    // the site, tailing off as the frontier runs dry.
    const target = total / (1 + Math.exp(-(t - seconds * 0.38) / (seconds / 9)))
    discovered = Math.max(
      discovered,
      Math.round(target * (0.97 + rng() * 0.03)),
    )
    fetched = Math.min(
      discovered,
      Math.max(fetched, Math.round(discovered * (0.72 + (t / seconds) * 0.28))),
    )
    samples.push({ t, discovered, fetched })
  }
  const last = samples[samples.length - 1]
  last.discovered = total
  last.fetched = total
  return samples
}

export const PROGRESS = {
  current: progress(5, 12480, 60),
  previous: progress(6, 11962, 60),
}

// 3. Latency -----------------------------------------------------------------

export const LATENCY_BUCKET_MS = 40

export interface LatencySeries {
  /** Pages per 40ms bucket, from 0ms. */
  counts: number[]
  p50: number
  p95: number
  p99: number
}

function latency(seed: number, median: number, spread: number, pages: number) {
  const rng = mulberry32(seed)
  const counts = new Array(30).fill(0)
  const samples: number[] = []
  for (let i = 0; i < pages; i++) {
    // Box–Muller, then exponentiate: response times are log-normal.
    const u = 1 - rng()
    const v = rng()
    const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
    const ms = Math.min(
      30 * LATENCY_BUCKET_MS - 1,
      median * Math.exp(z * spread),
    )
    samples.push(ms)
    counts[Math.floor(ms / LATENCY_BUCKET_MS)]++
  }
  samples.sort((a, b) => a - b)
  const at = (q: number) => Math.round(samples[Math.floor(q * samples.length)])
  return { counts, p50: at(0.5), p95: at(0.95), p99: at(0.99) }
}

export const LATENCY: Record<'All' | Agent, LatencySeries> = {
  All: latency(7, 182, 0.62, 12480),
  GPTBot: latency(8, 168, 0.55, 3120),
  ClaudeBot: latency(9, 176, 0.6, 3120),
  PerplexityBot: latency(10, 214, 0.7, 3120),
  'Google-Extended': latency(11, 158, 0.5, 3120),
}

// 4. Crawl funnel ------------------------------------------------------------

export interface FunnelStage {
  id: string
  label: string
  value: number
}

export interface FunnelLoss {
  /** The stage the pages drop out of. */
  from: string
  id: string
  label: string
  value: number
  icon: 'blocked' | 'redirect' | 'render' | 'structure' | 'hook'
}

export const FUNNEL: { stages: FunnelStage[]; losses: FunnelLoss[] } = {
  stages: [
    { id: 'discovered', label: 'Discovered', value: 12480 },
    { id: 'allowed', label: 'Allowed', value: 11640 },
    { id: 'fetched', label: 'Fetched', value: 11130 },
    { id: 'unique', label: 'Unique', value: 10210 },
    { id: 'delivered', label: 'Delivered', value: 9870 },
  ],
  losses: [
    {
      from: 'discovered',
      id: 'robots',
      label: 'Disallowed by robots.txt',
      value: 840,
      icon: 'blocked',
    },
    {
      from: 'allowed',
      id: 'errors',
      label: '4xx and 5xx',
      value: 510,
      icon: 'redirect',
    },
    {
      from: 'fetched',
      id: 'duplicates',
      label: 'Duplicates and canonicals',
      value: 920,
      icon: 'structure',
    },
    {
      from: 'unique',
      id: 'filtered',
      label: 'Dropped by your hooks',
      value: 340,
      icon: 'hook',
    },
  ],
}

// 5. Access matrix -----------------------------------------------------------

export type AccessState = 'allowed' | 'partial' | 'blocked'
export type RuleSource = 'robots' | 'meta' | 'header' | 'firewall' | 'llms'

export interface AccessCell {
  agent: Agent
  state: AccessState
  source: RuleSource
  /** The rule that decided it, as written. */
  rule: string
}

export interface AccessRow {
  path: string
  pages: number
  cells: AccessCell[]
}

const allow = (agent: Agent): AccessCell => ({
  agent,
  state: 'allowed',
  source: 'robots',
  rule: 'User-agent: * · Allow: /',
})

export const ACCESS: AccessRow[] = [
  { path: '/', pages: 1, cells: AGENTS.map(allow) },
  {
    path: '/pricing',
    pages: 3,
    cells: [
      allow('GPTBot'),
      allow('ClaudeBot'),
      {
        agent: 'PerplexityBot',
        state: 'partial',
        source: 'meta',
        rule: '<meta name="robots" content="nosnippet"> on 2 of 3 pages',
      },
      allow('Google-Extended'),
    ],
  },
  {
    path: '/docs/*',
    pages: 1840,
    cells: [
      {
        agent: 'GPTBot',
        state: 'blocked',
        source: 'robots',
        rule: 'robots.txt line 14 · Disallow: /docs/',
      },
      allow('ClaudeBot'),
      allow('PerplexityBot'),
      {
        agent: 'Google-Extended',
        state: 'blocked',
        source: 'robots',
        rule: 'robots.txt line 21 · Disallow: /docs/',
      },
    ],
  },
  {
    path: '/blog/*',
    pages: 412,
    cells: [
      allow('GPTBot'),
      {
        agent: 'ClaudeBot',
        state: 'partial',
        source: 'header',
        rule: 'X-Robots-Tag: noindex on /blog/archive/*',
      },
      allow('PerplexityBot'),
      allow('Google-Extended'),
    ],
  },
  {
    path: '/products/*',
    pages: 2306,
    cells: [
      allow('GPTBot'),
      allow('ClaudeBot'),
      {
        agent: 'PerplexityBot',
        state: 'blocked',
        source: 'firewall',
        rule: 'Firewall returned 403 · bot-fight mode',
      },
      allow('Google-Extended'),
    ],
  },
  {
    path: '/app/*',
    pages: 96,
    cells: AGENTS.map((agent) => ({
      agent,
      state: 'blocked' as const,
      source: 'robots' as const,
      rule: 'robots.txt line 3 · Disallow: /app/',
    })),
  },
]

// 6. Agent coverage ----------------------------------------------------------

export interface Coverage {
  agent: Agent
  readable: number
  partial: number
  blocked: number
  error: number
}

export const COVERAGE: Coverage[] = [
  {
    agent: 'ClaudeBot',
    readable: 9840,
    partial: 1120,
    blocked: 1010,
    error: 510,
  },
  { agent: 'GPTBot', readable: 8120, partial: 640, blocked: 3210, error: 510 },
  {
    agent: 'Google-Extended',
    readable: 7980,
    partial: 590,
    blocked: 3400,
    error: 510,
  },
  {
    agent: 'PerplexityBot',
    readable: 6950,
    partial: 1380,
    blocked: 3640,
    error: 510,
  },
]

// 7. Readability score -------------------------------------------------------

export const READABILITY = {
  path: '/pricing',
  score: 71,
  previous: 65,
  parts: [
    { label: 'Access', value: 92, weight: 0.3 },
    { label: 'Rendering', value: 54, weight: 0.3 },
    { label: 'Structure', value: 78, weight: 0.2 },
    { label: 'Quotability', value: 61, weight: 0.2 },
  ],
  fixes: [
    { title: 'Server-render the plan comparison table', part: 1, gain: 9 },
    { title: 'Answer “Is there a free plan?” in plain text', part: 3, gain: 5 },
    { title: 'Give each plan its own h3', part: 2, gain: 3 },
  ],
}

// 8. Render diff -------------------------------------------------------------

export interface RenderBlock {
  kind: 'heading' | 'text' | 'media' | 'table'
  /** Width as a fraction of the page. */
  w: number
  /** Height in rem. */
  h: number
  jsOnly: boolean
  label: string
  /** For JS-only blocks: the script that renders it. */
  source?: string
}

export const RENDER = {
  path: '/pricing',
  wordsMissing: 1240,
  blocks: [
    { kind: 'heading', w: 0.6, h: 1.5, jsOnly: false, label: 'Page title' },
    { kind: 'text', w: 1, h: 0.75, jsOnly: false, label: 'Intro paragraph' },
    { kind: 'text', w: 0.8, h: 0.75, jsOnly: false, label: 'Intro paragraph' },
    {
      kind: 'table',
      w: 1,
      h: 5,
      jsOnly: true,
      label: 'Plan comparison table',
      source: '/assets/pricing.js',
    },
    { kind: 'heading', w: 0.4, h: 1, jsOnly: false, label: 'FAQ heading' },
    {
      kind: 'text',
      w: 1,
      h: 3,
      jsOnly: true,
      label: 'FAQ answers',
      source: '/assets/faq.js',
    },
    {
      kind: 'media',
      w: 0.48,
      h: 3.5,
      jsOnly: true,
      label: 'Customer quote',
      source: '/assets/carousel.js',
    },
    { kind: 'media', w: 0.48, h: 3.5, jsOnly: false, label: 'Product image' },
    { kind: 'text', w: 0.9, h: 0.75, jsOnly: false, label: 'Footer note' },
  ] satisfies RenderBlock[],
}

// 9. Request log -------------------------------------------------------------

export interface LogEntry {
  method: 'GET' | 'HEAD'
  status: number
  path: string
  /** Which of the crawler's concurrent workers made the request. */
  worker: number
  ms: number
  bytes: number
  /** The rule that decided a 403 or skipped fetch, when one did. */
  rule?: string
  location?: string
}

const LOG_PATHS = [
  '/',
  '/pricing',
  '/docs/getting-started',
  '/docs/api/crawl',
  '/docs/api/hooks',
  '/blog/crawling-at-scale',
  '/blog/polite-crawling',
  '/products/crawler',
  '/products/mcp',
  '/about',
  '/careers',
  '/changelog',
  '/legal/privacy',
  '/old-pricing',
  '/app/dashboard',
]

function log(seed: number, length: number): LogEntry[] {
  const rng = mulberry32(seed)
  const pick = <T>(items: readonly T[]) =>
    items[Math.floor(rng() * items.length)]
  return Array.from({ length }, () => {
    const path = pick(LOG_PATHS)
    const worker = 1 + Math.floor(rng() * 4)
    const ms = Math.round(90 + rng() ** 2 * 900)
    if (path === '/old-pricing') {
      return {
        method: 'GET',
        status: 301,
        path,
        worker,
        ms: Math.round(ms / 4),
        bytes: 0,
        location: '/pricing',
      }
    }
    if (path.startsWith('/app/')) {
      return {
        method: 'GET',
        status: 403,
        path,
        worker,
        ms: Math.round(ms / 5),
        bytes: 0,
      }
    }
    const failed = rng() < 0.05
    return {
      method: 'GET',
      status: failed ? pick([404, 500, 503]) : 200,
      path,
      worker,
      ms,
      bytes: failed ? 512 : Math.round(8000 + rng() * 90000),
    }
  })
}

export const LOG = log(12, 60)
