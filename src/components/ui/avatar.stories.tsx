import type { Meta, StoryObj } from '@storybook/react-vite'
import { Avatar, AvatarFallback, AvatarImage } from './avatar'

// Inline image, so the story needs no network
const portrait =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" fill="#1d4477"/><circle cx="20" cy="16" r="7" fill="#e8ecf1"/><rect x="8" y="26" width="24" height="14" rx="7" fill="#e8ecf1"/></svg>')

const meta = {
  title: 'Design OS/UI/Avatar',
  component: Avatar,
} satisfies Meta<typeof Avatar>

export default meta
type Story = StoryObj<typeof meta>

export const Fallback: Story = {
  render: () => (
    <Avatar>
      <AvatarFallback>VC</AvatarFallback>
    </Avatar>
  ),
}

export const WithImage: Story = {
  render: () => (
    <Avatar>
      <AvatarImage src={portrait} alt="Avatar" />
      <AvatarFallback>CN</AvatarFallback>
    </Avatar>
  ),
}
