import { createContext, useContext } from 'react'
import type { ColorValue } from '@/types/design-tokens'

export type ValueFormat = 'oklch' | 'hex'

export const ValueFormatContext = createContext<ValueFormat>('oklch')

export function useValueFormat(): ValueFormat {
  return useContext(ValueFormatContext)
}

/** The value shown for a color in the active format. */
export function formatColor(value: ColorValue, format: ValueFormat): string {
  return format === 'hex' ? value.hex : value.oklch
}
