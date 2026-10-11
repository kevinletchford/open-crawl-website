import Icon from '@/components/Icon.astro'
import { ICON_NAMES } from '@/lib/icons'

export default {
  title: 'Foundations/Icon',
  component: Icon,
  argTypes: {
    name: { control: 'select', options: ICON_NAMES },
    size: { control: 'inline-radio', options: [16, 20, 24] },
    variant: { control: 'inline-radio', options: ['outline', 'solid'] },
    label: { control: 'text' },
  },
}

export const Default = {
  args: { name: 'crawl', size: 24, variant: 'outline' },
}

export const Solid = {
  args: { name: 'allowed', size: 24, variant: 'solid' },
}
