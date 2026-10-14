import CrawlModeChart from '@/components/data/CrawlModeChart.astro'
import { CRAWL_MODES } from '@/data/benchmarks'

export default {
  title: 'Data/Crawl mode chart',
  component: CrawlModeChart,
}

export const Default = {
  args: {
    html: CRAWL_MODES.html,
    rendered: CRAWL_MODES.rendered,
    samples: CRAWL_MODES.samples,
    caption: 'Local synthetic site · 14 October 2026',
  },
}
