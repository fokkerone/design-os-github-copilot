import type { Meta, StoryObj } from '@storybook/react-vite'
import { MermaidDiagram } from './MermaidDiagram'

const meta = {
  title: 'Design OS/Building Blocks/MermaidDiagram',
  component: MermaidDiagram,
  args: {
    chart: 'flowchart LR\n  A[Reminder] --> B{Reading valid?}\n  B -->|yes| C[Confirmation]\n  B -->|no| D[Fix the value]\n  D --> B',
  },
} satisfies Meta<typeof MermaidDiagram>

export default meta
type Story = StoryObj<typeof meta>

export const Flowchart: Story = {}

export const Sequence: Story = { args: { chart: 'sequenceDiagram\n  Page->>Chat: Start with agent\n  Chat->>OpenCode: message\n  OpenCode-->>Chat: answer' } }

export const InvalidSyntax: Story = { args: { chart: 'flowchart LR\n  A -->' } }
