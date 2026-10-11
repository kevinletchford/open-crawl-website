import SiteMaze from '@/components/data/SiteMaze.astro'

export default {
  title: 'Data/Site maze',
  component: SiteMaze,
  argTypes: {
    seed: { control: 'number' },
    rings: { control: { type: 'range', min: 4, max: 10 } },
  },
}

export const Default = {
  args: {},
}

export const LargerSite = {
  args: { seed: 23, rings: 9 },
}
