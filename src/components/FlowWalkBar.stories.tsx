import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect } from 'react'
import { useFlowWalk } from '@/lib/clickdummy-flows'
import { FlowStepGap, FlowWalkBar } from './FlowWalkBar'

/** The walk of the sample project's flows, optionally started */
function Walk({ start, gap }: { start?: boolean; gap?: boolean }) {
  const walk = useFlowWalk()
  const first = walk.flows[0]?.flow.id
  useEffect(() => {
    if (start && first) walk.start(first)
    // Start once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start, first])
  return gap ? <FlowStepGap walk={walk} /> : <FlowWalkBar walk={walk} />
}

const meta = {
  title: 'Design OS/Building Blocks/FlowWalkBar',
  component: FlowWalkBar,
  parameters: { layout: 'fullscreen' },
  decorators: [(Story) => <div className="h-[320px]"><Story /></div>],
} satisfies Meta

export default meta
type Story = StoryObj

export const PickAFlow: Story = { render: () => <Walk /> }

export const Walking: Story = { render: () => <Walk start /> }

export const StepGap: Story = { render: () => <Walk start gap /> }
