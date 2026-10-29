import type { Meta, StoryObj } from '@storybook/react-vite'
import { ScreenDesignFullscreen, ScreenDesignPage } from './ScreenDesignPage'

/**
 * The screen design page frames the preview. Storybook shows the Design OS UI only: the preview
 * iframe stays empty and the fullscreen route renders a placeholder instead of the prototype.
 */
const meta = {
  title: 'Design OS/Pages/ScreenDesignPage',
  component: ScreenDesignPage,
  parameters: {
    layout: 'fullscreen',
    router: {
      path: '/prototype/sections/:sectionId/screen-designs/:screenDesignName',
      url: '/prototype/sections/meter-readings/screen-designs/ReadingForm',
    },
  },
  decorators: [(Story) => <div className="flex h-screen flex-col @container"><Story /></div>],
} satisfies Meta<typeof ScreenDesignPage>

export default meta
type Story = StoryObj<typeof meta>

export const Frame: Story = {}

export const WithChat: Story = { parameters: { chat: 'online' } }

export const Fullscreen: Story = {
  render: () => <ScreenDesignFullscreen />,
  parameters: {
    router: {
      path: '/prototype/sections/:sectionId/screen-designs/:screenDesignName/fullscreen',
      url: '/prototype/sections/meter-readings/screen-designs/ReadingForm/fullscreen',
    },
  },
}
