import type { Meta, StoryObj } from '@storybook/react-vite'
import { PersonaPage } from './PersonaPage'

const meta = {
  title: 'Design OS/Pages/PersonaPage',
  component: PersonaPage,
  parameters: { layout: 'fullscreen', router: { path: '/personas/:personaId', url: '/personas/cautious-first-timer' } },
  decorators: [(Story) => <div className="@container min-h-screen"><Story /></div>],
} satisfies Meta<typeof PersonaPage>

export default meta
type Story = StoryObj<typeof meta>

export const SampleProject: Story = {}

export const NotFound: Story = { parameters: { router: { path: '/personas/:personaId', url: '/personas/unknown' } } }
