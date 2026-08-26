/**
 * Single source of truth for site-wide constants.
 *
 * SITE_URL is imported by `astro.config.ts` to populate `site:`, which in turn
 * drives canonical URLs, Open Graph tags and the generated sitemap. Change it
 * here and nowhere else — the one exception is `public/robots.txt`, which is a
 * static file and cannot read from this module.
 */

export const SITE_URL = 'https://open-crawl.com'

export const SITE_TITLE = 'Open-Crawl'

export const SITE_DESCRIPTION = 'Open-Crawl — open source web crawling.'

/** Twitter/X handle used for `twitter:site` card attribution. */
export const SITE_TWITTER = '@opencrawl'
