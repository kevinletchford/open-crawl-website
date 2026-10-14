/**
 * The home page's "how it works" steps, shared by every treatment in
 * `HowItWorks.astro`. Snippets and counts are illustrative, from the same
 * crawl as the interfaces' sessions.
 */
export const STEPS_HEADING = 'From one URL to a pipeline in three steps.'

export interface Step {
  title: string
  body: string
  /** Terminal lines; a leading `$ ` or `→ ` is drawn muted. */
  snippet: string[]
  /** What the step leaves you with, for the `count` treatment. */
  stat: { value: number; unit: string }
}

export const STEPS: Step[] = [
  {
    title: 'Point it at a site',
    body: 'From the CLI, from code, or by asking your agent. OpenCrawl reads robots.txt and sitemaps, then starts walking.',
    snippet: [
      '$ opencrawl crawl https://example.com',
      '  robots.txt · 1,812 URLs queued',
    ],
    stat: { value: 1812, unit: 'URLs queued' },
  },
  {
    title: 'Hook in your logic',
    body: 'Add the checks, filters and transforms your workflow needs, at the step where they belong.',
    snippet: ['postCapture(page) → extract', '  /pricing · 3 plans extracted'],
    stat: { value: 1742, unit: 'pages kept' },
  },
  {
    title: 'Hand the results on',
    body: 'Stream pages out as they’re captured, or let your agents query the finished crawl over MCP.',
    snippet: [
      '→ query_pages { status: "4xx" }',
      '  23 pages, 19 under /careers/',
    ],
    stat: { value: 23, unit: 'answers sent on' },
  },
]

/** The prompt at the start of a snippet line, drawn muted. */
export const prompt = (line: string) => /^(\$|→) /.exec(line)?.[0] ?? ''
