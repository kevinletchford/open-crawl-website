/** Role choices on the invite forms. Values must match ROLES in worker/index.ts. */
export const ROLES = [
  { value: 'marketing', label: 'Marketing' },
  { value: 'seo', label: 'SEO' },
  { value: 'engineering', label: 'Engineering' },
  { value: 'product', label: 'Product' },
  { value: 'founder', label: 'Founder / leadership' },
  { value: 'agency', label: 'Agency' },
  { value: 'other', label: 'Something else' },
] as const

/**
 * The fill-in-the-blank fields for the sentence and command CTAs, as props
 * for SentenceBlank. `id` prefixes each input's id.
 */
export function inviteBlanks(
  id: string,
  look: 'underline' | 'chip' | 'mono' = 'underline',
) {
  const blank = (name: string) => ({ id: `${id}-${name}`, name, look })
  return {
    email: {
      ...blank('email'),
      label: 'Work email',
      type: 'email',
      required: true,
      maxlength: 254,
      autocomplete: 'email',
      placeholder: 'you@company.com',
    },
    name: {
      ...blank('name'),
      label: 'Name',
      autocomplete: 'name',
      placeholder: 'your name',
    },
    company: {
      ...blank('company'),
      label: 'Company',
      autocomplete: 'organization',
      placeholder: 'company',
    },
    website: {
      ...blank('website'),
      label: 'Website',
      maxlength: 2048,
      autocomplete: 'url',
      inputmode: 'url',
      placeholder: 'example.com',
    },
  } as const
}
