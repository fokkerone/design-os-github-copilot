import { AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { contrastLevel, contrastRatio } from '@/lib/color-contrast'
import type { ColorScale, ColorValue, GradientStyle, ModalColorToken } from '@/types/design-tokens'
import { CodePill, ColorCode, CopyValue, Swatch, TokenGroup } from './primitives'
import { formatColor, useValueFormat } from './value-format'

// ---------------------------------------------------------------------------
// Semantic colors
// ---------------------------------------------------------------------------

interface SemanticGroup {
  name: string
  pairs: { base: ModalColorToken; foreground: ModalColorToken | null }[]
}

/** Group by shared prefix (3+ tokens, e.g. sidebar-*, chart-*); pair x with x-foreground. */
function groupSemantic(tokens: ModalColorToken[]): SemanticGroup[] {
  const prefixOf = (name: string) => name.split('-')[0]
  const counts = new Map<string, number>()
  for (const t of tokens) counts.set(prefixOf(t.name), (counts.get(prefixOf(t.name)) ?? 0) + 1)
  const groupOf = (name: string) => ((counts.get(prefixOf(name)) ?? 0) >= 3 ? prefixOf(name) : 'core')

  const byName = new Map(tokens.map((t) => [t.name, t]))
  // shadcn convention: "foreground" is the text color for "background"
  const foregroundOf = (name: string) => byName.get(name === 'background' ? 'foreground' : `${name}-foreground`) ?? null
  const isPairedForeground = (name: string) =>
    (name === 'foreground' && byName.has('background')) ||
    (name.endsWith('-foreground') && byName.has(name.replace(/-foreground$/, '')))

  const groups = new Map<string, SemanticGroup>()
  for (const t of tokens) {
    if (isPairedForeground(t.name)) continue
    const key = groupOf(t.name)
    if (!groups.has(key)) groups.set(key, { name: key, pairs: [] })
    groups.get(key)!.pairs.push({ base: t, foreground: foregroundOf(t.name) })
  }
  // core first, then by name (code point order — matches the generated files)
  return [...groups.values()].sort((a, b) =>
    a.name === 'core' ? -1 : b.name === 'core' ? 1 : a.name < b.name ? -1 : a.name > b.name ? 1 : 0,
  )
}

function ContrastBadge({ fg, bg }: { fg: ColorValue | null; bg: ColorValue | null }) {
  if (!fg || !bg) return null
  const ratio = contrastRatio(fg.hex, bg.hex)
  if (ratio === null) return null
  const level = contrastLevel(ratio)
  return (
    <span
      className={cn(
        'rounded px-1 py-px font-mono text-[10px] leading-none ring-1 ring-inset ring-current/40',
        level === 'fail' && 'line-through',
      )}
      style={{ color: fg.oklch }}
      title={`WCAG contrast ${ratio}:1 (${level})`}
    >
      {ratio}:1 {level === 'fail' ? 'fail' : level}
    </span>
  )
}

function ModeTile({ bg, fg, mode }: { bg: ColorValue | null; fg: ColorValue | null; mode: 'light' | 'dark' }) {
  return (
    <div className="space-y-1.5">
      <Swatch value={bg} className="h-14" title={`${mode}: ${bg ? `${bg.oklch} · ${bg.hex}` : 'not set'}`}>
        {bg && fg && (
          <div className="flex h-full items-end justify-between p-2">
            <span className="text-lg font-semibold leading-none" style={{ color: fg.oklch }}>
              Aa
            </span>
            <ContrastBadge fg={fg} bg={bg} />
          </div>
        )}
      </Swatch>
      <div className="flex flex-col">
        <ColorCode value={bg} />
        {fg && <ColorCode value={fg} />}
      </div>
    </div>
  )
}

export function SemanticColors({ tokens }: { tokens: ModalColorToken[] }) {
  const groups = groupSemantic(tokens)
  return (
    <TokenGroup
      title="Semantic colors"
      count={tokens.length}
      hint={
        <>
          Switch with the theme via <CodePill>:root</CodePill> / <CodePill>.dark</CodePill>. Tiles show the
          background with its <CodePill>-foreground</CodePill> pair and the WCAG contrast.
        </>
      }
    >
      <div className="space-y-6">
        {groups.map((group) => (
          <div key={group.name} className="space-y-2">
            {groups.length > 1 && (
              <p className="text-xs font-medium capitalize text-stone-600 dark:text-rwe-neutral-300">{group.name}</p>
            )}
            <div className="hidden @2xl:grid grid-cols-[14rem_1fr_1fr] gap-4 text-[11px] uppercase tracking-wide text-stone-400 dark:text-rwe-neutral-500">
              <span>Token</span>
              <span>Light</span>
              <span>Dark</span>
            </div>
            <div className="divide-y divide-stone-100 dark:divide-rwe-neutral-800">
              {group.pairs.map(({ base, foreground }) => {
                const missingLight = !base.light || (foreground && !foreground.light)
                return (
                  <div
                    key={base.name}
                    className="grid grid-cols-2 @2xl:grid-cols-[14rem_1fr_1fr] gap-x-4 gap-y-2 py-3"
                  >
                    <div className="col-span-2 @2xl:col-span-1 min-w-0 space-y-1">
                      <p className="flex items-center gap-1.5 text-sm font-medium text-stone-900 dark:text-rwe-neutral-100">
                        {base.name}
                        {missingLight && (
                          <AlertTriangle
                            className="h-3.5 w-3.5 text-amber-500"
                            strokeWidth={2}
                            aria-label="Light value missing in tokens.json"
                          />
                        )}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        <CodePill>{base.utility}</CodePill>
                        {foreground && <CodePill>{foreground.utility}</CodePill>}
                      </div>
                    </div>
                    <ModeTile bg={base.light} fg={foreground?.light ?? null} mode="light" />
                    <ModeTile bg={base.dark} fg={foreground?.dark ?? null} mode="dark" />
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </TokenGroup>
  )
}

// ---------------------------------------------------------------------------
// Custom colors
// ---------------------------------------------------------------------------

export function CustomColors({ tokens }: { tokens: ModalColorToken[] }) {
  if (!tokens.length) return null
  return (
    <TokenGroup title="Custom colors" count={tokens.length}>
      <div className="grid grid-cols-2 @2xl:grid-cols-4 @5xl:grid-cols-6 gap-4">
        {tokens.map((t) => (
          <div key={t.name} className="space-y-1.5 min-w-0">
            <div className="flex gap-1">
              <Swatch value={t.light} className="h-12 flex-1" />
              {t.dark && <Swatch value={t.dark} className="h-12 flex-1" />}
            </div>
            <p className="text-sm font-medium text-stone-900 dark:text-rwe-neutral-100 truncate">{t.name}</p>
            <CopyValue value={t.cssVar} />
            <ColorCode value={t.light} />
          </div>
        ))}
      </div>
    </TokenGroup>
  )
}

// ---------------------------------------------------------------------------
// Scales (palettes, alpha)
// ---------------------------------------------------------------------------

function ScaleRow({ scale, label }: { scale: ColorScale; label?: string }) {
  const format = useValueFormat()
  return (
    <div className="grid grid-cols-[4.5rem_minmax(0,1fr)] items-start gap-3">
      <p className="pt-2.5 text-xs font-medium text-stone-700 dark:text-rwe-neutral-300 truncate" title={scale.name}>
        {label ?? scale.name}
      </p>
      <div className="flex min-w-0 gap-1 overflow-x-auto">
        {scale.steps.map((step) => (
          <button
            key={step.step}
            type="button"
            onClick={() => navigator.clipboard?.writeText(formatColor(step.value, format))}
            className="group min-w-0 flex-1 text-left focus-visible:outline-none"
            title={`${step.cssVar}\n${step.value.oklch}\n${step.value.hex}\nClick to copy`}
          >
            <Swatch
              value={step.value}
              className="h-9 transition-transform group-hover:-translate-y-0.5 group-focus-visible:ring-2 group-focus-visible:ring-brand-blue-500"
            />
            <span className="mt-1 block truncate text-center font-mono text-[10px] text-stone-400 dark:text-rwe-neutral-500">
              {step.step}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

export function Palettes({ palettes }: { palettes: ColorScale[] }) {
  if (!palettes.length) return null
  const steps = palettes.reduce((sum, p) => sum + p.steps.length, 0)
  return (
    <TokenGroup
      title="Palettes"
      count={steps}
      hint={
        <>
          Utility <CodePill>bg-{'{palette}'}-{'{step}'}</CodePill>. Prefer semantic colors; palettes are for data
          visualization and exceptions. Click a swatch to copy its value.
        </>
      }
    >
      <div className="space-y-2">
        {palettes.map((p) => (
          <ScaleRow key={p.name} scale={p} />
        ))}
      </div>
    </TokenGroup>
  )
}

export function AlphaColors({ scales }: { scales: ColorScale[] }) {
  if (!scales.length) return null
  return (
    <TokenGroup
      title="Alpha colors"
      count={scales.reduce((sum, s) => sum + s.steps.length, 0)}
      hint={
        <>
          Utility <CodePill>bg-{'{role}'}-alpha-{'{step}'}</CodePill>, for tints, hovers and focus halos.
        </>
      }
    >
      <div className="space-y-2">
        {scales.map((s) => (
          <ScaleRow key={s.name} scale={s} />
        ))}
      </div>
    </TokenGroup>
  )
}

// ---------------------------------------------------------------------------
// Gradients (Figma styles, not tokens)
// ---------------------------------------------------------------------------

export function Gradients({ gradients }: { gradients: GradientStyle[] }) {
  if (!gradients.length) return null
  return (
    <TokenGroup
      title="Gradients"
      count={gradients.length}
      hint="Figma paint styles from DESIGN.md — reference only, not part of tokens.css. Direction is not exported."
    >
      <div className="grid grid-cols-1 @2xl:grid-cols-2 @5xl:grid-cols-3 gap-4">
        {gradients.map((g, i) => (
          <div key={`${g.name}-${i}`} className="space-y-1.5 min-w-0">
            {g.css ? (
              <div
                className="h-12 rounded-md ring-1 ring-inset ring-black/10 dark:ring-white/10"
                style={{ backgroundImage: g.css.replace('linear-gradient(', 'linear-gradient(to right, ') }}
              />
            ) : (
              <div className="flex h-12 items-center justify-center rounded-md border border-dashed border-stone-300 text-[11px] text-stone-400 dark:border-rwe-neutral-600">
                incomplete in export
              </div>
            )}
            <p className="text-sm font-medium text-stone-900 dark:text-rwe-neutral-100 truncate">{g.label}</p>
            {g.css ? <CopyValue value={g.css} /> : <p className="font-mono text-[11px] text-stone-400 truncate">{g.raw}</p>}
          </div>
        ))}
      </div>
    </TokenGroup>
  )
}
