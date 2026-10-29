import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { sampleModels } from '../../../.storybook/helpers'
import { ModelPicker } from './ModelPicker'

const meta = {
  title: 'Design OS/Chat/ModelPicker',
  component: ModelPicker,
  args: { options: sampleModels, value: undefined, onChange: fn() },
} satisfies Meta<typeof ModelPicker>

export default meta
type Story = StoryObj<typeof meta>

export const DefaultModel: Story = {}

export const Chosen: Story = { args: { value: sampleModels[1] } }
