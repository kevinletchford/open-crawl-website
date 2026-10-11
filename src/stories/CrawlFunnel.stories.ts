import CrawlFunnel from '@/components/data/CrawlFunnel.astro'
import { FUNNEL } from '@/data/demo'

export default {
  title: 'Data/Crawl funnel',
  component: CrawlFunnel,
}

export const Default = {
  args: { ...FUNNEL },
}

export const LinkedToFixes = {
  args: { ...FUNNEL, fixesHref: '#fixes' },
}
