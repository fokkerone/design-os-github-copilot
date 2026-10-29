import type { Meta, StoryObj } from '@storybook/react-vite'
import { ShellDesignPage } from './ShellDesignPage'

/** The shell page frames the shell preview; its iframe (preview.html) stays empty in Storybook */
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
