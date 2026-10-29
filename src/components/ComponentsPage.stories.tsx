import type { Meta, StoryObj } from '@storybook/react-vite'
import { ComponentsPage } from './ComponentsPage'

/** The UI primitives of the product as data: Storybook serves sample props (.storybook/fixtures/component-props.json) */
const meta = {
  title: 'Design OS/Pages/ComponentsPage',
  component: ComponentsPage,
  parameters: { layout: 'fullscreen', router: { path: '/design-system/components', url: '/design-system/components' } },
  decorators: [(Story) => <div className="@container min-h-screen"><Story /></div>],
} satisfies Meta<typeof ComponentsPage>

export default meta
type Story = StoryObj<typeof meta>

export const SampleProps: Story = {}
