import data from '../../../product/sections/meter-readings/data.json'
import type { Reading } from '../../../product/sections/meter-readings/types'
import { ReadingConfirmationCard } from './components'

/** Preview: the confirmation of the newest reading */
export default function ReadingConfirmation() {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-8">
      <ReadingConfirmationCard reading={data.readings[4] as Reading} />
    </div>
  )
}
