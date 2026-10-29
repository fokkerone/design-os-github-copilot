import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  BookOpen, Check, FileText, GitBranch, Layers, LayoutList, MousePointerClick, Package, Palette, PanelLeft,
  Route, Users, Wrench, type LucideIcon,
} from 'lucide-react'
import type { NavIconName, NavItem } from '@/lib/navigation'

const icons: Record<NavIconName, LucideIcon> = {
  prototype: MousePointerClick,
  vision: FileText,
  shell: PanelLeft,
  roadmap: Route,
  sections: LayoutList,
  preview: MousePointerClick,
  export: Package,
  personas: Users,
  flows: GitBranch,
  'design-system': Palette,
  techstack: Wrench,
  wiki: BookOpen,
}

interface MainNavProps {
  items: NavItem[]
  onNavigate?: (href: string) => void
}

export function MainNav({ items, onNavigate }: MainNavProps) {
  return (
    <nav aria-label="Main" className="flex flex-col gap-px px-2">
      {items.map((item) =>
        item.children ? (
          <CollapsibleGroup key={item.id} item={item} onNavigate={onNavigate} />
        ) : (
          <NavRow key={item.id} item={item} onNavigate={onNavigate} />
        ),
      )}
    </nav>
  )
}

function CollapsibleGroup({ item, onNavigate }: { item: NavItem; onNavigate?: (href: string) => void }) {
  const [open, setOpen] = useState(true)
  const Icon = icons[item.icon] ?? Layers
  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="group flex h-[30px] w-full items-center gap-2 rounded-md px-2 text-left text-[13px] font-medium text-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rwe-focus"
      >
        <Icon className="size-4 shrink-0 text-muted-foreground group-hover:text-foreground" strokeWidth={1.75} aria-hidden />
        <span className="truncate">{item.label}</span>
        <svg
          viewBox="0 0 8 8"
          aria-hidden
          className={`size-2 shrink-0 fill-current text-muted-foreground transition-transform duration-150 ${open ? 'rotate-90' : ''}`}
        >
          <path d="M2 1l4 3-4 3z" />
        </svg>
      </button>
      {open && (
        <ul className="mt-px flex flex-col gap-px pl-3">
          {item.children!.map((child) => (
            <NavRow key={child.id} item={child} onNavigate={onNavigate} nested />
          ))}
        </ul>
      )}
    </div>
  )
}

function NavRow({ item, onNavigate, nested }: { item: NavItem; onNavigate?: (href: string) => void; nested?: boolean }) {
  const Icon = icons[item.icon] ?? Layers
  const row = (
    <NavLink
      to={item.href}
      end={false}
      data-status={item.status}
      aria-current={item.isActive ? 'page' : undefined}
      onClick={() => onNavigate?.(item.href)}
      className={`group flex h-[30px] w-full items-center gap-2 rounded-md px-2 text-left text-[13px] font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rwe-focus ${
        item.isActive
          ? 'bg-muted text-foreground'
          : 'text-foreground hover:bg-accent hover:text-foreground'
      }`}
    >
      <Icon
        className={`size-4 shrink-0 ${
          item.isActive
            ? 'text-foreground'
            : 'text-muted-foreground group-hover:text-foreground'
        }`}
        strokeWidth={1.75}
        aria-hidden
      />
      <span className="truncate">{item.label}</span>
      {nested && item.status === 'completed' && (
        <Check className="ml-auto size-3.5 shrink-0 text-primary" strokeWidth={2} aria-hidden />
      )}
      {item.badge ? (
        <span className="ml-auto flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[11px] font-semibold text-primary-foreground">
          {item.badge}
        </span>
      ) : null}
    </NavLink>
  )
  return nested ? <li>{row}</li> : row
}
