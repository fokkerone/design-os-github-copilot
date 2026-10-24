import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
// @ts-expect-error plain ESM script without types
import { analyzeUiLayer } from '../scripts/ui-layer.mjs'

let root: string
const write = (file: string, code: string) => {
  fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true })
  fs.writeFileSync(path.join(root, file), code)
}
const project = (files: Record<string, string>) => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'ui-layer-'))
  for (const [file, code] of Object.entries(files)) write(file, code)
  return analyzeUiLayer(root)
}
afterEach(() => fs.rmSync(root, { recursive: true, force: true }))

const button = `export function Button() { return <button /> }\nexport const buttonVariants = 1`
const card = `export function Card() { return <div /> }\nfunction CardHeader() { return <div /> }\nexport { CardHeader }`

describe('analyzeUiLayer', () => {
  it('lists every component of src/ui/ with the design files that import it', () => {
    const { components, problems } = project({
      'src/ui/button.tsx': button,
      'src/ui/card.tsx': card,
      'src/ui/utils.ts': 'export function cn() {}',
      'src/sections/account/components/Login.tsx': `import { Button } from '../../../ui/button'\nimport { Card } from '@/ui/card'\nimport type { CardHeader } from '@/ui/card'`,
      'src/shell/components/AppShell.tsx': `import { Button } from '../../ui/button'`,
    })
    expect(problems).toEqual([])
    expect(components).toEqual({
      'src/ui/button.tsx': { Button: ['src/sections/account/components/Login.tsx', 'src/shell/components/AppShell.tsx'] },
      'src/ui/card.tsx': { Card: ['src/sections/account/components/Login.tsx'], CardHeader: [] },
    })
  })

  it('reports designs that bypass the layer: primitive libraries, Design OS UI, inline variants', () => {
    const { problems } = project({
      'src/ui/dialog.tsx': `import { Dialog as D } from 'radix-ui'\nexport function Dialog() { return null }`,
      'src/sections/a/components/A.tsx': [
        `import * as Dialog from '@radix-ui/react-dialog'`,
        `import { Button } from '@/components/ui/button'`,
        `import { cva } from 'class-variance-authority'`,
        `import { Check } from 'lucide-react'`,
        `import { useState } from 'react'`,
      ].join('\n'),
    })
    expect(problems.map((p: { file: string; line: number; message: string }) => `${p.line} ${p.message.split(' ').slice(0, 2).join(' ')}`)).toEqual([
      '1 imports @radix-ui/react-dialog',
      '2 imports @/components/ui/button,',
      '3 defines variants',
    ])
    expect(problems.every((p: { file: string }) => p.file === 'src/sections/a/components/A.tsx')).toBe(true)
  })
})
