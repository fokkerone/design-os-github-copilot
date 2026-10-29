/**
 * Shell loading and parsing utilities
 */

import type { ShellSpec, ShellInfo } from '@/types/product'

// Load shell spec markdown file at build time
const shellSpecFiles = import.meta.glob('/product/shell/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

// The shell components and the shell preview, by name only: the preview (preview.html) runs them
const shellComponentModules = import.meta.glob('/src/shell/components/*.tsx', { query: '?designos-file', import: 'default', eager: true }) as Record<string, true>
const shellPreviewModules = import.meta.glob('/src/shell/*.tsx', { query: '?designos-file', import: 'default', eager: true }) as Record<string, true>

/**
 * Parse shell spec.md content into ShellSpec structure
 *
 * Expected format:
 * # Application Shell Specification
 *
 * ## Overview
 * Description of the shell design
 *
 * ## Navigation Structure
 * - Nav Item 1 → Section
 * - Nav Item 2 → Section
 *
 * ## Layout Pattern
 * Description of layout (sidebar, top nav, etc.)
 */
export function parseShellSpec(md: string): ShellSpec | null {
  if (!md || !md.trim()) return null

  try {
    // Extract overview
    const overviewMatch = md.match(/## Overview\s*\n+([\s\S]*?)(?=\n## |\n#[^#]|$)/)
    const overview = overviewMatch?.[1]?.trim() || ''

    // Extract navigation items
    const navSection = md.match(/## Navigation Structure\s*\n+([\s\S]*?)(?=\n## |\n#[^#]|$)/)
    const navigationItems: string[] = []

    if (navSection?.[1]) {
      const lines = navSection[1].split('\n')
      for (const line of lines) {
        const trimmed = line.trim()
        if (trimmed.startsWith('- ')) {
          navigationItems.push(trimmed.slice(2).trim())
        }
      }
    }

    // Extract layout pattern
    const layoutMatch = md.match(/## Layout Pattern\s*\n+([\s\S]*?)(?=\n## |\n#[^#]|$)/)
    const layoutPattern = layoutMatch?.[1]?.trim() || ''

    // Return null if we couldn't parse anything meaningful
    if (!overview && navigationItems.length === 0 && !layoutPattern) {
      return null
    }

    return {
      raw: md,
      overview,
      navigationItems,
      layoutPattern,
    }
  } catch {
    return null
  }
}

/**
 * Check if shell components exist
 */
export function hasShellComponents(): boolean {
  return '/src/shell/components/AppShell.tsx' in shellComponentModules
}

/** Whether the shell has a preview wrapper (src/shell/ShellPreview.tsx) */
export function hasShellPreview(): boolean {
  return '/src/shell/ShellPreview.tsx' in shellPreviewModules
}

/**
 * Load the complete shell info
 */
export function loadShellInfo(): ShellInfo | null {
  const specContent = shellSpecFiles['/product/shell/spec.md']
  const spec = specContent ? parseShellSpec(specContent) : null
  const hasComponents = hasShellComponents()

  // Return null if neither spec nor components exist
  if (!spec && !hasComponents) {
    return null
  }

  return { spec, hasComponents }
}

/**
 * Check if shell has been defined (spec or components)
 */
export function hasShell(): boolean {
  return hasShellSpec() || hasShellComponents()
}

/**
 * Check if shell spec has been defined
 */
export function hasShellSpec(): boolean {
  return '/product/shell/spec.md' in shellSpecFiles
}

/**
 * Get list of shell component names
 */
export function getShellComponentNames(): string[] {
  const names: string[] = []
  for (const path of Object.keys(shellComponentModules)) {
    const match = path.match(/\/src\/shell\/components\/([^/]+)\.tsx$/)
    if (match) {
      names.push(match[1])
    }
  }
  return names
}
