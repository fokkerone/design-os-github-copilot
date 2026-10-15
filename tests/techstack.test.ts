import { describe, expect, it } from 'vitest'
import { fileURLToPath } from 'node:url'
import { execFileSync, spawnSync } from 'node:child_process'
import { checkTechstack, defaultTechstack, parseTechstack, usesShadcn } from '../src/lib/model/techstack.ts'
import { formatTechstack, loadTechstack, techstackReport } from '../scripts/techstack.mjs'

const root = fileURLToPath(new URL('./fixtures/project', import.meta.url))
const invalidRoot = fileURLToPath(new URL('./fixtures/techstack-invalid', import.meta.url))
const emptyRoot = fileURLToPath(new URL('./fixtures', import.meta.url))
const script = fileURLToPath(new URL('../scripts/techstack.mjs', import.meta.url))

describe('tech stack defaults', () => {
  it('applies shadcn/ui on React, Tailwind and lucide when the step was not run', () => {
    const stack = loadTechstack(emptyRoot)
    expect(stack.origin).toBe('default')
    const choices = Object.fromEntries(stack.resolved.map((decision) => [decision.area, decision.choice]))
    expect(choices['ui-library']).toBe('shadcn/ui')
    expect(choices['icons']).toBe('lucide-react')
    expect(choices['styling']).toBe('Tailwind CSS v4')
    expect(usesShadcn(stack)).toBe(true)
  })

  it('marks areas without a default as undecided, so no dependency is added for them', () => {
    const report = techstackReport(defaultTechstack())
    expect(report.undecided).toEqual(expect.arrayContaining(['forms', 'charts', 'state', 'target-framework']))
    expect(report.undecided).not.toContain('ui-library')
    expect(formatTechstack(report)).toContain('The tech stack step has not been run, so the defaults apply.')
  })
})

describe('tech stack file', () => {
  const stack = loadTechstack(root)

  it('reads decisions, registries, packages, constraints and open questions', () => {
    expect(stack.origin).toBe('file')
    expect(stack.status).toBe('confirmed')
    expect(stack.summary).toContain('shadcn/ui')
    expect(stack.registries.map((registry) => registry.name)).toEqual(['@acme', 'acme/portal'])
    expect(stack.registries[0]).toMatchObject({ kind: 'shadcn-registry', usedFor: 'Internal form components' })
    expect(stack.packages.map((entry) => [entry.name, entry.installed])).toEqual([
      ['react-hook-form', false],
      ['zod', false],
      ['recharts', true],
    ])
    expect(stack.constraints).toHaveLength(2)
    expect(stack.openQuestions).toEqual(['Does the target codebase use the `new-york` style?'])
  })

  it('lets the file override the defaults and keeps the others', () => {
    const byArea = Object.fromEntries(stack.resolved.map((decision) => [decision.area, decision]))
    expect(byArea['ui-base']).toMatchObject({ choice: 'Base UI', source: 'chosen', decided: true })
    expect(byArea['ui-style']).toMatchObject({ choice: 'new-york', source: 'default' })
    expect(byArea['forms'].choice).toBe('react-hook-form + zod')
    expect(byArea['state']).toMatchObject({ choice: 'none', decided: false })
    expect(byArea['target-framework'].choice).toBe('Next.js 15 (App Router)')
  })

  it('is valid', () => {
    expect(checkTechstack(stack).filter((problem) => problem.severity === 'error')).toEqual([])
  })

  it('parses area labels and underscores as area ids', () => {
    const parsed = parseTechstack('## Decisions\n\n| Area | Choice | Source | Rationale |\n|---|---|---|---|\n| UI library | Mantine | chosen | x |\n| data_fetching | TanStack Query | chosen | x |\n')
    expect(parsed.decisions.map((decision) => decision.area)).toEqual(['ui-library', 'data-fetching'])
  })
})

describe('tech stack check', () => {
  const problems = checkTechstack(loadTechstack(invalidRoot))
  const errors = problems.filter((problem) => problem.severity === 'error').map((problem) => problem.message)

  it('rejects changes to the prototype runtime', () => {
    expect(errors.some((message) => message.includes('runtime of the Design OS prototype'))).toBe(true)
  })

  it('asks for packages when the UI library is not shadcn/ui', () => {
    expect(errors.some((message) => message.includes('"Mantine" needs a row in "Packages"'))).toBe(true)
  })

  it('rejects unknown areas and areas decided twice', () => {
    expect(errors.some((message) => message.includes('Unknown area "bogus-area"'))).toBe(true)
    expect(errors.some((message) => message.includes('"icons" is decided twice'))).toBe(true)
  })
})

describe('techstack command', () => {
  it('prints the defaults and exits 0 without a file', () => {
    const out = execFileSync('node', [script, '--root', emptyRoot], { encoding: 'utf8' })
    expect(out).toContain('ui-library: shadcn/ui  [default]')
  })

  it('prints JSON', () => {
    const report = JSON.parse(execFileSync('node', [script, '--root', root, '--json'], { encoding: 'utf8' }))
    expect(report.source).toBe('product/techstack/techstack.md')
    expect(report.usesShadcn).toBe(true)
    expect(report.packages).toHaveLength(3)
  })

  it('fails --check on an invalid file', () => {
    const result = spawnSync('node', [script, '--root', invalidRoot, '--check'], { encoding: 'utf8' })
    expect(result.status).toBe(1)
    expect(result.stdout).toContain('[error]')
  })

  it('passes --check on a valid file', () => {
    const out = execFileSync('node', [script, '--root', root, '--check'], { encoding: 'utf8' })
    expect(out).toContain('is valid')
  })
})
