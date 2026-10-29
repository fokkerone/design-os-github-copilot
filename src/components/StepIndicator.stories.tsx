import type { Meta, StoryObj } from '@storybook/react-vite'
import { StepIndicator } from './StepIndicator'

const Box = ({ label }: { label: string }) => <div className="rounded-lg border border-stone-200 p-4 text-sm dark:border-rwe-neutral-800">{label}</div>

const meta = {
  title: 'Design OS/Building Blocks/StepIndicator',
  component: StepIndicator,
  args: { step: 1, status: 'current', children: <Box label="Current step" />, isLast: true },
  argTypes: { status: { control: 'select', options: ['completed', 'current', 'upcoming', 'skipped'] } },
} satisfies Meta<typeof StepIndicator>

export default meta
type Story = StoryObj<typeof meta>

export const Current: Story = {}

export const Sequence: Story = {
  render: () => (
    <div className="space-y-4">
      <StepIndicator step={1} status="completed"><Box label="Spec" /></StepIndicator>
      <StepIndicator step={2} status="skipped" optional><Box label="Sample data (optional)" /></StepIndicator>
      <StepIndicator step={3} status="current"><Box label="Screen designs" /></StepIndicator>
      <StepIndicator step={4} status="upcoming" isLast><Box label="Screenshots" /></StepIndicator>
    </div>
  ),
}
