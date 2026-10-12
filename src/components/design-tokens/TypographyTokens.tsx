import type { DesignTokens } from '@/types/design-tokens'
import { CodePill, CopyValue, TokenGroup } from './primitives'

type Typography = DesignTokens['typography']

const SAMPLE = 'The quick brown fox jumps over the lazy dog'

/** Font stack from the model; families that are not installed fall back visibly. */
function bodyStack(typography: Typography): string | undefined {
  return typography.fontFamilies.find((f) => f.name === 'sans')?.stack ?? typography.fontFamilies[0]?.stack
}

export function FontFamilies({ typography }: { typography: Typography }) {
  if (!typography.fontFamilies.length) return null
  return (
    <TokenGroup
      title="Font families"
      count={typography.fontFamilies.length}
      hint="Previews use the token stack; if a family is not installed locally, the browser falls back to the next entry."
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {typography.fontFamilies.map((f) => (
          <div key={f.name} className="rounded-md border border-stone-200 dark:border-stone-700 p-4 space-y-2 min-w-0">
            <p className="text-4xl text-stone-900 dark:text-stone-100 leading-none" style={{ fontFamily: f.stack }}>
              Aa
            </p>
            <p className="text-sm font-medium text-stone-900 dark:text-stone-100 truncate">{f.family}</p>
            <div className="flex flex-wrap items-center gap-1.5">
              <CodePill>font-{f.name}</CodePill>
            </div>
            <CopyValue value={f.stack} />
          </div>
        ))}
      </div>
    </TokenGroup>
  )
}

export function TypeScale({ typography }: { typography: Typography }) {
  if (!typography.fontSizes.length) return null
  const stack = bodyStack(typography)
  return (
    <TokenGroup title="Type scale" count={typography.fontSizes.length} hint="Rendered at true size; line height shown where the token defines one.">
      <div className="divide-y divide-stone-100 dark:divide-stone-800 overflow-hidden">
        {typography.fontSizes.map((f) => (
          <div key={f.name} className="grid grid-cols-[6.5rem_1fr] items-baseline gap-4 py-3">
            <div className="space-y-0.5">
              <CodePill>text-{f.name}</CodePill>
              <p className="font-mono text-[11px] text-stone-400 dark:text-stone-500">
                {f.px}px{f.lineHeight ? ` / ${f.lineHeight.px}px` : ''}
              </p>
            </div>
            <p
              className="truncate text-stone-900 dark:text-stone-100"
              style={{
                fontFamily: stack,
                fontSize: `${f.px}px`,
                lineHeight: f.lineHeight ? `${f.lineHeight.px}px` : 1.1,
              }}
              title={`${f.cssVar}: ${f.rem}`}
            >
              {f.px >= 48 ? 'Aa Bb Cc' : SAMPLE}
            </p>
          </div>
        ))}
      </div>
    </TokenGroup>
  )
}

export function FontWeights({ typography }: { typography: Typography }) {
  if (!typography.fontWeights.length) return null
  const stack = bodyStack(typography)
  return (
    <TokenGroup title="Font weights" count={typography.fontWeights.length}>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {typography.fontWeights.map((w) => (
          <div key={w.name} className="rounded-md bg-stone-50 dark:bg-stone-800/50 px-3 py-2.5 space-y-1">
            <p className="text-2xl text-stone-900 dark:text-stone-100" style={{ fontFamily: stack, fontWeight: w.value }}>
              Ag
            </p>
            <CodePill>font-{w.name}</CodePill>
            <p className="font-mono text-[11px] text-stone-400 dark:text-stone-500">{w.value}</p>
          </div>
        ))}
      </div>
    </TokenGroup>
  )
}

export function TextStyles({ typography }: { typography: Typography }) {
  if (!typography.textStyles.length) return null
  return (
    <TokenGroup
      title="Text styles"
      count={typography.textStyles.length}
      hint="Figma text styles from DESIGN.md, mapped to the token utilities that reproduce them."
    >
      <div className="overflow-x-auto rounded-md border border-stone-200 dark:border-stone-700">
        <table className="w-full text-[13px]">
          <thead className="bg-stone-50 dark:bg-stone-900 text-left text-[11px] uppercase tracking-wide text-stone-500 dark:text-stone-400">
            <tr>
              <th className="px-3 py-2 font-medium">Style</th>
              <th className="px-3 py-2 font-medium">Size / LH</th>
              <th className="px-3 py-2 font-medium">Utilities</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
            {typography.textStyles.map((t) => (
              <tr key={t.label}>
                <td className="px-3 py-1.5 text-stone-800 dark:text-stone-200 whitespace-nowrap">
                  {t.label}
                </td>
                <td className="px-3 py-1.5 font-mono text-[11px] text-stone-500 whitespace-nowrap">
                  {t.sizePx}/{t.lineHeightPx} · {t.weightValue ?? t.weight}
                </td>
                <td className="px-3 py-1.5">
                  {t.utilities ? <CopyValue value={t.utilities} /> : <span className="text-stone-400">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </TokenGroup>
  )
}
