import Problems from '@/components/Problems.astro'

export default {
  title: 'Sections/Problems',
  component: Problems,
  parameters: { layout: 'padded' },
  argTypes: {
    variant: {
      control: 'inline-radio',
      options: ['mazes', 'icons', 'cards', 'split', 'centered'],
    },
    heading: { control: 'text' },
    intro: { control: 'text' },
  },
}

const frame = 'mx-auto max-w-6xl my-12'

export const Mazes = { args: { variant: 'mazes', class: frame } }
export const Icons = { args: { variant: 'icons', class: frame } }
export const Cards = { args: { variant: 'cards', class: frame } }
export const Split = { args: { variant: 'split', class: frame } }
export const Centered = { args: { variant: 'centered', class: frame } }
