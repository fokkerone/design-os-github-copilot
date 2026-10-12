import { test } from 'node:test'
import assert from 'node:assert/strict'

import { hexToOklchCss, oklchCssToHex, formatNumber, normalizeHex, colorValue } from '../color.mjs'
import { classify, slug } from '../classify.mjs'
import { parseGuides, repairSplitBullets } from '../guides.mjs'
import { pxToRem, naturalCompare, colorUtility } from '../model.mjs'

test('color: known hex -> oklch values (Tailwind v4 format)', () => {
  assert.equal(hexToOklchCss('#ffffff'), 'oklch(100% 0 0)')
  assert.equal(hexToOklchCss('#000000'), 'oklch(0% 0 0)')
  assert.equal(hexToOklchCss('#0ba4a1'), 'oklch(65.03% 0.11008 192.46)')
  assert.equal(hexToOklchCss('#1717171a'), 'oklch(20.46% 0 0 / 0.102)')
  assert.equal(hexToOklchCss('#FFF'), hexToOklchCss('#ffffff'))
})

test('color: oklch output round-trips to the exact 8-bit hex', () => {
  // Every 17th value per channel plus alpha variants: 4096 colors
  for (let r = 0; r < 256; r += 17)
    for (let g = 0; g < 256; g += 17)
      for (let b = 0; b < 256; b += 17) {
        const hex = normalizeHex(`#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`)
        assert.equal(oklchCssToHex(hexToOklchCss(hex)), hex, hex)
      }
  for (const a of ['00', '03', '1a', '80', 'fe']) {
    const hex = `#3c3a40${a}`
    assert.equal(oklchCssToHex(hexToOklchCss(hex)), hex, hex)
  }
})

test('color: formatting is deterministic (no -0, trimmed zeros)', () => {
  assert.equal(formatNumber(-0.00001, 2), '0')
  assert.equal(formatNumber(100, 2), '100')
  assert.equal(formatNumber(10, 2), '10')
  assert.equal(formatNumber(1.5, 4), '1.5')
  assert.deepEqual(colorValue('#FFFFFF80'), { hex: '#ffffff80', oklch: 'oklch(100% 0 0 / 0.502)', alpha: 0.502 })
})

test('classify: every rule maps to one category', () => {
  const c = (path, $value, $type) => classify(path, { $value, $type })
  assert.equal(c(['colors', 'slate', '50'], '#fff', 'color').category, 'color.palette')
  assert.equal(c(['colors', 'fuschia', '50'], '#fff', 'color').group, 'fuchsia')
  assert.deepEqual(
    [c(['theme', 'primary-dark'], '#fff', 'color').name, c(['theme', 'primary-dark'], '#fff', 'color').mode],
    ['primary', 'dark'],
  )
  assert.equal(c(['opacity', 'primary', '10'], '#fff', 'color').category, 'color.alpha')
  assert.equal(c(['opacity', 'opacity-50'], 50, 'number').category, 'opacity')
  assert.equal(c(['shadow', 'sm', 'offset-x'], 0, 'number').category, 'shadow-primitive')
  assert.equal(c(['Light', 'box-shadow', 'Info', 'sm'], {}, 'shadow').name, 'info-sm')
  assert.equal(c(['shadow ring'], {}, 'shadow').name, 'ring')
  assert.equal(c(['spacing', '0,5'], 2, 'number').name, '0.5')
  assert.equal(c(['border radius', 'rounded'], 9999, 'number').name, 'full')
  assert.equal(c(['borders', 'radius', 'rounded-full'], 9999, 'number').name, 'full')
  assert.equal(c(['typography', 'font-weight', 'semi bold'], 600, 'number').name, 'semibold')
  const font = c(['font family', 'font-sans'], 'Inter', 'number')
  assert.deepEqual([font.category, font.name, font.fixType], ['font-family', 'sans', 'fontFamily'])
  assert.equal(c(['block-width'], 1440, 'number').category, 'layout')
  assert.equal(c(['button-size'], 'lg', 'number').category, 'component-config')
  assert.equal(c(['Number'], 0, 'number').category, 'unclassified')
})

test('slug: stable kebab-case', () => {
  assert.equal(slug('Semi Bold'), 'semi-bold')
  assert.equal(slug(' 0,5 '), '0.5')
  assert.equal(slug('font family'), 'font-family')
})

test('guides: comma-split bullets are repaired', () => {
  assert.deepEqual(repairSplitBullets(['States: default', 'hover', 'and loading.', 'Keep focus.']), [
    'States: default, hover, and loading.',
    'Keep focus.',
  ])
})

test('guides: unknown sections are kept verbatim, known ones parsed', () => {
  const g = parseGuides({
    designMd: '---\nname: x\nsource_file: X\n---\n# X Design Guidelines\n\n## Color Tokens\n\n- g: gradient_linear(#000000 0% | #ffffff 100%)\n\n## Custom Thing\n\nKeep me.\n',
    skillMd: null,
  })
  assert.equal(g.title, 'X')
  assert.equal(g.gradients[0].css, 'linear-gradient(oklch(0% 0 0) 0%, oklch(100% 0 0) 100%)')
  assert.deepEqual(g.additional, [{ file: 'DESIGN.md', heading: 'Custom Thing', lines: ['Keep me.'] }])
})

test('model helpers', () => {
  assert.equal(pxToRem(0), '0')
  assert.equal(pxToRem(2), '0.125rem')
  assert.equal(pxToRem(1440), '90rem')
  assert.deepEqual(['10', 'px', '2', '0.5'].sort(naturalCompare), ['0.5', '2', '10', 'px'])
  assert.equal(colorUtility('primary-foreground'), 'text-primary-foreground')
  assert.equal(colorUtility('sidebar-border'), 'border-sidebar-border')
  assert.equal(colorUtility('ring'), 'ring-ring')
  assert.equal(colorUtility('card'), 'bg-card')
})
