import { cn } from '@/lib/utils'
import type { DesignTokens } from '@/types/design-tokens'
import { CodePill, TokenGroup } from './primitives'

export function SpacingScale({ spacing }: { spacing: DesignTokens['spacing'] }) {
  if (!spacing.scale.length) return null
  const max = Math.max(...spacing.scale.map((s) => s.px), 1)
  return (
    <TokenGroup
      title="Spacing"
      count={spacing.scale.length}
      hint={
        spacing.base ? (
          <>
            Base unit <CodePill>--spacing: {spacing.base.rem}</CodePill> ({spacing.base.px}px). Tailwind derives{' '}
            <CodePill>p-*</CodePill> <CodePill>gap-*</CodePill> <CodePill>w-*</CodePill> from it; steps off the grid are
            emitted explicitly.
          </>
        ) : (
          'No base unit (spacing.1) — every step is emitted explicitly.'
        )
      }
    >
      <div className="space-y-1">
        {spacing.scale.map((s) => (
          <div key={s.name} className="grid grid-cols-[3.5rem_8.5rem_1fr] items-center gap-3">
            <CodePill className="justify-self-start">{s.name}</CodePill>
            <span className="font-mono text-[11px] text-stone-500 dark:text-rwe-neutral-400 whitespace-nowrap">
              {s.px}px · {s.rem}
            </span>
            <div className="flex items-center gap-2">
              <div
                className={cn('h-2.5 rounded-sm', s.conforms ? 'bg-brand-blue-500/70' : 'bg-amber-500/80')}
                style={{ width: `${Math.max((s.px / max) * 100, 0.5)}%` }}
              />
              {!s.conforms && <span className="text-[10px] text-amber-600 dark:text-amber-400 whitespace-nowrap">off grid</span>}
            </div>
          </div>
        ))}
      </div>
    </TokenGroup>
  )
}

export function SizingSummary({ sizing, layout }: { sizing: DesignTokens['sizing']; layout: DesignTokens['layout'] }) {
  if (!sizing.length && !layout.length) return null
  return (
    <TokenGroup title="Sizing and layout" hint="Documented only — Tailwind v4 derives sizing utilities from --spacing.">
      <div className="flex flex-wrap gap-2">
        {sizing.map((g) => {
          const matching = g.items.filter((i) => i.matchesSpacing).length
          return (
            <div key={g.group} className="rounded-md bg-stone-50 dark:bg-rwe-neutral-800/50 px-3 py-2">
              <p className="text-xs font-medium text-stone-700 dark:text-rwe-neutral-300">{g.group}</p>
              <p className="font-mono text-[11px] text-stone-500 dark:text-rwe-neutral-400">
                {g.items.length} steps · {matching === g.items.length ? 'all on spacing grid' : `${matching} on grid`}
              </p>
            </div>
          )
        })}
        {layout.map((l) => (
          <div key={l.name} className="rounded-md bg-stone-50 dark:bg-rwe-neutral-800/50 px-3 py-2">
            <p className="text-xs font-medium text-stone-700 dark:text-rwe-neutral-300">{l.name}</p>
            <p className="font-mono text-[11px] text-stone-500 dark:text-rwe-neutral-400">
              {l.px}px · {l.rem}
            </p>
          </div>
        ))}
      </div>
    </TokenGroup>
  )
}

export function RadiusScale({ radius }: { radius: DesignTokens['radius'] }) {
  if (!radius.length) return null
  return (
    <TokenGroup title="Radius" count={radius.length}>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(6.5rem,1fr))] gap-3">
        {radius.map((r) => (
          <div key={r.name} className="space-y-1.5 text-center">
            <div
              className="mx-auto h-14 w-14 border-2 border-stone-400 bg-stone-100 dark:border-rwe-neutral-500 dark:bg-rwe-neutral-800"
              style={{ borderRadius: r.css }}
            />
            <CodePill className="whitespace-nowrap">rounded-{r.name}</CodePill>
            <p className="font-mono text-[10px] text-stone-400 dark:text-rwe-neutral-500">{r.px >= 9999 ? 'pill' : `${r.px}px`}</p>
          </div>
        ))}
      </div>
    </TokenGroup>
  )
}

export function Breakpoints({ breakpoints }: { breakpoints: DesignTokens['breakpoints'] }) {
  if (!breakpoints.length) return null
  const max = Math.max(...breakpoints.map((b) => b.px))
  return (
    <TokenGroup title="Breakpoints" count={breakpoints.length} hint="Mobile first: a prefix applies from its min width upwards.">
      <div className="space-y-1.5">
        {breakpoints.map((b) => (
          <div key={b.name} className="grid grid-cols-[3.5rem_1fr] items-center gap-3">
            <CodePill className="justify-self-start">{b.name}:</CodePill>
            <div className="relative h-6 rounded-sm bg-stone-100 dark:bg-rwe-neutral-800">
              <div
                className="absolute inset-y-0 left-0 rounded-sm bg-stone-300/80 dark:bg-rwe-neutral-600/80"
                style={{ width: `${(b.px / max) * 100}%` }}
              />
              <span className="absolute inset-y-0 left-2 flex items-center font-mono text-[11px] text-stone-700 dark:text-rwe-neutral-200">
                ≥ {b.px}px · {b.rem}
              </span>
            </div>
          </div>
        ))}
      </div>
    </TokenGroup>
  )
}
