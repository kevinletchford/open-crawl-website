import CrawlGridBackdrop from '@/components/backdrops/CrawlGridBackdrop.astro'

export default {
  title: 'Backdrops/Crawl Grid',
  component: CrawlGridBackdrop,
  parameters: { layout: 'fullscreen' },
  argTypes: {
    seed: { control: 'number' },
    crawls: { control: 'number' },
    variant: { control: 'inline-radio', options: ['flood', 'trails', 'tiles'] },
  },
}

const frame = 'inset-0 min-h-[32rem] relative z-0'

export const Flood = { args: { variant: 'flood', class: frame } }
export const Trails = { args: { variant: 'trails', crawls: 4, class: frame } }
export const Tiles = { args: { variant: 'tiles', class: frame } }
