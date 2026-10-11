import MetricStrip from '@/components/data/MetricStrip.astro'
import { METRICS } from '@/data/demo'

export default {
  title: 'Data/Metric strip',
  component: MetricStrip,
}

export const Default = {
  args: { metrics: METRICS },
}

export const TwoMetrics = {
  args: { metrics: METRICS.slice(0, 2) },
}
