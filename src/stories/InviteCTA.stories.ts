import InviteCTA from '@/components/InviteCTA.astro'

export default {
  title: 'Forms/Invite CTA',
  component: InviteCTA,
  parameters: { layout: 'fullscreen' },
  argTypes: { heading: { control: 'text' } },
}

export const Default = {
  args: {},
}

export const CustomHeading = {
  args: { heading: 'Want this engine on your site?' },
}
