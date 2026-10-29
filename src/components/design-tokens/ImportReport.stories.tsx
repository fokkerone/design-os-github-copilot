import type { Meta, StoryObj } from '@storybook/react-vite'
import { loadDesignTokens } from '@/lib/design-tokens-loader'
import { ImportReport } from './ImportReport'

const tokens = loadDesignTokens()!

const meta = {
  title: 'Design OS/Design Tokens/ImportReport',
  component: ImportReport,
  args: { tokens },
} satisfies Meta<typeof ImportReport>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithWarnings: Story = {
  args: {
    tokens: {
      ...tokens,
      report: {
        ...tokens.report,
        issues: [
          ...tokens.report.issues,
          { code: 'unsupported-type', severity: 'warning', summary: 'Tokens of type "cubicBezier" are documented only', count: 2, items: [{ path: 'motion.ease.in', detail: 'cubicBezier' }, { path: 'motion.ease.out', detail: 'cubicBezier' }] },
        ],
      },
    },
  },
}
