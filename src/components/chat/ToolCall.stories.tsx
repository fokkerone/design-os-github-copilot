import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { ToolCall } from './ToolCall'

const meta = {
  title: 'Design OS/Chat/ToolCall',
  component: ToolCall,
  args: { toolName: 'read', args: { filePath: 'product/product-overview.md' }, respondToApproval: fn(async () => {}) },
  decorators: [(Story) => <div className="max-w-[720px]"><Story /></div>],
} satisfies Meta<typeof ToolCall>

export default meta
type Story = StoryObj<typeof meta>

export const Done: Story = { args: { status: { type: 'complete' } } }

export const Running: Story = { args: { toolName: 'bash', args: { command: 'npm run tokens:build' }, status: { type: 'running' } } }

export const Failed: Story = { args: { toolName: 'edit', args: { filePath: 'product/shell/spec.md' }, isError: true } }

export const NeedsPermission: Story = {
  args: {
    toolName: 'bash',
    args: { command: 'npm run tokens:build' },
    status: { type: 'requires-action', reason: 'tool-calls' },
    approval: {
      id: 'permission:p1',
      options: [
        { id: 'once', kind: 'allow-once', label: 'Allow once' },
        { id: 'always', kind: 'allow-always', label: 'Always allow', grants: ['npm run *'] },
        { id: 'reject', kind: 'reject-once', label: 'Deny' },
      ],
    },
  },
}

export const Allowed: Story = {
  args: { toolName: 'bash', args: { command: 'npm run tokens:build' }, status: { type: 'complete' }, approval: { id: 'permission:p1', approved: true } },
}

export const Question: Story = {
  args: {
    toolName: 'question',
    args: {},
    status: { type: 'requires-action', reason: 'tool-calls' },
    approval: {
      id: 'form:f1',
      display: 'questions',
      dismissible: true,
      questions: [
        {
          id: 'layout',
          prompt: 'Which layout should the shell use?',
          header: 'Shell',
          options: [
            { id: 'sidebar', label: 'Sidebar', description: 'Navigation on the left' },
            { id: 'top', label: 'Top bar', description: 'Navigation on top' },
          ],
          allowFreeform: true,
        },
      ],
    },
  },
}

export const QuestionAnswered: Story = {
  args: {
    ...Question.args,
    status: { type: 'complete' },
    approval: { ...Question.args!.approval!, approved: true, answers: { layout: { optionIds: ['sidebar'] } } },
  },
}
