import type { IconName } from '@/lib/icons'

/** The home page's "why another crawler" section, shared by every treatment. */
export const PROBLEMS_HEADING =
  'Fetching pages is solved. Wiring a crawler into an agent isn’t.'

export const PROBLEMS_INTRO =
  'Agents now do the research, the monitoring and the data gathering. The crawlers they depend on were designed for a person watching a dashboard.'

export const PROBLEMS: { title: string; icon: IconName; body: string }[] = [
  {
    title: 'Made for people, not agents',
    icon: 'agent',
    body: 'Most crawlers expect someone to press Start and read a report at the end. An agent needs tools it can call mid-task, and results it can reason over.',
  },
  {
    title: 'Results you have to dig back out',
    icon: 'structure',
    body: 'Output locked in a proprietary format or a hosted UI has to be exported, parsed and cleaned before the rest of your pipeline can touch it.',
  },
  {
    title: 'Fast or polite, pick one',
    icon: 'robots',
    body: 'Quick crawlers hammer servers and ignore robots.txt. Careful ones crawl so slowly they never finish a real site.',
  },
]
