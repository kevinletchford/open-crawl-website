import LatencyHistogram from '@/components/data/LatencyHistogram.astro'
import { LATENCY } from '@/data/demo'

export default {
  title: 'Data/Latency histogram',
  component: LatencyHistogram,
}

export const AllAgents = {
  args: { series: LATENCY },
}

export const OneAgent = {
  args: { series: { PerplexityBot: LATENCY.PerplexityBot } },
}
