/**
 * Live Edit: sends a component's prop edits to the dev server, which writes them into the JSX at
 * the call site (scripts/live-edit-writer.mjs). No agent involved; HMR shows the result.
 */
import type { LiveEdit, LiveSelection } from './selection'

export const WRITE_ENDPOINT = '/__designos/live-edit/props'

/** The props of the prop edits, null for a prop to remove */
export function propsOf(edits: LiveEdit[]): Record<string, string | number | boolean | null> {
  const props: Record<string, string | number | boolean | null> = {}
  for (const edit of edits) if (edit.prop) props[edit.prop.name] = edit.prop.value ?? null
  return props
}

export async function writePropsToSource(selection: LiveSelection): Promise<{ ok: true; file: string } | { ok: false; error: string }> {
  const { element, edits } = selection
  try {
    const res = await fetch(WRITE_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-designos-live-edit': '1' },
      body: JSON.stringify({ call: element.src, name: element.component, props: propsOf(edits) }),
    })
    const body = (await res.json().catch(() => ({}))) as { file?: string; error?: string }
    return res.ok && body.file ? { ok: true, file: body.file } : { ok: false, error: body.error ?? `HTTP ${res.status}` }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}
