import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'astro/config'

import { SITE_URL } from './src/consts'

export default defineConfig({
  site: SITE_URL,
  integrations: [
    mdx(),
    // The thank-you page is only reached by submitting the invite form, and
    // /system is an internal catalogue of the design system.
    sitemap({
      filter: (page) =>
        !page.includes('/invite/thanks') && !page.includes('/system'),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
    server: {
      // A bind-mounted source tree on macOS doesn't deliver inotify events into
      // the Linux container, so HMR silently stops working. Polling is the only
      // reliable watcher there — but it's wasteful, so keep it Docker-only.
      watch: process.env.DOCKER ? { usePolling: true } : undefined,
    },
  },
})
