import * as React from 'react'
import { cn } from './utils'

// token: card = white / stone-900 (dark), border = stone-200
export function Card({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card"
      className={cn('flex min-w-0 flex-col gap-4 rounded-xl border border-stone-200 bg-white py-5 text-stone-900 shadow-sm dark:border-stone-800 dark:bg-stone-900 dark:text-stone-50', className)}
      {...props}
    />
  )
}

export function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="card-header" className={cn('flex flex-col gap-1 px-5', className)} {...props} />
}

export function CardTitle({ className, ...props }: React.ComponentProps<'h3'>) {
  return <h3 data-slot="card-title" className={cn('text-base font-semibold leading-none', className)} {...props} />
}

// token: muted-foreground = stone-500
export function CardDescription({ className, ...props }: React.ComponentProps<'p'>) {
  return <p data-slot="card-description" className={cn('text-sm text-stone-500 dark:text-stone-400', className)} {...props} />
}

export function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="card-content" className={cn('min-w-0 px-5 break-words', className)} {...props} />
}

export function CardFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="card-footer" className={cn('flex flex-wrap items-center justify-end gap-2 px-5', className)} {...props} />
}
