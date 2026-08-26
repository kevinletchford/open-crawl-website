---
title: 'Hello, Open-Crawl'
description: 'A first post, and a working example of the blog content collection.'
pubDate: 2026-08-26
---

This post exists to prove the content collection works end to end: the schema in
`src/content.config.ts` validates the frontmatter above, `/blog` lists it, and
`/blog/hello-open-crawl/` renders it through `src/pages/blog/[...slug].astro`.

Add new posts as `.md` or `.mdx` files under `src/content/blog/`. Setting
`draft: true` in the frontmatter keeps a post out of both the listing and the
generated routes, so unfinished writing can live on `main` safely.
