import CtaStepper from '@/components/cta/CtaStepper.astro'

export default {
  title: 'Forms/Invite CTA explorations/Stepper',
  component: CtaStepper,
  parameters: { layout: 'fullscreen' },
  argTypes: { heading: { control: 'text' } },
}

export const Default = { args: {} }
