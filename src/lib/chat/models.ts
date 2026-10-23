/** Models the OpenCode server offers (its providers from opencode.json) and the user's choice */

export interface ModelRef {
  providerID: string
  modelID: string
}

export interface ModelOption extends ModelRef {
  label: string
  provider: string
}

export const MODEL_STORAGE_KEY = 'designos:model'

/** The answer of `GET /api/model` (OpenCode 2.x), sorted by provider and label */
export function parseModels(data: unknown): ModelOption[] {
  if (!Array.isArray(data)) return []
  const options: ModelOption[] = []
  for (const m of data as { id?: unknown; providerID?: unknown; name?: unknown }[]) {
    if (typeof m?.id !== 'string' || typeof m.providerID !== 'string') continue
    options.push({ providerID: m.providerID, modelID: m.id, label: typeof m.name === 'string' && m.name ? m.name : m.id, provider: m.providerID })
  }
  return options.sort((a, b) => a.provider.localeCompare(b.provider) || a.label.localeCompare(b.label))
}

export const modelKey = (m: ModelRef) => `${m.providerID}/${m.modelID}`

/** Provider ids never contain a slash, model ids may */
export function parseModelKey(key: string): ModelRef | undefined {
  const i = key.indexOf('/')
  if (i <= 0 || i === key.length - 1) return undefined
  return { providerID: key.slice(0, i), modelID: key.slice(i + 1) }
}

type Store = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>
const defaultStore = (): Store | undefined => (typeof localStorage === 'undefined' ? undefined : localStorage)

/** undefined means: let the server pick its configured default */
export function loadModelChoice(store: Store | undefined = defaultStore()): ModelRef | undefined {
  try {
    const raw = store?.getItem(MODEL_STORAGE_KEY)
    return raw ? parseModelKey(raw) : undefined
  } catch {
    return undefined
  }
}

export function saveModelChoice(choice: ModelRef | undefined, store: Store | undefined = defaultStore()) {
  try {
    if (choice) store?.setItem(MODEL_STORAGE_KEY, modelKey(choice))
    else store?.removeItem(MODEL_STORAGE_KEY)
  } catch {
    /* storage unavailable: the choice lasts for this session */
  }
}
