import RequestTicker from '@/components/RequestTicker.astro'
import { LOG } from '@/data/demo'

export default {
  title: 'Data/Request log variations',
  component: RequestTicker,
  parameters: { layout: 'padded' },
  argTypes: {
    variant: {
      control: 'inline-radio',
      options: ['stream', 'inflight', 'workers', 'totals', 'tape'],
    },
  },
}

const frame = 'mx-auto max-w-4xl my-12'

export const Stream = {
  args: { entries: LOG, variant: 'stream', class: frame },
}
export const InFlight = {
  name: 'In flight',
  args: { entries: LOG, variant: 'inflight', class: frame },
}
export const Workers = {
  args: { entries: LOG, variant: 'workers', class: frame },
}
export const Totals = {
  args: { entries: LOG, variant: 'totals', class: frame },
}
export const Tape = { args: { entries: LOG, variant: 'tape', class: frame } }
