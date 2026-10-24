import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
// @ts-expect-error plain ESM script, tested in tests/opencode-dev.test.ts
import { opencodeServePlugin } from './scripts/opencode-dev.mjs'
// @ts-expect-error plain ESM script, tested in tests/babel-source-attr.test.ts
import babelSourceAttr from './scripts/babel-source-attr.mjs'
// @ts-expect-error plain ESM script
import tailwindTheme from './scripts/tailwind-theme.mjs'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [
    // Live Edit: the dev server marks product UI elements with their source location
    react(command === 'serve' ? { babel: { plugins: [[babelSourceAttr, { root: __dirname }]] } } : {}),
    tailwindcss(),
    // Tailwind's default theme as data for Live Edit (virtual:tailwind-theme)
    tailwindTheme(),
    // Starts OpenCode for this checkout and proxies /opencode to it (env switches: see the script)
    opencodeServePlugin(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
  },
}))
