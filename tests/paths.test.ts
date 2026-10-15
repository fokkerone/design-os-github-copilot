import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { matchRoutes } from 'react-router-dom'
import { paths } from '@/lib/paths'
import { legacyRedirect } from '@/lib/navigation'
import { appRoutes } from '@/lib/routes'

const samples: [string, string][] = [
  ['vision', paths.vision],
  ['roadmap', paths.roadmap],
  ['dataShape', paths.dataShape],
  ['sections', paths.sections],
  ['section', paths.section('citizen-chat')],
  ['screen', paths.screen('citizen-chat', 'Start')],
  ['screenFullscreen', paths.screenFullscreen('citizen-chat', 'Start')],
  ['preview', paths.preview],
  ['previewFullscreen', paths.previewFullscreen],
  ['export', paths.export],
  ['personas', paths.personas],
  ['persona', paths.persona('anna')],
  ['flows', paths.flows],
  ['flow', paths.flow('signup')],
  ['designSystem', paths.designSystem],
  ['shell', paths.shell],
  ['shellFullscreen', paths.shellFullscreen],
  ['techstack', paths.techstack],
  ['wiki', paths.wiki],
]

describe('paths', () => {
  it.each(samples)('%s is a current route, not a legacy one', (_name, path) => {
    expect(legacyRedirect(path), path).toBeNull()
  })

  it.each(samples)('%s is served by a real route, not the catch-all', (_name, path) => {
    const matches = matchRoutes(appRoutes, path)
    expect(matches, path).not.toBeNull()
    expect(matches!.at(-1)!.route.path, path).not.toBe('*')
  })

  it('encodes dynamic segments', () => {
    expect(paths.screen('a b', 'C/D')).toBe('/prototype/sections/a%20b/screen-designs/C%2FD')
  })

  it('serves the clickdummy preview fullscreen, as AGENTS.md describes', () => {
    expect(paths.previewFullscreen).toBe('/prototype/preview/fullscreen')
  })
})

describe('no legacy paths in the app source', () => {
  const root = join(__dirname, '..', 'src')
  const skip = new Set(['lib/navigation.ts', 'lib/paths.ts', 'lib/routes.tsx'])
  const files: string[] = []
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name)
      if (statSync(p).isDirectory()) walk(p)
      else if (/\.(ts|tsx)$/.test(name)) files.push(p)
    }
  }
  walk(root)

  // A route literal such as '/sections', `/sections/${id}`, "/design" or href="/clickdummy/preview"
  const legacy = /(['"`])\/(sections|data-shape|design|clickdummy|export|shell\/design)(?=[/'"`?#$])/

  it('uses the helpers from lib/paths instead', () => {
    const offenders = files
      .filter((f) => !skip.has(relative(root, f).split('\\').join('/')))
      .filter((f) => legacy.test(readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')))
      .map((f) => relative(root, f))
    expect(offenders).toEqual([])
  })
})
