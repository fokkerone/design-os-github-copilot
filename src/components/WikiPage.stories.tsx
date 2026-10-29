import type { Meta, StoryObj } from '@storybook/react-vite'
import { WikiPage } from './WikiPage'

const meta = {
  title: 'Design OS/Pages/WikiPage',
  component: WikiPage,
  parameters: { layout: 'fullscreen', router: { path: '/wiki', url: '/wiki' } },
  decorators: [(Story) => <div className="@container min-h-screen"><Story /></div>],
} satisfies Meta<typeof WikiPage>

export default meta
type Story = StoryObj<typeof meta>

/** The wiki of the sample project */
export const SampleProject: Story = {}
