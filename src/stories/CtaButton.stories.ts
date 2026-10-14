import CtaButton from '@/components/cta/CtaButton.astro'

export default {
  title: 'Forms/Invite CTA explorations/Button only',
  component: CtaButton,
  parameters: { layout: 'fullscreen' },
  argTypes: { heading: { control: 'text' } },
}

export const Default = { args: {} }
