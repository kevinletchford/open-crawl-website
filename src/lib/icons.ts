/**
 * The OpenCrawl icon set: twenty glyphs that name what the crawler does.
 *
 * Drawn on a 24×24 grid inside a 2px margin, from the logo's vocabulary of
 * rings with gaps, short spokes and 45° cuts. Each entry is SVG markup for
 * the inside of an `<svg>`; `Icon.astro` supplies the stroke (currentColor,
 * round caps and joins) and the width.
 *
 * `solid` is the selected/active form. Most fill the icon's dominant shape
 * and cut its details out with a mask, as `Logo.astro` cuts the logo's gaps,
 * so the icon works on any background. `{id}` in the markup is replaced with
 * a per-instance id so masks on one page don't collide.
 */

export const ICON_NAMES = [
  'crawl',
  'agent',
  'robots',
  'llms',
  'allowed',
  'blocked',
  'partial',
  'render',
  'raw-html',
  'diff',
  'sitemap',
  'depth',
  'redirect',
  'latency',
  'throughput',
  'score',
  'structure',
  'quote',
  'hook',
  'mcp',
] as const

export type IconName = (typeof ICON_NAMES)[number]

export interface IconDef {
  /** What the icon stands for, for the catalogue and default labels. */
  meaning: string
  outline: string
  solid: string
}

const dot = (cx: number, cy: number, r = 1.25) =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="currentColor" stroke="none"/>`

/**
 * A filled `shape` with `details` cut out of it. The details are stroked in
 * black inside the mask (a little wider than the icon stroke, so the cut
 * reads at small sizes), which makes them holes in the fill.
 */
const cut = (shape: string, details: string) =>
  `<mask id="{id}" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">` +
  `<rect width="24" height="24" fill="white"/>` +
  `<g stroke="black" stroke-width="2" fill="none">${details}</g>` +
  `</mask>` +
  `<g mask="url(#{id})" fill="currentColor" stroke="none">${shape}</g>`

// Shared shapes.
const page =
  'M14 2.75H7A1.75 1.75 0 0 0 5.25 4.5v15A1.75 1.75 0 0 0 7 21.25h10a1.75 1.75 0 0 0 1.75-1.75V7.5Z'
const pageFold = '<path d="M14 2.75V7.5h4.75"/>'
const frame = '<rect x="3" y="4" width="18" height="16" rx="2.5"/>'
const frameBar = '<path d="M3 8.5h18"/>'
// A ring of radius 9 with a gap at the top right, where the agent passes.
const gateRing = '<path d="M19.79 7.5A9 9 0 1 1 15.8 3.84"/>'
const disk = '<circle cx="12" cy="12" r="10"/>'

export const ICONS: Record<IconName, IconDef> = {
  crawl: {
    meaning: 'A crawl run, and the engine itself',
    outline:
      '<path d="M14.94 2.97A9.5 9.5 0 1 1 9.06 2.97"/>' +
      '<path d="M14.01 14.87A3.5 3.5 0 1 0 9.99 14.87"/>' +
      '<path d="M12 1.5v4A6.5 6.5 0 0 1 12 18.5V12"/>' +
      dot(12, 12),
    solid: cut(
      disk,
      '<path d="M14.01 14.87A3.5 3.5 0 1 0 9.99 14.87"/>' +
        '<path d="M12 1v4.5A6.5 6.5 0 0 1 12 18.5V12"/>',
    ),
  },
  agent: {
    meaning: 'An AI user agent: GPTBot, ClaudeBot and the rest',
    outline:
      '<rect x="5" y="8" width="14" height="12.5" rx="4"/>' +
      '<path d="M10 12.5v2.5M14 12.5v2.5M12 8V5.25"/>' +
      dot(12, 3.75),
    solid:
      cut(
        '<rect x="4.25" y="7.25" width="15.5" height="14" rx="4.5"/>',
        '<path d="M10 12.5v2.5M14 12.5v2.5"/>',
      ) +
      '<path d="M12 8V5.25"/>' +
      dot(12, 3.75),
  },
  robots: {
    meaning: 'robots.txt rules',
    outline:
      `<path d="${page}"/>` +
      pageFold +
      '<path d="M8.5 11.5h7M8.5 14.5H11M13 14.5h2.5M8.5 17.5h5"/>',
    solid: cut(
      `<path d="${page}"/>`,
      pageFold + '<path d="M8.5 11.5h7M8.5 14.5H11M13 14.5h2.5M8.5 17.5h5"/>',
    ),
  },
  llms: {
    meaning: 'llms.txt, the guide written for language models',
    outline:
      `<path d="${page}"/>` +
      pageFold +
      '<path d="M8.5 11.5h7M8.5 14.5h3"/>' +
      '<path d="M15 15.25c.25 1.35 1 2.1 2.25 2.25-1.25.15-2 .9-2.25 2.25-.25-1.35-1-2.1-2.25-2.25 1.25-.15 2-.9 2.25-2.25Z" fill="currentColor"/>',
    solid: cut(
      `<path d="${page}"/>`,
      pageFold +
        '<path d="M8.5 11.5h7M8.5 14.5h3"/>' +
        '<path d="M15 15.25c.25 1.35 1 2.1 2.25 2.25-1.25.15-2 .9-2.25 2.25-.25-1.35-1-2.1-2.25-2.25 1.25-.15 2-.9 2.25-2.25Z"/>',
    ),
  },
  allowed: {
    meaning: 'The agent can read the page',
    outline: gateRing + '<path d="M7.5 12 11 15.5l8.5-11"/>',
    solid: cut(disk, '<path d="M7.5 12 11 15.5l6.5-8.5"/>'),
  },
  blocked: {
    meaning: 'The agent is turned away',
    outline:
      gateRing +
      '<path d="M15.8 3.84 19.79 7.5"/>' +
      '<path d="M7.5 16.5l8-8"/>',
    solid: cut(disk, '<path d="M7.5 16.5l9-9"/>'),
  },
  partial: {
    meaning: 'Some rules allow the agent, others block it',
    outline:
      '<circle cx="12" cy="12" r="9"/>' +
      '<path d="M12 3a9 9 0 0 0 0 18Z" fill="currentColor"/>',
    solid: cut(disk, '<path d="M12 6.5a5.5 5.5 0 0 1 0 11Z"/>'),
  },
  render: {
    meaning: 'Content rendered by JavaScript, as a browser sees it',
    outline:
      frame +
      frameBar +
      '<path d="M10 11.25c-1 0-1.5.5-1.5 1.25v.75c0 .5-.5 1-1 1 .5 0 1 .5 1 1v.75c0 .75.5 1.25 1.5 1.25M14 11.25c1 0 1.5.5 1.5 1.25v.75c0 .5.5 1 1 1-.5 0-1 .5-1 1v.75c0 .75-.5 1.25-1.5 1.25"/>',
    solid: cut(
      '<rect x="2.25" y="3.25" width="19.5" height="17.5" rx="3"/>',
      frameBar +
        '<path d="M10 11.25c-1 0-1.5.5-1.5 1.25v.75c0 .5-.5 1-1 1 .5 0 1 .5 1 1v.75c0 .75.5 1.25 1.5 1.25M14 11.25c1 0 1.5.5 1.5 1.25v.75c0 .5.5 1 1 1-.5 0-1 .5-1 1v.75c0 .75-.5 1.25-1.5 1.25"/>',
    ),
  },
  'raw-html': {
    meaning: 'Raw HTML, as fetched without running scripts',
    outline:
      frame +
      frameBar +
      '<path d="M9.5 12 7 14.25l2.5 2.25M14.5 12l2.5 2.25-2.5 2.25M13 11.25l-2 6"/>',
    solid: cut(
      '<rect x="2.25" y="3.25" width="19.5" height="17.5" rx="3"/>',
      frameBar +
        '<path d="M9.5 12 7 14.25l2.5 2.25M14.5 12l2.5 2.25-2.5 2.25M13 11.25l-2 6"/>',
    ),
  },
  diff: {
    meaning: 'Render diff: what disappears without JavaScript',
    outline:
      '<path d="M7 7V4.5A1.5 1.5 0 0 1 8.5 3h9A1.5 1.5 0 0 1 19 4.5v11a1.5 1.5 0 0 1-1.5 1.5H16" stroke-dasharray="2 2"/>' +
      '<rect x="4" y="7" width="12" height="14" rx="1.5"/>' +
      '<path d="M7 11h6"/>' +
      '<rect x="7" y="14" width="6" height="4" rx=".5" stroke-dasharray="1.5 1.5"/>',
    solid:
      '<path d="M7 7V4.5A1.5 1.5 0 0 1 8.5 3h9A1.5 1.5 0 0 1 19 4.5v11a1.5 1.5 0 0 1-1.5 1.5H16" stroke-dasharray="2 2"/>' +
      cut(
        '<rect x="3.25" y="6.25" width="13.5" height="15.5" rx="2"/>',
        '<path d="M7 11h6"/>' +
          '<rect x="7" y="14" width="6" height="4" rx=".5" stroke-dasharray="1.5 1.5"/>',
      ),
  },
  sitemap: {
    meaning: 'Site structure and sitemap.xml',
    outline:
      '<rect x="9.5" y="3" width="5" height="5" rx="1"/>' +
      '<rect x="2.5" y="16" width="5" height="5" rx="1"/>' +
      '<rect x="9.5" y="16" width="5" height="5" rx="1"/>' +
      '<rect x="16.5" y="16" width="5" height="5" rx="1"/>' +
      '<path d="M12 8v8M5 16v-3.5h14V16"/>',
    solid:
      '<g fill="currentColor">' +
      '<rect x="9.5" y="3" width="5" height="5" rx="1"/>' +
      '<rect x="2.5" y="16" width="5" height="5" rx="1"/>' +
      '<rect x="9.5" y="16" width="5" height="5" rx="1"/>' +
      '<rect x="16.5" y="16" width="5" height="5" rx="1"/>' +
      '</g>' +
      '<path d="M12 8v8M5 16v-3.5h14V16"/>',
  },
  depth: {
    meaning: 'Crawl depth: distance from the start page',
    outline:
      '<path d="M6.21 18.89A9 9 0 1 1 17.79 18.89"/>' +
      '<path d="M8.14 16.6A6 6 0 1 1 15.86 16.6"/>' +
      '<path d="M10.07 14.3A3 3 0 1 1 13.93 14.3"/>' +
      dot(12, 12),
    solid:
      '<path d="M6.21 18.89A9 9 0 1 1 17.79 18.89"/>' +
      '<path d="M8.14 16.6A6 6 0 1 1 15.86 16.6"/>' +
      dot(12, 12, 3.5),
  },
  redirect: {
    meaning: 'A 3xx redirect hop',
    outline:
      '<path d="M5 16.25V12a7 7 0 0 1 14 0v5.5"/>' +
      '<path d="M16.25 14.75 19 17.5l2.75-2.75"/>' +
      dot(5, 18.75),
    solid:
      '<path d="M5 16.25V12a7 7 0 0 1 14 0v3.5"/>' +
      '<path d="M15.75 15h6.5L19 18.75Z" fill="currentColor"/>' +
      dot(5, 18.75, 1.75),
  },
  latency: {
    meaning: 'Response time',
    outline:
      '<path d="M14.2 4.79A8.5 8.5 0 1 1 9.8 4.79"/>' +
      '<path d="M10 2.25h4M12 2.25v4M12 13l4.33-2.5"/>',
    solid:
      '<path d="M10 2.25h4M12 2.25v2"/>' +
      cut(
        '<circle cx="12" cy="13" r="9.25"/>',
        '<path d="M12 13l4.33-2.5M12 5v2"/>',
      ),
  },
  throughput: {
    meaning: 'Requests per second',
    outline:
      '<path d="M3.5 7l5 5-5 5" stroke-dasharray="1 2.25"/>' +
      '<path d="M9.5 7l5 5-5 5" stroke-dasharray="3 1.5"/>' +
      '<path d="M15.5 7l5 5-5 5"/>',
    solid:
      '<path d="M3.5 7l5 5-5 5M9.5 7l5 5-5 5"/>' +
      '<path d="M14.5 6.5 20 12l-5.5 5.5Z" fill="currentColor"/>',
  },
  score: {
    meaning: 'The AI readability score',
    outline:
      '<path d="M4.64 17.25A8.5 8.5 0 1 1 19.36 17.25"/>' +
      '<path d="M12 13l4.09-3.68M9.5 20.5h5"/>' +
      dot(12, 13, 1.5),
    solid:
      '<path d="M9.5 20.5h5"/>' +
      cut(
        '<path d="M4.64 17.25A8.5 8.5 0 1 1 19.36 17.25Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>',
        '<path d="M12 13l4.09-3.68"/>',
      ),
  },
  structure: {
    meaning: 'Headings and semantic structure',
    outline:
      '<rect x="3.5" y="4.5" width="3" height="3" rx=".5" fill="currentColor"/>' +
      '<path d="M9.5 6h11M3.5 12h13M3.5 18h8.5"/>',
    solid:
      '<rect x="3" y="4" width="4" height="4" rx=".75" fill="currentColor" stroke="none"/>' +
      '<path d="M10 6h10.5M4 12h12.5M4 18h8" stroke-width="3"/>',
  },
  quote: {
    meaning: 'Quotability: how easily a page can be cited',
    outline:
      '<path d="M7.5 3.5H4.25v17H7.5M16.5 3.5h3.25v17H16.5"/>' +
      '<path d="M11 11.25c0 2-1 3.25-2.5 3.75M15.5 11.25c0 2-1 3.25-2.5 3.75"/>' +
      dot(9.5, 11.25, 1.5) +
      dot(14, 11.25, 1.5),
    solid: cut(
      '<rect x="3" y="2.75" width="18" height="18.5" rx="2"/>',
      '<path d="M11 11.25c0 2-1 3.25-2.5 3.75M15.5 11.25c0 2-1 3.25-2.5 3.75"/>' +
        '<circle cx="9.5" cy="11.25" r=".75"/><circle cx="14" cy="11.25" r=".75"/>',
    ),
  },
  hook: {
    meaning: 'Plugins and lifecycle hooks',
    outline:
      '<path d="M14.25 10.9A4.5 4.5 0 1 0 9.75 10.9"/>' +
      '<path d="M12 8.5v8a3.5 3.5 0 0 1-7 0V15"/>',
    solid:
      cut('<circle cx="12" cy="7" r="5.25"/>', '<path d="M12 8.5V13"/>') +
      '<path d="M12 12v4.5a3.5 3.5 0 0 1-7 0V15"/>',
  },
  mcp: {
    meaning: 'The MCP server: your agents querying a crawl',
    outline:
      '<circle cx="6.25" cy="12" r="3.75"/>' +
      '<circle cx="17.75" cy="12" r="3.75"/>' +
      '<path d="M10 12h1.25M12.75 12H14"/>',
    solid:
      '<g fill="currentColor"><circle cx="6.25" cy="12" r="3.75"/>' +
      '<circle cx="17.75" cy="12" r="3.75"/></g>' +
      '<path d="M10 12h1.25M12.75 12H14"/>',
  },
}
