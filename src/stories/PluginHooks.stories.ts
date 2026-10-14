import PluginHooks from '@/components/PluginHooks.astro'

export default {
  title: 'Sections/Plugin Hooks',
  component: PluginHooks,
  parameters: { layout: 'padded' },
  argTypes: {
    variant: {
      control: 'inline-radio',
      options: ['list', 'rail', 'loop', 'code', 'trace', 'states'],
    },
    heading: { control: 'text' },
    intro: { control: 'text' },
  },
}

const frame = 'mx-auto max-w-6xl my-12'

export const List = {
  args: { variant: 'list', class: 'mx-auto max-w-xl my-12' },
}
export const Rail = { args: { variant: 'rail', class: frame } }
export const Loop = { args: { variant: 'loop', class: frame } }
export const Code = { args: { variant: 'code', class: frame } }
export const Trace = { args: { variant: 'trace', class: frame } }
export const States = { args: { variant: 'states', class: frame } }
