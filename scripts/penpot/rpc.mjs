/**
 * Penpot's backend RPC API, for what the Plugin API cannot do: listing projects and creating a
 * file. Needs an access token (Your account > Access tokens). Server side only.
 */
export async function rpc({ url, token, fetchImpl = fetch, timeoutMs = 30_000 }, method, params = {}) {
  const res = await fetchImpl(`${url.replace(/\/$/, '')}/api/main/methods/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json', authorization: `Token ${token}` },
    body: JSON.stringify(params),
    signal: AbortSignal.timeout(timeoutMs),
  })
  const text = await res.text()
  let body
  try {
    body = JSON.parse(text)
  } catch {
    body = text
  }
  if (!res.ok) {
    const error = new Error(`Penpot ${method} failed (${res.status}): ${body?.hint ?? body?.code ?? String(text).slice(0, 200)}`)
    error.status = res.status
    error.code = body?.code
    throw error
  }
  return body
}
