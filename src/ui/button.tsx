import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from './utils'

// Tokens (DESIGN.md): primary = teal-600 / teal-300 (dark), border = stone-300, rounded-md
const buttonVariants = cva(
  'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4',
  {
    variants: {
      variant: {
        // token: primary
        default: 'bg-teal-600 text-stone-50 hover:bg-teal-700 dark:bg-teal-300 dark:text-stone-900 dark:hover:bg-teal-200',
        // token: border
        outline:
          'border border-stone-300 bg-white text-stone-900 hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-50 dark:hover:bg-stone-800',
        ghost: 'text-stone-700 hover:bg-stone-100 dark:text-stone-200 dark:hover:bg-stone-800',
        // token: destructive
        destructive: 'bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-400',
      },
      size: { default: 'h-auto px-5 py-3.5 text-xs', sm: 'h-8 px-3', lg: 'h-12 px-6 text-base', icon: 'size-10' },
    },
    compoundVariants: [{ variant: 'ghost', size: 'default', className: 'px-3' }],
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

export interface ButtonProps extends React.ComponentProps<'button'>, VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button data-slot="button" className={cn(buttonVariants({ variant, size }), className)} {...props} />
}
