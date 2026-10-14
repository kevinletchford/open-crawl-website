import WaterfallBackdrop from '@/components/backdrops/WaterfallBackdrop.astro'

export default {
  title: 'Backdrops/Waterfall',
  component: WaterfallBackdrop,
  parameters: { layout: 'fullscreen' },
  argTypes: { seed: { control: 'number' } },
}

export const Default = {
  args: { class: 'inset-0 min-h-[32rem] relative z-0' },
}
