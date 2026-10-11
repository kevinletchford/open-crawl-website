import RenderDiff from '@/components/data/RenderDiff.astro'
import { RENDER } from '@/data/demo'

export default {
  title: 'Data/Render diff',
  component: RenderDiff,
}

export const Default = {
  args: { ...RENDER },
}

export const AsClaudeBot = {
  args: { ...RENDER, agent: 'ClaudeBot' },
}
