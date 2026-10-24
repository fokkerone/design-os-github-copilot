/** The product's UI layer as data: the primitives in src/ui/ and their declared props */
import declaredProps, { usage as declaredUsage } from 'virtual:component-props'
import type { DeclaredProp } from '@/lib/live-edit/component-props'

const UI_DIR = 'src/ui/'

export interface UiComponent {
  name: string
  file: string
  props: DeclaredProp[]
  /** The design files (screens, shell, clickdummy) that import it */
  usedIn: string[]
}

/** The product's UI primitives (src/ui/) with the props their types declare, sorted by file */
export function uiComponents(
  all: Record<string, Record<string, DeclaredProp[]>> = declaredProps,
  usage: Record<string, Record<string, string[]>> = declaredUsage,
): UiComponent[] {
  // A component the props reader skipped (no call signature) is still part of the layer
  const files = new Set([...Object.keys(all), ...Object.keys(usage)].filter((file) => file.startsWith(UI_DIR)))
  return [...files].sort().flatMap((file) => {
    const names = [...new Set([...Object.keys(all[file] ?? {}), ...Object.keys(usage[file] ?? {})])]
    return names.map((name) => ({ name, file, props: all[file]?.[name] ?? [], usedIn: usage[file]?.[name] ?? [] }))
  })
}
