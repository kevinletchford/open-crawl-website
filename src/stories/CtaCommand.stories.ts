import CtaCommand from '@/components/cta/CtaCommand.astro'

export default {
  title: 'Forms/Invite CTA explorations/Command',
  component: CtaCommand,
  parameters: { layout: 'fullscreen' },
  argTypes: {
    heading: { control: 'text' },
    variant: {
      control: 'inline-radio',
      options: ['flags', 'oneline', 'prompts', 'curl', 'window', 'typed'],
    },
  },
}

export const Flags = { args: { variant: 'flags' } }
export const OneLine = { args: { variant: 'oneline' } }
export const Prompts = { args: { variant: 'prompts' } }
export const Curl = { args: { variant: 'curl' } }
export const Window = { args: { variant: 'window' } }
export const Typed = { args: { variant: 'typed' } }
