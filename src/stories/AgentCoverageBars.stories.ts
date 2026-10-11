import AgentCoverageBars from '@/components/data/AgentCoverageBars.astro'
import { COVERAGE } from '@/data/demo'

export default {
  title: 'Data/Agent coverage bars',
  component: AgentCoverageBars,
}

export const Default = {
  args: { rows: COVERAGE },
}
