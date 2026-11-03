import { useState } from 'react'
import data from '../../../product/sections/meter-readings/data.json'
import type { Meter } from '../../../product/sections/meter-readings/types'
import { MeterReadingForm } from './components'
import { formatValue } from './components/format'

const meter = data.meters[0] as Meter

/** Preview: the form with live validation against the previous reading */
export default function ReadingForm() {
  const [value, setValue] = useState('')
  const number = Number(value)
  const error =
    value.trim() === ''
      ? undefined
      : !Number.isFinite(number)
        ? 'Enter the digits only, without a unit.'
        : number < meter.previousValue
          ? `Must not be lower than your last reading (${formatValue(meter.previousValue, meter.unit)}).`
          : undefined

  return (
    <div className="mx-auto w-full max-w-md px-4 py-8">
      <MeterReadingForm meter={meter} value={value} error={error} onChange={setValue} />
    </div>
  )
}
