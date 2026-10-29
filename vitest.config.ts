import { defineConfig } from 'vitest/config'
import path from 'path'
// @ts-expect-error plain ESM script
import tailwindTheme from './scripts/tailwind-theme.mjs'
// @ts-expect-error plain ESM script
import componentProps from './scripts/component-props.mjs'
// @ts-expect-error plain ESM script
import prototypeFiles from './scripts/prototype-files.mjs'

export default defineConfig({
  // Tailwind's default theme, not the prototype's: tests do not depend on product/
  plugins: [tailwindTheme({ prototype: false }), componentProps(), prototypeFiles()],
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
