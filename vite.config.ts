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
// @ts-expect-error plain ESM script, tested in tests/prop-override.test.ts
import reactDevtoolsHook from './scripts/react-devtools-hook.mjs'
// @ts-expect-error plain ESM script, tested in tests/component-props.test.ts
import componentProps from './scripts/component-props.mjs'
// @ts-expect-error plain ESM script, tested in tests/live-edit-writer.test.ts
import liveEditWriter from './scripts/live-edit-writer.mjs'
// @ts-expect-error plain ESM script, tested in tests/comments-store.test.ts
import commentsStore from './scripts/comments-store.mjs'
// @ts-expect-error plain ESM script, tested in tests/impeccable-context.test.ts
import { impeccableContext } from './scripts/impeccable-context.mjs'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [
    // Live Edit: the dev server marks product UI elements with their source location
    react(command === 'serve' ? { babel: { plugins: [[babelSourceAttr, { root: __dirname }]] } } : {}),
    tailwindcss(),
    // Tailwind's default theme as data for Live Edit (virtual:tailwind-theme)
    tailwindTheme(),
    // Live Edit: keeps React's DevTools internals, so the preview can override props live
    reactDevtoolsHook(),
    // Live Edit: the props of the product components as data (virtual:component-props)
    componentProps(),
    // Live Edit: writes prop edits from the inspector into the JSX at the call site
    liveEditWriter(),
    // Comments: numbered comments on the preview, stored in wiki/comments/
    commentsStore(),
    // impeccable reads PRODUCT.md and DESIGN.md through .agents/context/ (npm run impeccable:context)
    impeccableContext(),
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
