/**
 * The site's only server code. Static pages are served straight from the
 * edge by Workers static assets; `run_worker_first` in wrangler.jsonc routes
 * just `/api/*` here, and anything else that reaches this Worker falls
 * through to the assets.
 *
 * POST /api/invite stores an invite request in D1. The form works without
 * JavaScript (a normal POST, answered with a 303 redirect), and the page's
 * script can ask for JSON instead with `Accept: application/json`.
 */

// `Env` (the ASSETS and DB bindings) is generated from wrangler.jsonc by
// `wrangler types` into worker/worker-configuration.d.ts.

const ROLES = new Set([
  'marketing',
  'seo',
  'engineering',
  'product',
  'founder',
  'agency',
  'other',
])

/** Field name → max length. Anything longer is rejected, not truncated. */
const LIMITS = {
  email: 254,
  name: 120,
  company: 120,
  website: 2048,
  role: 32,
} as const

type Field = keyof typeof LIMITS
type Invite = Record<Field, string>

// Deliberately loose: one @, something either side, a dot in the domain.
// The real check is whether we can reach the address when we send invites.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url)
    if (url.pathname === '/api/invite') {
      if (request.method !== 'POST') {
        return new Response('Method not allowed', {
          status: 405,
          headers: { Allow: 'POST' },
        })
      }
      return handleInvite(request, env)
    }
    return env.ASSETS.fetch(request)
  },
} satisfies ExportedHandler<Env>

async function handleInvite(request: Request, env: Env): Promise<Response> {
  const wantsJson = (request.headers.get('Accept') ?? '').includes(
    'application/json',
  )

  let fields: Record<string, unknown>
  try {
    fields = await readBody(request)
  } catch {
    return reply(wantsJson, request, { ok: false, error: 'invalid_body' }, 400)
  }

  // Honeypot: a field hidden from people. Bots that fill it get a success
  // response and nothing is stored.
  if (typeof fields.company_url === 'string' && fields.company_url !== '') {
    return reply(wantsJson, request, { ok: true }, 200)
  }

  const result = validate(fields)
  if ('error' in result) {
    return reply(wantsJson, request, { ok: false, error: result.error }, 400)
  }
  const invite = result.invite

  const cf = (request as { cf?: { country?: string } }).cf
  await env.DB.prepare(
    `INSERT INTO invites (email, name, company, website, role, user_agent, country)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
     ON CONFLICT(email) DO NOTHING`,
  )
    .bind(
      invite.email,
      invite.name || null,
      invite.company || null,
      invite.website || null,
      invite.role || null,
      (request.headers.get('User-Agent') ?? '').slice(0, 512) || null,
      cf?.country ?? null,
    )
    .run()

  // A repeat request looks identical to a new one, so the form can't be used
  // to find out who has already signed up.
  return reply(wantsJson, request, { ok: true }, 200)
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  const type = request.headers.get('Content-Type') ?? ''
  if (type.includes('application/json')) {
    const body = await request.json()
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw new Error('Expected a JSON object')
    }
    return body as Record<string, unknown>
  }
  return Object.fromEntries(await request.formData())
}

function validate(
  fields: Record<string, unknown>,
): { invite: Invite } | { error: string } {
  const invite = {} as Invite
  for (const field of Object.keys(LIMITS) as Field[]) {
    const raw = fields[field] ?? ''
    if (typeof raw !== 'string') return { error: `invalid_${field}` }
    const value = raw.trim()
    if (value.length > LIMITS[field]) return { error: `invalid_${field}` }
    invite[field] = value
  }

  invite.email = invite.email.toLowerCase()
  if (!EMAIL.test(invite.email)) return { error: 'invalid_email' }

  if (invite.role && !ROLES.has(invite.role)) return { error: 'invalid_role' }

  if (invite.website) {
    const withScheme = /^https?:\/\//i.test(invite.website)
      ? invite.website
      : `https://${invite.website}`
    try {
      const url = new URL(withScheme)
      if (!url.hostname.includes('.')) return { error: 'invalid_website' }
      invite.website = url.toString()
    } catch {
      return { error: 'invalid_website' }
    }
  }

  return { invite }
}

/** JSON for scripted submissions; a 303 to a page for plain form posts. */
function reply(
  wantsJson: boolean,
  request: Request,
  body: { ok: boolean; error?: string },
  status: number,
): Response {
  if (wantsJson) return Response.json(body, { status })
  const target = new URL(
    body.ok ? '/invite/thanks' : `/invite?error=${body.error}`,
    request.url,
  )
  return Response.redirect(target.toString(), 303)
}
