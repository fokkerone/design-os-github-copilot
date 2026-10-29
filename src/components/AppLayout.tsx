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
    <div className="animate-fade-in px-4 py-6 @2xl:px-6">
      {backTo && (
        <div className="mb-6 flex items-center gap-3 text-sm">
          <Link
            to={backTo}
            className="-ml-1 inline-flex items-center gap-1.5 rounded-md px-1 py-0.5 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
            {backLabel}
          </Link>
          {title && (
            <>
              <span className="h-4 w-px bg-muted" />
              <span className="truncate font-medium text-foreground">{title}</span>
            </>
          )}
        </div>
      )}
      {children}
    </div>
  )
}
