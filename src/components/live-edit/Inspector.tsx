import { useMemo, useRef, useState } from 'react'
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  ChevronDown,
  Component,
  Italic,
  MessageSquarePlus,
  Minus,
  MousePointerClick,
  Redo2,
  RotateCcw,
  Save,
  Scan,
  Sparkles,
  Strikethrough,
  Type,
  Underline,
  Undo2,
  X,
} from 'lucide-react'
import { loadDesignTokens } from '@/lib/design-tokens-loader'
import {
  currentClass,
  currentDarkClass,
  inspectorGroups,
  isArbitrary,
  optionFromInput,
  type InspectorGroup,
  type InspectorOption,
  type InspectorProperty,
} from '@/lib/live-edit/inspector-options'
import { shortSource, type LiveEdit, type LiveSelection } from '@/lib/live-edit/selection'
import { panelClass } from './panel'
import { propEdit, propFields, type PropField } from '@/lib/live-edit/component-props'

const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rwe-focus'
const muted = 'text-muted-foreground'
const surface = 'bg-muted'
const fieldClass = `w-full rounded-md ${surface} px-2 py-1 text-[12px] text-foreground ${focusRing}`
const iconButton = `flex size-6 items-center justify-center rounded-md ${muted} hover:bg-accent hover:text-foreground disabled:opacity-40 disabled:hover:bg-transparent ${focusRing}`
const primaryButton = `flex items-center gap-1.5 rounded-md bg-primary px-2 py-1 text-[11px] font-medium text-primary-foreground hover:bg-primary/90 ${focusRing}`
// Transparent colors show a checkerboard behind the swatch
const checker = 'repeating-conic-gradient(#d6d3d1 0% 25%, #ffffff 0% 50%) 50% / 8px 8px'

/** What a property shows: the class that sets it (edited or in the source) and the computed value */
interface PropertyState {
  property: InspectorProperty
  /** The class in the source, null when none sets it */
  from: string | null
  /** The `dark:` class in the source (colors) */
  darkFrom: string | null
  /** The class now: the edit, else the source class */
  current: string | null
  option: InspectorOption | undefined
  computed: string
  edited: boolean
}

const round = (value: string) => value.replace(/(\d+\.\d{2})\d+/g, '$1')

/**
 * The Live Edit inspector, next to the preview: edits the picked element with design tokens.
 * Edits are a preview until "Apply with agent" sends them; the agent writes them to the source.
 */
export function Inspector({
  selection,
  onChange,
  onClose,
  onAddToChat,
  onApply,
  guides = false,
  onGuidesChange,
  tabs,
  onWrite,
  onRecord,
}: {
  selection: LiveSelection
  onChange: (edits: LiveEdit[]) => void
  onClose: () => void
  onAddToChat: () => void
  onApply: () => void
  /** "Show paddings and margins" in the preview */
  guides?: boolean
  onGuidesChange?: (on: boolean) => void
  /** The Layers | Inspect tabs, above the header */
  tabs?: React.ReactNode
  /** Component prop edits: writes them into the JSX at the call site, without the agent */
  onWrite?: () => Promise<{ ok: true; file: string } | { ok: false; error: string }>
  /** Sends what was written to the agent, which records it in the wiki */
  onRecord?: (edits: LiveEdit[]) => void
}) {
  const groups = useMemo(() => inspectorGroups(loadDesignTokens()), [])
  // Undo and redo walk through the edit lists of this element
  const [history, setHistory] = useState<LiveEdit[][]>([selection.edits])
  const [index, setIndex] = useState(0)
  const { element, edits } = selection

  const commit = (next: LiveEdit[]) => {
    setHistory([...history.slice(0, index + 1), next])
    setIndex(index + 1)
    onChange(next)
  }
  const step = (to: number) => {
    setIndex(to)
    onChange(history[to])
  }
  const setEdit = (property: string, edit: LiveEdit | null) => {
    const rest = edits.filter((e) => e.property !== property)
    commit(edit ? [...rest, edit] : rest)
  }

  const stateOf = (property: InspectorProperty): PropertyState => {
    const from = currentClass(property, element.classes)
    const darkFrom = currentDarkClass(property, element.classes)
    const edit = edits.find((e) => e.property === property.property)
    const current = edit?.to ?? from
    // Several options can share a class (a role that is a palette step): the edit's token, else the
    // option whose dark class the element has, else the plain one decides
    const matches = property.options.filter((o) => o.className === current)
    const option = edit
      ? (matches.find((o) => o.token === edit.token) ?? matches[0])
      : (matches.find((o) => o.dark && o.dark === darkFrom) ?? matches.find((o) => !o.dark && !o.token) ?? matches[0])
    return { property, from, darkFrom, current, option, computed: round(element.styles[property.property] ?? ''), edited: !!edit }
  }
  const choose = (state: PropertyState, option: InspectorOption | null) => {
    const { property, from, darkFrom } = state
    const same = option && option.className === from && (option.dark ?? null) === (option.dark ? darkFrom : null)
    if (!option || same) return setEdit(property.property, null)
    setEdit(property.property, {
      property: property.property,
      from,
      to: option.className,
      // The preview shows what the element shows: the dark value in a dark preview
      css: element.dark && option.darkCss ? option.darkCss : option.css,
      ...(option.token && { token: option.token }),
      ...(option.dark && { dark: { from: darkFrom, to: option.dark } }),
    })
  }

  const contentEdit = edits.find((e) => e.property === 'content')
  const controls = { stateOf, choose }
  const isComponent = element.kind === 'component'
  // "Write to source": what went in (for the wiki record), or why it failed
  const [writing, setWriting] = useState(false)
  const [written, setWritten] = useState<{ edits: LiveEdit[]; file: string; recorded?: boolean } | null>(null)
  const [writeError, setWriteError] = useState<string | null>(null)
  const canWrite = isComponent && !!onWrite && edits.length > 0 && edits.every((e) => e.prop)
  const write = async () => {
    if (!onWrite) return
    setWriting(true)
    setWriteError(null)
    const sentEdits = edits
    const result = await onWrite()
    setWriting(false)
    if (result.ok) {
      setWritten({ edits: [...(written?.recorded ? [] : (written?.edits ?? [])), ...sentEdits], file: result.file })
      setHistory([[]])
      setIndex(0)
    } else setWriteError(result.error)
  }

  return (
    <aside aria-label="Inspector" className={panelClass}>
      {tabs}
      <header className="flex items-center gap-2 border-b border-border px-2.5 py-1.5">
        {isComponent ? (
          <Component className="size-3.5 shrink-0 text-primary" strokeWidth={1.5} />
        ) : (
          <MousePointerClick className="size-3.5 shrink-0 text-primary" strokeWidth={1.5} />
        )}
        <div className="min-w-0 flex-1">
          {isComponent ? (
            <p className="truncate text-[12px] font-medium text-foreground" title={element.componentPath.join(' › ')}>
              {`<${element.component}>`} {element.componentPath.length > 1 && <span className={muted}>in {element.componentPath.at(-2)}</span>}
            </p>
          ) : (
            <p className="truncate text-[12px] font-medium text-foreground">
              {element.componentPath.join(' › ') || 'Element'} <span className={muted}>· {element.tag}</span>
            </p>
          )}
          <p className={`truncate font-mono text-[10px] ${muted}`} title={element.src}>
            {shortSource(element.src)}
          </p>
        </div>
        <button type="button" aria-label="Close inspector" onClick={onClose} className={iconButton}>
          <X className="size-3.5" strokeWidth={1.5} />
        </button>
      </header>

      <div className="flex-1 divide-y divide-border overflow-y-auto">
        {isComponent && <ComponentDetails element={element} edits={edits} setEdit={setEdit} />}
        {!isComponent && element.textOnly && (
          <Section title="Content">
            <textarea
              aria-label="Content"
              rows={2}
              value={contentEdit?.to ?? element.text}
              onChange={(e) =>
                setEdit('content', e.target.value === element.text ? null : { property: 'content', from: element.text, to: e.target.value, css: {} })
              }
              className={`${fieldClass} resize-y`}
            />
          </Section>
        )}
        {!isComponent && groups.map((group) => (
          <GroupSection key={group.id} group={group} {...controls} guides={guides} onGuidesChange={onGuidesChange} classes={element.classes} />
        ))}
        <Section title="Classes">
          <p className={`break-words font-mono text-[10px] ${muted}`}>{element.classes.join(' ') || '—'}</p>
        </Section>
      </div>

      {(written || writeError) && (
        <div role="status" className="space-y-1 border-t border-border px-2.5 py-1.5 text-[11px]">
          {writeError ? (
            <p className="text-destructive">Could not write: {writeError}</p>
          ) : (
            written && (
              <div className="flex items-center gap-2">
                <p className={`min-w-0 flex-1 truncate ${muted}`} title={written.file}>
                  {written.recorded ? 'Sent to the wiki record' : `Written to ${written.file.split('/').pop()}`}
                </p>
                {onRecord && !written.recorded && (
                  <button
                    type="button"
                    onClick={() => {
                      onRecord(written.edits)
                      setWritten({ ...written, recorded: true })
                    }}
                    className={`shrink-0 rounded px-1.5 py-0.5 font-medium text-primary hover:bg-accent ${focusRing}`}
                  >
                    Record in wiki
                  </button>
                )}
              </div>
            )
          )}
        </div>
      )}
      <footer className="flex items-center gap-1 border-t border-border px-2.5 py-1.5">
        <button type="button" aria-label="Undo" disabled={index === 0} onClick={() => step(index - 1)} className={iconButton}>
          <Undo2 className="size-3.5" strokeWidth={1.5} />
        </button>
        <button type="button" aria-label="Redo" disabled={index >= history.length - 1} onClick={() => step(index + 1)} className={iconButton}>
          <Redo2 className="size-3.5" strokeWidth={1.5} />
        </button>
        <button type="button" aria-label="Reset edits" disabled={edits.length === 0} onClick={() => commit([])} className={iconButton}>
          <RotateCcw className="size-3.5" strokeWidth={1.5} />
        </button>
        {canWrite ? (
          <>
            <button type="button" aria-label="Describe in chat" title="Describe in chat" onClick={onAddToChat} className={`ml-auto ${iconButton}`}>
              <MessageSquarePlus className="size-3.5" strokeWidth={1.5} />
            </button>
            <button type="button" aria-label="Apply with agent" title="Apply with agent" onClick={onApply} className={iconButton}>
              <Sparkles className="size-3.5" strokeWidth={1.5} />
            </button>
            <button type="button" onClick={write} disabled={writing} className={`${primaryButton} disabled:opacity-60`}>
              <Save className="size-3" strokeWidth={1.75} />
              {writing ? 'Writing…' : 'Write to source'}
            </button>
          </>
        ) : edits.length > 0 ? (
          <>
            <button type="button" aria-label="Describe in chat" title="Describe in chat" onClick={onAddToChat} className={`ml-auto ${iconButton}`}>
              <MessageSquarePlus className="size-3.5" strokeWidth={1.5} />
            </button>
            <button type="button" onClick={onApply} className={primaryButton}>
              <Sparkles className="size-3" strokeWidth={1.75} />
              Apply with agent
            </button>
          </>
        ) : (
          <button type="button" onClick={onAddToChat} className={`ml-auto ${primaryButton}`}>
            <MessageSquarePlus className="size-3" strokeWidth={1.75} />
            Describe in chat
          </button>
        )}
      </footer>
    </aside>
  )
}

/** A component picked in the tree: where it is defined, and its props to edit (variants, plain values) */
function ComponentDetails({
  element,
  edits,
  setEdit,
}: {
  element: LiveSelection['element']
  edits: LiveEdit[]
  setEdit: (property: string, edit: LiveEdit | null) => void
}) {
  const fields = useMemo(() => propFields(element), [element])
  const editable = element.overridable !== false
  const valueOf = (field: PropField) => {
    const edit = edits.find((e) => e.property === `prop:${field.name}`)
    return edit ? edit.prop?.value : field.value
  }
  const change = (field: PropField, next: string | number | boolean | undefined) => setEdit(`prop:${field.name}`, propEdit(field, next))

  return (
    <>
      {element.definition && (
        <Section title="Defined in">
          <p className={`break-all font-mono text-[10px] ${muted}`} title={element.definition}>
            {shortSource(element.definition)}
          </p>
        </Section>
      )}
      <Section title="Props">
        {fields.length === 0 && <p className={`text-[11px] ${muted}`}>No props</p>}
        <div className="space-y-1.5">
          {fields.map((field) => {
            const value = valueOf(field)
            const edited = edits.some((e) => e.property === `prop:${field.name}`)
            const label = (
              <span
                className={`w-16 shrink-0 truncate text-[11px] ${edited ? 'font-medium text-primary' : muted}`}
                title={field.from ? `${field.name} (from ${field.from})` : field.name}
              >
                {field.name}
              </span>
            )
            if (field.kind === 'readonly' || !editable) {
              const text = field.shown ?? (value !== undefined ? JSON.stringify(value) : field.type ?? '—')
              return (
                <div key={field.name} className="flex items-center gap-2">
                  {label}
                  <span className={`truncate font-mono text-[11px] ${field.shown || value !== undefined ? 'text-foreground' : muted}`} title={text}>
                    {text}
                  </span>
                </div>
              )
            }
            if (field.kind === 'choice') {
              return (
                <label key={field.name} className="flex items-center gap-2">
                  {label}
                  <span className="relative min-w-0 flex-1">
                    <select
                      aria-label={field.name}
                      value={String(value ?? field.default ?? '')}
                      onChange={(e) => change(field, e.target.value === '' ? undefined : e.target.value)}
                      className={`${fieldClass} appearance-none pr-6`}
                    >
                      {field.default === undefined && value === undefined && <option value="">— not set</option>}
                      {field.options!.map((o) => (
                        <option key={o} value={o}>
                          {o === field.default ? `${o} (default)` : o}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className={`pointer-events-none absolute right-1.5 top-1/2 size-3 -translate-y-1/2 ${muted}`} strokeWidth={1.75} />
                  </span>
                </label>
              )
            }
            if (field.kind === 'boolean') {
              return (
                <label key={field.name} className="flex items-center gap-2">
                  {label}
                  <input
                    type="checkbox"
                    aria-label={field.name}
                    checked={(value ?? field.default) === true}
                    onChange={(e) => change(field, e.target.checked)}
                    className="size-3.5 accent-primary"
                  />
                </label>
              )
            }
            return (
              <label key={field.name} className="flex items-center gap-2">
                {label}
                <input
                  key={String(value)}
                  aria-label={field.name}
                  type={field.kind === 'number' ? 'number' : 'text'}
                  defaultValue={value === undefined || value === null ? '' : String(value)}
                  placeholder={field.default !== undefined ? String(field.default) : 'not set'}
                  // Typing previews on Enter or when the field is left, not on every key
                  onBlur={(e) => {
                    const raw = e.target.value
                    // An emptied field removes the prop
                    change(field, raw === '' ? undefined : field.kind === 'number' ? Number(raw) : raw)
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                  className={`${fieldClass} font-mono`}
                />
              </label>
            )
          })}
        </div>
        <p className={`text-[10px] ${muted}`}>
          {editable ? 'Changes preview live; Apply with agent writes them at the call site.' : 'Live prop changes need the dev server. Describe them in the chat.'}
        </p>
      </Section>
    </>
  )
}

interface Controls {
  stateOf: (property: InspectorProperty) => PropertyState
  choose: (state: PropertyState, option: InspectorOption | null) => void
}

const byProperty = (group: InspectorGroup, prefix: string) => group.properties.filter((p) => p.property.startsWith(prefix))

/** One inspector section; Layout and Appearance lay their side and corner fields out in pairs */
function GroupSection({
  group,
  stateOf,
  choose,
  guides,
  onGuidesChange,
  classes,
}: Controls & { group: InspectorGroup; guides: boolean; onGuidesChange?: (on: boolean) => void; classes: string[] }) {
  const corners = byProperty(group, 'border-').filter((p) => p.property !== 'border-radius')
  // Single corners open by themselves when the element already rounds them one by one
  const [splitCorners, setSplitCorners] = useState(() => corners.some((p) => currentClass(p, classes)))
  // A property without tokens (no blur effects in the design system) is left out
  const render = (property: InspectorProperty) =>
    property.options.length > 0 && <Field key={property.property} state={stateOf(property)} choose={choose} />

  if (group.id === 'layout') {
    const single = group.properties.filter((p) => !/^(margin|padding)-/.test(p.property))
    return (
      <Section
        title={group.title}
        action={
          onGuidesChange && (
            <label className={`flex items-center gap-1 text-[10px] ${muted}`}>
              <input
                type="checkbox"
                checked={guides}
                onChange={(e) => onGuidesChange(e.target.checked)}
                className="size-3 accent-primary"
              />
              Show paddings and margins
            </label>
          )
        }
      >
        {single.map(render)}
        <Pairs title="Margin">{byProperty(group, 'margin-').map(render)}</Pairs>
        <Pairs title="Padding">{byProperty(group, 'padding-').map(render)}</Pairs>
      </Section>
    )
  }

  if (group.id === 'appearance') {
    const all = group.properties.find((p) => p.property === 'border-radius')!
    const opacity = group.properties.find((p) => p.property === 'opacity')!
    return (
      <Section title={group.title}>
        {render(opacity)}
        <Field
          state={stateOf(all)}
          choose={choose}
          aside={
            <button
              type="button"
              aria-label="Individual corners"
              aria-pressed={splitCorners}
              title="Individual corners"
              onClick={() => setSplitCorners(!splitCorners)}
              className={`flex size-[26px] shrink-0 items-center justify-center rounded-md border border-border ${
                splitCorners ? 'bg-muted text-foreground' : muted
              } ${focusRing}`}
            >
              <Scan className="size-3.5" strokeWidth={1.5} />
            </button>
          }
        />
        {splitCorners && <Pairs>{corners.map(render)}</Pairs>}
        {group.properties.filter((p) => p.property.endsWith('filter')).map(render)}
      </Section>
    )
  }

  return <Section title={group.title}>{group.properties.map(render)}</Section>
}

function Field({ state, choose, aside }: { state: PropertyState; choose: Controls['choose']; aside?: React.ReactNode }) {
  const { property, edited } = state
  const control =
    property.kind === 'scale' ? (
      <ScrubField state={state} choose={choose} />
    ) : property.kind === 'segmented' ? (
      <Segmented state={state} choose={choose} />
    ) : property.kind === 'color' ? (
      <ColorField state={state} choose={choose} />
    ) : (
      <SelectField state={state} choose={choose} />
    )
  return (
    <div className="min-w-0">
      <span className={`mb-1 flex items-center justify-between text-[11px] ${muted}`}>
        {property.label}
        {edited && <span className="font-mono text-[10px] text-primary">edited</span>}
      </span>
      <div className="flex items-center gap-1.5">
        <div className="min-w-0 flex-1">{control}</div>
        {aside}
      </div>
    </div>
  )
}

/** A number field over a token scale: drag the grip or use the arrow keys to step, or type a value */
function ScrubField({ state, choose }: { state: PropertyState; choose: Controls['choose'] }) {
  const { property, option, current, computed } = state
  const options = property.options
  const [draft, setDraft] = useState<string | null>(null)
  const drag = useRef<{ x: number; start: number } | null>(null)
  const display = option ? option.label : current && isArbitrary(current) ? current.slice(current.indexOf('[') + 1, -1) : computed || '—'
  const hint = option?.value && option.value !== option.label ? option.value : current && isArbitrary(current) ? 'not a token' : option ? '' : 'computed'

  // Where on the scale the value sits: its token, else the token closest to the computed value
  const position = () => {
    const at = options.findIndex((o) => o.className === current)
    if (at >= 0) return at
    const target = parseFloat(computed)
    let best = 0
    let distance = Infinity
    options.forEach((o, i) => {
      const d = Math.abs(parseFloat(o.value ?? '') - target)
      if (d < distance) [best, distance] = [i, d]
    })
    return best
  }
  const stepTo = (i: number) => choose(state, options[Math.max(0, Math.min(options.length - 1, i))])
  const commitDraft = () => {
    if (draft === null) return
    const next = optionFromInput(property, draft)
    if (next) choose(state, next)
    setDraft(null)
  }

  return (
    <div className={`flex items-center gap-2 rounded-md ${surface} py-0.5 pl-0.5 pr-2`}>
      <span
        role="slider"
        tabIndex={-1}
        aria-label={`Drag to change ${property.name ?? property.label}`}
        aria-valuemin={0}
        aria-valuemax={options.length - 1}
        aria-valuenow={position()}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId)
          drag.current = { x: e.clientX, start: position() }
        }}
        onPointerMove={(e) => {
          if (!drag.current) return
          const steps = Math.round((e.clientX - drag.current.x) / 8)
          const next = Math.max(0, Math.min(options.length - 1, drag.current.start + steps))
          if (options[next].className !== current) stepTo(next)
        }}
        onPointerUp={() => (drag.current = null)}
        className="flex h-5 w-3.5 shrink-0 cursor-ew-resize items-center justify-center rounded bg-muted/70"
      >
        <span className="h-2.5 w-px bg-muted-foreground" />
        <span className="ml-0.5 h-2.5 w-px bg-muted-foreground" />
      </span>
      <input
        aria-label={property.name ?? property.label}
        value={draft ?? display}
        onChange={(e) => setDraft(e.target.value)}
        onFocus={(e) => e.target.select()}
        onBlur={commitDraft}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commitDraft()
          else if (e.key === 'Escape') setDraft(null)
          else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault()
            setDraft(null)
            stepTo(position() + (e.key === 'ArrowUp' ? 1 : -1))
          }
        }}
        className="min-w-0 flex-1 bg-transparent font-mono text-[12px] text-foreground focus:outline-none"
      />
      {hint && <span className={`shrink-0 font-mono text-[10px] ${hint === 'not a token' ? 'text-amber-600 dark:text-amber-400' : muted}`}>{hint}</span>}
    </div>
  )
}

/** Options by their group, in order of first appearance; ungrouped options under "" */
function grouped(options: InspectorOption[]): [string, InspectorOption[]][] {
  const map = new Map<string, InspectorOption[]>()
  for (const o of options) map.set(o.group ?? '', [...(map.get(o.group ?? '') ?? []), o])
  return [...map]
}

function SelectField({ state, choose }: { state: PropertyState; choose: Controls['choose'] }) {
  const { property, current, from, computed } = state
  return (
    <div className="relative">
      <select
        aria-label={property.name ?? property.label}
        value={current ?? ''}
        onChange={(e) => choose(state, property.options.find((o) => o.className === e.target.value) ?? null)}
        className={`${fieldClass} appearance-none pr-7`}
      >
        {!from && <option value="">{`— ${computed || 'not set'}`}</option>}
        {grouped(property.options).map(([group, options]) =>
          group ? (
            <optgroup key={group} label={group}>
              {options.map((o) => (
                <option key={o.className} value={o.className}>
                  {o.label}
                </option>
              ))}
            </optgroup>
          ) : (
            options.map((o) => (
              <option key={o.className} value={o.className}>
                {o.label}
              </option>
            ))
          ),
        )}
      </select>
      <ChevronDown className={`pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 ${muted}`} strokeWidth={1.5} />
    </div>
  )
}

const SEGMENT_ICONS: Record<string, React.ReactNode> = {
  'not-italic': <Type className="size-3.5" strokeWidth={1.5} />,
  italic: <Italic className="size-3.5" strokeWidth={1.5} />,
  'text-left': <AlignLeft className="size-3.5" strokeWidth={1.5} />,
  'text-center': <AlignCenter className="size-3.5" strokeWidth={1.5} />,
  'text-right': <AlignRight className="size-3.5" strokeWidth={1.5} />,
  'text-justify': <AlignJustify className="size-3.5" strokeWidth={1.5} />,
  'normal-case': <Minus className="size-3.5" strokeWidth={1.5} />,
  capitalize: <span className="text-[11px]">Aa</span>,
  uppercase: <span className="text-[11px] font-semibold">AA</span>,
  lowercase: <span className="text-[11px]">aa</span>,
  'no-underline': <Minus className="size-3.5" strokeWidth={1.5} />,
  underline: <Underline className="size-3.5" strokeWidth={1.5} />,
  'line-through': <Strikethrough className="size-3.5" strokeWidth={1.5} />,
  overline: <span className="text-[12px] overline">a</span>,
}

/** Icon buttons for a handful of values; without a class the computed value is the active one */
function Segmented({ state, choose }: { state: PropertyState; choose: Controls['choose'] }) {
  const { property, current, computed } = state
  const active = (o: InspectorOption) => (current ? o.className === current : Object.values(o.css)[0] === computed || (computed === 'start' && o.className === 'text-left'))
  return (
    <div role="group" aria-label={property.name ?? property.label} className={`flex gap-0.5 rounded-md ${surface} p-0.5`}>
      {property.options.map((o) => (
        <button
          key={o.className}
          type="button"
          aria-label={o.label}
          aria-pressed={active(o)}
          title={`${o.label} (${o.className})`}
          onClick={() => choose(state, o)}
          className={`flex h-6 flex-1 items-center justify-center rounded ${focusRing} ${
            active(o)
              ? 'bg-card text-foreground shadow-sm'
              : `${muted} hover:text-foreground`
          }`}
        >
          {SEGMENT_ICONS[o.className] ?? o.label}
        </button>
      ))}
    </div>
  )
}

function Swatch({ color, size = 'size-6' }: { color: string; size?: string }) {
  return (
    <span aria-hidden className={`${size} inline-block shrink-0 overflow-hidden rounded-full border border-border`} style={{ background: checker }}>
      <span className="block size-full" style={{ background: color }} />
    </span>
  )
}

/** Swatch and value; opens the palette of the design system (roles first, then every palette step) */
function ColorField({ state, choose }: { state: PropertyState; choose: Controls['choose'] }) {
  const { property, option, current, computed } = state
  const [open, setOpen] = useState(false)
  const groups = useMemo(() => grouped(property.options), [property.options])
  const label = option?.label ?? (current && isArbitrary(current) ? current : computed || 'not set')

  return (
    <div>
      <button
        type="button"
        aria-label={`${property.name ?? property.label}: ${label}`}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className={`flex w-full items-center gap-1.5 rounded-md text-left ${focusRing}`}
      >
        <Swatch color={option?.swatch ?? computed} />
        <span className={`${fieldClass} truncate font-mono`}>{label}</span>
      </button>
      {open && (
        <div className={`mt-2 max-h-80 space-y-2 overflow-y-auto rounded-md ${surface} p-2`}>
          {groups.map(([name, options]) => (
            <div key={name}>
              <p className={`mb-1 text-[10px] ${muted}`}>{name}</p>
              {name === 'Roles' ? (
                <div className="space-y-0.5">
                  {options.map((o) => (
                    <ColorOption key={o.label} option={o} selected={o === option} onPick={() => choose(state, o)} wide />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-11 gap-1">
                  {options.map((o) => (
                    <ColorOption key={o.label} option={o} selected={o === option} onPick={() => choose(state, o)} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ColorOption({ option, selected, onPick, wide }: { option: InspectorOption; selected: boolean; onPick: () => void; wide?: boolean }) {
  const ring = selected ? 'ring-2 ring-ring' : ''
  if (wide) {
    return (
      <button
        type="button"
        aria-label={option.label}
        aria-pressed={selected}
        onClick={onPick}
        className={`flex w-full items-center gap-1.5 rounded px-1 py-0.5 text-left text-[11px] text-foreground hover:bg-accent ${ring} ${focusRing}`}
      >
        <Swatch color={option.swatch ?? ''} size="size-4" />
        {option.darkSwatch && <Swatch color={option.darkSwatch} size="size-4" />}
        <span className="truncate">{option.label}</span>
      </button>
    )
  }
  return (
    <button type="button" aria-label={option.label} aria-pressed={selected} title={option.label} onClick={onPick} className={`flex aspect-square rounded-full ${ring} ${focusRing}`}>
      <Swatch color={option.swatch ?? ''} size="size-full" />
    </button>
  )
}

function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="space-y-2 px-2.5 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <h3 className={`text-[10px] font-semibold uppercase tracking-wide ${muted}`}>{title}</h3>
        {action}
      </div>
      {children}
    </section>
  )
}

/** Side or corner fields two by two, under an optional label */
function Pairs({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div>
      {title && <p className="mb-1 text-[11px] text-foreground">{title}</p>}
      <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">{children}</div>
    </div>
  )
}

/** Toolbar toggle for the picker */
export function PickButton({ active, onToggle }: { active: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onToggle}
      title="Select an element (V)"
      className={`flex items-center gap-1.5 rounded px-2 py-1 text-xs transition-colors ${focusRing} ${
        active
          ? 'bg-primary text-primary-foreground'
          : `${muted} hover:bg-accent hover:text-foreground`
      }`}
    >
      <MousePointerClick className="size-3.5" strokeWidth={1.5} />
      Select element
    </button>
  )
}
