import EngineFeatures from '@/components/EngineFeatures.astro'

export default {
  title: 'Sections/Engine Features',
  component: EngineFeatures,
  parameters: { layout: 'padded' },
  argTypes: {
    variant: {
      control: 'inline-radio',
      options: ['cards', 'list', 'pipeline', 'ports', 'bento', 'ledger'],
    },
    heading: { control: 'text' },
  },
}

const frame = 'mx-auto max-w-6xl my-12'

export const Cards = { args: { variant: 'cards', class: frame } }
export const List = { args: { variant: 'list', class: frame } }
export const Pipeline = { args: { variant: 'pipeline', class: frame } }
export const Ports = { args: { variant: 'ports', class: frame } }
export const Bento = { args: { variant: 'bento', class: frame } }
export const Ledger = { args: { variant: 'ledger', class: frame } }
