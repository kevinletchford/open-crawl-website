import Interfaces from '@/components/Interfaces.astro'

export default {
  title: 'Sections/Interfaces',
  component: Interfaces,
  parameters: { layout: 'padded' },
  argTypes: {
    variant: {
      control: 'inline-radio',
      options: ['switchboard', 'console', 'ticker', 'maze', 'decoder'],
    },
  },
}

const frame = 'mx-auto max-w-4xl my-12'
const wide = 'mx-auto max-w-6xl my-12'

export const Switchboard = { args: { variant: 'switchboard', class: wide } }
export const Console = { args: { variant: 'console', class: frame } }
export const Ticker = { args: { variant: 'ticker', class: 'my-12' } }
export const Maze = { args: { variant: 'maze', class: frame } }
export const Decoder = { args: { variant: 'decoder', class: frame } }
