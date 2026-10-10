import js from '@eslint/js'
import eslintPluginAstro from 'eslint-plugin-astro'
import prettier from 'eslint-config-prettier'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: [
      'dist/',
      '.astro/',
      'node_modules/',
      '.wrangler/',
      'worker/worker-configuration.d.ts',
    ],
  },

  js.configs.recommended,
  tseslint.configs.recommended,

  // Parses .astro frontmatter + template, and lints the markup for a11y.
  eslintPluginAstro.configs['flat/recommended'],
  eslintPluginAstro.configs['flat/jsx-a11y-recommended'],

  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },

  // Must stay last: switches off every rule Prettier already owns, so the two
  // tools can't disagree about formatting.
  prettier,
)
