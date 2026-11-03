/**
 * Client for the Penpot MCP server (remote, multi-user mode): `execute_code` runs Plugin API code
 * in the Penpot tab that is connected through File > MCP Server > Connect. Server side only: the
 * URL carries the user's MCP key, so it never reaches the browser.
 */
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'

export const mcpUrl = (penpotUrl, key) => `${penpotUrl.replace(/\/$/, '')}/mcp/stream?userToken=${encodeURIComponent(key)}`

/** Text of a tool result; a result flagged as error becomes an exception */
export function toolText(result) {
  const text = (result.content ?? []).filter((c) => c.type === 'text').map((c) => c.text).join('\n')
  // The server also reports failures as plain text, without isError
  if (result.isError || text.startsWith('Tool execution failed:')) throw new Error(text.replace(/^Tool execution failed: (Error: )?/, '') || 'Penpot MCP tool failed')
  return text
}

/** A tool's result as a value: execute_code answers JSON, anything else stays text */
export function parseResult(text) {
  let value
  try {
    value = JSON.parse(text)
  } catch {
    return text
  }
  return value && typeof value === 'object' && 'result' in value ? value.result : value
}

export async function connectMcp({ url, key, name = 'design-os' }) {
  const client = new Client({ name, version: '0.0.0' })
  const transport = new StreamableHTTPClientTransport(new URL(mcpUrl(url, key)))
  await client.connect(transport)
  return {
    listTools: async () => (await client.listTools()).tools,
    callTool: (tool, args, timeout = 120_000) => client.callTool({ name: tool, arguments: args }, undefined, { timeout }),
    execute: async (code, timeout) => parseResult(toolText(await client.callTool({ name: 'execute_code', arguments: { code } }, undefined, { timeout: timeout ?? 120_000 }))),
    // Ends the session on the server too: the panel polls, and sessions would pile up until the server's cleanup
    close: async () => {
      await transport.terminateSession().catch(() => {})
      await client.close()
    },
  }
}
