import AgentAccessMatrix from '@/components/data/AgentAccessMatrix.astro'
import { ACCESS, AGENTS } from '@/data/demo'

export default {
  title: 'Data/Agent access matrix',
  component: AgentAccessMatrix,
}

export const Default = {
  args: { agents: AGENTS, rows: ACCESS },
}

export const MixedRowsOnly = {
  args: {
    agents: AGENTS,
    rows: ACCESS.filter(
      (row) => new Set(row.cells.map((c) => c.state)).size > 1,
    ),
  },
}
