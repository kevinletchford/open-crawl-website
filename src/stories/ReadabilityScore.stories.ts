import ReadabilityScore from '@/components/data/ReadabilityScore.astro'
import { READABILITY } from '@/data/demo'

export default {
  title: 'Data/Readability score',
  component: ReadabilityScore,
}

export const Default = {
  args: { ...READABILITY },
}

export const Struggling = {
  args: {
    ...READABILITY,
    path: '/docs/api',
    score: 38,
    previous: 44,
    parts: [
      { label: 'Access', value: 20, weight: 0.3 },
      { label: 'Rendering', value: 35, weight: 0.3 },
      { label: 'Structure', value: 62, weight: 0.2 },
      { label: 'Quotability', value: 48, weight: 0.2 },
    ],
    fixes: [
      { title: 'Allow GPTBot in robots.txt for /docs/', part: 0, gain: 18 },
      { title: 'Server-render the endpoint reference', part: 1, gain: 12 },
    ],
  },
}
