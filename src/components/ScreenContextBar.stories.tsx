import type { Meta, StoryObj } from '@storybook/react-vite'
import { ScreenContextBar } from './ScreenContextBar'

const meta = {
  title: 'Design OS/Building Blocks/ScreenContextBar',
  component: ScreenContextBar,
  args: { sectionId: 'meter-readings', screenDesignName: 'ReadingForm' },
} satisfies Meta<typeof ScreenContextBar>

export default meta
type Story = StoryObj<typeof meta>

/** A screen of the sample project that a flow step uses */
export const InFlow: Story = {}

export const WithoutFlow: Story = { args: { sectionId: 'account', screenDesignName: 'Login' } }
