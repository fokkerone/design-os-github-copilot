import * as React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'

export function Tabs({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Root> & { inset?: boolean }) {
  return <TabsPrimitive.Root className={className} {...props} />
}
