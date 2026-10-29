import type { Meta, StoryObj } from '@storybook/react-vite'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs'

const meta = {
  title: 'Design OS/UI/Tabs',
  component: Tabs,
} satisfies Meta<typeof Tabs>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="tokens" className="w-96">
      <TabsList>
        <TabsTrigger value="tokens">Tokens</TabsTrigger>
        <TabsTrigger value="guide">Guide</TabsTrigger>
        <TabsTrigger value="report" disabled>
          Report
        </TabsTrigger>
      </TabsList>
      <TabsContent value="tokens" className="text-sm">Colors, typography, spacing.</TabsContent>
      <TabsContent value="guide" className="text-sm">The merged DESIGN.md.</TabsContent>
    </Tabs>
  ),
}
