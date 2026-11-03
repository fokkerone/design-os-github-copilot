import type { LucideIcon } from 'lucide-react'

export interface NavigationItem {
  label: string
  href: string
  icon?: LucideIcon
  isActive?: boolean
}

interface MainNavProps {
  items: NavigationItem[]
  onNavigate?: (href: string) => void
  /** bar: inline in the top bar, tabs: bottom tab bar on phones */
  variant?: 'bar' | 'tabs'
}

export function MainNav({ items, onNavigate, variant = 'bar' }: MainNavProps) {
  if (variant === 'tabs') {
    return (
      <nav aria-label="Main" className="grid grid-cols-2 border-t border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900">
        {items.map((item) => (
          <button
            key={item.href}
            type="button"
            aria-current={item.isActive ? 'page' : undefined}
            onClick={() => onNavigate?.(item.href)}
            className={`flex flex-col items-center gap-1 py-2 text-xs font-medium ${
              item.isActive ? 'text-teal-700 dark:text-teal-300' /* token: primary */ : 'text-stone-500 dark:text-stone-400'
            }`}
          >
            {item.icon && <item.icon className="size-5" aria-hidden />}
            {item.label}
          </button>
        ))}
      </nav>
    )
  }
  return (
    <nav aria-label="Main" className="flex items-center gap-1">
      {items.map((item) => (
        <button
          key={item.href}
          type="button"
          aria-current={item.isActive ? 'page' : undefined}
          onClick={() => onNavigate?.(item.href)}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            item.isActive
              ? 'bg-teal-50 text-teal-800 dark:bg-teal-950 dark:text-teal-200' /* token: primary */
              : 'text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800'
          }`}
        >
          {item.label}
        </button>
      ))}
    </nav>
  )
}
