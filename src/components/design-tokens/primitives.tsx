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
        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          {title}
          {count !== undefined && (
            <span className="ml-2 font-mono text-xs normal-case tracking-normal text-muted-foreground">
              {count}
            </span>
          )}
        </h4>
      </div>
      {hint && <p className="text-xs text-muted-foreground -mt-1">{hint}</p>}
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
        'inline-flex max-w-full items-center gap-1 truncate rounded px-1 -mx-1 text-left font-mono text-[11px] text-muted-foreground',
        'hover:bg-accent hover:text-foreground transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
    >
      {copied ? <Check className="h-3 w-3 shrink-0 text-primary" strokeWidth={2} /> : null}
      <span className="truncate">{copied ? 'Copied' : value}</span>
    </button>
  )
}

/** Color value in the active format (OKLCH or hex), copyable. */
export function ColorCode({ value, className }: { value: ColorValue | null; className?: string }) {
  const format = useValueFormat()
  if (!value) return <span className={cn('font-mono text-[11px] text-muted-foreground', className)}>—</span>
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
          'flex items-center justify-center rounded-md border border-dashed border-border text-[10px] text-muted-foreground',
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
        'rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-foreground',
        className,
      )}
    >
      {children}
    </code>
  )
}
