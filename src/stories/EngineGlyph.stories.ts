import EngineGlyph from '@/components/EngineGlyph.astro'

export default {
  title: 'Foundations/Engine Glyphs',
  component: EngineGlyph,
  argTypes: {
    name: {
      control: 'inline-radio',
      options: ['mcp', 'hooks', 'pipe', 'render', 'polite', 'runs'],
    },
    size: { control: { type: 'range', min: 24, max: 192, step: 24 } },
  },
}

const big = { size: 144, class: 'text-ink' }

export const MCP = { args: { name: 'mcp', ...big } }
export const Hooks = { args: { name: 'hooks', ...big } }
export const Pipe = { args: { name: 'pipe', ...big } }
export const Render = { args: { name: 'render', ...big } }
export const Polite = { args: { name: 'polite', ...big } }
export const Runs = { args: { name: 'runs', ...big } }
