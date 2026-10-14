import CtaSentence from '@/components/cta/CtaSentence.astro'

export default {
  title: 'Forms/Invite CTA explorations/Sentence',
  component: CtaSentence,
  parameters: { layout: 'fullscreen' },
  argTypes: {
    heading: { control: 'text' },
    variant: {
      control: 'inline-radio',
      options: ['underline', 'chips', 'centered', 'short', 'unfold', 'command'],
    },
  },
}

export const Underline = { args: { variant: 'underline' } }
export const Chips = { args: { variant: 'chips' } }
export const Centered = { args: { variant: 'centered' } }
export const Short = { args: { variant: 'short' } }
export const Unfold = { args: { variant: 'unfold' } }
export const Command = { args: { variant: 'command' } }
