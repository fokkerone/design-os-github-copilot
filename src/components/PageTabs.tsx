import { NavLink } from 'react-router-dom'

export interface PageTab {
  to: string
  label: string
  /** Match the path exactly, so a parent tab is not active on its child routes */
  end?: boolean
}

/** Route-based tabs at the top of a step page, e.g. Roadmap | Data Shape */
export function PageTabs({ tabs, label }: { tabs: PageTab[]; label: string }) {
  return (
    <nav aria-label={label} className="mb-6 flex gap-1 border-b border-border">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end ?? true}
          className={({ isActive }) =>
            `-mb-px border-b-2 px-3 py-2 text-[13px] font-medium transition-colors ${
              isActive
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  )
}
