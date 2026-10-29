/**
 * Runtime side of `.storybook/fixture-globs.ts`: strips the fixture root from the glob keys, so a
 * loader finds `/product/...` as it would in the app, and hides every file while a story runs with
 * `parameters: { fixtures: 'empty' }` (the state of a fresh project).
 */
const ROOT = '/.storybook/fixtures'

export type FixtureMode = 'filled' | 'empty'

const state: { mode: FixtureMode } = { mode: 'filled' }

export function setFixtureMode(mode: FixtureMode) {
  state.mode = mode
}

export function fixtureGlob<T>(files: Record<string, T>): Record<string, T> {
  const target = Object.fromEntries(Object.entries(files).map(([key, value]) => [key.replace(ROOT, ''), value]))
  const empty = () => state.mode === 'empty'
  return new Proxy(target, {
    get: (t, key) => (empty() ? undefined : Reflect.get(t, key)),
    has: (t, key) => !empty() && Reflect.has(t, key),
    ownKeys: (t) => (empty() ? [] : Reflect.ownKeys(t)),
    getOwnPropertyDescriptor: (t, key) => (empty() ? undefined : Reflect.getOwnPropertyDescriptor(t, key)),
  })
}
