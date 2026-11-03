import { useCallback, useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle2, ExternalLink, Plug, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SyncProgress } from './SyncProgress'
import { penpotClient, type PenpotClient, type PenpotStatus, type SyncAction, type SyncReport } from '@/lib/penpot/client'

const POLL_MS = 3000

const HINT: Record<PenpotStatus['connection']['state'], string> = {
  'no-key': 'Add PENPOT_MCP_KEY to .env.local (Penpot: Your account › Integrations › MCP Server).',
  'not-connected': 'Open the file in Penpot and choose File › MCP Server › Connect. Keep that tab visible during a sync.',
  'wrong-file': 'The connected Penpot tab shows a different file. Open the linked file and connect it.',
  connected: 'Connected. Keep the Penpot tab visible and leave it alone during a sync.',
  error: 'Penpot does not answer. Click into the Penpot tab to wake it, then refresh.',
}

function Report({ report }: { report: SyncReport }) {
  const boards = report.boards ?? []
  const offBoards = boards.filter((b) => b.offsets.length > 0 || b.pixels.sizeMatches === false).length
  const outside = boards.reduce((sum, b) => sum + (b.pixels.outsideText ?? 0), 0)
  return (
    <div className="space-y-2 rounded-md border border-border p-3 text-sm">
      <p className="font-medium text-foreground">Last sync: {new Date(report.at).toLocaleString()}</p>
      <ul className="space-y-1 text-muted-foreground">
        {report.tokens && (
          <li>
            Tokens: {report.tokens.created} new, {report.tokens.updated} updated, {report.tokens.same} unchanged
            {report.tokens.failed.length > 0 && <span className="text-destructive">, {report.tokens.failed.length} failed</span>}
          </li>
        )}
        {report.components && (
          <li>
            Components: {report.components.total} variants, {report.components.created} new
            {!!report.components.variantFailures?.length && <span className="text-amber-600 dark:text-amber-400">, not grouped: {report.components.variantFailures.map((f) => f.name).join(', ')}</span>}
          </li>
        )}
        {boards.length > 0 && (
          <li>
            Boards: {boards.length}, {offBoards} with layout offsets, {outside.toLocaleString('en-US')} differing pixels outside text
          </li>
        )}
      </ul>
      {!!report.tokenViolations?.length && (
        <details>
          <summary className="cursor-pointer text-amber-600 dark:text-amber-400">{report.tokenViolations.length} values without a token</summary>
          <ul className="mt-1 space-y-1 font-mono text-xs text-muted-foreground">
            {report.tokenViolations.map((v) => (
              <li key={`${v.kind}:${v.value}`}>
                {v.kind} {v.value} ({v.where.join(', ')})
              </li>
            ))}
          </ul>
        </details>
      )}
      {boards.length > 0 && (
        <details>
          <summary className="cursor-pointer text-muted-foreground">Boards in detail</summary>
          <ul className="mt-1 space-y-1 font-mono text-xs text-muted-foreground">
            {boards.map((b) => (
              <li key={`${b.section}:${b.board}`}>
                {b.section} · {b.board}: {b.pixels.share ?? '?'}% differ, text {b.pixels.textShare ?? '?'}%, {b.offsets.length} offsets
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}

/**
 * Sync with Penpot: the file, the tokens, the components and the sections, through the Penpot MCP
 * server. A section sync always runs tokens and components first (scripts/penpot/sync.mjs).
 */
export function PenpotSyncPanel({ client = penpotClient, fileName = 'Design OS' }: { client?: PenpotClient; fileName?: string }) {
  const [status, setStatus] = useState<PenpotStatus | null>(null)
  const [running, setRunning] = useState<string | null>(null)
  const [progress, setProgress] = useState({ percent: 0, message: '' })
  const [error, setError] = useState<string | null>(null)
  const [report, setReport] = useState<SyncReport | null>(null)

  const refresh = useCallback(async () => {
    try {
      setStatus(await client.status())
    } catch (e) {
      setError(String((e as Error).message ?? e))
    }
  }, [client])

  useEffect(() => {
    client.status().then(setStatus, (e: Error) => setError(String(e.message ?? e)))
  }, [client])

  const run = async (label: string, action: SyncAction) => {
    setRunning(label)
    setError(null)
    setProgress({ percent: 0, message: '' })
    try {
      await client.run(action, (event) => {
        if (event.step === 'error') setError(event.message)
        else setProgress((p) => ({ percent: event.percent ?? p.percent, message: event.message }))
        if (event.report) setReport(event.report)
      })
    } catch (e) {
      setError(String((e as Error).message ?? e))
    } finally {
      setRunning(null)
      void refresh()
    }
  }

  const createFile = async () => {
    setRunning('file')
    setError(null)
    try {
      await client.createFile(fileName)
      setReport(null)
    } catch (e) {
      setError(String((e as Error).message ?? e))
    } finally {
      setRunning(null)
      void refresh()
    }
  }

  const connection = status?.connection.state
  const link = status?.link ?? null
  const busy = !!running || !!status?.running

  // Connecting happens in the Penpot tab, so nothing here would notice it: ask until it is connected
  const waiting = !!link && connection !== 'connected' && !busy
  useEffect(() => {
    if (!waiting) return
    let stopped = false
    let timer: ReturnType<typeof setTimeout>
    const tick = async () => {
      await refresh()
      if (!stopped) timer = setTimeout(tick, POLL_MS)
    }
    timer = setTimeout(tick, POLL_MS)
    return () => {
      stopped = true
      clearTimeout(timer)
    }
  }, [waiting, refresh])

  // Coming back from Penpot: the tab may have been connected, closed or switched to another file
  useEffect(() => {
    if (busy) return
    const onFocus = () => void refresh()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [busy, refresh])

  const canSync = connection === 'connected' && !!link && !busy
  const shown = report ?? link?.lastSync ?? null

  return (
    <Card aria-label="Penpot sync">
      <CardHeader className="flex flex-row flex-wrap items-center gap-2">
        <Plug className="size-4 text-primary" />
        <CardTitle className="text-base">Penpot</CardTitle>
        {connection === 'connected' ? <CheckCircle2 aria-label="Connected" className="size-4 text-emerald-600 dark:text-emerald-400" /> : status && <AlertTriangle aria-label="Not connected" className="size-4 text-amber-600 dark:text-amber-400" />}
        <Button variant="ghost" size="sm" className="ml-auto" onClick={() => void refresh()} disabled={!!running}>
          <RefreshCw /> Refresh
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {!status && !error && <p className="text-sm text-muted-foreground">Checking the connection…</p>}
        {status?.goneFile && <p className="text-sm text-amber-600 dark:text-amber-400">The linked file “{status.goneFile}” no longer exists in Penpot. Create a new one.</p>}
        {status && <p className="text-sm text-muted-foreground">{HINT[status.connection.state]}</p>}
        {status && (
          <div className="flex flex-wrap items-center gap-2">
            {link ? (
              <Button variant="outline" size="sm" asChild>
                <a href={link.url} target="_blank" rel="noreferrer">
                  <ExternalLink /> Open “{link.name}” in Penpot
                </a>
              </Button>
            ) : (
              <Button size="sm" onClick={() => void createFile()} disabled={!!running || !status.configured.token}>
                Create Penpot file
              </Button>
            )}
            {!link && !status.configured.token && <span className="text-xs text-muted-foreground">Add PENPOT_ACCESS_TOKEN to .env.local first.</span>}
          </div>
        )}
        {link && status && (
          <>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" disabled={!canSync} onClick={() => void run('all', { action: 'all' })}>
                Sync
              </Button>
              <Button variant="outline" size="sm" disabled={!canSync} onClick={() => void run('tokens', { action: 'tokens' })}>
                Sync tokens
              </Button>
              <Button variant="outline" size="sm" disabled={!canSync} onClick={() => void run('components', { action: 'components' })}>
                Sync components
              </Button>
            </div>
            {status.sections.length > 0 && (
              <ul className="divide-y divide-border rounded-md border border-border">
                {status.sections.map((s) => (
                  <li key={s.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                    <span className="font-medium text-foreground">{s.id}</span>
                    <span className="text-muted-foreground">{s.screens.length} screens</span>
                    <Button variant="outline" size="sm" className="ml-auto" disabled={!canSync} aria-label={`Sync section ${s.id}`} onClick={() => void run(`section:${s.id}`, { action: 'section', sectionId: s.id })}>
                      Sync
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            <p className="text-xs text-muted-foreground">Sync runs tokens, components and all sections. A section sync always updates tokens and components first and rebuilds the section's boards. Changes made by hand on those boards are overwritten.</p>
          </>
        )}
        {running && running !== 'file' && <SyncProgress label="Syncing with Penpot" percent={progress.percent} message={progress.message || 'Starting…'} />}
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        {shown && !running && <Report report={shown} />}
      </CardContent>
    </Card>
  )
}
