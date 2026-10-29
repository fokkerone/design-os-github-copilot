import type { Meta, StoryObj } from '@storybook/react-vite'
import { loadDesignTokens } from '@/lib/design-tokens-loader'
import { AlphaColors, CustomColors, Gradients, Palettes, SemanticColors } from './ColorTokens'

// The sample token model from the Storybook fixtures (read through the loader, as the app does)
const tokens = loadDesignTokens()!

const meta = {
  title: 'Design OS/Design Tokens/ColorTokens',
  component: SemanticColors,
  args: { tokens: tokens.color.semantic },
} satisfies Meta<typeof SemanticColors>

export default meta
type Story = StoryObj<typeof meta>

export const Semantic: Story = {}

export const Custom: Story = { render: () => <CustomColors tokens={tokens.color.custom} /> }

export const PaletteScales: Story = { render: () => <Palettes palettes={tokens.color.palettes} /> }

export const Alpha: Story = { render: () => <AlphaColors scales={tokens.color.alpha} /> }

export const GradientStyles: Story = { render: () => <Gradients gradients={tokens.color.gradients} /> }
