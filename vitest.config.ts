import { defineConfig } from 'vitest/config'
import path from 'path'
// @ts-expect-error plain ESM script
import tailwindTheme from './scripts/tailwind-theme.mjs'

export default defineConfig({
  plugins: [tailwindTheme()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  esbuild: { jsx: 'automatic' },
  test: {
    include: ['tests/**/*.test.{ts,tsx}'],
    // Component tests opt in to the DOM with `// @vitest-environment jsdom`; model tests stay in node
    setupFiles: ['tests/setup.ts'],
  },
})
