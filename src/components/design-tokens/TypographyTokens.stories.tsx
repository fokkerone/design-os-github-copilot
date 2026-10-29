import type { Meta, StoryObj } from '@storybook/react-vite'
import { loadDesignTokens } from '@/lib/design-tokens-loader'
import { FontFamilies, FontWeights, TextStyles, TypeScale } from './TypographyTokens'

const tokens = loadDesignTokens()!

const meta = {
  title: 'Design OS/Design Tokens/TypographyTokens',
  component: FontFamilies,
  args: { typography: tokens.typography },
} satisfies Meta<typeof FontFamilies>

export default meta
type Story = StoryObj<typeof meta>

export const Families: Story = {}

export const Scale: Story = { render: () => <TypeScale typography={tokens.typography} /> }

export const Weights: Story = { render: () => <FontWeights typography={tokens.typography} /> }

export const Styles: Story = { render: () => <TextStyles typography={tokens.typography} /> }
