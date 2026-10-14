/**
 * Single source of truth for site-wide constants.
 *
 * SITE_URL is imported by `astro.config.ts` to populate `site:`, which in turn
 * drives canonical URLs, Open Graph tags and the generated sitemap. Change it
 * here and nowhere else — the one exception is `public/robots.txt`, which is a
 * static file and cannot read from this module.
 */

export const SITE_URL = 'https://open-crawl.com'

export const SITE_TITLE = 'OpenCrawl'

export const SITE_DESCRIPTION =
  'OpenCrawl is a fast, open web crawler built to be driven by AI agents over MCP, and to slot into whatever crawl pipeline you already run.'

/** Twitter/X handle used for `twitter:site` card attribution. */
export const SITE_TWITTER = '@opencrawl'

export const GITHUB_URL = 'https://github.com/kevinletchford/open-crawl'

/** Primary navigation, shared by the header and footer. */
export const NAV = [
  { href: '/product', label: 'Product' },
  { href: '/benchmarks', label: 'Benchmarks' },
]
