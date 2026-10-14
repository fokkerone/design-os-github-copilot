import { useState } from 'react'
import { AlertTriangle, ChevronRight, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DesignTokens, ReportIssue } from '@/types/design-tokens'
import { CodePill, TokenGroup } from './primitives'

const STATUS_STYLE: Record<string, string> = {
  used: 'bg-brand-blue-100 text-brand-blue-800 dark:bg-energy-green-950 dark:text-energy-green-300',
  partial: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300',
  superseded: 'bg-stone-100 text-stone-600 dark:bg-rwe-neutral-800 dark:text-rwe-neutral-300',
  dropped: 'bg-stone-100 text-stone-500 dark:bg-rwe-neutral-800 dark:text-rwe-neutral-400',
  verbatim: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
}

function IssueRow({ issue }: { issue: ReportIssue }) {
  const [open, setOpen] = useState(false)
  const Icon = issue.severity === 'warning' ? AlertTriangle : Info
  return (
    <li className="py-2">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-start gap-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-500 rounded"
      >
        <ChevronRight className={cn('mt-0.5 h-4 w-4 shrink-0 text-stone-400 transition-transform', open && 'rotate-90')} />
        <Icon
          className={cn('mt-0.5 h-4 w-4 shrink-0', issue.severity === 'warning' ? 'text-amber-500' : 'text-stone-400')}
          strokeWidth={2}
        />
        <span className="flex-1 text-sm text-stone-800 dark:text-rwe-neutral-200">{issue.summary}</span>
        <span className="font-mono text-xs text-stone-500">{issue.count}</span>
      </button>
      {open && (
        <ul className="mt-2 ml-12 space-y-1 max-h-64 overflow-auto">
          {issue.items.map((item, i) => (
            <li key={`${item.path}-${i}`} className="text-xs text-stone-600 dark:text-rwe-neutral-400">
              <code className="font-mono text-stone-800 dark:text-rwe-neutral-200">{item.path}</code> — {item.detail}
            </li>
          ))}
        </ul>
      )}
    </li>
  )
}

export function ImportReport({ tokens }: { tokens: DesignTokens }) {
  const { meta, report } = tokens
  const warnings = report.issues.filter((i) => i.severity === 'warning')
  const infos = report.issues.filter((i) => i.severity === 'info')
  return (
    <div className="space-y-8">
      <TokenGroup title="Pipeline">
        <ol className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
          {[
            ['1 · Import', 'product/design-system/import/', 'tokens.json (DTCG), DESIGN.md, skill.md'],
            ['2 · Convert', 'Style Dictionary ' + meta.generator.styleDictionary, 'classify · hex → OKLCH · px → rem'],
            ['3 · Generate', 'product/design-system/', 'tokens/tokens.css · tokens/tokens.json · DESIGN.md'],
            ['4 · Display', 'Design OS', 'reads tokens/tokens.json only'],
          ].map(([step, where, what]) => (
            <li key={step} className="rounded-md border border-stone-200 dark:border-rwe-neutral-700 px-3 py-2">
              <p className="font-medium text-stone-900 dark:text-rwe-neutral-100">{step}</p>
              <p className="font-mono text-[11px] text-stone-500 dark:text-rwe-neutral-400 break-all">{where}</p>
              <p className="mt-1 text-stone-600 dark:text-rwe-neutral-400">{what}</p>
            </li>
          ))}
        </ol>
      </TokenGroup>

      <TokenGroup title="Inputs">
        <div className="overflow-x-auto rounded-md border border-stone-200 dark:border-rwe-neutral-700">
          <table className="w-full text-[13px]">
            <tbody className="divide-y divide-stone-100 dark:divide-rwe-neutral-800">
              {meta.inputs.map((i) => (
                <tr key={i.file}>
                  <td className="px-3 py-2 font-medium text-stone-800 dark:text-rwe-neutral-200">{i.file}</td>
                  <td className="px-3 py-2 font-mono text-[11px] text-stone-500" title={i.sha256}>
                    sha256 {i.sha256.slice(0, 16)}…
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-[11px] text-stone-500">{i.bytes.toLocaleString('en-US')} B</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TokenGroup>

      <TokenGroup title="Warnings" count={warnings.reduce((s, i) => s + i.count, 0)} hint="Fix these in the source (Figma / tokens.json) and re-import.">
        {warnings.length ? (
          <ul className="divide-y divide-stone-100 dark:divide-rwe-neutral-800">
            {warnings.map((i) => (
              <IssueRow key={i.code} issue={i} />
            ))}
          </ul>
        ) : (
          <p className="text-sm text-stone-500">No warnings.</p>
        )}
      </TokenGroup>

      <TokenGroup title="Normalizations" count={infos.reduce((s, i) => s + i.count, 0)} hint="Applied automatically and deterministically.">
        <ul className="divide-y divide-stone-100 dark:divide-rwe-neutral-800">
          {infos.map((i) => (
            <IssueRow key={i.code} issue={i} />
          ))}
        </ul>
      </TokenGroup>

      <TokenGroup title="Not emitted to tokens.css" hint="Documented in DESIGN.md and tokens.json, intentionally not CSS variables.">
        <ul className="space-y-1.5">
          {report.notEmitted.map((n) => (
            <li key={n.category} className="grid grid-cols-[9.5rem_2.5rem_1fr] items-start gap-3 text-sm">
              <CodePill className="justify-self-start">{n.category}</CodePill>
              <span className="font-mono text-xs text-stone-500 pt-0.5 text-right">{n.count}</span>
              <span className="text-stone-600 dark:text-rwe-neutral-400">{n.reason}</span>
            </li>
          ))}
        </ul>
      </TokenGroup>

      <TokenGroup title="Source sections" hint="How each section of DESIGN.md and skill.md was merged.">
        <div className="overflow-x-auto rounded-md border border-stone-200 dark:border-rwe-neutral-700">
          <table className="w-full text-[13px]">
            <tbody className="divide-y divide-stone-100 dark:divide-rwe-neutral-800">
              {report.sources.map((s) => (
                <tr key={`${s.file}-${s.heading}`}>
                  <td className="px-3 py-1.5 font-mono text-[11px] text-stone-500 whitespace-nowrap">{s.file}</td>
                  <td className="px-3 py-1.5 text-stone-800 dark:text-rwe-neutral-200 whitespace-nowrap">{s.heading}</td>
                  <td className="px-3 py-1.5">
                    <span className={cn('rounded px-1.5 py-0.5 text-[11px] font-medium', STATUS_STYLE[s.status])}>{s.status}</span>
                  </td>
                  <td className="px-3 py-1.5 text-xs text-stone-500 dark:text-rwe-neutral-400">{s.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TokenGroup>
    </div>
  )
}
