/**
 * The three product cards (components/FeatureCards.astro). `summary` and
 * `points` are what the expand button reveals; each card's visual is drawn
 * in the component.
 */
export const FEATURE_CARDS_HEADING =
  'One crawler, from the first rule to the last report.'

export const FEATURE_CARDS_INTRO =
  'Model how each site should be crawled, test what comes back, and hand the results to your team and your agents. Every step is open and yours to change.'

export interface FeatureCard {
  id: 'models' | 'testing' | 'reporting'
  title: string
  summary: string
  points: string[]
}

export const FEATURE_CARDS: FeatureCard[] = [
  {
    id: 'models',
    title: 'Advanced bespoke crawling models',
    summary:
      'Shape the crawl to the site, not the other way round. Set scope, depth, rendering and pace per section, save it as a model, and reuse it on every crawl of that site.',
    points: [
      'Per-path rules for depth, rendering and request rate',
      'Respects robots.txt and crawl-delay by default',
      'Models are plain files you can version and review',
    ],
  },
  {
    id: 'testing',
    title: 'Testable data collection',
    summary:
      'Write down what a crawl should return and run it like a test suite. A changed template or a broken selector fails the run before bad data reaches your pipeline.',
    points: [
      'Schema checks on every extracted record',
      'Replay a crawl against saved pages as fixtures',
      'Runs in CI and fails the build on a regression',
    ],
  },
  {
    id: 'reporting',
    title: 'Powerful reporting and agent integration',
    summary:
      'Every crawl ends in a report people can read and an API agents can query. Ask over MCP, or stream results into your warehouse, search index or dashboard.',
    points: [
      'MCP tools to start, watch and query crawls',
      'Coverage, status, render gaps and agent access per page',
      'Export to JSON, Parquet, webhooks or your own sink',
    ],
  },
]
