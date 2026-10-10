# open-crawl-website

Marketing website for **Open-Crawl** — [open-crawl.com](https://open-crawl.com)

Astro (static) · Tailwind CSS v4 · ESLint + Prettier · Lefthook · Cloudflare Workers + D1

## Requirements

Node 24 (see `.node-version`) and pnpm 10. Or just use Docker — see below.

## Local development

```bash
pnpm install     # also installs the git hooks via the `prepare` script
pnpm dev         # http://localhost:4321
```

### With Docker

```bash
docker compose up --build     # http://localhost:4321
```

Source is bind-mounted and edits hot-reload. `node_modules` lives in an
anonymous volume so the container keeps its own Linux binaries rather than
inheriting the host's macOS ones.

## Scripts

| Command                 | Does                                         |
| ----------------------- | -------------------------------------------- |
| `pnpm dev`              | Dev server on :4321                          |
| `pnpm build`            | Static build to `./dist`                     |
| `pnpm preview`          | Serve the built output                       |
| `pnpm lint`             | ESLint, including a11y rules on Astro markup |
| `pnpm lint:fix`         | ESLint with autofix                          |
| `pnpm format`           | Prettier write                               |
| `pnpm format:check`     | Prettier check (what CI runs)                |
| `pnpm check`            | `astro check`, then type-checks the Worker   |
| `pnpm deploy`           | Build and deploy to Cloudflare Workers       |
| `pnpm dev:worker`       | Build, then run site + Worker on :8787       |
| `pnpm db:migrate:local` | Apply D1 migrations to the local database    |

## Quality gates

`lefthook.yml` runs ESLint and Prettier over staged files on **pre-commit**
(autofixes are re-staged), and `astro check` on **pre-push**. The authoritative
gate is `.github/workflows/ci.yml`, which runs lint, format check, type check
and build on every pull request.

## Content

Blog posts are markdown/MDX under `src/content/blog/`, validated by the schema
in `src/content.config.ts`. `draft: true` keeps a post off the site.

Site-wide constants live in `src/consts.ts`. `SITE_URL` there feeds `site:` in
`astro.config.ts`, which drives canonical URLs, Open Graph tags and the
sitemap — change it in one place. The one exception is `public/robots.txt`,
which is static and hardcodes the domain.

## Deployment

Pushes to `main` that pass CI deploy automatically via
`.github/workflows/deploy.yml`. Manual deploy: `pnpm deploy`.

Two repository secrets are required:

- `CLOUDFLARE_API_TOKEN` — needs _Workers Scripts: Edit_, _D1: Edit_ and
  _Account Settings: Read_
- `CLOUDFLARE_ACCOUNT_ID`

The Worker serves `./dist` as static assets (`wrangler.jsonc`). The only
server code is `worker/index.ts`, which handles `/api/*` (see below); every
other request is served from the edge without invoking it. The first deploy lands on a `workers.dev` subdomain — binding
`open-crawl.com` to the Worker is a one-off Custom Domain setup in the
Cloudflare dashboard.

## Invite requests (Worker + D1)

OpenCrawl is invite-only. The "Request an invite" form posts to
`/api/invite`, handled by `worker/index.ts`, which validates the request and
stores it in the `invites` table of the `open-crawl-invites` D1 database.
Repeat requests for the same email are ignored. The schema lives in
`migrations/`, and CI applies new migrations before each deploy.

The form works without JavaScript: a plain POST gets a `303` to
`/invite/thanks` (or back to `/invite?error=…`). Send `Accept:
application/json` to get `{ "ok": true }` / `{ "ok": false, "error": "…" }`
instead.

**Database:** `open-crawl-invites` already exists in Cloudflare, and its id
is in `wrangler.jsonc`. Deploys apply new migrations before shipping the
Worker. The CI token (`CLOUDFLARE_API_TOKEN`) needs **D1: Edit** for that
step.

**Local testing:** `astro dev` doesn't run the Worker, so use:

```bash
pnpm db:migrate:local
pnpm dev:worker                 # http://localhost:8787
curl -X POST -d email=you@example.com localhost:8787/api/invite
```

**Reading requests:**

```bash
pnpm exec wrangler d1 execute open-crawl-invites --remote \
  --command "SELECT email, name, company, website, role, created_at FROM invites ORDER BY created_at DESC"
```

Drop `--remote` to read the local database instead.
