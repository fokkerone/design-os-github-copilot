import { useEffect, useEffectEvent, useState } from 'react'
import { useDefaultLayout, usePanelRef } from 'react-resizable-panels'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { Maximize2, MessageSquare, Minimize2, PanelRight } from 'lucide-react'
import type { AgentActivity } from '@/lib/chat/activity'
import { SHOW_CHAT_EVENT } from '@/lib/chat/chat-context'

/** open: chat and step side by side, expanded: step fills the area, hidden: chat only */
export type PanelMode = 'open' | 'expanded' | 'hidden'

interface SplitLayoutProps {
  /** Header title, usually the active step */
  title: string
  /** The chat. Without it the step fills the whole area. */
  chat?: React.ReactNode
  /** The step page */
  children: React.ReactNode
  panelMode?: PanelMode
  /** Identifies the shown step, e.g. the path. On narrow screens a change opens the step sheet. */
  stepKey?: string
  /** What the agent does, shown by the chat icon in the header */
  chatActivity?: AgentActivity
  onPanelModeChange?: (mode: PanelMode) => void
}

const WIDE_QUERY = '(min-width: 1024px)'
const isWide = () => typeof window === 'undefined' || window.matchMedia(WIDE_QUERY).matches

/** Follows the lg breakpoint: wide screens get resizable panels, narrow ones an overlay sheet */
function useIsWide() {
  const [wide, setWide] = useState(isWide)
  useEffect(() => {
    const query = window.matchMedia(WIDE_QUERY)
    const update = () => setWide(query.matches)
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  return wide
}

const SPLIT_LAYOUT_KEY = 'designos:split'

const border = 'border-stone-200 dark:border-rwe-neutral-800'

/**
 * Chat on the left, the page of the current step on the right (layout of the reference app).
 * The chat stays mounted in every mode, so a running conversation survives navigation and expanding.
 */
export function SplitLayout({ title, chat, children, panelMode, onPanelModeChange, chatActivity = 'idle', stepKey }: SplitLayoutProps) {
  // Below the lg breakpoint the step is an overlay sheet, so it starts closed and the chat is visible
  const [internal, setInternal] = useState<PanelMode>(() => (isWide() ? 'open' : 'hidden'))
  const [prevKey, setPrevKey] = useState(stepKey)
  if (prevKey !== stepKey) {
    setPrevKey(stepKey)
    // Choosing another step on a narrow screen means: show it
    if (!isWide() && internal === 'hidden') setInternal('open')
  }
  const wide = useIsWide()
  const requested = panelMode ?? internal
  const hasChat = chat !== undefined
  const mode: PanelMode = hasChat ? requested : 'expanded'
  const setMode = (next: PanelMode) => {
    setInternal(next)
    onPanelModeChange?.(next)
  }

  // A page asks for the chat (Live Edit "Describe in chat"): uncover it
  const covered = hasChat && (wide ? mode === 'expanded' : mode !== 'hidden')
  const showChat = useEffectEvent(() => setMode(wide ? 'open' : 'hidden'))
  useEffect(() => {
    if (!covered) return
    const onShow = () => showChat()
    window.addEventListener(SHOW_CHAT_EVENT, onShow)
    return () => window.removeEventListener(SHOW_CHAT_EVENT, onShow)
  }, [covered])

  return (
    <div className="flex h-full min-h-[560px] flex-col text-rwe-neutral-900 dark:text-rwe-neutral-100">
      <header className={`flex h-12 shrink-0 items-center gap-3 border-b px-3 sm:px-4 ${border}`}>
        <h1 className="min-w-0 truncate px-2 text-[14px] text-rwe-neutral-900 dark:text-rwe-neutral-50">{title}</h1>
        {hasChat && (
          <div className="ml-auto flex items-center gap-1">
            <HeaderButton
              label={chatActivity === 'working' ? 'Chat, agent is working' : chatActivity === 'waiting' ? 'Chat, waiting for your answer' : 'Chat'}
              onClick={() => mode === 'expanded' && setMode('open')}
              busy={chatActivity !== 'idle'}
            >
              <MessageSquare
                className={`size-4 ${chatActivity !== 'idle' ? 'animate-pulse text-brand-blue-500 dark:text-energy-green-500' : ''}`}
                strokeWidth={1.75}
              />
            </HeaderButton>
            {mode !== 'hidden' && (
              <HeaderButton
                label={mode === 'expanded' ? 'Collapse step panel' : 'Expand step panel'}
                onClick={() => setMode(mode === 'expanded' ? 'open' : 'expanded')}
              >
                {mode === 'expanded' ? <Minimize2 className="size-4" strokeWidth={1.75} /> : <Maximize2 className="size-4" strokeWidth={1.75} />}
              </HeaderButton>
            )}
            <HeaderButton
              label={mode === 'hidden' ? 'Show step panel' : 'Hide step panel'}
              onClick={() => setMode(mode === 'hidden' ? 'open' : 'hidden')}
              pressed={mode !== 'hidden'}
            >
              <PanelRight className="size-4" strokeWidth={1.75} />
            </HeaderButton>
          </div>
        )}
      </header>

      {wide && hasChat ? (
        <ResizableSplit mode={mode} setMode={setMode} chat={chat}>
          {children}
        </ResizableSplit>
      ) : (
        <div className="relative flex min-h-0 flex-1">
          {hasChat && (
            <div data-pane="chat" className="flex min-w-0 flex-1 flex-col">
              {chat}
            </div>
          )}
          {mode !== 'hidden' && (
            <>
              {/* On narrow screens the step is an overlay sheet */}
              {hasChat && (
                <button
                  type="button"
                  aria-label="Close step"
                  onClick={() => setMode('hidden')}
                  className="fixed inset-0 z-30 bg-rwe-black-a-25"
                />
              )}
              <aside
                aria-label="Step"
                className={`flex flex-col bg-rwe-sand-50 dark:bg-rwe-neutral-900 ${
                  hasChat ? 'fixed inset-y-0 right-0 z-40 w-full max-w-[560px] shadow-xl' : 'min-w-0 flex-1'
                }`}
              >
                <div className="@container min-h-0 flex-1 overflow-y-auto">{children}</div>
              </aside>
            </>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Chat and step as resizable panels. The three modes are collapsed panels, so both stay mounted
 * (a running conversation survives expanding). Dragging a panel to its edge collapses it and
 * sets the matching mode. The sizes are remembered.
 */
function ResizableSplit({
  mode,
  setMode,
  chat,
  children,
}: {
  mode: PanelMode
  setMode: (mode: PanelMode) => void
  chat: React.ReactNode
  children: React.ReactNode
}) {
  const chatRef = usePanelRef()
  const stepRef = usePanelRef()
  const layout = useDefaultLayout({
    id: SPLIT_LAYOUT_KEY,
    panelIds: ['chat', 'step'],
    storage: typeof localStorage === 'undefined' ? undefined : localStorage,
  })

  // Mode (header buttons) to panels. Expand before collapsing, so one side is always open.
  useEffect(() => {
    const chatPanel = chatRef.current
    const stepPanel = stepRef.current
    if (!chatPanel || !stepPanel) return
    if (mode !== 'hidden' && stepPanel.isCollapsed()) stepPanel.expand()
    if (mode !== 'expanded' && chatPanel.isCollapsed()) chatPanel.expand()
    if (mode === 'hidden' && !stepPanel.isCollapsed()) stepPanel.collapse()
    if (mode === 'expanded' && !chatPanel.isCollapsed()) chatPanel.collapse()
  }, [mode, chatRef, stepRef])

  // Panels to mode (dragging to the edge)
  const onSize = (panel: 'chat' | 'step') => (size: { asPercentage: number }) => {
    const collapsed = size.asPercentage === 0
    if (collapsed) setMode(panel === 'step' ? 'hidden' : 'expanded')
    else if (mode !== 'open' && panel === (mode === 'hidden' ? 'step' : 'chat')) setMode('open')
  }

  return (
    <ResizablePanelGroup
      orientation="horizontal"
      className="min-h-0 flex-1"
      defaultLayout={layout.defaultLayout}
      onLayoutChanged={layout.onLayoutChanged}
    >
      <ResizablePanel
        id="chat"
        panelRef={chatRef}
        defaultSize="54%"
        minSize="25%"
        collapsible
        collapsedSize={0}
        onResize={onSize('chat')}
      >
        <div
          data-pane="chat"
          data-collapsed={mode === 'expanded'}
          className="flex h-full min-w-0 flex-col data-[collapsed=true]:invisible"
        >
          {chat}
        </div>
      </ResizablePanel>
      <ResizableHandle
        withHandle
        aria-label="Resize chat and step"
        className="bg-stone-200 data-[separator=active]:bg-brand-blue-500 dark:bg-rwe-neutral-800 dark:data-[separator=active]:bg-energy-green-500"
      />
      <ResizablePanel
        id="step"
        panelRef={stepRef}
        defaultSize="46%"
        minSize="25%"
        collapsible
        collapsedSize={0}
        onResize={onSize('step')}
      >
        <aside
          aria-label="Step"
          data-collapsed={mode === 'hidden'}
          className="flex h-full flex-col bg-rwe-sand-50 data-[collapsed=true]:invisible dark:bg-rwe-neutral-900"
        >
          <div className="@container min-h-0 flex-1 overflow-y-auto">{mode !== 'hidden' && children}</div>
        </aside>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}

function HeaderButton({ label, onClick, pressed, busy, children }: { label: string; onClick: () => void; pressed?: boolean; busy?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      data-busy={busy ? 'true' : undefined}
      onClick={onClick}
      className="flex size-8 items-center justify-center rounded-md text-stone-500 hover:bg-rwe-sand-500 hover:text-rwe-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rwe-focus dark:text-rwe-neutral-300 dark:hover:bg-rwe-neutral-800 dark:hover:text-rwe-neutral-50"
    >
      {children}
    </button>
  )
}
