import { useEffect, useState } from 'react'

/** The dev server proxies this path to its `opencode serve` (scripts/opencode-dev.mjs): same origin, no CORS, no password in the browser */
export const OPENCODE_PROXY_PATH = '/opencode'

/** `npm run dev` starts OpenCode itself; the chat shows this when that failed */
export const OPENCODE_START_COMMAND = 'npm run dev'

/** The SDK builds requests from a full URL, so a path like `/opencode` is resolved against the page origin */
export function resolveBaseUrl(base: string, origin: string = window.location.origin): string {
  return new URL(base, origin).toString().replace(/\/+$/, '')
}

export async function checkOpenCodeHealth(
  baseUrl: string,
  fetchImpl: typeof fetch = fetch,
  timeoutMs = 2500,
): Promise<boolean> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    // OpenCode 2.x: GET /api/info → { version }. A 1.x server answers the path with HTML.
    const res = await fetchImpl(`${baseUrl}/api/info`, { signal: controller.signal })
    if (!res.ok || !(res.headers.get('content-type') ?? '').includes('json')) return false
    const body = (await res.json()) as { version?: unknown }
    return typeof body.version === 'string'
  } catch {
    return false
  } finally {
    clearTimeout(timer)
  }
}

export type OpenCodeStatus = 'checking' | 'online' | 'offline'

/**
 * Polls the server, so the chat notices when OpenCode is started or stopped. A busy agent can make
 * one check time out, so an online server only counts as offline after `failuresToOffline` misses
 * in a row: going offline cuts the event stream.
 */
export function useOpenCodeStatus(baseUrl: string, intervalMs = 5000, failuresToOffline = 2): OpenCodeStatus {
  const [status, setStatus] = useState<OpenCodeStatus>('checking')
  useEffect(() => {
    let cancelled = false
    let failures = 0
    const tick = async () => {
      const ok = await checkOpenCodeHealth(baseUrl)
      if (cancelled) return
      failures = ok ? 0 : failures + 1
      setStatus((s) => (ok ? 'online' : s === 'online' && failures < failuresToOffline ? 'online' : 'offline'))
    }
    void tick()
    const timer = setInterval(tick, intervalMs)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [baseUrl, intervalMs, failuresToOffline])
  return status
}
