import * as React from 'react'
import { cn } from './utils'

export function Label({ className, ...props }: React.ComponentProps<'label'>) {
  return (
    <label
      data-slot="label"
      className={cn('flex items-center gap-2 text-sm font-medium leading-none text-stone-900 dark:text-stone-50', className)}
      {...props}
    />
  )
}
