import * as React from 'react'
import { cn } from './utils'

// token: input / border = stone-300, ring = sky-500
export function Input({ className, type = 'text', ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'h-10 w-full min-w-0 rounded-md border border-stone-300 bg-white px-3 text-base text-stone-900 outline-none transition-colors placeholder:text-stone-400 focus-visible:border-sky-500 focus-visible:ring-2 focus-visible:ring-sky-500/40 disabled:opacity-50 aria-invalid:border-red-500 aria-invalid:ring-red-500/30 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-50 md:text-sm',
        className,
      )}
      {...props}
    />
  )
}
