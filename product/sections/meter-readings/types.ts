// =============================================================================
// UI Data Shapes — the data the Meter Readings components expect
// =============================================================================

export type MeterType = 'electricity' | 'water' | 'gas'

export type ReadingStatus = 'submitted' | 'accepted' | 'rejected'

export interface Meter {
  id: string
  type: MeterType
  serialNumber: string
  location: string
  unit: string
  /** The last accepted value, shown next to the input */
  previousValue: number
  previousDate: string
}

export interface Reading {
  id: string
  meterId: string
  value: number
  unit: string
  date: string
  status: ReadingStatus
  /** Why a reading was rejected */
  reason?: string
  reference: string
}

export interface ReadingFormProps {
  meter: Meter
  /** Value typed so far */
  value?: string
  /** Shown under the input when the value is not valid */
  error?: string
  onChange?: (value: string) => void
  onContinue?: (value: number) => void
}

export interface ReadingReviewProps {
  meter: Meter
  value: number
  onBack?: () => void
  onSubmit?: () => void
}

export interface ReadingConfirmationProps {
  reading: Reading
  onShowHistory?: () => void
}

export interface ReadingHistoryProps {
  meters: Meter[]
  readings: Reading[]
  onSelectReading?: (id: string) => void
  onNewReading?: () => void
}
