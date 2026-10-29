import type { Meta, StoryObj } from '@storybook/react-vite'
import { WikiMarkdown } from './WikiMarkdown'

const meta = {
  title: 'Design OS/Wiki/WikiMarkdown',
  component: WikiMarkdown,
  args: {
    markdown:
      '# Product vision\n\nMeterly turns the yearly meter reading into a one-minute task. See [[decisions]] and [[missing-page]].\n\n## Problems\n\n- Readings get lost\n- Deadlines are missed\n\n> A reading always carries a photo.\n\n```mermaid\nflowchart LR\n  A[Reminder] --> B[Reading] --> C[Confirmation]\n```\n',
  },
} satisfies Meta<typeof WikiMarkdown>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithAnchors: Story = { args: { anchors: true } }
