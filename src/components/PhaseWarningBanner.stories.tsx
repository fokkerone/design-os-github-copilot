import type { Meta, StoryObj } from '@storybook/react-vite'
import { PhaseWarningBanner } from './PhaseWarningBanner'

const meta = {
  title: 'Design OS/Building Blocks/PhaseWarningBanner',
  component: PhaseWarningBanner,
} satisfies Meta<typeof PhaseWarningBanner>

export default meta
type Story = StoryObj<typeof meta>

/** A fresh project: data shape and design system are missing, the banner points to both */
export const MissingPhases: Story = { parameters: { fixtures: 'empty' } }

/** The sample project has a data shape and a design system: the banner renders nothing */
export const AllPhasesDone: Story = {}
