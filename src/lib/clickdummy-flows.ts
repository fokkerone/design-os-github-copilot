/**
 * User flows for the clickdummy: walk a flow step by step through the screen designs.
 *
 * The routes are derived from product/flows at runtime (see src/lib/model/project.ts),
 * so a new flow, a changed step or a new screen design shows up in the clickdummy
 * without assembling it again.
 *
 * `?flow=<flow-id>` on the clickdummy URL locks it to one flow: only that flow's
 * steps and sections are reachable. This is the entry point for a clickdummy of a
 * single flow.
 */

import { useCallback, useMemo, useState } from 'react'
import { walkOptions, type FlowRoute, type ResolvedStep, type ScreenRef, type WalkOption } from './model/project.ts'
import type { Flow } from './model/flow.ts'
import { getProjectModel } from './project-model'

export interface WalkableFlow {
  flow: Flow
  route: FlowRoute
}

export interface FlowWalk {
  /** Flows with at least one step, in title order */
  flows: WalkableFlow[]
  /** The flow being walked, or null when the clickdummy is browsed freely */
  active: WalkableFlow | null
  /** Current step of the active flow */
  step: ResolvedStep | null
  /** Position of the current step, starting at 1 */
  position: number
  /** Screen design of the current step; null when the step has none yet */
  screen: ScreenRef | null
  /** Ways forward from the current step; several for a decision, none at the end */
  options: WalkOption[]
  canGoBack: boolean
  /** True when the URL names a flow: the clickdummy shows only that flow */
  locked: boolean
  /** Section ids of the active flow, for limiting the navigation of a locked clickdummy */
  sectionIds: string[]
  start(flowId: string): void
  goTo(stepId: string): void
  back(): void
  stop(): void
}

/** Flow id from `?flow=<flow-id>`, or null */
export function flowIdFromUrl(search: string): string | null {
  return new URLSearchParams(search).get('flow')
}

export function useFlowWalk(): FlowWalk {
  const model = useMemo(() => getProjectModel(), [])
  const flows = useMemo(
    () =>
      model.flows.flatMap((flow) => {
        const route = model.route(flow.id)
        return route && route.steps.length > 0 ? [{ flow, route }] : []
      }),
    [model]
  )

  const lockedFlowId = useMemo(() => {
    const flowId = flowIdFromUrl(window.location.search)
    return flowId && flows.some((item) => item.flow.id === flowId) ? flowId : null
  }, [flows])

  const [flowId, setFlowId] = useState<string | null>(lockedFlowId)
  // Visited step ids of the active flow; the last one is the current step
  const [path, setPath] = useState<string[]>(() => {
    const first = flows.find((item) => item.flow.id === lockedFlowId)?.route.steps[0]
    return first ? [first.id] : []
  })

  const active = flows.find((item) => item.flow.id === flowId) ?? null
  const step = active?.route.steps.find((item) => item.id === path[path.length - 1]) ?? null

  const start = useCallback(
    (nextFlowId: string) => {
      const next = flows.find((item) => item.flow.id === nextFlowId)
      if (!next) return
      setFlowId(nextFlowId)
      setPath([next.route.steps[0].id])
    },
    [flows]
  )
  const goTo = useCallback((stepId: string) => setPath((current) => [...current, stepId]), [])
  const back = useCallback(() => setPath((current) => (current.length > 1 ? current.slice(0, -1) : current)), [])
  const stop = useCallback(() => {
    if (lockedFlowId) return
    setFlowId(null)
    setPath([])
  }, [lockedFlowId])

  return {
    flows,
    active,
    step,
    position: active && step ? active.route.steps.indexOf(step) + 1 : 0,
    screen: step?.target ?? null,
    options: active && step ? walkOptions(active.route, step.id) : [],
    canGoBack: path.length > 1,
    locked: lockedFlowId !== null,
    sectionIds: active ? model.sectionsForFlow(active.flow.id) : [],
    start,
    goTo,
    back,
    stop,
  }
}
