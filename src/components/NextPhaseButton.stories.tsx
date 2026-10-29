import type { Meta, StoryObj } from '@storybook/react-vite'
import { NextPhaseButton } from './NextPhaseButton'

const meta = {
  title: 'Design OS/Building Blocks/NextPhaseButton',
  component: NextPhaseButton,
  args: { nextPhase: 'data-shape' },
  argTypes: { nextPhase: { control: 'select', options: ['data-shape', 'design-system', 'sections', 'export'] } },
} satisfies Meta<typeof NextPhaseButton>

export default meta
type Story = StoryObj<typeof meta>

export const DataShape: Story = {}

export const DesignSystem: Story = { args: { nextPhase: 'design-system' } }

export const Sections: Story = { args: { nextPhase: 'sections' } }

export const Export: Story = { args: { nextPhase: 'export' } }
