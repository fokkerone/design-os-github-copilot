/**
 * Relations between personas, user flows, flow steps, sections and screen designs.
 *
 * Everything here is derived from the planning files on each call. Nothing is stored:
 * coverage and issues change as soon as a flow, a spec or a screen design changes.
 * Pure module: no Vite APIs, so scripts and tests can import it directly.
 */

import type { ParsedSpec } from '../../types/section.ts'
import type { Flow, FlowStep, FlowTransition } from './flow.ts'
import type { Persona } from './persona.ts'

export interface ScreenRef {
  sectionId: string
  /** Screen design name = file name in src/sections/[section-id]/ without extension */
  name: string
}

export interface RoadmapSection {
  id: string
  title: string
}

/** The planning files a project model is built from */
export interface ProjectSources {
  flows: Flow[]
  personas: Persona[]
  /** Parsed spec.md per section id. A section without a spec is absent. */
  specs: Record<string, ParsedSpec>
  /** Sections of the roadmap. Empty when there is no roadmap yet. */
  roadmap: RoadmapSection[]
  /** Screen designs that exist in src/sections/ */
  screens: ScreenRef[]
}

/**
 * How a flow step relates to a screen design:
 * - mapped: the step names a screen design that exists
 * - screen-missing: the step names a screen design that does not exist
 * - unassigned: the step names no screen design
 * - unknown-section: the step names a section that is not in the roadmap
 * - ambiguous: the step names a screen without a section, and several sections have one of that name
 */
export type StepStatus = 'mapped' | 'screen-missing' | 'unassigned' | 'unknown-section' | 'ambiguous'

export interface ResolvedStep extends FlowStep {
  flowId: string
  status: StepStatus
  /** The existing screen design, only for status "mapped" */
  target: ScreenRef | null
  /** The flow's Prototype Mapping marks this step as partial: the screen exists but lacks a state or action */
  partial: boolean
  /** What the Prototype Mapping says is missing, if anything */
  missing: string
}

export interface FlowCoverage {
  total: number
  mapped: number
  /** Steps without an existing screen design */
  open: number
  /** Mapped steps the flow marks as partial */
  partial: number
  /** mapped / total as a whole number from 0 to 100; 0 for a flow without steps */
  percent: number
}

export type IssueKind =
  | 'screen-missing'
  | 'unassigned-step'
  | 'unknown-section'
  | 'ambiguous-screen'
  | 'partial-step'
  | 'stale-mapping'
  | 'flow-not-found'
  | 'persona-not-found'
  | 'flow-not-in-spec'
  | 'flow-without-step-in-section'
  | 'section-not-in-flow'
  | 'persona-link-mismatch'
  | 'flow-persona-mismatch'

export interface ProjectIssue {
  kind: IssueKind
  /** conflict: two planning files contradict each other. gap: something is not there yet. */
  severity: 'conflict' | 'gap'
  message: string
  flowId?: string
  stepId?: string
  sectionId?: string
  personaId?: string
}

/** A screen-to-screen transition derived from a flow, for clickdummy navigation */
export interface FlowRouteTransition extends FlowTransition {
  /** Screen of the step the transition starts at, or null when that step has no screen */
  fromScreen: ScreenRef | null
  /** Screen of the step the transition leads to, or null when that step has no screen */
  toScreen: ScreenRef | null
  /** Both steps are in different sections */
  crossesSection: boolean
}

export interface FlowRoute {
  flowId: string
  /** Steps in table order with their resolved screens */
  steps: ResolvedStep[]
  /** Distinct screens the flow uses, in order of first use */
  screens: ScreenRef[]
  transitions: FlowRouteTransition[]
  /** True when every step has an existing screen design */
  complete: boolean
}

export interface ScreenFlowUsage {
  flow: Flow
  /** Steps of the flow that this screen covers */
  steps: ResolvedStep[]
  /** Step before the first covered step, if any */
  previous: ResolvedStep | null
  /** Step after the last covered step, if any */
  next: ResolvedStep | null
}

export interface ProjectModel {
  flows: Flow[]
  personas: Persona[]
  getFlow(flowId: string): Flow | null
  getPersona(personaId: string): Persona | null
  /** Steps of a flow with their screen status */
  resolveSteps(flowId: string): ResolvedStep[]
  coverage(flowId: string): FlowCoverage
  /** Steps, screens and transitions of one flow: the input for a clickdummy of that flow */
  route(flowId: string): FlowRoute | null
  /** Flows linked from the section's spec, listing the section, or with a step in it */
  flowsForSection(sectionId: string): Flow[]
  /** Personas linked from the section's spec or listing the section */
  personasForSection(sectionId: string): Persona[]
  /** Flows that use a screen design, with the steps it covers */
  flowsForScreen(sectionId: string, screen: string): ScreenFlowUsage[]
  /** Personas of the flows that use a screen design, then personas of its section */
  personasForScreen(sectionId: string, screen: string): Persona[]
  /** Flows that list the persona, or that the persona lists */
  flowsForPersona(personaId: string): Flow[]
  /** Section ids the persona is linked to, from its own file and from section specs */
  sectionsForPersona(personaId: string): string[]
  /** Screens of the flows the persona is linked to */
  screensForPersona(personaId: string): ScreenRef[]
  /** Section ids a flow touches: frontmatter, steps and specs that link it */
  sectionsForFlow(flowId: string): string[]
  /** Screens of a section that no flow step uses */
  screensWithoutFlow(sectionId: string): ScreenRef[]
  issues: ProjectIssue[]
  issuesForFlow(flowId: string): ProjectIssue[]
  issuesForSection(sectionId: string): ProjectIssue[]
  issuesForPersona(personaId: string): ProjectIssue[]
}

export interface WalkOption {
  /** Step the option leads to */
  step: ResolvedStep
  /** Edge label from the diagram, e.g. "yes"; empty for the only way forward */
  label: string
  kind: 'happy' | 'failure'
  crossesSection: boolean
}

/**
 * The ways forward from a step of a flow route: one option per outgoing transition.
 * A decision yields several. The last step of a flow yields none.
 */
export function walkOptions(route: FlowRoute, stepId: string): WalkOption[] {
  const options: WalkOption[] = []
  for (const edge of route.transitions) {
    if (edge.from !== stepId) continue
    const step = route.steps.find((item) => item.id === edge.to)
    if (!step || options.some((option) => option.step.id === step.id && option.label === edge.label)) continue
    options.push({ step, label: edge.label, kind: edge.kind, crossesSection: edge.crossesSection })
  }
  return options
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)]
}

function sameScreen(a: ScreenRef, b: ScreenRef): boolean {
  return a.sectionId === b.sectionId && a.name === b.name
}

/**
 * Build the relation model from the current planning files
 */
export function buildProjectModel(sources: ProjectSources): ProjectModel {
  const { flows, personas, specs, roadmap, screens } = sources
  const flowById = new Map(flows.map((flow) => [flow.id, flow]))
  const personaById = new Map(personas.map((persona) => [persona.id, persona]))
  const roadmapIds = new Set(roadmap.map((item) => item.id))
  const hasScreen = (sectionId: string, name: string) => screens.some((screen) => sameScreen(screen, { sectionId, name }))

  const specFlowIds = (sectionId: string) =>
    (specs[sectionId]?.userFlowItems ?? []).flatMap((item) => (item.flowId ? [item.flowId] : []))
  const specPersonaIds = (sectionId: string) =>
    (specs[sectionId]?.personas ?? []).flatMap((item) => (item.personaId ? [item.personaId] : []))

  function resolveStep(flow: Flow, step: FlowStep): ResolvedStep {
    const mappingRow = flow.mapping.find((row) => row.stepId === step.id)
    const base = {
      ...step,
      flowId: flow.id,
      partial: false,
      missing: mappingRow?.missing ?? '',
      target: null,
    }

    if (!step.screen) {
      const unknown = step.sectionId !== null && roadmapIds.size > 0 && !roadmapIds.has(step.sectionId)
      return { ...base, status: unknown ? 'unknown-section' : 'unassigned' }
    }

    if (!step.sectionId) {
      const candidates = screens.filter((screen) => screen.name === step.screen)
      if (candidates.length > 1) return { ...base, status: 'ambiguous' }
      if (candidates.length === 0) return { ...base, status: 'screen-missing' }
      return { ...base, status: 'mapped', target: candidates[0], partial: mappingRow?.status === 'partial' }
    }

    if (hasScreen(step.sectionId, step.screen)) {
      return {
        ...base,
        status: 'mapped',
        target: { sectionId: step.sectionId, name: step.screen },
        partial: mappingRow?.status === 'partial',
      }
    }
    if (roadmapIds.size > 0 && !roadmapIds.has(step.sectionId)) return { ...base, status: 'unknown-section' }
    return { ...base, status: 'screen-missing' }
  }

  const resolved = new Map(flows.map((flow) => [flow.id, flow.steps.map((step) => resolveStep(flow, step))]))
  const resolveSteps = (flowId: string) => resolved.get(flowId) ?? []

  function coverage(flowId: string): FlowCoverage {
    const steps = resolveSteps(flowId)
    const mapped = steps.filter((step) => step.status === 'mapped').length
    return {
      total: steps.length,
      mapped,
      open: steps.length - mapped,
      partial: steps.filter((step) => step.partial).length,
      percent: steps.length === 0 ? 0 : Math.round((mapped / steps.length) * 100),
    }
  }

  function sectionsForFlow(flowId: string): string[] {
    const flow = flowById.get(flowId)
    if (!flow) return []
    return unique([
      ...flow.sections,
      ...resolveSteps(flowId).flatMap((step) => (step.target ? [step.target.sectionId] : step.sectionId ? [step.sectionId] : [])),
      ...Object.keys(specs).filter((sectionId) => specFlowIds(sectionId).includes(flowId)),
    ])
  }

  const flowsForSection = (sectionId: string) => flows.filter((flow) => sectionsForFlow(flow.id).includes(sectionId))

  function personasForSection(sectionId: string): Persona[] {
    const linked = specPersonaIds(sectionId)
    return personas.filter((persona) => linked.includes(persona.id) || persona.sections.includes(sectionId))
  }

  function flowsForScreen(sectionId: string, screen: string): ScreenFlowUsage[] {
    return flows.flatMap((flow) => {
      const steps = resolveSteps(flow.id)
      const covered = steps.filter((step) => step.target && sameScreen(step.target, { sectionId, name: screen }))
      if (covered.length === 0) return []
      const first = steps.indexOf(covered[0])
      const last = steps.indexOf(covered[covered.length - 1])
      return [{ flow, steps: covered, previous: steps[first - 1] ?? null, next: steps[last + 1] ?? null }]
    })
  }

  function flowsForPersona(personaId: string): Flow[] {
    const persona = personaById.get(personaId)
    return flows.filter((flow) => flow.personas.includes(personaId) || persona?.flows.includes(flow.id))
  }

  function personasForScreen(sectionId: string, screen: string): Persona[] {
    const viaFlows = flowsForScreen(sectionId, screen).flatMap(({ flow }) =>
      personas.filter((persona) => flowsForPersona(persona.id).includes(flow))
    )
    return unique([...viaFlows, ...personasForSection(sectionId)])
  }

  function sectionsForPersona(personaId: string): string[] {
    const persona = personaById.get(personaId)
    return unique([
      ...(persona?.sections ?? []),
      ...Object.keys(specs).filter((sectionId) => specPersonaIds(sectionId).includes(personaId)),
    ])
  }

  function screensForPersona(personaId: string): ScreenRef[] {
    const result: ScreenRef[] = []
    for (const flow of flowsForPersona(personaId)) {
      for (const step of resolveSteps(flow.id)) {
        if (step.target && !result.some((screen) => sameScreen(screen, step.target!))) result.push(step.target)
      }
    }
    return result
  }

  function route(flowId: string): FlowRoute | null {
    const flow = flowById.get(flowId)
    if (!flow) return null
    const steps = resolveSteps(flowId)
    const stepById = new Map(steps.map((step) => [step.id, step]))

    // Fall back to table order when the diagram has no readable edges between steps
    const diagramEdges = flow.transitions.filter((edge) => stepById.has(edge.from) && stepById.has(edge.to))
    const edges: FlowTransition[] =
      diagramEdges.length > 0
        ? diagramEdges
        : steps.slice(1).map((step, index) => ({ from: steps[index].id, to: step.id, label: '', kind: 'happy' }))

    const routeScreens: ScreenRef[] = []
    for (const step of steps) {
      if (step.target && !routeScreens.some((screen) => sameScreen(screen, step.target!))) routeScreens.push(step.target)
    }

    return {
      flowId,
      steps,
      screens: routeScreens,
      transitions: edges.map((edge) => {
        const from = stepById.get(edge.from)!
        const to = stepById.get(edge.to)!
        const fromSection = from.target?.sectionId ?? from.sectionId
        const toSection = to.target?.sectionId ?? to.sectionId
        return {
          ...edge,
          fromScreen: from.target,
          toScreen: to.target,
          crossesSection: fromSection !== null && toSection !== null && fromSection !== toSection,
        }
      }),
      complete: steps.length > 0 && steps.every((step) => step.status === 'mapped'),
    }
  }

  function screensWithoutFlow(sectionId: string): ScreenRef[] {
    return screens.filter(
      (screen) => screen.sectionId === sectionId && flowsForScreen(sectionId, screen.name).length === 0
    )
  }

  // ---------------------------------------------------------------------------
  // Issues: gaps and contradictions between flows, personas, specs and screens
  // ---------------------------------------------------------------------------

  const issues: ProjectIssue[] = []

  for (const flow of flows) {
    for (const step of resolveSteps(flow.id)) {
      const where = { flowId: flow.id, stepId: step.id, sectionId: step.sectionId ?? undefined }
      const mappingRow = flow.mapping.find((row) => row.stepId === step.id)

      if (step.status === 'screen-missing') {
        issues.push({
          ...where,
          kind: 'screen-missing',
          severity: 'gap',
          message: `${step.id} names screen design "${step.screen}"${step.sectionId ? ` in section "${step.sectionId}"` : ''}, which does not exist.`,
        })
      } else if (step.status === 'unassigned') {
        issues.push({ ...where, kind: 'unassigned-step', severity: 'gap', message: `${step.id} has no screen design assigned.` })
      } else if (step.status === 'unknown-section') {
        issues.push({
          ...where,
          kind: 'unknown-section',
          severity: 'conflict',
          message: `${step.id} names section "${step.sectionId}", which is not in the roadmap.`,
        })
      } else if (step.status === 'ambiguous') {
        issues.push({
          ...where,
          kind: 'ambiguous-screen',
          severity: 'conflict',
          message: `${step.id} names screen design "${step.screen}" without a section, and several sections have one.`,
        })
      } else if (step.partial) {
        issues.push({
          ...where,
          kind: 'partial-step',
          severity: 'gap',
          message: `${step.id} is only partly covered by "${step.screen}"${step.missing ? `: ${step.missing}` : '.'}`,
        })
      }

      if (mappingRow?.status === 'exists' && step.status !== 'mapped') {
        issues.push({
          ...where,
          kind: 'stale-mapping',
          severity: 'conflict',
          message: `The flow's Prototype Mapping says ${step.id} exists, but its screen design is not there.`,
        })
      }
      if (step.status === 'mapped' && step.target && !flow.sections.includes(step.target.sectionId)) {
        issues.push({
          ...where,
          sectionId: step.target.sectionId,
          kind: 'section-not-in-flow',
          severity: 'conflict',
          message: `${step.id} uses a screen in section "${step.target.sectionId}", which the flow does not list in sections.`,
        })
      }
    }

    for (const sectionId of flow.sections) {
      if (specs[sectionId] && !specFlowIds(sectionId).includes(flow.id)) {
        issues.push({
          kind: 'flow-not-in-spec',
          severity: 'conflict',
          flowId: flow.id,
          sectionId,
          message: `The flow lists section "${sectionId}", but that section's spec does not link the flow.`,
        })
      }
    }

    for (const personaId of flow.personas) {
      const persona = personaById.get(personaId)
      if (!persona) {
        issues.push({
          kind: 'persona-not-found',
          severity: 'conflict',
          flowId: flow.id,
          personaId,
          message: `The flow lists persona "${personaId}", which does not exist.`,
        })
      } else if (!persona.flows.includes(flow.id)) {
        issues.push({
          kind: 'flow-persona-mismatch',
          severity: 'conflict',
          flowId: flow.id,
          personaId,
          message: `The flow lists persona "${personaId}", but the persona does not list the flow.`,
        })
      }
    }
  }

  for (const persona of personas) {
    for (const flowId of persona.flows) {
      const flow = flowById.get(flowId)
      if (!flow) {
        issues.push({
          kind: 'flow-not-found',
          severity: 'conflict',
          personaId: persona.id,
          flowId,
          message: `Persona "${persona.id}" lists flow "${flowId}", which does not exist.`,
        })
      } else if (!flow.personas.includes(persona.id)) {
        issues.push({
          kind: 'flow-persona-mismatch',
          severity: 'conflict',
          personaId: persona.id,
          flowId,
          message: `Persona "${persona.id}" lists flow "${flowId}", but the flow does not list the persona.`,
        })
      }
    }
    for (const sectionId of persona.sections) {
      if (specs[sectionId] && !specPersonaIds(sectionId).includes(persona.id)) {
        issues.push({
          kind: 'persona-link-mismatch',
          severity: 'conflict',
          personaId: persona.id,
          sectionId,
          message: `Persona "${persona.id}" lists section "${sectionId}", but that section's spec does not link the persona.`,
        })
      }
    }
  }

  for (const sectionId of Object.keys(specs)) {
    for (const flowId of specFlowIds(sectionId)) {
      const flow = flowById.get(flowId)
      if (!flow) {
        issues.push({
          kind: 'flow-not-found',
          severity: 'conflict',
          sectionId,
          flowId,
          message: `The spec of section "${sectionId}" links flow "${flowId}", which does not exist.`,
        })
      } else if (flow.steps.length > 0 && !resolveSteps(flowId).some((step) => (step.target?.sectionId ?? step.sectionId) === sectionId)) {
        issues.push({
          kind: 'flow-without-step-in-section',
          severity: 'conflict',
          sectionId,
          flowId,
          message: `The spec of section "${sectionId}" links flow "${flowId}", but no step of the flow is in this section.`,
        })
      }
    }
    for (const personaId of specPersonaIds(sectionId)) {
      const persona = personaById.get(personaId)
      if (!persona) {
        issues.push({
          kind: 'persona-not-found',
          severity: 'conflict',
          sectionId,
          personaId,
          message: `The spec of section "${sectionId}" links persona "${personaId}", which does not exist.`,
        })
      } else if (!persona.sections.includes(sectionId)) {
        issues.push({
          kind: 'persona-link-mismatch',
          severity: 'conflict',
          sectionId,
          personaId,
          message: `The spec of section "${sectionId}" links persona "${personaId}", but the persona does not list the section.`,
        })
      }
    }
  }

  return {
    flows,
    personas,
    getFlow: (flowId) => flowById.get(flowId) ?? null,
    getPersona: (personaId) => personaById.get(personaId) ?? null,
    resolveSteps,
    coverage,
    route,
    flowsForSection,
    personasForSection,
    flowsForScreen,
    personasForScreen,
    flowsForPersona,
    sectionsForPersona,
    screensForPersona,
    sectionsForFlow,
    screensWithoutFlow,
    issues,
    issuesForFlow: (flowId) => issues.filter((issue) => issue.flowId === flowId),
    issuesForSection: (sectionId) => issues.filter((issue) => issue.sectionId === sectionId),
    issuesForPersona: (personaId) => issues.filter((issue) => issue.personaId === personaId),
  }
}
