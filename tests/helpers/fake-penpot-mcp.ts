/** A fake of the Penpot MCP connection for tests: records the calls of the sync and answers like the plugin would. */
export function createFakeMcp(file: { id: string; name: string }) {
  const calls: string[] = []
  const failures = new Map<string, Error>()
  const mcp = {
    listTools: async () => [],
    close: async () => {},
    callTool: async (name: string) => {
      calls.push(`tool:${name}`)
      return { content: [] }
    },
    execute: async (code: string) => {
      if (code.includes('penpot.currentFile.id') && !code.includes('storage.dos')) return file
      if (code.startsWith('storage.dos =')) {
        calls.push('install')
        return true
      }
      const method = code.match(/storage\.dos\.(\w+)\(/)?.[1] ?? 'unknown'
      calls.push(method)
      if (failures.has(method)) throw failures.get(method)
      if (method === 'layoutStart') return { x: 100, y: 100 }
      if (method === 'upsertTokens') return { created: 1, updated: 0, same: 0, failed: [] }
      if (method === 'existingKeys' || method === 'missing') return []
      if (method === 'measure') return { w: 1440, h: 900, shapes: [] }
      return 'id'
    },
  }
  return { mcp, calls, failures, connect: async () => mcp }
}
