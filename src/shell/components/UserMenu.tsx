import { useState } from 'react'
import { LogOut } from 'lucide-react'

export interface ShellUser {
  name: string
  avatarUrl?: string
}

export function UserMenu({ user, onLogout }: { user: ShellUser; onLogout?: () => void }) {
  const [open, setOpen] = useState(false)
  const initials = user.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
  return (
    <div className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu for ${user.name}`}
        onClick={() => setOpen(!open)}
        className="flex size-9 items-center justify-center rounded-full bg-teal-600 text-xs font-semibold text-white outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:bg-teal-300 dark:text-stone-900" /* token: primary */
      >
        {initials}
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-11 z-20 w-48 rounded-lg border border-stone-200 bg-white p-1 shadow-lg dark:border-stone-800 dark:bg-stone-900">
          <p className="px-3 py-2 text-sm font-medium text-stone-900 dark:text-stone-50">{user.name}</p>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              onLogout?.()
            }}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-stone-700 hover:bg-stone-100 dark:text-stone-200 dark:hover:bg-stone-800"
          >
            <LogOut className="size-4" aria-hidden /> Sign out
          </button>
        </div>
      )}
    </div>
  )
}
