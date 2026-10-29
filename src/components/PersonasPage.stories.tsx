import type { Meta, StoryObj } from '@storybook/react-vite'
import { PersonasPage } from './PersonasPage'

const meta = {
  title: 'Design OS/Pages/PersonasPage',
  component: PersonasPage,
  parameters: { layout: 'fullscreen', router: { path: '/personas', url: '/personas' } },
  decorators: [(Story) => <div className="@container min-h-screen"><Story /></div>],
} satisfies Meta<typeof PersonasPage>

export default meta
type Story = StoryObj<typeof meta>

/** The personas of the sample project */
export const SampleProject: Story = {}
