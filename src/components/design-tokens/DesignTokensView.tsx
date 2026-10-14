import { useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { findStaleInputs } from '@/lib/design-tokens-loader'
import type { DesignTokens } from '@/types/design-tokens'
import { AlphaColors, CustomColors, Gradients, Palettes, SemanticColors } from './ColorTokens'
import { FontFamilies, FontWeights, TextStyles, TypeScale } from './TypographyTokens'
import { Breakpoints, RadiusScale, SizingSummary, SpacingScale } from './LayoutTokens'
import { BlurEffects, OpacityScale, Shadows } from './EffectTokens'
import { GuidelinesPanel } from './GuidelinesPanel'
import { ImportReport } from './ImportReport'
import { CodePill } from './primitives'
import { ValueFormatContext, type ValueFormat } from './value-format'

const TABS = [
  ['color', 'Color'],
  ['typography', 'Typography'],
  ['layout', 'Spacing & layout'],
  ['effects', 'Effects'],
  ['guidelines', 'Guidelines'],
  ['report', 'Import report'],
] as const

function useStaleInputs(tokens: DesignTokens): string[] | null {
  const [stale, setStale] = useState<string[] | null>(null)
  useEffect(() => {
    let cancelled = false
    findStaleInputs(tokens)
      .then((files) => !cancelled && setStale(files))
      .catch(() => !cancelled && setStale(null))
    return () => {
      cancelled = true
    }
  }, [tokens])
  return stale
}

function FormatToggle({ value, onChange }: { value: ValueFormat; onChange: (v: ValueFormat) => void }) {
  return (
    <div role="radiogroup" aria-label="Color value format" className="inline-flex rounded-md bg-stone-100 p-0.5 dark:bg-rwe-neutral-800">
      {(['oklch', 'hex'] as const).map((f) => (
        <button
          key={f}
          type="button"
          role="radio"
          aria-checked={value === f}
          onClick={() => onChange(f)}
          className={cn(
            'rounded px-2.5 py-1 font-mono text-[11px] uppercase transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-500',
            value === f
              ? 'bg-rwe-sand-25 text-stone-900 shadow-sm dark:bg-rwe-neutral-700 dark:text-rwe-neutral-100'
              : 'text-stone-500 hover:text-stone-800 dark:text-rwe-neutral-400 dark:hover:text-rwe-neutral-200',
          )}
        >
          {f}
        </button>
      ))}
    </div>
  )
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: 'warning' }) {
  return (
    <div className="rounded-md bg-stone-50 dark:bg-rwe-neutral-800/50 px-3 py-2">
      <p className={cn('text-lg font-semibold tabular-nums', tone === 'warning' && value > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-stone-900 dark:text-rwe-neutral-100')}>
        {value.toLocaleString('en-US')}
      </p>
      <p className="text-[11px] text-stone-500 dark:text-rwe-neutral-400">{label}</p>
    </div>
  )
}

export function DesignTokensView({ tokens, guide }: { tokens: DesignTokens; guide: string | null }) {
  const [format, setFormat] = useState<ValueFormat>('oklch')
  const stale = useStaleInputs(tokens)
  const { meta } = tokens

  return (
    <ValueFormatContext.Provider value={format}>
      <Card className="border-stone-200 dark:border-rwe-neutral-700 shadow-sm">
        <CardHeader className="pb-4 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-stone-500 dark:text-rwe-neutral-400">Imported design system</p>
              <h3 className="text-lg font-semibold text-stone-900 dark:text-rwe-neutral-100">{meta.title ?? meta.name ?? 'Design tokens'}</h3>
              {meta.source.figmaFile && (
                <p className="text-xs text-stone-500 dark:text-rwe-neutral-400">
                  Figma: {meta.source.figmaFile}
                  {meta.source.figmaPage ? ` · ${meta.source.figmaPage}` : ''}
                </p>
              )}
            </div>
            <FormatToggle value={format} onChange={setFormat} />
          </div>

          <div className="grid grid-cols-2 @2xl:grid-cols-4 gap-2">
            <Stat label="DTCG tokens" value={meta.counts.tokens} />
            <Stat label="CSS variables" value={meta.counts.cssVariables} />
            <Stat label="Documented only" value={meta.counts.documentedOnly} />
            <Stat label="Warnings" value={meta.counts.warnings} tone="warning" />
          </div>

          {stale && stale.length > 0 ? (
            <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
              <RefreshCw className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                Out of date: {stale.join(', ')} changed since the last build. Run <CodePill>npm run tokens:build</CodePill>.
              </span>
            </div>
          ) : stale ? (
            <p className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-rwe-neutral-400">
              <CheckCircle2 className="h-3.5 w-3.5 text-brand-blue-600" />
              In sync with <CodePill>product/design-system/import/</CodePill> · Style Dictionary {meta.generator.styleDictionary}
            </p>
          ) : null}
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="color" className="gap-6">
            <TabsList className="h-auto w-full flex-wrap justify-start gap-1 bg-stone-100 dark:bg-rwe-neutral-800">
              {TABS.map(([value, label]) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className="flex-none text-stone-600 data-[state=active]:bg-rwe-sand-25 data-[state=active]:text-stone-900 dark:text-rwe-neutral-400 dark:data-[state=active]:bg-stone-700 dark:data-[state=active]:text-stone-100"
                >
                  {label}
                  {value === 'report' && meta.counts.warnings > 0 && <AlertTriangle className="text-amber-500" />}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="color" className="space-y-10">
              <SemanticColors tokens={tokens.color.semantic} />
              <CustomColors tokens={tokens.color.custom} />
              <AlphaColors scales={tokens.color.alpha} />
              <Palettes palettes={tokens.color.palettes} />
              <Gradients gradients={tokens.color.gradients} />
            </TabsContent>

            <TabsContent value="typography" className="space-y-10">
              <FontFamilies typography={tokens.typography} />
              <TypeScale typography={tokens.typography} />
              <FontWeights typography={tokens.typography} />
              <TextStyles typography={tokens.typography} />
            </TabsContent>

            <TabsContent value="layout" className="space-y-10">
              <SpacingScale spacing={tokens.spacing} />
              <RadiusScale radius={tokens.radius} />
              <Breakpoints breakpoints={tokens.breakpoints} />
              <SizingSummary sizing={tokens.sizing} layout={tokens.layout} />
            </TabsContent>

            <TabsContent value="effects" className="space-y-10">
              <Shadows shadows={tokens.shadows} />
              <BlurEffects effects={tokens.effects} />
              <OpacityScale opacity={tokens.opacity} />
            </TabsContent>

            <TabsContent value="guidelines">
              <GuidelinesPanel tokens={tokens} guide={guide} />
            </TabsContent>

            <TabsContent value="report">
              <ImportReport tokens={tokens} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </ValueFormatContext.Provider>
  )
}
