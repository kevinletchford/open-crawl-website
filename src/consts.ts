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
  'OpenCrawl crawls your site the way AI crawlers and answer engines do, and shows you what they can and can’t see.'

/** Twitter/X handle used for `twitter:site` card attribution. */
export const SITE_TWITTER = '@opencrawl'

export const GITHUB_URL = 'https://github.com/kevinletchford/open-crawl'

/** Primary navigation, shared by the header and footer. */
export const NAV = [{ href: '/blog', label: 'Blog' }]
