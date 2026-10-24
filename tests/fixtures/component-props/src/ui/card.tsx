import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

// shadcn's newer styles: size is a plain union, styled through data-size
export function Card({ className, size = 'default', ...props }: React.ComponentProps<'div'> & { size?: 'default' | 'sm' }) {
  return <div data-size={size} className={className} {...props} />
}

const badgeVariants = cva('', { variants: { tone: { neutral: '', danger: '' } }, defaultVariants: { tone: 'neutral' } })
function Badge({ tone, ...props }: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
  return <span className={badgeVariants({ tone })} {...props} />
}
export { Badge }
