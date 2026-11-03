import data from '../../../product/sections/meter-readings/data.json'
import type { Meter, Reading } from '../../../product/sections/meter-readings/types'
import { ReadingHistoryList } from './components'

/** Preview: the history with accepted, submitted and rejected readings */
export default function ReadingHistory() {
  return (
    <div className="mx-auto w-full max-w-xl px-4 py-8">
      <ReadingHistoryList meters={data.meters as Meter[]} readings={data.readings as Reading[]} />
    </div>
  )
}
