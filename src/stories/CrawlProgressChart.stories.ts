import CrawlProgressChart from '@/components/data/CrawlProgressChart.astro'
import { PROGRESS } from '@/data/demo'

export default {
  title: 'Data/Crawl progress chart',
  component: CrawlProgressChart,
}

export const Default = {
  args: { ...PROGRESS },
}
