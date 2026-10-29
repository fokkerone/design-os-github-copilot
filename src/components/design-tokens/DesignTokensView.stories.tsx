import type { Meta, StoryObj } from '@storybook/react-vite'
import { loadDesignGuide, loadDesignTokens } from '@/lib/design-tokens-loader'
import { DesignTokensView } from './DesignTokensView'

const meta = {
  title: 'Design OS/Design Tokens/DesignTokensView',
  component: DesignTokensView,
  args: { tokens: loadDesignTokens()!, guide: loadDesignGuide() },
} satisfies Meta<typeof DesignTokensView>

export default meta
type Story = StoryObj<typeof meta>

export const WithGuide: Story = {}

export const WithoutGuide: Story = { args: { guide: null } }
