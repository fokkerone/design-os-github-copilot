import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, GitBranch, UserRound } from 'lucide-react'
import { getProjectModel } from '@/lib/project-model'
import type { ResolvedStep } from '@/lib/model/project.ts'

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
        className="inline-flex items-center gap-1 text-stone-400 dark:text-stone-500"
        title={step.screen ? `${step.screen} is not designed yet` : 'This step has no screen assigned'}
      >
        {content}
      </span>
    )
  }
  return (
    <Link
      to={`/sections/${step.target.sectionId}/screen-designs/${step.target.name}`}
      className="inline-flex items-center gap-1 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100"
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
    <div className="border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 shrink-0 px-4 py-1.5 text-xs space-y-1">
      {usages.length === 0 && (
        <p className="text-stone-500 dark:text-stone-400">No user flow step names this screen.</p>
      )}
      {usages.map((usage) => (
        <div key={usage.flow.id} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1">
          <div className="flex items-center gap-2 min-w-0">
            <GitBranch className="w-3.5 h-3.5 text-lime-600 dark:text-lime-400 shrink-0" strokeWidth={1.75} />
            <Link
              to={`/flows/${usage.flow.id}`}
              className="font-medium text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 truncate"
            >
              {usage.flow.title}
            </Link>
            <span className="text-stone-500 dark:text-stone-400 truncate">
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
          <UserRound className="w-3.5 h-3.5 text-lime-600 dark:text-lime-400 shrink-0" strokeWidth={1.75} />
          <span className="text-stone-500 dark:text-stone-400">For</span>
          {personas.map((persona, index) => (
            <span key={persona.id}>
              <Link
                to={`/personas/${persona.id}`}
                className="text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100"
              >
                {persona.name}
              </Link>
              {index < personas.length - 1 && <span className="text-stone-400 dark:text-stone-500">,</span>}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
