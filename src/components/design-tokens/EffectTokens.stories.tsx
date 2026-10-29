import type { Meta, StoryObj } from '@storybook/react-vite'
import { loadDesignTokens } from '@/lib/design-tokens-loader'
import { BlurEffects, OpacityScale, Shadows } from './EffectTokens'

const tokens = loadDesignTokens()!

const meta = {
  title: 'Design OS/Design Tokens/EffectTokens',
  component: Shadows,
  args: { shadows: tokens.shadows },
} satisfies Meta<typeof Shadows>

export default meta
type Story = StoryObj<typeof meta>

export const ShadowTokens: Story = {}

export const Blur: Story = { render: () => <BlurEffects effects={tokens.effects} /> }

export const Opacity: Story = { render: () => <OpacityScale opacity={tokens.opacity} /> }
