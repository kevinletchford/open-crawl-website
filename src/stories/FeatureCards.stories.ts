import FeatureCards from '@/components/FeatureCards.astro'

export default {
  title: 'Sections/Feature Cards',
  component: FeatureCards,
  parameters: { layout: 'padded' },
  argTypes: {
    heading: { control: 'text' },
    intro: { control: 'text' },
    visual: { control: 'inline-radio', options: ['graphic', 'maze', 'none'] },
    open: {
      control: 'inline-radio',
      options: [undefined, 'models', 'testing', 'reporting'],
    },
  },
}

const frame = 'mx-auto max-w-6xl my-12'

export const Default = { args: { class: frame } }
export const Mazes = { args: { visual: 'maze', class: frame } }
export const PanelsOnly = { args: { visual: 'none', class: frame } }
export const NoHeading = { args: { heading: '', class: frame } }
export const ModelsOpen = { args: { open: 'models', class: frame } }
export const TestingOpen = { args: { open: 'testing', class: frame } }
export const ReportingOpen = { args: { open: 'reporting', class: frame } }
