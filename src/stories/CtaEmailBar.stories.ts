import CtaEmailBar from '@/components/cta/CtaEmailBar.astro'

export default {
  title: 'Forms/Invite CTA explorations/Email bar',
  component: CtaEmailBar,
  parameters: { layout: 'fullscreen' },
  argTypes: { heading: { control: 'text' } },
}

export const Default = { args: {} }
