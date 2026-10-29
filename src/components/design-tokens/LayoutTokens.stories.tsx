import type { Meta, StoryObj } from '@storybook/react-vite'
import { loadDesignTokens } from '@/lib/design-tokens-loader'
import { Breakpoints, RadiusScale, SizingSummary, SpacingScale } from './LayoutTokens'

const tokens = loadDesignTokens()!

const meta = {
  title: 'Design OS/Design Tokens/LayoutTokens',
  component: SpacingScale,
  args: { spacing: tokens.spacing },
} satisfies Meta<typeof SpacingScale>

export default meta
type Story = StoryObj<typeof meta>

export const Spacing: Story = {}

export const Sizing: Story = { render: () => <SizingSummary sizing={tokens.sizing} layout={tokens.layout} /> }

export const Radius: Story = { render: () => <RadiusScale radius={tokens.radius} /> }

export const BreakpointTokens: Story = { render: () => <Breakpoints breakpoints={tokens.breakpoints} /> }
