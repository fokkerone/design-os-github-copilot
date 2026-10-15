/** The one detail worth showing for a tool call: the file, the command or the pattern */
export function summarizeTool(tool: string, args: unknown): string {
  if (!args || typeof args !== 'object') return ''
  const a = args as Record<string, unknown>
  const pick = (...keys: string[]) => {
    for (const k of keys) if (typeof a[k] === 'string') return a[k] as string
    return ''
  }
  switch (tool) {
    case 'read':
    case 'write':
    case 'edit':
      return pick('filePath', 'path')
    case 'bash':
      return pick('command')
    case 'glob':
    case 'grep':
      return pick('pattern')
    case 'webfetch':
      return pick('url')
    default:
      return ''
  }
}
