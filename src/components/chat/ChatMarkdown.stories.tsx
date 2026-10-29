import type { Meta, StoryObj } from '@storybook/react-vite'
import { ChatMarkdown } from './ChatMarkdown'

const meta = {
  title: 'Design OS/Chat/ChatMarkdown',
  component: ChatMarkdown,
  decorators: [(Story) => <div className="max-w-[720px] text-[14px]"><Story /></div>],
} satisfies Meta<typeof ChatMarkdown>

export default meta
type Story = StoryObj<typeof meta>

export const Text: Story = { args: { text: 'A **bold** move with `inline code` and a [link](https://example.com).' } }

export const Lists: Story = { args: { text: '## Next steps\n\n1. Shape the section\n2. Generate sample data\n\n- spec.md\n- data.json' } }

export const Code: Story = { args: { text: '```bash\nnpm run tokens:build\n```' } }

export const Table: Story = {
  args: { text: '| Section | Screens |\n| --- | --- |\n| Meter Readings | 3 |\n| Account | 1 |' },
}

export const SanitizedHtml: Story = { args: { text: 'Before <script>alert(1)</script> after' } }
