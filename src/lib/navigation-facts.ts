/** Reads the project files through the loaders and returns the facts the navigation needs */

import { loadProductData, hasExportZip, hasClickdummy } from '@/lib/product-loader'
import { getAllSectionIds, getSectionScreenDesigns } from '@/lib/section-loader'
import { loadAllPersonas } from '@/lib/persona-loader'
import { loadAllFlows } from '@/lib/flow-loader'
import { hasTechstack } from '@/lib/techstack-loader'
import type { NavFacts } from '@/lib/navigation'

export function loadNavFacts(): NavFacts {
  const product = loadProductData()
  return {
    hasOverview: !!product.overview,
    hasRoadmap: !!product.roadmap,
    hasDataShape: !!product.dataShape,
    hasDesignSystem: !!(product.designSystem || product.designTokens),
    hasShell: !!product.shell,
    sectionsWithScreenDesigns: getAllSectionIds().filter((id) => getSectionScreenDesigns(id).length > 0).length,
    hasClickdummy: hasClickdummy(),
    hasExport: hasExportZip(),
    hasTechstack: hasTechstack(),
    personaCount: loadAllPersonas().length,
    flowCount: loadAllFlows().length,
  }
}
