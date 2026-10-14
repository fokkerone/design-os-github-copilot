import { useMemo, type ReactNode } from 'react'
import { Link, Navigate, Outlet, useLocation } from 'react-router-dom'
import { AppShell } from './AppShell'
import { SplitLayout } from './SplitLayout'
import { ChatPanel } from '@/components/chat/ChatDock'
import { ChatProvider } from '@/components/chat/ChatProvider'
import { buildNavigation, legacyRedirect, type NavFacts, type NavItem } from '@/lib/navigation'
import { loadNavFacts } from '@/lib/navigation-facts'
import { useShellTheme } from '@/lib/shell-theme'
import { useChat } from '@/lib/chat/chat-context'
import { paths } from '@/lib/paths'

function activeTitle(items: NavItem[]): string {
  for (const item of items) {
    const child = item.children?.find((c) => c.isActive)
    if (child) return child.label
    if (item.isActive) return item.label
  }
  return 'Design OS'
}

interface AppFrameProps {
  /** Override the facts read from the project files (tests) */
  facts?: NavFacts
  /** Override the chat (tests, later the OpenCode chat) */
  chat?: ReactNode
}

/** Layout route: sidebar, header, chat and the page of the current step in the step panel */
export function AppFrame({ facts, chat }: AppFrameProps) {
  const { pathname } = useLocation()
  const [theme, setTheme] = useShellTheme()
  // Files can change while the app runs (the agent writes them), so facts refresh on navigation
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const navFacts = useMemo(() => facts ?? loadNavFacts(), [facts, pathname])
  const navigation = useMemo(() => buildNavigation(pathname, navFacts), [pathname, navFacts])

  const frame = (
    <AppShell navigation={navigation} theme={theme} onThemeChange={setTheme}>
      <FramedSplit title={activeTitle(navigation)} chat={chat ?? <ChatPanel />} />
    </AppShell>
  )
  // One OpenCode runtime for chat and pages. An overriding chat (tests) brings its own.
  return chat ? frame : <ChatProvider>{frame}</ChatProvider>
}

/** Reads the agent activity from the chat of the provider above, for the header indicator */
function FramedSplit({ title, chat }: { title: string; chat: ReactNode }) {
  const activity = useChat()?.activity ?? 'idle'
  return (
    <SplitLayout title={title} chat={chat} chatActivity={activity}>
      <Outlet />
    </SplitLayout>
  )
}

/** Catch-all: old routes redirect to their new place, everything else is a 404 */
export function LegacyOrNotFound() {
  const { pathname, search, hash } = useLocation()
  const target = legacyRedirect(pathname)
  if (target) return <Navigate to={target + search + hash} replace />
  return (
    <div className="px-6 py-12 text-[13px]">
      <p className="text-[15px] font-medium">Page not found</p>
      <p className="mt-1 text-stone-500 dark:text-rwe-neutral-400">
        <code>{pathname}</code> does not exist.
      </p>
      <Link to={paths.vision} className="mt-4 inline-block underline underline-offset-2">
        Back to Vision
      </Link>
    </div>
  )
}
