import { readFileSync } from 'node:fs'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
// @ts-expect-error plain ESM script
import tailwindTheme from '../scripts/tailwind-theme.mjs'
import { fixtureGlobs } from './fixture-globs'

/**
 * `virtual:component-props` reads the props of the product's components (src/ui, src/sections,
 * src/shell). Storybook serves sample props from the fixtures instead, so no product code is read.
 */
function fixtureComponentProps(): Plugin {
  const id = 'virtual:component-props'
  const file = path.resolve(__dirname, 'fixtures/component-props.json')
  return {
    name: 'designos:fixture-component-props',
    resolveId: (source) => (source === id ? `\0${id}` : null),
    load(loaded) {
      if (loaded !== `\0${id}`) return null
      const { props, usage } = JSON.parse(readFileSync(file, 'utf8'))
      return `export default ${JSON.stringify(props)}\nexport const usage = ${JSON.stringify(usage)}`
    },
  }
}

/**
 * Vite config of Storybook. Storybook shows the Design OS UI only, so it leaves out what the app
 * needs for the product: no OpenCode server, no Live Edit source markers, prop writer, React
 * DevTools hook or comment store, and the loaders read sample fixtures instead of product/
 * (see fixture-globs.ts). Tailwind's default theme stays: Live Edit reads it as data.
 */
export default defineConfig({
  plugins: [fixtureGlobs(), react(), tailwindcss(), tailwindTheme(), fixtureComponentProps()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../src'),
    },
  },
})
