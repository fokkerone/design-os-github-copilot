import { defineConfig } from '@playwright/test'

// Smoke tests in the installed Chrome (no browser download). The dev server runs without the real
// opencode; the tests start a fake one on 4196 (e2e/fixtures.ts), so a real opencode on 4096 is left alone, so no agent or API key is needed.
export default defineConfig({
  testDir: 'e2e',
  workers: 1,
  timeout: 30_000,
  expect: { timeout: 7_000 },
  reporter: 'list',
  use: { baseURL: 'http://localhost:3100', channel: 'chrome', viewport: { width: 1440, height: 900 } },
  webServer: {
    command: 'npx vite --port 3100 --strictPort',
    url: 'http://localhost:3100',
    reuseExistingServer: false,
    env: { DESIGNOS_NO_OPENCODE: '1', DESIGNOS_OPENCODE_PORT: '4196' },
  },
})
