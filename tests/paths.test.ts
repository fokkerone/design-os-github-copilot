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
  ['preview', paths.preview],
  ['export', paths.export],
  ['personas', paths.personas],
  ['persona', paths.persona('anna')],
  ['flows', paths.flows],
  ['flow', paths.flow('signup')],
  ['designSystem', paths.designSystem],
  ['shell', paths.shell],
  ['components', paths.components],
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

  it('opens previews in the prototype preview, a document of its own', () => {
    expect(paths.screenFullscreen('a b', 'Start')).toBe('/preview.html#/screen/a%20b/Start')
    expect(paths.shellFullscreen).toBe('/preview.html#/shell')
    expect(paths.previewFullscreen).toBe('/preview.html#/clickdummy')
  })

  it.each(['/prototype/sections/a/screen-designs/B/fullscreen', '/prototype/shell/fullscreen', '/prototype/preview/fullscreen'])(
    'keeps the old fullscreen route %s as a redirect to the preview',
    (path) => {
      const matches = matchRoutes(appRoutes, path)
      expect(matches!.at(-1)!.route.loader).toBeTypeOf('function')
    },
  )
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
