/** The product page's plugin hooks, shared by every treatment. */
export const HOOKS_HEADING = 'Hook into every step of the crawl.'

export const HOOKS_INTRO =
  'Four lifecycle hooks let you add your own checks, change how pages are fetched and rendered, or drop what you don’t need before it’s stored.'

export interface Hook {
  hook: string
  body: string
  /** How often it runs: once per crawl, or once for every page. */
  runs: 'crawl' | 'page'
  /** What it did on one illustrative crawl, for the trace. */
  trace: { target: string; did: string }
}

export const HOOKS: Hook[] = [
  {
    hook: 'preAudit',
    body: 'Read and adjust the crawl configuration.',
    runs: 'crawl',
    trace: { target: 'acme.dev', did: 'scope set to /docs/**, /pricing/*' },
  },
  {
    hook: 'preCapture',
    body: 'Run just before a node is fetched. Skip it, or change the request.',
    runs: 'page',
    trace: { target: '/careers/42', did: 'skipped: out of scope' },
  },
  {
    hook: 'render',
    body: 'Decide how each node is rendered: raw HTML or headless Chrome.',
    runs: 'page',
    trace: { target: '/pricing', did: 'rendered in headless Chrome' },
  },
  {
    hook: 'postCapture',
    body: 'Enrich, filter, score or export what was captured.',
    runs: 'page',
    trace: { target: '/pricing', did: '3 plans extracted, sent to warehouse' },
  },
]
