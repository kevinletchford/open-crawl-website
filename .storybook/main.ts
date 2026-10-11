import type { StorybookConfig } from '@storybook-astro/framework'

/**
 * Storybook for the Astro components, via the community Astro framework
 * (Storybook has no official Astro support). Components are rendered by
 * Astro on the Storybook dev server, so their `<script>`s and scoped styles
 * behave as they do on the site.
 *
 * `patches/@storybook-astro__renderer@1.12.0.patch` fixes a framework bug
 * that served TypeScript component scripts uncompiled; see the patch.
 */
const config: StorybookConfig = {
  stories: ['../src/**/*.stories.ts'],
  framework: {
    name: '@storybook-astro/framework',
    options: {},
  },
}

export default config
