import { useEffect, useState } from 'react'

/** Vite proxies this path to `opencode serve` (see vite.config.ts): same origin, no CORS */
export const OPENCODE_PROXY_PATH = '/opencode'

export const OPENCODE_START_COMMAND = 'opencode serve --port 4096'

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
    const res = await fetchImpl(`${baseUrl}/global/health`, { signal: controller.signal })
    if (!res.ok) return false
    const body = (await res.json()) as { healthy?: boolean }
    return body.healthy === true
  } catch {
    return false
  } finally {
    clearTimeout(timer)
  }
}

export type OpenCodeStatus = 'checking' | 'online' | 'offline'

/** Polls the server, so the chat notices when OpenCode is started or stopped */
export function useOpenCodeStatus(baseUrl: string, intervalMs = 5000): OpenCodeStatus {
  const [status, setStatus] = useState<OpenCodeStatus>('checking')
  useEffect(() => {
    let cancelled = false
    const tick = async () => {
      const ok = await checkOpenCodeHealth(baseUrl)
      if (!cancelled) setStatus(ok ? 'online' : 'offline')
    }
    void tick()
    const timer = setInterval(tick, intervalMs)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [baseUrl, intervalMs])
  return status
}
