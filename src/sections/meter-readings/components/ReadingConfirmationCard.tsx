import { ShieldCheck } from 'lucide-react'
import { Button } from '@/ui/button'
import { Card, CardContent, CardFooter } from '@/ui/card'
import type { ReadingConfirmationProps } from '../../../../product/sections/meter-readings/types'
import { formatDate, formatValue } from './format'

// Plays once on arrival: the shield pops in (500 ms), then the check draws itself (400 ms, 300 ms delay).
// Reduced motion keeps the fade and drops the scale and the drawing.
const ICON_CLASSES = [
  'mx-auto size-16 text-emerald-600 dark:text-emerald-400',
  'transition duration-500 ease-out starting:scale-50 starting:opacity-0 motion-reduce:starting:scale-100',
  '[&_path:nth-child(2)]:[stroke-dasharray:6] [&_path:nth-child(2)]:transition-[stroke-dashoffset]',
  '[&_path:nth-child(2)]:duration-400 [&_path:nth-child(2)]:delay-300 [&_path:nth-child(2)]:ease-out',
  '[&_path:nth-child(2)]:starting:[stroke-dashoffset:6] motion-reduce:[&_path:nth-child(2)]:starting:[stroke-dashoffset:0]',
].join(' ')

export function ReadingConfirmationCard({ reading, onShowHistory }: ReadingConfirmationProps) {
  const value = Number.isFinite(reading.value) ? formatValue(reading.value, reading.unit) : null
  const date = Number.isNaN(new Date(reading.date).getTime()) ? null : formatDate(reading.date)
  const reference = reading.reference?.trim()

  return (
    <Card role="status" className="w-full text-center">
      <CardContent className="space-y-3 pt-2">
        <ShieldCheck className={ICON_CLASSES} aria-hidden /* token: success */ />
        <h2 className="text-xl font-semibold">Reading received</h2>
        <p className="text-sm text-stone-600 dark:text-stone-300">
          We saved {value ? <strong>{value}</strong> : 'your reading'}
          {date ? ` on ${date}` : ''}. A confirmation is on its way to your email.
        </p>
        {reference ? <p className="font-mono text-xs break-all text-stone-500 dark:text-stone-400">Reference {reference}</p> : null}
      </CardContent>
      <CardFooter className="justify-center">
        <Button variant="outline" className="max-w-full text-center whitespace-normal" onClick={onShowHistory}>
          Show my readings
        </Button>
      </CardFooter>
    </Card>
  )
}
