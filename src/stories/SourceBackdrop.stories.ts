import SourceBackdrop from '@/components/backdrops/SourceBackdrop.astro'

export default {
  title: 'Backdrops/Source',
  component: SourceBackdrop,
  parameters: { layout: 'fullscreen' },
  argTypes: { seed: { control: 'number' } },
}

export const Default = {
  args: { class: 'inset-0 min-h-[32rem] relative z-0' },
}
