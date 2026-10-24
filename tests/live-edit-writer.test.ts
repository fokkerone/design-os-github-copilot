import { afterEach, describe, expect, it } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
// @ts-expect-error plain ESM script
import { setJsxProps, writeProps } from '../scripts/live-edit-writer.mjs'

const form = `export function Form() {
  return (
    <form>
      <Button type="submit" size="lg" className="w-full">
        Sign in
      </Button>
      <Card.Header
        title="A"
        compact
      />
    </form>
  )
}
`

describe('live edit writer', () => {
  it('changes, adds and removes props of the element at line:column, nothing else', () => {
    const out = setJsxProps(form, 4, 7, { size: 'sm', variant: 'outline', type: null, loading: true, limit: 3, open: false }, 'Button')
    expect(out).toContain('      <Button size="sm" className="w-full" variant="outline" loading limit={3} open={false}>\n        Sign in')
    expect(out.split('\n').length).toBe(form.split('\n').length)
  })

  it('keeps multi-line attributes and quotes strings that need it', () => {
    const out = setJsxProps(form, 7, 7, { compact: null, title: 'say "hi"' }, 'Card.Header')
    expect(out).toContain('      <Card.Header\n        title={"say \\"hi\\""}\n      />')
  })

  it('refuses when the element moved or is another one', () => {
    expect(() => setJsxProps(form, 5, 7, { size: 'sm' })).toThrow('No JSX element at 5:7')
    expect(() => setJsxProps(form, 4, 7, { size: 'sm' }, 'Badge')).toThrow('Expected <Badge>')
    expect(() => setJsxProps(form, 4, 7, { 'on{x}': 'a' })).toThrow('Not a prop name')
  })

  describe('files', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dos-writer-'))
    afterEach(() => fs.rmSync(path.join(root, 'src'), { recursive: true, force: true }))
    const include = ['src/sections']

    it('writes product files only', () => {
      fs.mkdirSync(path.join(root, 'src/sections/a'), { recursive: true })
      fs.writeFileSync(path.join(root, 'src/sections/a/Form.tsx'), form)
      expect(writeProps(root, include, { call: 'src/sections/a/Form.tsx:4:7', name: 'Button', props: { size: 'sm' } })).toBe('src/sections/a/Form.tsx')
      expect(fs.readFileSync(path.join(root, 'src/sections/a/Form.tsx'), 'utf8')).toContain('<Button type="submit" size="sm"')
      expect(() => writeProps(root, include, { call: 'src/sections/../../etc/x.tsx:1:1', props: {} })).toThrow('Not a product file')
      expect(() => writeProps(root, include, { call: 'src/components/X.tsx:1:1', props: {} })).toThrow('Not a product file')
      expect(() => writeProps(root, include, { call: 'src/sections/a/Form.tsx:4:7', props: { size: { a: 1 } } })).toThrow('Only string')
    })
  })
})
