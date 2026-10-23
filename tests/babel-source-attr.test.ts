import { describe, expect, it } from 'vitest'
import path from 'node:path'
import { transformSync } from '@babel/core'
// @ts-expect-error plain ESM script
import babelSourceAttr from '../scripts/babel-source-attr.mjs'

const root = '/repo'
const transform = (code: string, file: string) =>
  transformSync(code, {
    filename: path.join(root, file),
    babelrc: false,
    configFile: false,
    parserOpts: { plugins: ['jsx', 'typescript'] },
    plugins: [[babelSourceAttr, { root }]],
  })?.code ?? ''

const hero = `export function Hero({ title }) {
  return (
    <section className="py-24">
      <h1 className="text-6xl">{title}</h1>
      <Button>Go</Button>
    </section>
  )
}`

describe('babel-source-attr', () => {
  it('marks host elements in screen designs with file, line and column', () => {
    const out = transform(hero, 'src/sections/landing/components/Hero.tsx')
    expect(out).toContain('data-dos-src="src/sections/landing/components/Hero.tsx:3:5"')
    expect(out).toContain('data-dos-src="src/sections/landing/components/Hero.tsx:4:7"')
    expect(out).toContain('data-dos-comp="Hero"')
  })

  it('leaves component elements alone', () => {
    const out = transform(hero, 'src/sections/landing/components/Hero.tsx')
    expect(out).toMatch(/<Button>Go<\/Button>/)
  })

  it('covers the shell and the product UI layer, not the Design OS app', () => {
    expect(transform(hero, 'src/shell/components/AppShell.tsx')).toContain('data-dos-src')
    expect(transform(hero, 'src/ui/button.tsx')).toContain('data-dos-src')
    expect(transform(hero, 'src/components/ScreenDesignPage.tsx')).not.toContain('data-dos-src')
    expect(transform(hero, 'tests/x.tsx')).not.toContain('data-dos-src')
  })

  it('finds the component of arrow functions and forwardRef', () => {
    const arrow = transform('const Card = () => <div />', 'src/ui/card.tsx')
    expect(arrow).toContain('data-dos-comp="Card"')
    const ref = transform('const Input = forwardRef((p, r) => <input ref={r} />)', 'src/ui/input.tsx')
    expect(ref).toContain('data-dos-comp="Input"')
  })

  it('is idempotent', () => {
    const once = transform(hero, 'src/sections/landing/components/Hero.tsx')
    const twice = transform(once, 'src/sections/landing/components/Hero.tsx')
    expect(twice.match(/data-dos-src/g)).toHaveLength(2)
  })
})
