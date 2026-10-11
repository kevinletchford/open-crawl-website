import RequestLog from '@/components/data/RequestLog.astro'
import { LOG } from '@/data/demo'

export default {
  title: 'Data/Request log',
  component: RequestLog,
  argTypes: { rows: { control: { type: 'range', min: 3, max: 15 } } },
}

export const Default = {
  args: { entries: LOG },
}

export const Compact = {
  args: { entries: LOG, rows: 5 },
}
