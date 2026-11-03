import { Gauge } from 'lucide-react'
import { Button } from '@/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card'
import { Input } from '@/ui/input'
import { Label } from '@/ui/label'
import type { ReadingFormProps } from '../../../../product/sections/meter-readings/types'
import { MeterPicture } from './MeterPicture'
import { formatDate, formatValue } from './format'

export function MeterReadingForm({ meter, value = '', error, onChange, onContinue }: ReadingFormProps) {
  const number = Number(value)
  const canContinue = value.trim() !== '' && Number.isFinite(number) && !error

  return (
    <Card className="w-full text-orange-700">
      <CardHeader>
        <div className="flex items-center gap-2 text-teal-700 dark:text-teal-300" /* token: primary */>
          <Gauge className="size-4" aria-hidden />
          <span className="text-xs font-medium uppercase tracking-wide">{meter.type}</span>
        </div>
        <CardTitle className="text-2xl">Submit your reading</CardTitle>
        <CardDescription>
          Meter {meter.serialNumber} · {meter.location}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <MeterPicture />
        <p className="rounded-md bg-stone-100 px-3 py-2 text-sm text-stone-700 dark:bg-stone-800 dark:text-stone-200">
          Last reading: <strong>{formatValue(meter.previousValue, meter.unit)}</strong> on {formatDate(meter.previousDate)}
        </p>
        <form
          className="space-y-2"
          onSubmit={(e) => {
            e.preventDefault()
            if (canContinue) onContinue?.(number)
          }}
        >
          <Label htmlFor="reading">Current reading ({meter.unit})</Label>
          <Input
            id="reading"
            inputMode="numeric"
            autoComplete="off"
            value={value}
            aria-invalid={!!error}
            aria-describedby={error ? 'reading-error' : undefined}
            onChange={(e) => onChange?.(e.target.value)}
          />
          {error && (
            <p id="reading-error" role="alert" className="text-sm text-red-600 dark:text-red-400" /* token: destructive */>
              {error}
            </p>
          )}
          <Button type="submit" size="lg" className="mt-3 w-full" disabled={!canContinue}>
            Review reading
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
