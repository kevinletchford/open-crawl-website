/**
 * Submits invite forms in place, for the CTA variants. Without JavaScript
 * each form is a plain POST to the Worker, as with InviteForm.
 */
const MESSAGES: Record<string, string> = {
  invalid_email: 'Please enter a valid email address.',
  invalid_website: 'That website doesn’t look like a valid URL.',
  invalid_role: 'Please choose a role from the list.',
}
const FALLBACK = 'Something went wrong. Please try again in a moment.'

/** POSTs the form to the Worker. Resolves to null, or an error message. */
export async function postInvite(
  form: HTMLFormElement,
): Promise<string | null> {
  try {
    const response = await fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      headers: { Accept: 'application/json' },
    })
    const result = (await response.json()) as { ok: boolean; error?: string }
    return result.ok ? null : (MESSAGES[result.error ?? ''] ?? FALLBACK)
  } catch {
    return FALLBACK
  }
}

/**
 * Submits the form inside `root` and swaps it for `[data-invite-done]`,
 * or shows what went wrong in `[data-invite-error]`.
 */
export function wireInviteSubmit(root: HTMLElement) {
  const form = root.querySelector('form')!
  const error = root.querySelector<HTMLElement>('[data-invite-error]')!
  const done = root.querySelector<HTMLElement>('[data-invite-done]')!

  form.addEventListener('submit', async (event) => {
    event.preventDefault()
    error.hidden = true
    if (!form.reportValidity()) return

    const button = (event.submitter ??
      form.querySelector('[type=submit]')) as HTMLButtonElement
    const label = button.textContent
    button.disabled = true
    button.textContent = 'Sending…'
    const message = await postInvite(form)
    if (message === null) {
      form.hidden = true
      done.hidden = false
      done.focus()
      return
    }
    error.textContent = message
    error.hidden = false
    button.disabled = false
    button.textContent = label
  })
}
