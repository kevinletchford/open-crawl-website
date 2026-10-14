import LinkGraphBackdrop from '@/components/backdrops/LinkGraphBackdrop.astro'

export default {
  title: 'Backdrops/Link Graph',
  component: LinkGraphBackdrop,
  parameters: { layout: 'fullscreen' },
  argTypes: { seed: { control: 'number' } },
}

export const Default = {
  args: { class: 'inset-0 min-h-[32rem] relative z-0' },
}
