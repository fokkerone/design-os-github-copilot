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

interface ProvidersResponse {
  providers?: { id?: string; name?: string; models?: Record<string, { id?: string; name?: string }> }[]
}

/** The answer of `GET /config/providers`, flattened and sorted by provider and label */
export function parseProviders(data: unknown): ModelOption[] {
  const providers = (data as ProvidersResponse | undefined)?.providers
  if (!Array.isArray(providers)) return []
  const options: ModelOption[] = []
  for (const p of providers) {
    if (!p?.id || !p.models) continue
    for (const [key, m] of Object.entries(p.models)) {
      const modelID = m?.id ?? key
      options.push({ providerID: p.id, modelID, label: m?.name || modelID, provider: p.name || p.id })
    }
  }
  return options.sort((a, b) => a.provider.localeCompare(b.provider) || a.modelID.localeCompare(b.modelID))
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
