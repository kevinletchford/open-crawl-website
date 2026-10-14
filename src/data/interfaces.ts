/**
 * The ways in and out of a crawl, for `Interfaces.astro`: what starts it and
 * feeds it, and where its results go. Snippets are illustrative, like the
 * session on the product page.
 */
import type { IconName } from '@/lib/icons'

export interface Interface {
  name: string
  /** In: starts or feeds the crawl. Out: where results go. */
  side: 'in' | 'out'
  icon: IconName
  /** One line on what it's for. */
  note: string
  /** A few characters to show under the name: what it sends or serves. */
  tag: string
  /** Terminal lines; a leading `$ ` or `→ ` is drawn muted. */
  snippet: string[]
}

export const INTERFACES: Interface[] = [
  {
    name: 'Claude',
    side: 'in',
    icon: 'mcp',
    tag: 'run_crawl()',
    note: 'Claude, or any MCP client, starts the crawl itself.',
    snippet: [
      '→ run_crawl { url: "https://example.com/docs/", max_pages: 2000 }',
      '  crawl c_81f2 started · 0 / 2000',
    ],
  },
  {
    name: 'Terminal',
    side: 'in',
    icon: 'crawl',
    tag: '$ opencrawl crawl',
    note: 'One command, from your shell.',
    snippet: [
      '$ opencrawl crawl https://example.com --max-pages 2000',
      '  1,742 pages · 23 errors · 41.2s',
    ],
  },
  {
    name: 'Deploys',
    side: 'in',
    icon: 'hook',
    tag: 'on: deploy',
    note: 'Crawl every preview build before it ships.',
    snippet: [
      '$ opencrawl crawl $PREVIEW_URL --fail-on 4xx',
      '  1,742 pages · 0 new errors · pass',
    ],
  },
  {
    name: 'Schedule',
    side: 'in',
    icon: 'latency',
    tag: '0 6 * * *',
    note: 'Nightly runs, so you see what changed since the last one.',
    snippet: [
      '$ opencrawl schedule https://example.com --cron "0 6 * * *"',
      '  next run 06:00 · compared with c_81f2',
    ],
  },
  {
    name: 'Sitemaps',
    side: 'in',
    icon: 'sitemap',
    tag: '1,812 URLs',
    note: 'Seeds the crawl with every page you listed.',
    snippet: ['GET /sitemap.xml', '  3 sitemaps · 1,812 URLs queued'],
  },
  {
    name: 'Reports',
    side: 'out',
    icon: 'score',
    tag: 'c_81f2',
    note: 'What was fetched, rendered and broken, at a glance.',
    snippet: [
      '$ opencrawl report c_81f2',
      '  fetched 97.4% · rendered 7.9% · errors 1.3%',
    ],
  },
  {
    name: 'Agents',
    side: 'out',
    icon: 'agent',
    tag: 'query_pages()',
    note: 'Your agents ask the crawl questions and get pages back.',
    snippet: [
      '→ query_pages { crawl: "c_81f2", status: "4xx" }',
      '  23 pages, 19 under /careers/',
    ],
  },
  {
    name: 'API',
    side: 'out',
    icon: 'raw-html',
    tag: 'GET /v1/pages',
    note: 'Every page as JSON, for your own tools.',
    snippet: [
      '$ curl api.example.com/v1/crawls/c_81f2/pages?status=404',
      '{"url":"/careers/2019","status":404,"ms":31}',
    ],
  },
  {
    name: 'Exports',
    side: 'out',
    icon: 'structure',
    tag: '.jsonl  .csv  .db',
    note: 'JSON Lines, CSV or SQLite, to keep and compare.',
    snippet: [
      'sqlite> SELECT status, count(*) FROM pages GROUP BY status;',
      '  200|1702',
      '  404|23',
    ],
  },
]

export const INPUTS = INTERFACES.filter((item) => item.side === 'in')
export const OUTPUTS = INTERFACES.filter((item) => item.side === 'out')
