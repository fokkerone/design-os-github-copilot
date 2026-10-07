import type { ElementType, ReactNode } from 'react'

interface RenderComponentProps {
  component: ElementType
  children?: ReactNode
}

/**
 * Renders a component that is chosen at runtime (e.g. a lazily loaded screen
 * design). Callers must pass a component with a stable identity, such as one
 * cached at module level, so it is not remounted on every render.
 */
export function RenderComponent({ component: Component, children }: RenderComponentProps) {
  return <Component>{children}</Component>
}
