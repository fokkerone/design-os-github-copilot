import { Check, ArrowRight, AlertTriangle } from 'lucide-react'
import type { ReactNode } from 'react'

export type StepStatus = 'completed' | 'current' | 'upcoming' | 'skipped'

interface StepIndicatorProps {
  step: number
  status: StepStatus
  children: ReactNode
  isLast?: boolean
  optional?: boolean
}

export function StepIndicator({ step, status, children, isLast = false, optional = false }: StepIndicatorProps) {
  return (
    <div className="relative">
      {/* Vertical connecting line - extends from this step to the next */}
      {!isLast && (
        <div
          className="absolute left-[10px] top-[28px] w-[2px] h-[calc(100%+16px)] bg-muted"
          aria-hidden="true"
        />
      )}

      {/* Step badge positioned at top-left */}
      <div className="absolute -left-[2px] top-0 z-10">
        <StepBadge step={step} status={status} optional={optional} />
      </div>

      {/* Card content with left padding to accommodate the step indicator */}
      <div className="pl-10">
        {children}
      </div>
    </div>
  )
}

interface StepBadgeProps {
  step: number
  status: StepStatus
  optional?: boolean
}

function StepBadge({ step, status, optional = false }: StepBadgeProps) {
  const baseClasses = "w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-200"

  // Optional steps that are upcoming show as dashed/muted
  if (optional && status === 'upcoming') {
    return (
      <div className={`${baseClasses} border-2 border-dashed border-border text-muted-foreground`}>
        {step}
      </div>
    )
  }

  // Optional steps that are current show normally but slightly muted
  if (optional && status === 'current') {
    return (
      <div className={`${baseClasses} bg-primary text-primary-foreground shadow-sm`}>
        <ArrowRight className="w-3 h-3" strokeWidth={2.5} />
      </div>
    )
  }

  if (status === 'completed') {
    return (
      <div className={`${baseClasses} bg-muted text-muted-foreground`}>
        <Check className="w-3 h-3" strokeWidth={2.5} />
      </div>
    )
  }

  if (status === 'current') {
    return (
      <div className={`${baseClasses} bg-primary text-primary-foreground shadow-sm`}>
        <ArrowRight className="w-3 h-3" strokeWidth={2.5} />
      </div>
    )
  }

  if (status === 'skipped') {
    return (
      <div className={`${baseClasses} bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400`}>
        <AlertTriangle className="w-3 h-3" strokeWidth={2.5} />
      </div>
    )
  }

  // upcoming
  return (
    <div className={`${baseClasses} bg-muted text-muted-foreground`}>
      {step}
    </div>
  )
}
