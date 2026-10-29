import type { Meta, StoryObj } from '@storybook/react-vite'
import { CodePill, ColorCode, CopyValue, Swatch, TokenGroup } from './primitives'

const teal = { hex: '#0d9488', oklch: 'oklch(0.6 0.1 185)', alpha: 1 }
const veil = { hex: '#0d948880', oklch: 'oklch(0.6 0.1 185 / 0.5)', alpha: 0.5 }

const meta = {
  title: 'Design OS/Design Tokens/Primitives',
  component: TokenGroup,
  args: { title: 'Colors', count: 3, hint: 'Semantic roles in light and dark mode', children: <p className="text-sm">Group content</p> },
} satisfies Meta<typeof TokenGroup>

export default meta
type Story = StoryObj<typeof meta>

export const Group: Story = {}

export const Swatches: Story = {
  render: () => (
    <div className="flex gap-3">
      <Swatch value={teal} title="primary" className="size-16 rounded-md" />
      <Swatch value={veil} title="primary / 50%" className="size-16 rounded-md" />
      <Swatch value={null} title="missing" className="size-16 rounded-md" />
    </div>
  ),
}

export const Values: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <ColorCode value={teal} />
      <ColorCode value={null} />
      <CopyValue value="--spacing-4" />
      <CodePill>bg-teal-600</CodePill>
    </div>
  ),
}
