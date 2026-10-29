import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, GitBranch, UserRound } from 'lucide-react'
import { getProjectModel } from '@/lib/project-model'
import type { ResolvedStep } from '@/lib/model/project.ts'
import { paths } from '@/lib/paths'

interface ScreenContextBarProps {
  sectionId: string
  screenDesignName: string
}

function StepLink({ step, direction }: { step: ResolvedStep | null; direction: 'previous' | 'next' }) {
  if (!step) return null
  const label = `${step.id} ${step.title}`
  const content = (
    <>
      {direction === 'previous' && <ArrowLeft className="w-3 h-3 shrink-0" strokeWidth={1.75} />}
      <span className="truncate max-w-48">{label}</span>
      {direction === 'next' && <ArrowRight className="w-3 h-3 shrink-0" strokeWidth={1.75} />}
    </>
  )
  if (!step.target) {
    return (
      <span
        className="inline-flex items-center gap-1 text-muted-foreground"
        title={step.screen ? `${step.screen} is not designed yet` : 'This step has no screen assigned'}
      >
        {content}
      </span>
    )
  }
  return (
    <Link
      to={paths.screen(step.target.sectionId, step.target.name)}
      className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
      title={`${step.target.sectionId}/${step.target.name}`}
    >
      {content}
    </Link>
  )
}

/**
 * Where a screen design sits in the user flows: the steps it covers, who it is for,
 * and the step before and after, so a flow can be walked through screen by screen.
 */
export function ScreenContextBar({ sectionId, screenDesignName }: ScreenContextBarProps) {
  const model = getProjectModel()
  const usages = model.flowsForScreen(sectionId, screenDesignName)
  const personas = model.personasForScreen(sectionId, screenDesignName)

  if (usages.length === 0 && personas.length === 0) return null

  return (
    <div className="border-b border-border bg-card shrink-0 px-4 py-1.5 text-xs space-y-1">
      {usages.length === 0 && (
        <p className="text-muted-foreground">No user flow step names this screen.</p>
      )}
      {usages.map((usage) => (
        <div key={usage.flow.id} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1">
          <div className="flex items-center gap-2 min-w-0">
            <GitBranch className="w-3.5 h-3.5 text-primary shrink-0" strokeWidth={1.75} />
            <Link
              to={`/flows/${usage.flow.id}`}
              className="font-medium text-foreground hover:text-foreground truncate"
            >
              {usage.flow.title}
            </Link>
            <span className="text-muted-foreground truncate">
              {usage.steps.map((step) => `${step.id} ${step.title}`).join(', ')}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <StepLink step={usage.previous} direction="previous" />
            <StepLink step={usage.next} direction="next" />
          </div>
        </div>
      ))}
      {personas.length > 0 && (
        <div className="flex items-center gap-2">
          <UserRound className="w-3.5 h-3.5 text-primary shrink-0" strokeWidth={1.75} />
          <span className="text-muted-foreground">For</span>
          {personas.map((persona, index) => (
            <span key={persona.id}>
              <Link
                to={`/personas/${persona.id}`}
                className="text-foreground hover:text-foreground"
              >
                {persona.name}
              </Link>
              {index < personas.length - 1 && <span className="text-muted-foreground">,</span>}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
