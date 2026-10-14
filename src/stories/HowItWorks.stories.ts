import HowItWorks from '@/components/HowItWorks.astro'

export default {
  title: 'Sections/How It Works',
  component: HowItWorks,
  parameters: { layout: 'padded' },
  argTypes: {
    variant: {
      control: 'inline-radio',
      options: ['rail', 'stepper', 'session', 'count', 'maze', 'journey'],
    },
    heading: { control: 'text' },
  },
}

const frame = 'mx-auto max-w-6xl my-12'

export const Rail = { args: { variant: 'rail', class: frame } }
export const Stepper = { args: { variant: 'stepper', class: frame } }
export const Session = { args: { variant: 'session', class: frame } }
export const Count = { args: { variant: 'count', class: frame } }
export const Maze = { args: { variant: 'maze', class: frame } }
export const Journey = { args: { variant: 'journey', class: frame } }
