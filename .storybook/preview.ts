import type { Preview } from '@storybook-astro/framework'
// The same fonts and tokens as BaseLayout.astro.
import '@fontsource/gothic-a1/latin-400.css'
import '@fontsource/gothic-a1/latin-500.css'
import '@fontsource/gothic-a1/latin-600.css'
import '@fontsource/gothic-a1/latin-700.css'
import '../src/styles/global.css'

const preview: Preview = {
  parameters: {
    layout: 'padded',
    // The site is black throughout; let the page background show.
    backgrounds: { disable: true },
    controls: { expanded: true },
    options: {
      storySort: {
        order: ['Foundations', 'Forms', 'Sections', 'Backdrops', 'Data'],
      },
    },
  },
}

export default preview
