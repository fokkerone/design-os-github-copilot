import type { Meta, StoryObj } from '@storybook/react-vite'
import { SectionPage } from './SectionPage'

const meta = {
  title: 'Design OS/Pages/SectionPage',
  component: SectionPage,
  parameters: { layout: 'fullscreen', router: { path: '/prototype/sections/:sectionId', url: '/prototype/sections/meter-readings' } },
  decorators: [(Story) => <div className="@container min-h-screen"><Story /></div>],
} satisfies Meta<typeof SectionPage>

export default meta
type Story = StoryObj<typeof meta>

/** Spec, data and screen designs */
export const Designed: Story = {}

/** Only a spec */
export const Shaped: Story = { parameters: { router: { path: '/prototype/sections/:sectionId', url: '/prototype/sections/account' } } }

export const NotFound: Story = { parameters: { router: { path: '/prototype/sections/:sectionId', url: '/prototype/sections/unknown' } } }

export const WithChat: Story = { parameters: { chat: 'online' } }
