/**
 * Small markdown helpers for the planning files in product/.
 * Pure module: no Vite APIs, so scripts and tests can import it directly.
 */

/**
 * Body of a `## Heading` section, up to the next heading of the same or a higher level.
 * Fenced code blocks are skipped when looking for the end, so a `#` inside a diagram is safe.
 */
export function section(body: string, heading: string): string {
  const lines = body.replace(/\r\n/g, '\n').split('\n')
  const start = lines.findIndex((line) => line.trim().toLowerCase() === `## ${heading}`.toLowerCase())
  if (start === -1) return ''

  const collected: string[] = []
  let fenced = false
  for (const line of lines.slice(start + 1)) {
    if (line.trim().startsWith('```')) fenced = !fenced
    if (!fenced && /^#{1,2}\s/.test(line)) break
    collected.push(line)
  }
  return collected.join('\n').trim()
}

/** Top-level `- ` bullets of a markdown block */
export function bullets(block: string): string[] {
  return block
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('- '))
    .map((line) => line.slice(2).trim())
}

/** Remove backticks, bold markers and surrounding whitespace from a table cell */
export function plain(cell: string): string {
  return cell.replace(/`/g, '').replace(/\*\*/g, '').trim()
}

/** True for cells that mean "nothing": empty, a dash, or an unfilled `<placeholder>` */
export function isBlank(cell: string): boolean {
  const value = plain(cell)
  return value === '' || /^[-–—]+$/.test(value) || /^<.*>$/.test(value)
}

/**
 * Parse the first markdown table of a block into rows keyed by lower-cased header.
 * e.g. `| # | Step |` -> [{ '#': 'S1', step: 'Review cart' }]
 */
export function table(block: string): Record<string, string>[] {
  const rows = block
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('|'))
    .map((line) =>
      line
        .replace(/^\||\|$/g, '')
        .split(/(?<!\\)\|/)
        .map((cell) => cell.trim())
    )
  if (rows.length < 2) return []

  const headers = rows[0].map((header) => plain(header).toLowerCase())
  return rows
    .slice(1)
    .filter((cells) => !cells.every((cell) => /^:?-{2,}:?$/.test(cell)))
    .map((cells) => Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ''])))
}

/** `- **Label:** value` bullets as a label -> value map (labels lower-cased) */
export function labeledBullets(block: string): Record<string, string> {
  const result: Record<string, string> = {}
  for (const bullet of bullets(block)) {
    const match = bullet.match(/^\*\*(.+?):?\*\*:?\s*(.*)$/)
    if (match) result[match[1].trim().toLowerCase()] = match[2].trim()
  }
  return result
}
