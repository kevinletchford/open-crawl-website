import RequestBoard from '@/components/RequestBoard.astro'
import { LOG } from '@/data/demo'

export default {
  title: 'Data/Request board',
  component: RequestBoard,
  parameters: { layout: 'padded' },
  argTypes: {
    variant: {
      control: 'inline-radio',
      options: ['departures', 'words', 'headline', 'workers', 'counters'],
    },
  },
}

const frame = 'mx-auto max-w-4xl my-12'

export const Departures = {
  args: { entries: LOG, variant: 'departures', class: frame },
}
export const Words = { args: { entries: LOG, variant: 'words', class: frame } }
export const Headline = {
  args: { entries: LOG, variant: 'headline', class: frame },
}
export const Workers = {
  args: { entries: LOG, variant: 'workers', class: frame },
}
export const Counters = {
  args: { entries: LOG, variant: 'counters', class: frame },
}
