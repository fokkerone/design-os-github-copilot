/**
 * Renders every screen design in a real Chrome (viewport × mode) and reads what it shows: the DOM
 * with its React components as data, plus a screenshot for the comparison. Dev server only: the
 * owner chain and the source markers exist only in dev builds.
 */
import fs from 'node:fs'
import path from 'node:path'

export const VARIANTS = [
  { viewport: 'desktop', width: 1440, height: 900, mode: 'light' },
  { viewport: 'desktop', width: 1440, height: 900, mode: 'dark' },
  { viewport: 'mobile', width: 390, height: 844, mode: 'light' },
  { viewport: 'mobile', width: 390, height: 844, mode: 'dark' },
]

const listTsx = (dir) => (fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.tsx')) : [])

/** Sections and their screen designs: src/sections/<id>/<Screen>.tsx */
export function listSections(root) {
  const dir = path.join(root, 'src/sections')
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => ({ id: d.name, screens: listTsx(path.join(dir, d.name)).map((f) => f.replace(/\.tsx$/, '')) }))
    .filter((s) => s.screens.length > 0)
}

/** Component names per layer: src/ui is "ui", the components folders of sections and the shell are "composite" */
export function knownComponents(root) {
  const known = {}
  const scan = (dir, tier) => {
    for (const file of listTsx(dir)) {
      const code = fs.readFileSync(path.join(dir, file), 'utf8')
      for (const m of code.matchAll(/export\s+(?:default\s+)?(?:function|const)\s+([A-Z]\w*)/g)) known[m[1]] = tier
    }
  }
  scan(path.join(root, 'src/ui'), 'ui')
  scan(path.join(root, 'src/shell/components'), 'composite')
  for (const s of listSections(root)) scan(path.join(root, 'src/sections', s.id, 'components'), 'composite')
  return known
}

export async function openBrowser() {
  const { chromium } = await import('@playwright/test')
  return chromium.launch({ channel: 'chrome' })
}

/** One screen in one variant: { tree, unsupported, size, screenshot } */
export async function captureScreen(browser, baseUrl, sectionId, screen, variant, known, root) {
  const context = await browser.newContext({ viewport: { width: variant.width, height: variant.height }, colorScheme: variant.mode, reducedMotion: 'reduce' })
  await context.addInitScript((mode) => localStorage.setItem('theme', mode), variant.mode)
  const page = await context.newPage()
  try {
    await page.goto(`${baseUrl}/preview.html#/screen/${encodeURIComponent(sectionId)}/${encodeURIComponent(screen)}`, { waitUntil: 'networkidle' })
    await page.addStyleTag({ content: '*,*::before,*::after{transition:none!important;animation:none!important;caret-color:transparent!important}' })
    await page.waitForFunction(() => document.getElementById('root')?.childElementCount > 0 && document.fonts.status === 'loaded')
    await page.evaluate(() => document.fonts.ready)
    await page.evaluate(() => document.activeElement?.blur?.())
    const height = await page.evaluate(() => document.documentElement.scrollHeight)
    if (height > variant.height) await page.setViewportSize({ width: variant.width, height })
    const walker = fs.readFileSync(path.join(root, 'scripts/penpot/page-walker.js'), 'utf8').replace(/^export\s+/m, '')
    const data = await page.evaluate(`(${'() => {' + walker + '; return walkPage(' + JSON.stringify(known) + ')}'})()`)
    const screenshot = await page.screenshot({ fullPage: true })
    return { ...data, screenshot }
  } finally {
    await context.close()
  }
}

