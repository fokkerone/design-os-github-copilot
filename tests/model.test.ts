import { describe, expect, it } from 'vitest'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import {
  buildProjectModel,
  parseFlow,
  parsePersona,
  parseScreenRef,
  parseTransitions,
  walkOptions,
  type ProjectSources,
} from '../src/lib/model/index.ts'
import { loadSources } from '../scripts/context.mjs'

const root = fileURLToPath(new URL('./fixtures/project', import.meta.url))
const sources = loadSources(root) as ProjectSources
const model = buildProjectModel(sources)
const FLOW = 'submit-meter-reading'
const PERSONA = 'cautious-first-timer'

describe('loading', () => {
  it('parses a flow file', () => {
    const flow = model.getFlow(FLOW)!
    expect(flow.title).toBe('Submit meter reading')
    expect(flow.status).toBe('in-spec')
    expect(flow.sections).toEqual(['meter-readings', 'account'])
    expect(flow.personas).toEqual([PERSONA])
    expect(flow.context.trigger).toBe('Reminder email')
    expect(flow.rules).toHaveLength(2)
    expect(flow.steps.map((step) => step.id)).toEqual(['S1', 'S2', 'S3', 'S4', 'S5', 'S6'])
    expect(flow.steps[1]).toMatchObject({ sectionId: 'account', screen: 'Login', rules: ['R2'] })
    expect(flow.steps[5]).toMatchObject({ sectionId: null, screen: null })
    expect(flow.edgeCases).toEqual([
      expect.objectContaining({ id: 'E1', returnsTo: 'S3' }),
    ])
    expect(flow.mermaid).toContain('flowchart TD')
    expect(flow.openQuestions).toEqual(['Is a photo upload required?'])
  })

  it('parses a persona file', () => {
    const persona = model.getPersona(PERSONA)!
    expect(persona).toMatchObject({ name: 'Ana', archetype: 'The cautious first-timer', kind: 'proto', priority: 'primary' })
    expect(persona.quote).toBe('I just want to be sure I typed the right number.')
    expect(persona.jobStory).toMatch(/^When the reminder arrives, I want to/)
    expect(persona.painPoints.map((point) => point.id)).toEqual(['P1', 'P2'])
    expect(persona.implications).toEqual([
      { kind: 'do', text: 'Show the entered value again before submitting (P2)' },
      { kind: 'dont', text: 'Hide the previous reading behind a tap (P1)' },
    ])
    expect(persona.assumptions[1]).toMatchObject({ id: 'A2', evidenceLevel: 'signal' })
    expect(persona.dimensions[0].position).toBe(4)
    expect(persona.goals['end goals']).toContain('before the deadline')
  })

  it('falls back to defaults for a file without frontmatter', () => {
    expect(parseFlow('bare', '# Bare flow\n')).toMatchObject({ id: 'bare', title: 'Bare flow', status: 'planned', steps: [] })
    expect(parsePersona('bare', '# Somebody\n')).toMatchObject({ name: 'Somebody', kind: 'proto', confidence: 'low' })
  })

  it('reads the Section / Screen column', () => {
    expect(parseScreenRef('`checkout` / `PaymentForm`')).toEqual({ sectionId: 'checkout', screen: 'PaymentForm' })
    expect(parseScreenRef('checkout / PaymentForm.tsx')).toEqual({ sectionId: 'checkout', screen: 'PaymentForm' })
    expect(parseScreenRef('`checkout`')).toEqual({ sectionId: 'checkout', screen: null })
    expect(parseScreenRef('`PaymentForm`')).toEqual({ sectionId: null, screen: 'PaymentForm' })
    expect(parseScreenRef('—')).toEqual({ sectionId: null, screen: null })
    expect(parseScreenRef('`<section-id>` / `<Screen>`')).toEqual({ sectionId: null, screen: null })
  })

  it('reads diagram edges with labels, chains and failure paths', () => {
    const edges = parseTransitions(
      ['flowchart TD', '  start(["Start: x"]) --> S1["S1 · a"] --> S2{"S2 · b?"}', '  S2 -- "yes" --> S3', '  S3 -. "declined" .-> E1["E1 · c"]', '  class E1 error'].join('\n')
    )
    expect(edges).toEqual([
      { from: 'start', to: 'S1', label: '', kind: 'happy' },
      { from: 'S1', to: 'S2', label: '', kind: 'happy' },
      { from: 'S2', to: 'S3', label: 'yes', kind: 'happy' },
      { from: 'S3', to: 'E1', label: 'declined', kind: 'failure' },
    ])
  })
})

describe('step to screen assignment', () => {
  it('gives every step a status based on the screen designs that exist', () => {
    const statuses = Object.fromEntries(model.resolveSteps(FLOW).map((step) => [step.id, step.status]))
    expect(statuses).toEqual({
      S1: 'mapped',
      S2: 'mapped',
      S3: 'mapped',
      S4: 'screen-missing',
      S5: 'mapped',
      S6: 'unassigned',
    })
  })

  it('takes partial from the Prototype Mapping', () => {
    const step = model.resolveSteps(FLOW).find((item) => item.id === 'S3')!
    expect(step).toMatchObject({ partial: true, missing: 'inline error state' })
  })

  it('flags unknown sections and ambiguous screens', () => {
    const flow = parseFlow(
      'odd',
      [
        '## Steps',
        '| # | Step | Section / Screen |',
        '|---|------|------------------|',
        '| S1 | a | `billing` / `Invoice` |',
        '| S2 | b | `Shared` |',
        '| S3 | c | `Login` |',
      ].join('\n')
    )
    const odd = buildProjectModel({
      ...sources,
      flows: [flow],
      screens: [...sources.screens, { sectionId: 'meter-readings', name: 'Shared' }, { sectionId: 'account', name: 'Shared' }],
    })
    expect(odd.resolveSteps('odd').map((step) => step.status)).toEqual(['unknown-section', 'ambiguous', 'mapped'])
    expect(odd.resolveSteps('odd')[2].target).toEqual({ sectionId: 'account', name: 'Login' })
  })
})

describe('coverage', () => {
  it('counts steps with and without a screen design', () => {
    expect(model.coverage(FLOW)).toEqual({ total: 6, mapped: 4, open: 2, partial: 1, percent: 67 })
  })

  it('is zero for a flow without steps', () => {
    const empty = buildProjectModel({ ...sources, flows: [parseFlow('empty', '# Empty\n')] })
    expect(empty.coverage('empty')).toEqual({ total: 0, mapped: 0, open: 0, partial: 0, percent: 0 })
  })

  it('follows the screen designs: a new screen closes the gap', () => {
    const next = buildProjectModel({
      ...sources,
      screens: [...sources.screens, { sectionId: 'meter-readings', name: 'ReadingReview' }],
    })
    expect(next.coverage(FLOW)).toMatchObject({ mapped: 5, open: 1, percent: 83 })
    expect(next.issuesForFlow(FLOW).some((issue) => issue.kind === 'stale-mapping')).toBe(false)
  })

  it('follows the flow: a changed step changes the coverage', () => {
    const flow = model.getFlow(FLOW)!
    const changed = {
      ...flow,
      steps: flow.steps.map((step) => (step.id === 'S6' ? { ...step, sectionId: 'meter-readings', screen: 'ReadingConfirmation' } : step)),
    }
    const next = buildProjectModel({ ...sources, flows: [changed] })
    expect(next.coverage(FLOW)).toMatchObject({ mapped: 5, open: 1 })
  })
})

describe('relations', () => {
  it('links sections to flows and personas', () => {
    expect(model.flowsForSection('meter-readings').map((flow) => flow.id)).toEqual([FLOW])
    expect(model.flowsForSection('account').map((flow) => flow.id)).toEqual([FLOW])
    expect(model.personasForSection('meter-readings').map((persona) => persona.id)).toEqual([PERSONA])
    expect(model.sectionsForFlow(FLOW)).toEqual(['meter-readings', 'account'])
  })

  it('links screens to the flow steps they cover, with the steps around them', () => {
    const [usage] = model.flowsForScreen('meter-readings', 'ReadingForm')
    expect(usage.steps.map((step) => step.id)).toEqual(['S1', 'S3'])
    expect(usage.previous).toBeNull()
    expect(usage.next?.id).toBe('S4')

    const [login] = model.flowsForScreen('account', 'Login')
    expect(login.previous?.id).toBe('S1')
    expect(login.next?.id).toBe('S3')
  })

  it('links screens to personas through their flows', () => {
    expect(model.personasForScreen('account', 'Login').map((persona) => persona.id)).toEqual([PERSONA])
    expect(model.screensForPersona(PERSONA)).toEqual([
      { sectionId: 'meter-readings', name: 'ReadingForm' },
      { sectionId: 'account', name: 'Login' },
      { sectionId: 'meter-readings', name: 'ReadingConfirmation' },
    ])
  })

  it('links personas to flows and sections', () => {
    expect(model.flowsForPersona(PERSONA).map((flow) => flow.id)).toEqual([FLOW])
    expect(model.sectionsForPersona(PERSONA)).toEqual(['meter-readings', 'account'])
  })

  it('lists screens no flow step uses, without inventing a link', () => {
    expect(model.screensWithoutFlow('meter-readings')).toEqual([{ sectionId: 'meter-readings', name: 'ReadingHistory' }])
    expect(model.flowsForScreen('meter-readings', 'ReadingHistory')).toEqual([])
  })
})

describe('issues', () => {
  const kinds = (issues: { kind: string }[]) => issues.map((issue) => issue.kind).sort()

  it('reports missing and unassigned screens as gaps', () => {
    const gaps = model.issuesForFlow(FLOW).filter((issue) => issue.severity === 'gap')
    expect(kinds(gaps)).toEqual(['partial-step', 'screen-missing', 'unassigned-step'])
    expect(gaps.find((issue) => issue.kind === 'screen-missing')).toMatchObject({ stepId: 'S4', sectionId: 'meter-readings' })
  })

  it('reports contradictions between flow, spec and persona as conflicts', () => {
    const conflicts = model.issues.filter((issue) => issue.severity === 'conflict')
    expect(kinds(conflicts)).toEqual([
      'flow-not-found', // persona lists archived-flow
      'flow-not-found', // account spec links reset-password
      'flow-not-in-spec', // flow lists account, account spec does not link it
      'persona-link-mismatch', // persona lists account, account spec does not link it
      'persona-not-found', // account spec links ghost
      'stale-mapping', // mapping says S4 exists
    ])
  })

  it('scopes issues to a section and to a persona', () => {
    expect(kinds(model.issuesForSection('account'))).toEqual([
      'flow-not-found',
      'flow-not-in-spec',
      'persona-link-mismatch',
      'persona-not-found',
    ])
    expect(kinds(model.issuesForPersona(PERSONA))).toEqual(['flow-not-found', 'persona-link-mismatch'])
  })

  it('reports nothing for a consistent project', () => {
    const flow = parseFlow(
      'ok',
      ['---', 'sections: [account]', '---', '## Steps', '| # | Step | Section / Screen |', '|---|---|---|', '| S1 | Sign in | `account` / `Login` |'].join('\n')
    )
    const clean = buildProjectModel({ ...sources, flows: [flow], personas: [], specs: {} })
    expect(clean.issues).toEqual([])
    expect(clean.route('ok')?.complete).toBe(true)
  })
})

describe('flow route (input for a clickdummy of one flow)', () => {
  const route = model.route(FLOW)!

  it('lists the screens of the flow in order of first use, across sections', () => {
    expect(route.screens).toEqual([
      { sectionId: 'meter-readings', name: 'ReadingForm' },
      { sectionId: 'account', name: 'Login' },
      { sectionId: 'meter-readings', name: 'ReadingConfirmation' },
    ])
    expect(route.complete).toBe(false)
  })

  it('derives transitions from the diagram, including branches', () => {
    const fromS2 = route.transitions.filter((edge) => edge.from === 'S2')
    expect(fromS2.map((edge) => edge.label)).toEqual(['yes', 'no'])
    expect(fromS2[0]).toMatchObject({
      fromScreen: { sectionId: 'account', name: 'Login' },
      toScreen: { sectionId: 'meter-readings', name: 'ReadingForm' },
      crossesSection: true,
    })
  })

  it('keeps transitions to steps without a screen visible instead of dropping them', () => {
    expect(route.transitions.find((edge) => edge.from === 'S3' && edge.to === 'S4')).toMatchObject({ toScreen: null })
  })

  it('falls back to table order when the diagram has no edges', () => {
    const flow = { ...model.getFlow(FLOW)!, transitions: [] }
    const plain = buildProjectModel({ ...sources, flows: [flow] }).route(FLOW)!
    expect(plain.transitions.map((edge) => `${edge.from}>${edge.to}`)).toEqual(['S1>S2', 'S2>S3', 'S3>S4', 'S4>S5', 'S5>S6'])
  })

  it('returns null for an unknown flow', () => {
    expect(model.route('nope')).toBeNull()
  })
})

describe('walking a flow', () => {
  const route = model.route(FLOW)!

  it('offers one option per outgoing transition, several at a decision', () => {
    expect(walkOptions(route, 'S1').map((option) => option.step.id)).toEqual(['S2'])
    expect(walkOptions(route, 'S2').map((option) => option.label)).toEqual(['yes', 'no'])
    expect(walkOptions(route, 'S2')[0]).toMatchObject({ crossesSection: true, step: { id: 'S3' } })
  })

  it('leads into steps without a screen instead of skipping them', () => {
    const [option] = walkOptions(route, 'S3')
    expect(option.step).toMatchObject({ id: 'S4', status: 'screen-missing', target: null })
  })

  it('ends at the last step', () => {
    expect(walkOptions(route, 'S6')).toEqual([])
  })
})

describe('untouched files', () => {
  it('leaves .claude/DESIGN.md unchanged', () => {
    const status = execFileSync('git', ['status', '--porcelain', '--', '.claude/DESIGN.md', 'Design.md', 'DESIGN.md', 'design.md'], {
      encoding: 'utf8',
    })
    expect(status).toBe('')
  })
})
