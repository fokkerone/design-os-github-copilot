import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { fn } from 'storybook/test'
import { CommentButton } from './CommentButton'

const meta = {
  title: 'Design OS/Live Edit/Comments/CommentButton',
  component: CommentButton,
  args: { active: false, open: 0, showResolved: false, onToggle: fn(), onShowResolved: fn() },
} satisfies Meta<typeof CommentButton>

export default meta
type Story = StoryObj<typeof meta>

export const Off: Story = {}

export const OffWithOpenComments: Story = { args: { open: 3 } }

/** Comment mode on: the second button shows or hides resolved comments */
export const On: Story = { args: { active: true, open: 3 } }

export const OnShowingResolved: Story = { args: { active: true, open: 1, showResolved: true } }

/** Click to toggle, as in the preview toolbar (or press C there) */
export const Interactive: Story = {
  render: function Render(args) {
    const [active, setActive] = useState(false)
    const [showResolved, setShowResolved] = useState(false)
    return (
      <CommentButton
        {...args}
        active={active}
        onToggle={() => setActive(!active)}
        showResolved={showResolved}
        onShowResolved={setShowResolved}
      />
    )
  },
  args: { open: 2 },
}
