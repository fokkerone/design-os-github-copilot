import type { Meta, StoryObj } from '@storybook/react-vite'
import { SyncProgress } from './SyncProgress'

const meta = {
  title: 'Design OS/penpot/SyncProgress',
  component: SyncProgress,
} satisfies Meta<typeof SyncProgress>
export default meta
type Story = StoryObj<typeof meta>

export const Starting: Story = { args: { label: 'Syncing with Penpot', percent: 0, message: 'Starting…' } }
export const Components: Story = { args: { label: 'Syncing with Penpot', percent: 42, message: 'Components: 12/36 ui/Button' } }
export const Done: Story = { args: { label: 'Syncing with Penpot', percent: 100, message: 'Done' } }
