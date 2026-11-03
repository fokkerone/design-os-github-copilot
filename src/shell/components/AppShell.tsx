import { Gauge } from 'lucide-react'
import { MainNav, type NavigationItem } from './MainNav'
import { UserMenu, type ShellUser } from './UserMenu'

export interface AppShellProps {
  children?: React.ReactNode
  navigationItems?: NavigationItem[]
  user?: ShellUser
  onNavigate?: (href: string) => void
  onLogout?: () => void
}

/** Top bar on desktop, bottom tab bar on phones. The content sits in a centered column. */
export default function AppShell({ children, navigationItems = [], user, onNavigate, onLogout }: AppShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-stone-50 font-sans text-stone-900 dark:bg-stone-950 dark:text-stone-50">
      <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b border-stone-200 bg-white px-4 dark:border-stone-800 dark:bg-stone-900">
        <span className="flex items-center gap-2 text-base font-semibold">
          <Gauge className="size-5 text-teal-600 dark:text-teal-300" aria-hidden /> MeterMate
        </span>
        <div className="mx-auto hidden sm:block">
          <MainNav items={navigationItems} onNavigate={onNavigate} />
        </div>
        <div className="ml-auto sm:ml-0">{user && <UserMenu user={user} onLogout={onLogout} />}</div>
      </header>
      <main className="mx-auto w-full max-w-[640px] flex-1">{children}</main>
      <div className="sticky bottom-0 sm:hidden">
        <MainNav items={navigationItems} onNavigate={onNavigate} variant="tabs" />
      </div>
    </div>
  )
}
