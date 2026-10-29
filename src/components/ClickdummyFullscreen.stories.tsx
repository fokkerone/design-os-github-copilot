import type { Meta, StoryObj } from '@storybook/react-vite'
import { ClickdummyFullscreen } from './ClickdummyFullscreen'

/** The fullscreen clickdummy route; Storybook renders a placeholder instead of the assembled prototype */
const meta = {
  title: 'Design OS/Pages/ClickdummyFullscreen',
  component: ClickdummyFullscreen,
  parameters: { layout: 'fullscreen', router: { path: '/prototype/preview/fullscreen', url: '/prototype/preview/fullscreen' } },
  decorators: [(Story) => <div className="h-screen"><Story /></div>],
} satisfies Meta<typeof ClickdummyFullscreen>

export default meta
type Story = StoryObj<typeof meta>

export const Assembled: Story = {}
