import { Gauge, UserRound } from 'lucide-react'
import AppShell from './components/AppShell'

const navigationItems = [
  { label: 'Readings', href: '/readings', icon: Gauge, isActive: true },
  { label: 'Account', href: '/account', icon: UserRound },
]

/** Preview of the application shell with placeholder content */
export default function ShellPreview() {
  return (
    <AppShell navigationItems={navigationItems} user={{ name: 'Ana Keller' }}>
      <div className="space-y-3 p-6">
        <div className="h-6 w-40 rounded-md bg-stone-200 dark:bg-stone-800" />
        <div className="h-24 rounded-xl border border-dashed border-stone-300 dark:border-stone-700" />
        <div className="h-24 rounded-xl border border-dashed border-stone-300 dark:border-stone-700" />
      </div>
    </AppShell>
  )
}
