import CtaReveal from '@/components/cta/CtaReveal.astro'

export default {
  title: 'Forms/Invite CTA explorations/Reveal',
  component: CtaReveal,
  parameters: { layout: 'fullscreen' },
  argTypes: { heading: { control: 'text' } },
}

export const Default = { args: {} }
