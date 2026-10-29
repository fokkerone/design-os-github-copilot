/**
 * The prototype's components, loaded on demand: the only place that imports screen designs, the
 * shell and the clickdummy. The Design OS UI lists these files by name only and shows them in an
 * iframe of preview.html, so no prototype code reaches its bundle.
 */
import React from 'react'
import { BookOpen, CalendarDays, Circle, LayoutDashboard, Users } from 'lucide-react'
import { parseSpec } from '@/lib/model/spec'
import { parseShellSpec } from '@/lib/shell-loader'

type Loader<T = React.ComponentType> = () => Promise<{ default?: T } & Record<string, unknown>>
type LazyComponent<P = object> = React.LazyExoticComponent<React.ComponentType<P>>
type ShellProps = { children?: React.ReactNode }

const screenModules = import.meta.glob('/src/sections/*/*.tsx') as Record<string, Loader>
const shellComponentModules = import.meta.glob('/src/shell/components/*.tsx') as Record<string, Loader<React.ComponentType<ShellProps>>>
const shellPreviewModules = import.meta.glob('/src/shell/*.tsx') as Record<string, Loader>
const clickdummyModules = import.meta.glob('/src/clickdummy/ClickdummyApp.tsx') as Record<string, Loader>
const specFiles = import.meta.glob('/product/sections/*/spec.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>
const shellSpecFiles = import.meta.glob('/product/shell/spec.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>

/** Whether a section's screens render inside the shell (spec.md, default: yes) */
export function sectionUsesShell(sectionId: string): boolean {
  const spec = specFiles[`/product/sections/${sectionId}/spec.md`]
  if (!spec) return true
  return parseSpec(spec)?.useShell ?? true
}

const failed = (text: string): { default: React.ComponentType } => ({ default: () => React.createElement('div', null, text) })

// Lazy components are created once per screen design / section and cached at module level, so
// their identity is stable across renders.
const screenCache = new Map<string, LazyComponent | null>()
const shellCache = new Map<string, LazyComponent<ShellProps> | null>()
let shellPreview: LazyComponent | null | undefined
let clickdummy: LazyComponent | null | undefined

export function lazyScreenDesign(sectionId: string, screenDesignName: string): LazyComponent | null {
  const key = `${sectionId}/${screenDesignName}`
  if (!screenCache.has(key)) {
    const load = screenModules[`/src/sections/${sectionId}/${screenDesignName}.tsx`]
    screenCache.set(
      key,
      load
        ? React.lazy(async () => {
            try {
              const module = await load()
              if (typeof module.default === 'function') return { default: module.default as React.ComponentType }
              console.error('Screen design does not have a valid default export:', screenDesignName)
              return failed(`Invalid screen design: ${screenDesignName}`)
            } catch (e) {
              console.error('Failed to load screen design:', screenDesignName, e)
              return failed(`Failed to load: ${screenDesignName}`)
            }
          })
        : null,
    )
  }
  return screenCache.get(key) ?? null
}

/** ShellWrapper (made to wrap arbitrary content) when it exists, else AppShell */
function appShellLoader() {
  return shellComponentModules['/src/shell/components/ShellWrapper.tsx'] ?? shellComponentModules['/src/shell/components/AppShell.tsx'] ?? null
}

// Icon mapping for known section labels
const ICONS: Record<string, typeof Circle> = {
  dashboard: LayoutDashboard,
  'rotation planning': CalendarDays,
  profiles: Users,
  'knowledge base': BookOpen,
}

/** Navigation items for the shell from its spec ("**Label** → Description"), else placeholders */
function navigationItems() {
  const spec = shellSpecFiles['/product/shell/spec.md']
  const items = (spec ? parseShellSpec(spec)?.navigationItems : null) ?? []
  if (!items.length) {
    return [
      { label: 'Dashboard', href: '/', icon: LayoutDashboard, isActive: true },
      { label: 'Items', href: '/items', icon: Circle },
      { label: 'Settings', href: '/settings', icon: Circle },
    ]
  }
  return items.map((item, index) => {
    const label = item.match(/\*\*([^*]+)\*\*/)?.[1] ?? (item.split('→')[0]?.trim() || `Item ${index + 1}`)
    return { label, href: `/${label.toLowerCase().replace(/\s+/g, '-')}`, icon: ICONS[label.toLowerCase()] ?? Circle, isActive: index === 0 }
  })
}

/** The app shell around a section's screens, or null when the section has none or opts out */
export function lazyAppShell(sectionId: string | undefined): LazyComponent<ShellProps> | null {
  const key = sectionId ?? ''
  if (!shellCache.has(key)) {
    const load = sectionId && !sectionUsesShell(sectionId) ? null : appShellLoader()
    shellCache.set(
      key,
      load
        ? React.lazy(async () => {
            const passThrough: { default: React.ComponentType<ShellProps> } = { default: ({ children }) => React.createElement(React.Fragment, null, children) }
            try {
              const module = await load()
              const Shell = (module.default ?? module.AppShell) as React.ComponentType<Record<string, unknown>> | undefined
              if (typeof Shell !== 'function') {
                console.warn('[preview] AppShell does not have a valid export')
                return passThrough
              }
              // The shell decides which props it needs
              const ShellWrapper: React.ComponentType<ShellProps> = ({ children }) =>
                React.createElement(Shell, { navigationItems: navigationItems(), user: { name: 'Demo User' }, onNavigate: () => {}, onLogout: () => {} }, children)
              return { default: ShellWrapper }
            } catch (e) {
              console.error('[preview] Failed to load AppShell:', e)
              return passThrough
            }
          })
        : null,
    )
  }
  return shellCache.get(key) ?? null
}

export function lazyShellPreview(): LazyComponent | null {
  if (shellPreview === undefined) {
    const load = shellPreviewModules['/src/shell/ShellPreview.tsx']
    shellPreview = load ? React.lazy(async () => ({ default: (await load()).default as React.ComponentType })) : null
  }
  return shellPreview
}

/** The assembled clickdummy; the clickdummy step writes it, so it may not exist yet */
export function lazyClickdummy(): LazyComponent | null {
  if (clickdummy === undefined) {
    const load = clickdummyModules['/src/clickdummy/ClickdummyApp.tsx']
    clickdummy = load
      ? React.lazy(async () => {
          const module = await load()
          return { default: (module.default ?? module.ClickdummyApp) as React.ComponentType }
        })
      : null
  }
  return clickdummy
}
