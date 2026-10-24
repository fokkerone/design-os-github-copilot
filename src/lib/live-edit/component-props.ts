/**
 * Live Edit: the props of a component picked in the tree as inspector fields. What a component
 * declares comes from its props type (scripts/component-props.mjs), the values from the call
 * site the preview reported. A change is a prop edit the preview shows live and the agent
 * writes at the call site.
 */
import declaredProps from 'virtual:component-props'
import type { PickedElement } from './protocol'
import type { LiveEdit } from './selection'

type Value = string | number | boolean | null

/** A prop as the component's type declares it */
export interface DeclaredProp {
  name: string
  kind: 'choice' | 'boolean' | 'number' | 'string' | 'readonly'
  /** Choices: the strings of the union, in the order they are written */
  options?: string[]
  /** What applies without the prop: the parameter default or cva() defaultVariants */
  default?: string | number | boolean
  optional: boolean
  /** Read-only props: their type, e.g. "(email: string) => void" */
  type?: string
  /** Declared by a library (Radix …), not by the component */
  from?: string
}

export interface PropField extends Omit<DeclaredProp, 'optional'> {
  /** The value at the call site, undefined when the prop is not set */
  value: Value | undefined
  /** Read-only props: how the value shows (ƒ, {…}, <Icon />) */
  shown?: string
  /** False for props the call site passes that the type does not name (DOM attributes) */
  declared: boolean
}

type AllProps = Record<string, Record<string, DeclaredProp[]>>

/** What a component declares, found by the file of its definition */
export function declaredOf(element: PickedElement, all: AllProps = declaredProps): DeclaredProp[] {
  const file = element.definition?.replace(/(:\d+)+$/, '')
  const byComponent = file ? all[file] : undefined
  const name = element.component ?? ''
  return (byComponent && (byComponent[name] ?? byComponent[name.replace(/\./g, '')] ?? byComponent[name.split('.').pop() ?? ''])) ?? []
}

/** The declared props (also those the call site does not set), then the other props the call site passes */
export function propFields(element: PickedElement, all?: AllProps): PropField[] {
  const values = element.values ?? {}
  const shown = new Map(element.props ?? [])
  const declared = declaredOf(element, all)
  const fields: PropField[] = declared.map((d) => ({
    name: d.name,
    kind: d.kind,
    ...(d.options && { options: d.options }),
    ...(d.default !== undefined && { default: d.default }),
    ...(d.type && { type: d.type }),
    ...(d.from && { from: d.from }),
    value: values[d.name],
    declared: true,
    ...(d.kind === 'readonly' && shown.has(d.name) && { shown: shown.get(d.name) }),
  }))
  const names = new Set(declared.map((d) => d.name))
  for (const [name, value] of Object.entries(values)) {
    if (names.has(name)) continue
    const kind = typeof value === 'boolean' ? 'boolean' : typeof value === 'number' ? 'number' : typeof value === 'string' ? 'string' : 'readonly'
    fields.push({ name, kind, value, declared: false, ...(kind === 'readonly' && { shown: String(value) }) })
  }
  for (const [name, value] of shown) {
    if (!(name in values) && !names.has(name)) fields.push({ name, kind: 'readonly', value: undefined, shown: value, declared: false })
  }
  return fields
}

const show = (value: Value | undefined) => (value === undefined ? '(none)' : JSON.stringify(value))

/** The edit for a new prop value; null when it is what the call site already renders (no edit) */
export function propEdit(field: PropField, next: Value | undefined): LiveEdit | null {
  // The default needs no prop: choosing it removes the prop
  const value = field.default !== undefined && next === field.default ? undefined : next
  const current = field.value === undefined ? field.default : field.value
  if (value === field.value || (value === undefined && current === field.default)) return null
  return {
    property: `prop:${field.name}`,
    from: show(field.value),
    to: show(value),
    css: {},
    prop: { name: field.name, value: value === null ? undefined : value, ...(field.options && { options: field.options }) },
  }
}
