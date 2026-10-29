import type { Meta, StoryObj } from '@storybook/react-vite'
import { ShellDesignFullscreen, ShellDesignPage } from './ShellDesignPage'

/** The shell page frames the shell preview; Storybook renders a placeholder instead of the prototype shell */
const meta = {
  title: 'Design OS/Pages/ShellDesignPage',
  component: ShellDesignPage,
  parameters: { layout: 'fullscreen', router: { path: '/design-system/shell', url: '/design-system/shell' } },
  decorators: [(Story) => <div className="flex h-screen flex-col @container"><Story /></div>],
} satisfies Meta<typeof ShellDesignPage>

export default meta
type Story = StoryObj<typeof meta>

export const Frame: Story = {}

export const NoShellYet: Story = { parameters: { fixtures: 'empty' } }

export const Fullscreen: Story = {
  render: () => <ShellDesignFullscreen />,
  parameters: { router: { path: '/design-system/shell/fullscreen', url: '/design-system/shell/fullscreen' } },
}
