import type { Meta, StoryObj } from '@storybook/react-vite'
import { loadDesignGuide, loadDesignTokens } from '@/lib/design-tokens-loader'
import { GuidelinesPanel } from './GuidelinesPanel'

const meta = {
  title: 'Design OS/Design Tokens/GuidelinesPanel',
  component: GuidelinesPanel,
  args: { tokens: loadDesignTokens()!, guide: loadDesignGuide() },
} satisfies Meta<typeof GuidelinesPanel>

export default meta
type Story = StoryObj<typeof meta>

export const WithGuide: Story = {}

export const WithoutGuide: Story = { args: { guide: null } }
