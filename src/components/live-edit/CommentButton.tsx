import { CheckCheck, MessageSquarePlus } from 'lucide-react'

const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rwe-focus'
const muted = 'text-stone-500 dark:text-rwe-neutral-400'
const idle = `${muted} hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-rwe-neutral-800 dark:hover:text-rwe-neutral-200`
const on = 'bg-brand-blue-500 text-white dark:bg-energy-green-500 dark:text-brand-blue-900'

/** Comment mode in the preview toolbar: numbered comments with an impeccable command (C) */
export function CommentButton({
  active,
  onToggle,
  open,
  showResolved,
  onShowResolved,
}: {
  active: boolean
  onToggle: () => void
  /** Comments that are not resolved yet */
  open: number
  showResolved: boolean
  onShowResolved: (show: boolean) => void
}) {
  return (
    <div className="flex items-center gap-0.5">
      <button
        type="button"
        aria-pressed={active}
        onClick={onToggle}
        title="Comment on the design (C)"
        className={`flex items-center gap-1.5 rounded px-2 py-1 text-xs transition-colors ${focusRing} ${active ? on : idle}`}
      >
        <MessageSquarePlus className="size-3.5" strokeWidth={1.5} />
        Comment
        {open > 0 && (
          <span
            aria-label={`${open} open`}
            className={`flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold ${
              active ? 'bg-rwe-neutral-950/20' : 'bg-brand-blue-500 text-white dark:bg-energy-green-500 dark:text-brand-blue-900'
            }`}
          >
            {open}
          </span>
        )}
      </button>
      {active && (
        <button
          type="button"
          aria-pressed={showResolved}
          onClick={() => onShowResolved(!showResolved)}
          title={showResolved ? 'Hide resolved comments' : 'Show resolved comments'}
          aria-label="Show resolved comments"
          className={`flex size-6 items-center justify-center rounded transition-colors ${focusRing} ${showResolved ? on : idle}`}
        >
          <CheckCheck className="size-3.5" strokeWidth={1.5} />
        </button>
      )}
    </div>
  )
}
