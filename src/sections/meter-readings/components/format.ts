export const formatValue = (value: number, unit: string) => `${value.toLocaleString('en-US')} ${unit}`

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
