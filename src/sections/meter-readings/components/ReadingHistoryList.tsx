import { Plus } from 'lucide-react'
import { Badge } from '@/ui/badge'
import { Button } from '@/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card'
import type { ReadingHistoryProps, ReadingStatus } from '../../../../product/sections/meter-readings/types'
import { formatDate, formatValue } from './format'

const STATUS: Record<ReadingStatus, { label: string; variant: 'success' | 'warning' | 'destructive' }> = {
  accepted: { label: 'Accepted', variant: 'success' },
  submitted: { label: 'Submitted', variant: 'warning' },
  rejected: { label: 'Rejected', variant: 'destructive' },
}

export function ReadingHistoryList({ meters, readings, onSelectReading, onNewReading }: ReadingHistoryProps) {
  const sorted = [...readings].sort((a, b) => b.date.localeCompare(a.date))

  return (
    <Card className="w-full">
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div className="space-y-1">
          <CardTitle className="text-lg">Your readings</CardTitle>
          <CardDescription>{readings.length} readings on {meters.length} meters</CardDescription>
        </div>
        <Button variant="ghost" size="sm" onClick={onNewReading} className="text-white border-[oklch(60.19%_0.10655 184.1)] dark:border-[oklch(70.17%_0.15855 160.07)]" /* tokens: chart-2 (border) */>
          <Plus aria-hidden /> New
        </Button>
      </CardHeader>
      <CardContent className="px-0">
        {sorted.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-stone-500 dark:text-stone-400">No readings yet. Submit your first one when the reminder arrives.</p>
        ) : (
          <ul className="divide-y divide-stone-200 dark:divide-stone-800">
            {sorted.map((r) => {
              const meter = meters.find((m) => m.id === r.meterId)
              const status = STATUS[r.status]
              return (
                <li key={r.id} className="even:bg-stone-50 dark:even:bg-stone-800/40" /* token: muted (zebra) */>
                  <button
                    type="button"
                    onClick={() => onSelectReading?.(r.id)}
                    className="flex w-full items-start justify-between gap-3 px-5 py-3 text-left transition-colors hover:bg-stone-100 focus-visible:bg-stone-100 focus-visible:outline-none dark:hover:bg-stone-800 dark:focus-visible:bg-stone-800"
                  >
                    <span className="min-w-0">
                      <span className="block font-medium capitalize">{meter?.type ?? 'Meter'}</span>
                      <span className="block truncate text-xs text-stone-500 dark:text-stone-400">
                        {formatDate(r.date)} · {r.reference}
                      </span>
                      {r.reason && <span className="mt-1 block text-xs text-red-700 dark:text-red-300">{r.reason}</span>}
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-1">
                      <span className="font-mono text-sm">{formatValue(r.value, r.unit)}</span>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
