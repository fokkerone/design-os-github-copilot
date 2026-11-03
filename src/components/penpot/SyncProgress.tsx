import { Progress } from '@/components/ui/progress'

/** Progress bar with status message, after reui's c-progress-4, showing a real sync's progress */
export function SyncProgress({ label, percent, message }: { label: string; percent: number; message: string }) {
  const value = Math.min(Math.round(percent), 100)
  return (
    <div className="w-full space-y-2" role="status">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-muted-foreground text-sm">{value}%</span>
      </div>
      <Progress value={value} aria-label={label} />
      <div className="text-muted-foreground truncate text-xs">{message}</div>
    </div>
  )
}
