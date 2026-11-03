import data from '../../../product/sections/meter-readings/data.json'
import type { Meter } from '../../../product/sections/meter-readings/types'
import { ReadingReviewCard } from './components'

/** Preview: the review step with the draft value */
export default function ReadingReview() {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-8">
      <ReadingReviewCard meter={data.meters[0] as Meter} value={data.draft.value} />
    </div>
  )
}
