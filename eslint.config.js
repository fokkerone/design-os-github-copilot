import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import storybook from 'eslint-plugin-storybook'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'storybook-static', '.claude/worktrees']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      // Every checkout (project root and each .claude/worktrees/*) has its own tsconfig; pin the
      // root to this config so typescript-eslint never has to choose between them
      parserOptions: { tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      // shadcn/ui components export their cva variants next to the component
      'react-refresh/only-export-components': ['error', { allowExportNames: ['buttonVariants', 'badgeVariants', 'tabsListVariants'] }],
    },
  },
  ...storybook.configs['flat/recommended'],
  {
    // Stories export story objects, not components
    files: ['**/*.stories.tsx', '.storybook/**/*.{ts,tsx}'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
])
