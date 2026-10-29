import type { Meta, StoryObj } from '@storybook/react-vite'
import { getProjectModel } from '@/lib/project-model'
import { CommandHint, CoverageBar, FlowChip, IssueList, PersonaChip, SectionChip, StepScreen, StepStatusBadge } from './PlanningContext'

// The project model of the sample fixtures, as the pages compute it
const model = getProjectModel()
const flow = model.flows[0]
const steps = flow ? model.resolveSteps(flow.id) : []

const meta = {
  title: 'Design OS/Building Blocks/PlanningContext',
  component: CoverageBar,
  args: { coverage: flow ? model.coverage(flow.id) : { total: 4, mapped: 2, open: 2, partial: 0, percent: 50 } },
} satisfies Meta<typeof CoverageBar>

export default meta
type Story = StoryObj<typeof meta>

export const Coverage: Story = {}

export const CoverageCompact: Story = { args: { compact: true } }

export const Steps: Story = {
  render: () => (
    <ul className="space-y-2 text-sm">
      {steps.map((step) => (
        <li key={step.id} className="flex items-center gap-3">
          <StepStatusBadge step={step} />
          <span>{step.title}</span>
          <StepScreen step={step} />
        </li>
      ))}
    </ul>
  ),
}

export const Chips: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      {model.personas.map((persona) => (
        <PersonaChip key={persona.id} persona={persona} />
      ))}
      {model.flows.map((f) => (
        <FlowChip key={f.id} flow={f} detail="4 steps" />
      ))}
      <SectionChip sectionId="meter-readings" title="Meter Readings" />
    </div>
  ),
}

export const Issues: Story = {
  render: () => (
    <IssueList
      issues={
        model.issues.length
          ? model.issues
          : [
              { kind: 'screen-missing', severity: 'gap', message: 'Step "Confirm" has no screen design yet.', flowId: 'submit-meter-reading' },
              { kind: 'unknown-section', severity: 'conflict', message: 'The flow names a section the roadmap does not have.' },
            ]
      }
    />
  ),
}

export const Command: Story = { render: () => <CommandHint label="Map the missing steps" step="userflow" args="submit-meter-reading" /> }

export const CommandWithChat: Story = { ...Command, parameters: { chat: 'online' } }
