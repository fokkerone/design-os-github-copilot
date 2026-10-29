import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReactNode } from 'react'
import { RenderComponent } from './RenderComponent'

// Stable, module-level components, as the callers pass them
function Frame({ children }: { children?: ReactNode }) {
  return <div className="rounded-lg border border-stone-200 p-4 dark:border-rwe-neutral-800">{children}</div>
}
function Content() {
  return <p className="text-sm">A component chosen at runtime</p>
}

const meta = {
  title: 'Design OS/Building Blocks/RenderComponent',
  component: RenderComponent,
  args: { component: Content },
} satisfies Meta<typeof RenderComponent>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Nested: Story = {
  render: () => (
    <RenderComponent component={Frame}>
      <RenderComponent component={Content} />
    </RenderComponent>
  ),
}
