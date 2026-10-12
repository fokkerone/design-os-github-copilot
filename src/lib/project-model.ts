/**
 * The relation model of the current project: personas, user flows, flow steps,
 * sections and screen designs, with coverage and issues.
 *
 * Built from the planning files Vite loads, so it is rebuilt on every change (HMR).
 * The relations themselves live in src/lib/model/project.ts.
 */

import { buildProjectModel, type ProjectModel, type ScreenRef } from './model/project.ts'
import type { ParsedSpec } from '@/types/section'
import { loadAllFlows } from './flow-loader'
import { loadAllPersonas } from './persona-loader'
import { loadProductData } from './product-loader'
import { getAllSectionIds, loadSectionData } from './section-loader'

let cached: ProjectModel | null = null

export function getProjectModel(): ProjectModel {
  if (cached) return cached

  const roadmap = loadProductData().roadmap?.sections ?? []
  const sectionIds = [...new Set([...roadmap.map((section) => section.id), ...getAllSectionIds()])]

  const specs: Record<string, ParsedSpec> = {}
  const screens: ScreenRef[] = []
  for (const sectionId of sectionIds) {
    const data = loadSectionData(sectionId)
    if (data.specParsed) specs[sectionId] = data.specParsed
    for (const screen of data.screenDesigns) screens.push({ sectionId, name: screen.name })
  }

  cached = buildProjectModel({
    flows: loadAllFlows(),
    personas: loadAllPersonas(),
    specs,
    roadmap: roadmap.map(({ id, title }) => ({ id, title })),
    screens,
  })
  return cached
}

/** Title of a section from the roadmap, falling back to its id */
export function sectionTitle(sectionId: string): string {
  return loadProductData().roadmap?.sections.find((section) => section.id === sectionId)?.title ?? sectionId
}
