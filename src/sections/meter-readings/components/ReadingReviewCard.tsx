import { ArrowLeft, Send } from 'lucide-react'
import { Button } from '@/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/ui/card'
import type { ReadingReviewProps } from '../../../../product/sections/meter-readings/types'
import { formatValue } from './format'

export function ReadingReviewCard({ meter, value, onBack, onSubmit }: ReadingReviewProps) {
  const diff = value - meter.previousValue
  return (
    <Card className="h-auto w-full rounded-[0.375rem] bg-neutral-900 pb-7 pl-2 pr-2.5 pt-8" /* token: radius-lg */>
      <CardHeader>
        <CardTitle className="text-lg">Check your reading</CardTitle>
        <CardDescription>You cannot change it after sending.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-teal-200 bg-teal-50 p-4 text-center dark:border-teal-800 dark:bg-teal-950" /* token: primary */>
          <p className="text-sm text-stone-600 dark:text-stone-300">Meter {meter.serialNumber}</p>
          <p className="mt-1 font-mono text-3xl font-semibold text-stone-900 dark:text-stone-50">{formatValue(value, meter.unit)}</p>
        </div>
        <p className="text-sm text-stone-600 dark:text-stone-300">
          That is <strong>{formatValue(diff, meter.unit)}</strong> more than your last reading.
        </p>
      </CardContent>
      <CardFooter className="gap-3">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft aria-hidden /> Change
        </Button>
        <Button className="flex-1" onClick={onSubmit}>
          <Send aria-hidden /> Send reading
        </Button>
      </CardFooter>
    </Card>
  )
}
