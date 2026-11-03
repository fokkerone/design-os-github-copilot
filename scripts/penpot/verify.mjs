/**
 * Compares a built board with the browser: size and position of the top-level shapes, and the
 * rendered picture. Text is measured apart, because Penpot and Chrome smooth glyphs differently.
 */
import pixelmatch from 'pixelmatch'
import { PNG } from 'pngjs'

const textRects = (node, out = []) => {
  for (const k of node.kids ?? []) {
    if (k.kind === 'text') out.push(k.rect)
    else textRects(k, out)
  }
  return out
}

export function comparePixels(webPng, penpotPng, tree) {
  const web = PNG.sync.read(webPng)
  const design = PNG.sync.read(penpotPng)
  if (web.width !== design.width || web.height !== design.height) {
    return { sizeMatches: false, web: `${web.width}x${web.height}`, penpot: `${design.width}x${design.height}` }
  }
  const { width, height } = web
  const diff = new PNG({ width, height })
  const changed = pixelmatch(web.data, design.data, diff.data, width, height, { threshold: 0.1, includeAA: false, diffMask: true })
  const inText = new Uint8Array(width * height)
  for (const r of textRects(tree)) {
    // A little room around the line for descenders and overhang
    const x0 = Math.max(0, Math.floor(r.x) - 2)
    const y0 = Math.max(0, Math.floor(r.y) - 2)
    const x1 = Math.min(width, Math.ceil(r.x + r.w) + 2)
    const y1 = Math.min(height, Math.ceil(r.y + r.h) + 2)
    for (let y = y0; y < y1; y++) inText.fill(1, y * width + x0, y * width + x1)
  }
  let outside = 0
  let text = 0
  let textArea = 0
  for (let i = 0; i < width * height; i++) {
    if (inText[i]) textArea++
    if (diff.data[i * 4 + 3] === 0) continue
    if (inText[i]) text++
    else outside++
  }
  return {
    sizeMatches: true,
    changed,
    outsideText: outside,
    insideText: text,
    textShare: textArea ? Math.round((text / textArea) * 1000) / 10 : 0,
    share: Math.round((changed / (width * height)) * 10000) / 100,
    diffPng: PNG.sync.write(diff),
  }
}
