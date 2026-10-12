import { useState, type ReactNode } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ColorValue } from '@/types/design-tokens'
import { formatColor, useValueFormat } from './value-format'

/** Section inside a token tab: small uppercase label, optional hint, content. */
export function TokenGroup({
  title,
  hint,
  count,
  children,
}: {
  title: string
  hint?: ReactNode
  count?: number
  children: ReactNode
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between gap-4">
        <h4 className="text-sm font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">
          {title}
          {count !== undefined && (
            <span className="ml-2 font-mono text-xs normal-case tracking-normal text-stone-400 dark:text-stone-500">
              {count}
            </span>
          )}
        </h4>
      </div>
      {hint && <p className="text-xs text-stone-500 dark:text-stone-400 -mt-1">{hint}</p>}
      {children}
    </section>
  )
}

/** Monospace value that copies itself on click. */
export function CopyValue({ value, className }: { value: string; className?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(value)
        setCopied(true)
        setTimeout(() => setCopied(false), 1200)
      }}
      title={`Copy ${value}`}
      className={cn(
        'inline-flex max-w-full items-center gap-1 truncate rounded px-1 -mx-1 text-left font-mono text-[11px] text-stone-500 dark:text-stone-400',
        'hover:bg-stone-100 hover:text-stone-800 dark:hover:bg-stone-800 dark:hover:text-stone-200 transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500',
        className,
      )}
    >
      {copied ? <Check className="h-3 w-3 shrink-0 text-lime-600" strokeWidth={2} /> : null}
      <span className="truncate">{copied ? 'Copied' : value}</span>
    </button>
  )
}

/** Color value in the active format (OKLCH or hex), copyable. */
export function ColorCode({ value, className }: { value: ColorValue | null; className?: string }) {
  const format = useValueFormat()
  if (!value) return <span className={cn('font-mono text-[11px] text-stone-400', className)}>—</span>
  return <CopyValue value={formatColor(value, format)} className={className} />
}

/** Checkerboard behind a color so transparency stays visible. */
const checker =
  'bg-[conic-gradient(#e7e5e4_25%,#ffffff_0_50%,#e7e5e4_0_75%,#ffffff_0)] bg-[length:10px_10px] dark:bg-[conic-gradient(#44403c_25%,#1c1917_0_50%,#44403c_0_75%,#1c1917_0)]'

export function Swatch({
  value,
  className,
  children,
  title,
}: {
  value: ColorValue | null
  className?: string
  children?: ReactNode
  title?: string
}) {
  if (!value) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-md border border-dashed border-stone-300 dark:border-stone-600 text-[10px] text-stone-400',
          className,
        )}
        title={title ?? 'Not defined'}
      >
        not set
      </div>
    )
  }
  return (
    <div className={cn('relative overflow-hidden rounded-md', value.alpha < 1 && checker, className)} title={title ?? `${value.oklch} · ${value.hex}`}>
      <div className="absolute inset-0 ring-1 ring-inset ring-black/10 dark:ring-white/10 rounded-[inherit]" style={{ backgroundColor: value.oklch }} />
      {children && <div className="relative h-full">{children}</div>}
    </div>
  )
}

/** Small mono pill for a CSS variable or utility class. */
export function CodePill({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <code
      className={cn(
        'rounded bg-stone-100 px-1.5 py-0.5 font-mono text-[11px] text-stone-700 dark:bg-stone-800 dark:text-stone-300',
        className,
      )}
    >
      {children}
    </code>
  )
}
