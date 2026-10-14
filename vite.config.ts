import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
// @ts-expect-error plain ESM script, tested in tests/opencode-dev.test.ts
import { opencodeServePlugin } from './scripts/opencode-dev.mjs'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), ...(process.env.DESIGNOS_NO_OPENCODE ? [] : [opencodeServePlugin()])],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      // opencode serve (127.0.0.1:4096), same origin for the browser, SSE passes through
      '/opencode': {
        target: 'http://127.0.0.1:4096',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/opencode/, ''),
      },
    },
  },
})
