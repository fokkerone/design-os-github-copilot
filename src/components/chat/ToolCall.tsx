import { useState } from 'react'
import { AlertCircle, Check, FileText, Loader2, Terminal, Wrench } from 'lucide-react'
import type { ToolApprovalResponse, ToolCallMessagePart, ToolCallMessagePartStatus } from '@assistant-ui/react'

import { summarizeTool } from '@/lib/chat/tool-summary'

export interface ToolCallView {
  toolName: string
  args?: unknown
  status?: ToolCallMessagePartStatus
  isError?: boolean
  approval?: ToolCallMessagePart['approval']
  respondToApproval: (response: ToolApprovalResponse) => Promise<void>
}

type Approval = NonNullable<ToolCallView['approval']>

const muted = 'text-muted-foreground'
const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rwe-focus'
const primary = `h-8 rounded-sm bg-primary px-3 text-[13px] font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground ${focusRing}`
const ghost = `h-8 rounded-sm px-3 text-[13px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground ${focusRing}`

const TOOL_ICONS: Record<string, typeof Wrench> = { bash: Terminal, read: FileText, write: FileText, edit: FileText, glob: FileText, grep: FileText }

/** A tool call of the agent, with the permission or question it waits for */
export function ToolCall({ toolName, args, status, isError, approval, respondToApproval }: ToolCallView) {
  const summary = summarizeTool(toolName, args)
  const running = status?.type === 'running' || status?.type === 'requires-action'
  const open = !!approval && approval.approved === undefined && !approval.resolution
  const state = isError || status?.type === 'incomplete' ? 'error' : running ? 'running' : 'done'
  const Icon = TOOL_ICONS[toolName] ?? Wrench

  // A question is the message itself, not a tool row
  if (approval?.display === 'questions') {
    return open ? (
      <Questions approval={approval} onRespond={respondToApproval} />
    ) : (
      <Answered approval={approval} />
    )
  }

  return (
    <div
      role="group"
      aria-label={`${toolName} ${summary}`.trim()}
      aria-busy={running}
      data-state={state}
      className={`my-1.5 rounded-md border text-[13px] ${
        open
          ? 'border-amber-300 bg-amber-50 dark:border-amber-700/60 dark:bg-amber-900/20'
          : 'border-border bg-card'
      }`}
    >
      <div className="flex items-center gap-2 px-2.5 py-1.5">
        {state === 'running' ? (
          <Loader2 className="size-3.5 shrink-0 animate-spin text-primary" aria-hidden />
        ) : state === 'error' ? (
          <AlertCircle className="size-3.5 shrink-0 text-destructive" aria-hidden />
        ) : (
          <Icon className={`size-3.5 shrink-0 ${muted}`} aria-hidden />
        )}
        <span className="font-medium">{toolName}</span>
        {summary && <span className={`min-w-0 truncate font-mono text-[12px] ${muted}`}>{summary}</span>}
        {state === 'done' && approval?.approved !== undefined && (
          <span className={`ml-auto text-[12px] ${muted}`}>{approval.approved ? 'Allowed' : 'Denied'}</span>
        )}
      </div>
      {open && <Decision approval={approval} onRespond={respondToApproval} />}
    </div>
  )
}

function Decision({ approval, onRespond }: { approval: Approval; onRespond: (r: ToolApprovalResponse) => Promise<void> }) {
  const options = approval.options ?? [
    { id: 'once', kind: 'allow-once' },
    { id: 'reject', kind: 'reject-once' },
  ]
  const label = (kind: string) => (kind === 'allow-once' ? 'Allow once' : kind === 'allow-always' ? 'Always allow' : 'Deny')
  return (
    <div className="border-t border-amber-200 px-2.5 py-2 dark:border-amber-700/40">
      <p className="mb-2 text-[12px] text-amber-900 dark:text-amber-100">The agent needs your permission to run this.</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const allow = o.kind.startsWith('allow')
          return (
            <button
              key={o.id}
              type="button"
              title={o.grants?.length ? `Allows: ${o.grants.join(', ')}` : o.description}
              onClick={() => void onRespond({ approved: allow, optionId: o.id })}
              className={allow && o.kind === 'allow-once' ? primary : ghost}
            >
              {o.label ?? label(o.kind)}
            </button>
          )
        })}
      </div>
    </div>
  )
}

type Answers = Record<string, { optionIds: string[]; text: string }>

function Questions({ approval, onRespond }: { approval: Approval; onRespond: (r: ToolApprovalResponse) => Promise<void> }) {
  const questions = approval.questions ?? []
  const [answers, setAnswers] = useState<Answers>({})
  const get = (id: string) => answers[id] ?? { optionIds: [], text: '' }
  const set = (id: string, patch: Partial<Answers[string]>) => setAnswers({ ...answers, [id]: { ...get(id), ...patch } })
  const complete = questions.every((q) => get(q.id).optionIds.length > 0 || get(q.id).text.trim() !== '')

  const submit = () => {
    const out: Record<string, { optionIds?: string[]; text?: string }> = {}
    for (const q of questions) {
      const a = get(q.id)
      out[q.id] = { ...(a.optionIds.length ? { optionIds: a.optionIds } : {}), ...(a.text.trim() ? { text: a.text.trim() } : {}) }
    }
    void onRespond({ answers: out })
  }

  return (
    <form
      className="my-2 min-w-0 space-y-4 rounded-md border border-primary/30 bg-card p-3"
      onSubmit={(e) => {
        e.preventDefault()
        if (complete) submit()
      }}
    >
      {questions.map((q) => {
        const a = get(q.id)
        const multiple = !!q.multiple
        return (
          <fieldset key={q.id} className="min-w-0 space-y-1.5 wrap-anywhere">
            {q.header && <p className={`text-[12px] ${muted}`}>{q.header}</p>}
            <legend className="text-[14px] font-medium leading-snug">{q.prompt}</legend>
            {q.options?.map((o) => {
              const checked = a.optionIds.includes(o.id)
              return (
                <label
                  key={o.id}
                  className={`flex cursor-pointer items-start gap-2 rounded-md border px-2.5 py-1.5 text-[13px] transition-colors ${
                    checked
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:bg-accent'
                  }`}
                >
                  <input
                    type={multiple ? 'checkbox' : 'radio'}
                    name={`q-${q.id}`}
                    checked={checked}
                    onChange={() =>
                      set(q.id, {
                        optionIds: multiple ? (checked ? a.optionIds.filter((x) => x !== o.id) : [...a.optionIds, o.id]) : [o.id],
                        ...(multiple ? {} : { text: '' }),
                      })
                    }
                    className="mt-0.5"
                    aria-label={o.label}
                  />
                  <span>
                    <span className="font-medium">{o.label}</span>
                    {o.description && <span className={`block text-[12px] ${muted}`}>{o.description}</span>}
                  </span>
                </label>
              )
            })}
            {q.allowFreeform && (
              <textarea
                aria-label="Your own answer"
                placeholder="Or write your own answer…"
                rows={2}
                value={a.text}
                onChange={(e) => set(q.id, { text: e.target.value, ...(multiple ? {} : { optionIds: [] }) })}
                className={`block w-full resize-none rounded-md border border-border bg-transparent px-2.5 py-1.5 text-[13px] placeholder:text-muted-foreground ${focusRing}`}
              />
            )}
          </fieldset>
        )
      })}
      <div className="flex items-center gap-1.5">
        <button type="submit" disabled={!complete} className={primary}>
          Send answer
        </button>
        {approval.dismissible && (
          <button type="button" onClick={() => void onRespond({ approved: false })} className={ghost}>
            Skip
          </button>
        )}
      </div>
    </form>
  )
}

function Answered({ approval }: { approval: Approval }) {
  const questions = approval.questions ?? []
  return (
    <div className="my-2 space-y-2 rounded-md border border-border bg-card px-3 py-2 text-[13px]">
      {questions.map((q) => {
        const a = approval.answers?.[q.id]
        const given = [...(a?.optionIds ?? []), ...(a?.text ? [a.text] : [])]
        return (
          <div key={q.id}>
            <p className={muted}>{q.prompt}</p>
            <p className="mt-0.5 flex items-center gap-1.5 font-medium">
              {approval.approved === false || given.length === 0 ? (
                <span className={`font-normal ${muted}`}>{approval.approved === false ? 'Skipped' : approval.resolution ?? 'No answer'}</span>
              ) : (
                <>
                  <Check className="size-3.5 text-primary" aria-hidden />
                  <span>{given.join(', ')}</span>
                </>
              )}
            </p>
          </div>
        )
      })}
    </div>
  )
}
