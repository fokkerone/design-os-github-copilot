/**
 * Section data loading utilities for spec.md, data.json, and screen designs
 *
 * File structure:
 * - product/sections/[section-id]/spec.md     - Section specification
 * - product/sections/[section-id]/data.json   - Sample data
 * - src/sections/[section-id]/[PageName].tsx  - Screen design pages
 */

import type { SectionData, ScreenDesignInfo, ScreenshotInfo } from '@/types/section'
import { parseSpec } from './model/spec.ts'

export { parseSpec }

// Load spec.md files from product/sections at build time
const specFiles = import.meta.glob('/product/sections/*/spec.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

// Load data.json files from product/sections at build time
const dataFiles = import.meta.glob('/product/sections/*/data.json', {
  eager: true,
}) as Record<string, { default: Record<string, unknown> }>

// The screen designs in src/sections, by name only: the preview (preview.html) runs them
const screenDesignModules = import.meta.glob('/src/sections/*/*.tsx', { query: '?designos-file', import: 'default', eager: true }) as Record<string, true>

// Load screenshot files from product/sections at build time
const screenshotFiles = import.meta.glob('/product/sections/*/*.png', {
  query: '?url',
  import: 'default',
  eager: true,
}) as Record<string, string>

/**
 * Extract section ID from a product/sections file path
 * e.g., "/product/sections/invoices/spec.md" -> "invoices"
 */
function extractSectionIdFromProduct(path: string): string | null {
  const match = path.match(/\/product\/sections\/([^/]+)\//)
  return match?.[1] || null
}

/**
 * Extract section ID from a src/sections file path
 * e.g., "/src/sections/invoices/InvoiceList.tsx" -> "invoices"
 */
function extractSectionIdFromSrc(path: string): string | null {
  const match = path.match(/\/src\/sections\/([^/]+)\//)
  return match?.[1] || null
}

/**
 * Extract screen design name from a file path
 * e.g., "/src/sections/invoices/InvoiceList.tsx" -> "InvoiceList"
 */
function extractScreenDesignName(path: string): string | null {
  const match = path.match(/\/src\/sections\/[^/]+\/([^/]+)\.tsx$/)
  return match?.[1] || null
}

/**
 * Extract screenshot name from a file path
 * e.g., "/product/sections/invoices/invoice-list.png" -> "invoice-list"
 */
function extractScreenshotName(path: string): string | null {
  const match = path.match(/\/product\/sections\/[^/]+\/([^/]+)\.png$/)
  return match?.[1] || null
}

/**
 * Get screen designs for a specific section
 */
export function getSectionScreenDesigns(sectionId: string): ScreenDesignInfo[] {
  const screenDesigns: ScreenDesignInfo[] = []
  const prefix = `/src/sections/${sectionId}/`

  for (const path of Object.keys(screenDesignModules)) {
    if (path.startsWith(prefix)) {
      const name = extractScreenDesignName(path)
      if (name) {
        screenDesigns.push({
          name,
          path,
          componentName: name,
        })
      }
    }
  }

  return screenDesigns
}

/**
 * Get screenshots for a specific section
 */
export function getSectionScreenshots(sectionId: string): ScreenshotInfo[] {
  const screenshots: ScreenshotInfo[] = []
  const prefix = `/product/sections/${sectionId}/`

  for (const [path, url] of Object.entries(screenshotFiles)) {
    if (path.startsWith(prefix)) {
      const name = extractScreenshotName(path)
      if (name) {
        screenshots.push({
          name,
          path,
          url,
        })
      }
    }
  }

  return screenshots
}

/**
 * Load all data for a specific section
 */
export function loadSectionData(sectionId: string): SectionData {
  const specPath = `/product/sections/${sectionId}/spec.md`
  const dataPath = `/product/sections/${sectionId}/data.json`

  const specContent = specFiles[specPath] || null
  const dataModule = dataFiles[dataPath]
  const data = dataModule?.default || null

  return {
    sectionId,
    spec: specContent,
    specParsed: specContent ? parseSpec(specContent) : null,
    data,
    screenDesigns: getSectionScreenDesigns(sectionId),
    screenshots: getSectionScreenshots(sectionId),
  }
}

/**
 * Check if a section has a spec.md file
 */
export function hasSectionSpec(sectionId: string): boolean {
  return `/product/sections/${sectionId}/spec.md` in specFiles
}

/**
 * Check if a section's screen designs should use the app shell
 * Returns true by default, false if spec contains "shell: false"
 */
export function sectionUsesShell(sectionId: string): boolean {
  const specPath = `/product/sections/${sectionId}/spec.md`
  const specContent = specFiles[specPath]
  if (!specContent) return true // Default to using shell if no spec

  const parsed = parseSpec(specContent)
  return parsed?.useShell ?? true
}

/**
 * Check if a section has a data.json file
 */
export function hasSectionData(sectionId: string): boolean {
  return `/product/sections/${sectionId}/data.json` in dataFiles
}

/**
 * Get all section IDs that have any artifacts
 */
export function getAllSectionIds(): string[] {
  const ids = new Set<string>()

  for (const path of Object.keys(specFiles)) {
    const id = extractSectionIdFromProduct(path)
    if (id) ids.add(id)
  }

  for (const path of Object.keys(dataFiles)) {
    const id = extractSectionIdFromProduct(path)
    if (id) ids.add(id)
  }

  for (const path of Object.keys(screenDesignModules)) {
    const id = extractSectionIdFromSrc(path)
    if (id) ids.add(id)
  }

  return Array.from(ids)
}
