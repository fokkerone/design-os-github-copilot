import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

interface AppLayoutProps {
  children: ReactNode
  /** Optional title shown next to the back link (for sub-pages) */
  title?: string
  /** Optional back navigation path */
  backTo?: string
  /** Optional back label */
  backLabel?: string
  /** Kept for call sites written for the old page layout; the step panel decides the width now */
  width?: 'default' | 'wide'
}

export function AppLayout({ children, backTo, backLabel = 'Back', title }: AppLayoutProps) {
  // The sidebar, header and step panel are the chrome (see AppFrame): a page renders only its content
  return (
    <div className="animate-fade-in px-4 py-6 sm:px-6">
      {backTo && (
        <div className="mb-6 flex items-center gap-3 text-sm">
          <Link
            to={backTo}
            className="-ml-1 inline-flex items-center gap-1.5 rounded-md px-1 py-0.5 text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
            {backLabel}
          </Link>
          {title && (
            <>
              <span className="h-4 w-px bg-stone-200 dark:bg-stone-700" />
              <span className="truncate font-medium text-stone-900 dark:text-stone-100">{title}</span>
            </>
          )}
        </div>
      )}
      {children}
    </div>
  )
}
