import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from './button'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card'

const meta = {
  title: 'Design OS/UI/Card',
  component: Card,
} satisfies Meta<typeof Card>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => (
    <Card {...args} className="max-w-md">
      <CardHeader>
        <CardTitle>Product overview</CardTitle>
        <CardDescription>Name, description, problems and features.</CardDescription>
        <CardAction>
          <Button size="sm" variant="outline">Edit</Button>
        </CardAction>
      </CardHeader>
      <CardContent className="text-sm">The card holds one planning artifact.</CardContent>
      <CardFooter>
        <Button size="sm">Next step</Button>
      </CardFooter>
    </Card>
  ),
}
