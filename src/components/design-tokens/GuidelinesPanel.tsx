import { useState } from 'react'
import { Check, ChevronDown, X } from 'lucide-react'
import { WikiMarkdown } from '@/components/WikiMarkdown'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import type { DesignTokens } from '@/types/design-tokens'
import { TokenGroup } from './primitives'

function RuleList({ items, kind }: { items: string[]; kind: 'do' | 'dont' | 'neutral' }) {
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2 text-sm text-stone-700 dark:text-stone-300">
          {kind === 'do' && <Check className="mt-0.5 h-4 w-4 shrink-0 text-lime-600" strokeWidth={2} />}
          {kind === 'dont' && <X className="mt-0.5 h-4 w-4 shrink-0 text-red-500" strokeWidth={2} />}
          {kind === 'neutral' && <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-stone-400" />}
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

export function GuidelinesPanel({ tokens, guide }: { tokens: DesignTokens; guide: string | null }) {
  const g = tokens.guidelines
  const [open, setOpen] = useState(false)
  return (
    <div className="space-y-8">
      {(g.mission || g.writingTone || g.brand.length > 0) && (
        <TokenGroup title="Overview">
          {g.mission && <p className="text-stone-700 dark:text-stone-300 leading-relaxed">{g.mission}</p>}
          <div className="flex flex-wrap gap-2">
            {g.brand.map((b) => (
              <span key={b} className="rounded bg-stone-100 px-2 py-1 text-xs text-stone-600 dark:bg-stone-800 dark:text-stone-300">
                {b}
              </span>
            ))}
            {g.writingTone && (
              <span className="rounded bg-stone-100 px-2 py-1 text-xs text-stone-600 dark:bg-stone-800 dark:text-stone-300">
                Tone: {g.writingTone}
              </span>
            )}
          </div>
        </TokenGroup>
      )}

      {(g.rulesDo.length > 0 || g.rulesDont.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {g.rulesDo.length > 0 && (
            <TokenGroup title="Do">
              <RuleList items={g.rulesDo} kind="do" />
            </TokenGroup>
          )}
          {g.rulesDont.length > 0 && (
            <TokenGroup title="Don't">
              <RuleList items={g.rulesDont} kind="dont" />
            </TokenGroup>
          )}
        </div>
      )}

      {(g.componentRules.length > 0 || g.qualityGates.length > 0 || g.accessibility.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {g.accessibility.length > 0 && (
            <TokenGroup title="Accessibility">
              <RuleList items={g.accessibility} kind="neutral" />
            </TokenGroup>
          )}
          {g.componentRules.length > 0 && (
            <TokenGroup title="Component rules">
              <RuleList items={g.componentRules} kind="neutral" />
            </TokenGroup>
          )}
          {g.qualityGates.length > 0 && (
            <TokenGroup title="Quality gates">
              <RuleList items={g.qualityGates} kind="neutral" />
            </TokenGroup>
          )}
        </div>
      )}

      {(g.components.families.length > 0 || g.components.variantAxes.length > 0) && (
        <TokenGroup title="Components">
          <div className="flex flex-wrap gap-2">
            {g.components.families.map((f) => (
              <span key={f} className="rounded-full border border-stone-200 px-2.5 py-1 text-xs text-stone-700 dark:border-stone-700 dark:text-stone-300">
                {f}
              </span>
            ))}
          </div>
          {g.components.variantAxes.length > 0 && (
            <dl className="grid grid-cols-[6rem_1fr] gap-x-4 gap-y-1.5 text-sm">
              {g.components.variantAxes.map((a) => (
                <div key={a.axis} className="contents">
                  <dt className="text-stone-500 dark:text-stone-400">{a.axis}</dt>
                  <dd className="text-stone-800 dark:text-stone-200">{a.values.join(' · ')}</dd>
                </div>
              ))}
            </dl>
          )}
        </TokenGroup>
      )}

      {g.additional.map((a) => (
        <TokenGroup key={`${a.file}-${a.heading}`} title={a.heading} hint={`Kept verbatim from ${a.file}`}>
          <WikiMarkdown markdown={a.markdown} />
        </TokenGroup>
      ))}

      {guide && (
        <Collapsible open={open} onOpenChange={setOpen} className="rounded-md border border-stone-200 dark:border-stone-700">
          <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-3 text-left">
            <span>
              <span className="block text-sm font-medium text-stone-900 dark:text-stone-100">DESIGN.md</span>
              <span className="block font-mono text-[11px] text-stone-500 dark:text-stone-400">
                product/design-system/DESIGN.md · generated, read-only
              </span>
            </span>
            <ChevronDown className={`h-4 w-4 text-stone-400 transition-transform ${open ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="border-t border-stone-200 dark:border-stone-700 px-4 py-4">
              {open && <WikiMarkdown markdown={guide.replace(/^---\n[\s\S]*?\n---\n/, '')} />}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  )
}
