#!/usr/bin/env node
/**
 * Persona and user flow context for the planning commands.
 *
 * Reads product/flows, product/personas, the section specs, the roadmap and the
 * screen designs in src/sections, and prints how they relate: which personas and
 * flows belong to a section, which flow steps have a screen design, where a screen
 * sits in its flows, and where the planning files contradict each other.
 *
 * The parsing and the relation model are the same modules the app uses
 * (src/lib/model), so the app and the commands always agree.
 *
 *   node scripts/context.mjs                          project overview: every flow with coverage, all issues
 *   node scripts/context.mjs <section-id>             personas, flows and screens of one section
 *   node scripts/context.mjs <section-id> --screen X  where screen X sits in its flows
 *   node scripts/context.mjs --flow <flow-id>         one flow across all its sections, with transitions
 *   node scripts/context.mjs ... --json               the same as JSON
 *   node scripts/context.mjs ... --root <dir>         read another project root (default: current directory)
 *
 * The skill .claude/skills/designos-context/SKILL.md says how the commands use this.
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { buildProjectModel, parseFlow, parsePersona, parseProductRoadmap, parseSpec } from '../src/lib/model/index.ts'

function markdownFiles(dir) {
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter((name) => name.endsWith('.md') && name !== 'README.md')
    .sort()
}

function directories(dir) {
  if (!existsSync(dir)) return []
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
}

/**
 * Read the planning files below `root` into the sources of the project model
 */
export function loadSources(root) {
  const read = (...parts) => readFileSync(join(root, ...parts), 'utf8')

  const flowsDir = join(root, 'product', 'flows')
  const personasDir = join(root, 'product', 'personas')
  const sectionsDir = join(root, 'product', 'sections')
  const screensDir = join(root, 'src', 'sections')
  const roadmapPath = join(root, 'product', 'product-roadmap.md')

  const specs = {}
  for (const sectionId of directories(sectionsDir)) {
    const specPath = join(sectionsDir, sectionId, 'spec.md')
    if (!existsSync(specPath)) continue
    const spec = parseSpec(readFileSync(specPath, 'utf8'))
    if (spec) specs[sectionId] = spec
  }

  const screens = directories(screensDir).flatMap((sectionId) =>
    readdirSync(join(screensDir, sectionId))
      .filter((name) => name.endsWith('.tsx'))
      .sort()
      .map((name) => ({ sectionId, name: name.replace(/\.tsx$/, '') }))
  )

  const roadmap = existsSync(roadmapPath) ? parseProductRoadmap(readFileSync(roadmapPath, 'utf8')) : null

  return {
    flows: markdownFiles(flowsDir).map((name) => parseFlow(name.replace(/\.md$/, ''), read('product', 'flows', name))),
    personas: markdownFiles(personasDir).map((name) =>
      parsePersona(name.replace(/\.md$/, ''), read('product', 'personas', name))
    ),
    specs,
    roadmap: (roadmap?.sections ?? []).map(({ id, title }) => ({ id, title })),
    screens,
  }
}

export function loadProject(root) {
  const sources = loadSources(root)
  return { sources, model: buildProjectModel(sources) }
}

// ---------------------------------------------------------------------------
// Report data
// ---------------------------------------------------------------------------

function personaSummary(persona) {
  return {
    id: persona.id,
    name: persona.name,
    archetype: persona.archetype,
    kind: persona.kind,
    priority: persona.priority,
    confidence: persona.confidence,
    jobStory: persona.jobStory,
    painPoints: persona.painPoints,
    implications: persona.implications,
    contextOfUse: persona.contextOfUse,
    accessibility: persona.accessibility,
    source: `product/personas/${persona.id}.md`,
  }
}

function flowSummary(model, flow) {
  return {
    id: flow.id,
    title: flow.title,
    status: flow.status,
    overview: flow.overview,
    context: flow.context,
    personas: flow.personas,
    sections: model.sectionsForFlow(flow.id),
    rules: flow.rules,
    coverage: model.coverage(flow.id),
    steps: model.resolveSteps(flow.id),
    edgeCases: flow.edgeCases,
    source: `product/flows/${flow.id}.md`,
  }
}

export function projectReport({ sources, model }) {
  return {
    scope: 'project',
    flows: model.flows.map((flow) => flowSummary(model, flow)),
    personas: model.personas.map(personaSummary),
    sectionsWithoutPersona: sources.roadmap.filter(({ id }) => model.personasForSection(id).length === 0).map(({ id }) => id),
    sectionsWithoutFlow: sources.roadmap.filter(({ id }) => model.flowsForSection(id).length === 0).map(({ id }) => id),
    issues: model.issues,
  }
}

export function sectionReport({ sources, model }, sectionId, screenName) {
  const spec = sources.specs[sectionId] ?? null
  const screens = sources.screens.filter((screen) => screen.sectionId === sectionId)
  const flows = model.flowsForSection(sectionId)

  const report = {
    scope: 'section',
    sectionId,
    inRoadmap: sources.roadmap.length === 0 ? null : sources.roadmap.some(({ id }) => id === sectionId),
    spec: spec
      ? { source: `product/sections/${sectionId}/spec.md`, overview: spec.overview, userFlows: spec.userFlows, uiRequirements: spec.uiRequirements }
      : null,
    personas: model.personasForSection(sectionId).map(personaSummary),
    flows: flows.map((flow) => ({
      ...flowSummary(model, flow),
      stepsInSection: model
        .resolveSteps(flow.id)
        .filter((step) => (step.target?.sectionId ?? step.sectionId) === sectionId)
        .map((step) => step.id),
    })),
    screens: screens.map((screen) => ({
      name: screen.name,
      source: `src/sections/${sectionId}/${screen.name}.tsx`,
      flows: model.flowsForScreen(sectionId, screen.name).map((usage) => ({
        flowId: usage.flow.id,
        steps: usage.steps.map((step) => step.id),
      })),
    })),
    issues: unique([...model.issuesForSection(sectionId), ...flows.flatMap((flow) => model.issuesForFlow(flow.id))]),
  }

  if (screenName) {
    report.screen = {
      name: screenName,
      exists: screens.some((screen) => screen.name === screenName),
      personas: model.personasForScreen(sectionId, screenName).map(({ id, name }) => ({ id, name })),
      flows: model.flowsForScreen(sectionId, screenName).map((usage) => ({
        flowId: usage.flow.id,
        title: usage.flow.title,
        steps: usage.steps,
        previous: usage.previous,
        next: usage.next,
        edgeCases: usage.flow.edgeCases.filter((edge) => usage.steps.some((step) => step.id === edge.returnsTo)),
      })),
      // Steps that name this screen although its file does not exist yet
      plannedFor: flows.flatMap((flow) => {
        const steps = model.resolveSteps(flow.id)
        return steps
          .filter((step) => step.screen === screenName && step.status === 'screen-missing' && (step.sectionId ?? sectionId) === sectionId)
          .map((step) => {
            const index = steps.indexOf(step)
            return {
              flowId: flow.id,
              title: flow.title,
              step,
              previous: steps[index - 1] ?? null,
              next: steps[index + 1] ?? null,
              edgeCases: flow.edgeCases.filter((edge) => edge.returnsTo === step.id),
            }
          })
      }),
    }
  }
  return report
}

export function flowReport({ model }, flowId) {
  const flow = model.getFlow(flowId)
  if (!flow) return null
  return {
    scope: 'flow',
    ...flowSummary(model, flow),
    route: model.route(flowId),
    personaDetails: model.personas.filter((persona) => model.flowsForPersona(persona.id).includes(flow)).map(personaSummary),
    issues: model.issuesForFlow(flowId),
  }
}

function unique(items) {
  return [...new Set(items)]
}

// ---------------------------------------------------------------------------
// Text output
// ---------------------------------------------------------------------------

const STATUS_LABEL = {
  mapped: 'exists',
  'screen-missing': 'MISSING',
  unassigned: 'NO SCREEN',
  'unknown-section': 'UNKNOWN SECTION',
  ambiguous: 'AMBIGUOUS',
}

function stepLine(step) {
  const where = step.target
    ? `${step.target.sectionId}/${step.target.name}`
    : [step.sectionId, step.screen].filter(Boolean).join('/') || '—'
  const partial = step.partial ? ` (partial${step.missing ? `: ${step.missing}` : ''})` : ''
  return `  ${step.id}  ${step.title}  →  ${where}  [${STATUS_LABEL[step.status]}]${partial}`
}

function coverageLine(coverage) {
  return `${coverage.mapped} of ${coverage.total} steps have a screen design (${coverage.percent}%), ${coverage.open} open` +
    (coverage.partial ? `, ${coverage.partial} partial` : '')
}

function printPersona(lines, persona) {
  lines.push(`- ${persona.name}${persona.archetype ? ` — ${persona.archetype}` : ''} (persona: ${persona.id})`)
  lines.push(`  ${[persona.priority, persona.kind, `${persona.confidence} confidence`].filter(Boolean).join(' · ')}  ·  ${persona.source}`)
  if (persona.jobStory) lines.push(`  Job story: ${persona.jobStory}`)
  for (const point of persona.painPoints) lines.push(`  ${point.id}: ${point.painPoint}${point.need ? ` → needs ${point.need}` : ''}`)
  for (const item of persona.implications) lines.push(`  ${item.kind === 'do' ? 'Do' : "Don't"}: ${item.text}`)
  for (const [label, value] of Object.entries(persona.contextOfUse)) lines.push(`  Context, ${label}: ${value}`)
  for (const [label, value] of Object.entries(persona.accessibility)) lines.push(`  Accessibility, ${label}: ${value}`)
}

function printFlow(lines, flow, highlight = []) {
  lines.push(`- ${flow.title} (flow: ${flow.id})  ·  ${flow.status}  ·  ${flow.source}`)
  if (flow.overview) lines.push(`  ${flow.overview.replace(/\n+/g, ' ')}`)
  if (flow.personas.length) lines.push(`  Personas: ${flow.personas.join(', ')}`)
  if (flow.sections.length) lines.push(`  Sections: ${flow.sections.join(', ')}`)
  lines.push(`  Coverage: ${coverageLine(flow.coverage)}`)
  for (const rule of flow.rules) lines.push(`  Rule: ${rule.replace(/\*\*/g, '')}`)
  for (const step of flow.steps) lines.push(stepLine(step) + (highlight.includes(step.id) ? '   ← this section' : ''))
  for (const edge of flow.edgeCases) {
    lines.push(`  ${edge.id}  ${edge.failure}  →  ${edge.handling}${edge.returnsTo ? `  (returns to ${edge.returnsTo})` : ''}`)
  }
}

function printIssues(lines, issues) {
  const conflicts = issues.filter((issue) => issue.severity === 'conflict')
  const gaps = issues.filter((issue) => issue.severity === 'gap')
  lines.push('', `## Conflicts (${conflicts.length})`)
  lines.push(conflicts.length ? 'Show these to the user. Do not resolve them yourself.' : 'None.')
  for (const issue of conflicts) lines.push(`- [${issue.kind}] ${issue.flowId ? `${issue.flowId}: ` : ''}${issue.message}`)
  lines.push('', `## Gaps (${gaps.length})`)
  if (!gaps.length) lines.push('None.')
  for (const issue of gaps) lines.push(`- [${issue.kind}] ${issue.flowId ? `${issue.flowId}: ` : ''}${issue.message}`)
}

function stepRef(step) {
  if (!step) return 'none'
  const where = step.target ? `${step.target.sectionId}/${step.target.name}` : [step.sectionId, step.screen].filter(Boolean).join('/')
  return `${step.id} ${step.title}${where ? ` (${where}${step.status === 'mapped' ? '' : ', not designed yet'})` : ' (no screen assigned)'}`
}

export function formatReport(report) {
  const lines = []

  if (report.scope === 'project') {
    lines.push('# Personas and user flows: project', '')
    lines.push(`## Personas (${report.personas.length})`)
    if (!report.personas.length) lines.push('None. Create one with /design-os:persona.')
    for (const persona of report.personas) printPersona(lines, persona)
    lines.push('', `## User flows (${report.flows.length})`)
    if (!report.flows.length) lines.push('None. Create one with /design-os:userflow.')
    for (const flow of report.flows) printFlow(lines, flow)
    if (report.sectionsWithoutPersona.length) lines.push('', `Sections without a persona: ${report.sectionsWithoutPersona.join(', ')}`)
    if (report.sectionsWithoutFlow.length) lines.push(`Sections without a flow: ${report.sectionsWithoutFlow.join(', ')}`)
    printIssues(lines, report.issues)
  }

  if (report.scope === 'section') {
    lines.push(`# Personas and user flows: section ${report.sectionId}`, '')
    if (report.inRoadmap === false) lines.push(`Note: "${report.sectionId}" is not in the roadmap.`, '')
    lines.push(report.spec ? `Spec (binding): ${report.spec.source}` : 'Spec: none yet. Run /shape-section first.')
    lines.push('', `## Personas (${report.personas.length})`)
    if (!report.personas.length) lines.push('None linked to this section.')
    for (const persona of report.personas) printPersona(lines, persona)
    lines.push('', `## User flows (${report.flows.length})`)
    if (!report.flows.length) lines.push('None linked to this section.')
    for (const flow of report.flows) printFlow(lines, flow, flow.stepsInSection)
    lines.push('', `## Screen designs in this section (${report.screens.length})`)
    if (!report.screens.length) lines.push('None yet.')
    for (const screen of report.screens) {
      const uses = screen.flows.map((use) => `${use.flowId} ${use.steps.join(', ')}`).join('; ')
      lines.push(`- ${screen.name}  ·  ${screen.source}  ·  ${uses ? `covers ${uses}` : 'not used by any flow step'}`)
    }
    if (report.screen) {
      lines.push('', `## Screen ${report.screen.name}${report.screen.exists ? '' : ' (not designed yet)'}`)
      if (report.screen.personas.length) lines.push(`Designed for: ${report.screen.personas.map((persona) => `${persona.name} (${persona.id})`).join(', ')}`)
      const uses = [
        ...report.screen.flows.map((use) => ({ ...use, stepIds: use.steps.map((step) => `${step.id} ${step.title}`) })),
        ...report.screen.plannedFor.map((use) => ({ ...use, stepIds: [`${use.step.id} ${use.step.title}`] })),
      ]
      if (!uses.length) lines.push('No flow step names this screen.')
      for (const use of uses) {
        lines.push(`- In flow ${use.title} (${use.flowId}): ${use.stepIds.join(', ')}`)
        lines.push(`  Comes from: ${stepRef(use.previous)}`)
        lines.push(`  Leads to:   ${stepRef(use.next)}`)
        for (const edge of use.edgeCases) lines.push(`  ${edge.id}  ${edge.failure}  →  ${edge.handling}`)
      }
    }
    printIssues(lines, report.issues)
  }

  if (report.scope === 'flow') {
    lines.push(`# User flow: ${report.title} (${report.id})`, '')
    printFlow(lines, report)
    lines.push('', `## Personas (${report.personaDetails.length})`)
    if (!report.personaDetails.length) lines.push('None linked to this flow.')
    for (const persona of report.personaDetails) printPersona(lines, persona)
    lines.push('', `## Transitions (${report.route.transitions.length})`)
    for (const edge of report.route.transitions) {
      const from = edge.fromScreen ? `${edge.fromScreen.sectionId}/${edge.fromScreen.name}` : 'no screen'
      const to = edge.toScreen ? `${edge.toScreen.sectionId}/${edge.toScreen.name}` : 'no screen'
      lines.push(
        `- ${edge.from} → ${edge.to}${edge.label ? ` "${edge.label}"` : ''}${edge.kind === 'failure' ? ' (failure path)' : ''}: ${from} → ${to}` +
          (edge.crossesSection ? '  · crosses sections' : '')
      )
    }
    lines.push('', report.route.complete ? 'Every step has a screen design.' : 'Not every step has a screen design yet.')
    printIssues(lines, report.issues)
  }

  return lines.join('\n')
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function main(argv) {
  const args = [...argv]
  const take = (flag) => {
    const index = args.indexOf(flag)
    if (index === -1) return null
    const [, value] = args.splice(index, 2)
    if (!value) fail(`${flag} needs a value`)
    return value
  }
  const json = args.includes('--json')
  if (json) args.splice(args.indexOf('--json'), 1)

  const root = resolve(take('--root') ?? process.cwd())
  const flowId = take('--flow')
  const screenName = take('--screen')
  const sectionId = args[0] ?? null
  if (args.length > 1 || sectionId?.startsWith('--')) fail('usage: context.mjs [<section-id> [--screen <Name>] | --flow <flow-id>] [--json] [--root <dir>]')

  const project = loadProject(root)
  let report
  if (flowId) {
    report = flowReport(project, flowId)
    if (!report) fail(`flow "${flowId}" not found in product/flows/`)
  } else if (sectionId) {
    report = sectionReport(project, sectionId, screenName?.replace(/\.tsx$/, ''))
  } else {
    report = projectReport(project)
  }

  console.log(json ? JSON.stringify(report, null, 2) : formatReport(report))
}

function fail(message) {
  console.error(message)
  process.exit(1)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main(process.argv.slice(2))
