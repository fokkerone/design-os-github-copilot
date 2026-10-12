import { describe, expect, it } from 'vitest'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import { flowReport, formatReport, loadProject, projectReport, sectionReport } from '../scripts/context.mjs'

const root = fileURLToPath(new URL('./fixtures/project', import.meta.url))
const script = fileURLToPath(new URL('../scripts/context.mjs', import.meta.url))
const project = loadProject(root)

describe('context report for the planning commands', () => {
  it('loads flows, personas, specs, roadmap and screens from disk', () => {
    expect(project.sources.flows).toHaveLength(1)
    expect(project.sources.personas).toHaveLength(1)
    expect(Object.keys(project.sources.specs).sort()).toEqual(['account', 'meter-readings'])
    expect(project.sources.roadmap.map((section: { id: string }) => section.id)).toEqual(['meter-readings', 'account'])
    expect(project.sources.screens).toHaveLength(4)
  })

  it('limits a section report to that section and names the spec as binding', () => {
    const report = sectionReport(project, 'meter-readings')
    expect(report.spec?.source).toBe('product/sections/meter-readings/spec.md')
    expect(report.personas.map((persona: { id: string }) => persona.id)).toEqual(['cautious-first-timer'])
    expect(report.flows[0].stepsInSection).toEqual(['S1', 'S3', 'S4', 'S5'])
    expect(report.screens.map((screen: { name: string }) => screen.name)).toEqual(['ReadingConfirmation', 'ReadingForm', 'ReadingHistory'])
    expect(formatReport(report)).toContain('Spec (binding): product/sections/meter-readings/spec.md')
  })

  it('places an existing screen in its flow with the steps before and after', () => {
    const { screen } = sectionReport(project, 'account', 'Login')
    expect(screen.exists).toBe(true)
    expect(screen.flows[0]).toMatchObject({ flowId: 'submit-meter-reading', previous: { id: 'S1' }, next: { id: 'S3' } })
  })

  it('places a screen that is not designed yet through the step that names it', () => {
    const { screen } = sectionReport(project, 'meter-readings', 'ReadingReview')
    expect(screen.exists).toBe(false)
    expect(screen.plannedFor[0]).toMatchObject({ step: { id: 'S4' }, previous: { id: 'S3' }, next: { id: 'S5' } })
  })

  it('says so when a section has no spec, personas or flows', () => {
    const text = formatReport(sectionReport(project, 'billing'))
    expect(text).toContain('"billing" is not in the roadmap')
    expect(text).toContain('Spec: none yet')
    expect(text).toContain('None linked to this section.')
  })

  it('reports conflicts separately and tells the agent not to resolve them', () => {
    const text = formatReport(sectionReport(project, 'account'))
    expect(text).toContain('## Conflicts (5)')
    expect(text).toContain('Do not resolve them yourself.')
    expect(text).toContain('[flow-not-found]')
  })

  it('gives a flow report with transitions across sections', () => {
    const report = flowReport(project, 'submit-meter-reading')!
    expect(report.coverage.percent).toBe(67)
    expect(report.route.transitions.some((edge: { crossesSection: boolean }) => edge.crossesSection)).toBe(true)
    expect(flowReport(project, 'nope')).toBeNull()
  })

  it('gives a project report', () => {
    const report = projectReport(project)
    expect(report.flows).toHaveLength(1)
    expect(report.sectionsWithoutFlow).toEqual([])
    expect(report.issues.length).toBeGreaterThan(0)
  })

  it('runs as a command and prints JSON', () => {
    const out = execFileSync('node', [script, '--root', root, '--flow', 'submit-meter-reading', '--json'], { encoding: 'utf8' })
    expect(JSON.parse(out)).toMatchObject({ scope: 'flow', id: 'submit-meter-reading', coverage: { total: 6, mapped: 4 } })
  })

  it('fails for an unknown flow', () => {
    expect(() => execFileSync('node', [script, '--root', root, '--flow', 'nope'], { stdio: 'pipe' })).toThrow()
  })
})
