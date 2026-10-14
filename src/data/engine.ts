import type { GlyphName } from '@/components/EngineGlyph.astro'
import type { IconName } from '@/lib/icons'

/** The home page's "edges left open" section, shared by every treatment. */
export const ENGINE_HEADING = 'A crawl engine with the edges left open.'

export interface EngineFeature {
  title: string
  icon: IconName
  /** Its bespoke drawing, for the cards. */
  glyph: GlyphName
  body: string
  /** The step of a crawl the feature belongs to, for the pipeline layout. */
  stage: string
  /** A line or two showing it, for the layouts that carry a proof. */
  proof: string[]
}

export const ENGINE_FEATURES: EngineFeature[] = [
  {
    title: 'An MCP server built in',
    icon: 'mcp',
    glyph: 'mcp',
    body: 'Agents can start a crawl, check on it, and query what it found, as tool calls, without a human in between.',
    stage: 'Start',
    proof: [
      '→ crawl.start { "url": "https://acme.dev" }',
      '← { "run": "r_8f2c", "status": "running" }',
    ],
  },
  {
    title: 'Plugins at every step',
    icon: 'hook',
    glyph: 'hooks',
    body: 'Hook in before a crawl, before and after each page is captured, and in the renderer itself. Filter, enrich, or send pages anywhere.',
    stage: 'Hook',
    proof: ['preAudit · preCapture', 'render · postCapture'],
  },
  {
    title: 'Output you can pipe',
    icon: 'sitemap',
    glyph: 'pipe',
    body: 'JSON, JSON Lines and SQLite, with stable fields. Feed an index, a warehouse, an eval set or the next step in your pipeline.',
    stage: 'Output',
    proof: ['{"url":"/docs","status":200}', '{"url":"/pricing","status":200}'],
  },
  {
    title: 'Render only when you need to',
    icon: 'render',
    glyph: 'render',
    body: 'Raw HTML by default, headless Chrome for the pages that need it, and a diff showing what scripts add.',
    stage: 'Render',
    proof: [
      '/pricing  raw 2.1 kB → rendered 48.6 kB',
      '+ 14 links, + 3 prices added by scripts',
    ],
  },
  {
    title: 'Polite by default',
    icon: 'robots',
    glyph: 'polite',
    body: 'robots.txt (RFC 9309) is read before anything else, requests are throttled, and the crawler says who it is.',
    stage: 'Fetch',
    proof: ['GET /robots.txt  200', 'user-agent: OpenCrawl · 4 req/s'],
  },
  {
    title: 'Every run saved',
    icon: 'crawl',
    glyph: 'runs',
    body: 'Crawls are stored and comparable, so you, or your agent, can ask what changed since last week.',
    stage: 'Store',
    proof: ['r_7a10 → r_8f2c', '+ 12 pages  − 3 pages  ~ 41 changed'],
  },
]
