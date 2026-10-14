import { useState } from 'react'
import { Maximize2, MessageSquare, Minimize2, PanelRight } from 'lucide-react'
import type { AgentActivity } from '@/lib/chat/activity'

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
  /** What the agent does, shown by the chat icon in the header */
  chatActivity?: AgentActivity
  onPanelModeChange?: (mode: PanelMode) => void
}

const border = 'border-stone-200 dark:border-rwe-neutral-800'

/**
 * Chat on the left, the page of the current step on the right (layout of the reference app).
 * The chat stays mounted in every mode, so a running conversation survives navigation and expanding.
 */
export function SplitLayout({ title, chat, children, panelMode, onPanelModeChange, chatActivity = 'idle' }: SplitLayoutProps) {
  const [internal, setInternal] = useState<PanelMode>('open')
  const requested = panelMode ?? internal
  const hasChat = chat !== undefined
  const mode: PanelMode = hasChat ? requested : 'expanded'
  const setMode = (next: PanelMode) => {
    setInternal(next)
    onPanelModeChange?.(next)
  }

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

      <div className="relative flex min-h-0 flex-1">
        {hasChat && (
          <div data-pane="chat" className={`min-w-0 flex-1 flex-col ${mode === 'expanded' ? 'hidden' : 'flex'}`}>
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
                className="fixed inset-0 z-30 bg-rwe-black-a-25 lg:hidden"
              />
            )}
            <aside
              aria-label="Step"
              className={`flex flex-col bg-rwe-sand-50 dark:bg-rwe-neutral-900 ${
                hasChat ? 'fixed inset-y-0 right-0 z-40 w-full max-w-[560px] shadow-xl lg:static lg:z-auto lg:max-w-none lg:shadow-none' : 'min-w-0 flex-1'
              } ${
                mode === 'expanded' || !hasChat ? 'lg:flex-1' : `lg:w-[46%] lg:shrink-0 lg:border-l xl:w-[44%] ${border}`
              }`}
            >
              <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
            </aside>
          </>
        )}
      </div>
    </div>
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
