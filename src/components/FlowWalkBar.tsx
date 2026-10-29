import { ArrowLeft, ArrowRight, GitBranch, X } from 'lucide-react'
import type { FlowWalk } from '@/lib/clickdummy-flows'

/**
 * Floating control for walking a user flow through the clickdummy: pick a flow,
 * see the current step, move along its transitions. Rendered by src/clickdummy/ClickdummyApp.tsx.
 */
export function FlowWalkBar({ walk }: { walk: FlowWalk }) {
  if (walk.flows.length === 0) return null

  const buttonClass =
    'inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-40'

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 max-w-[calc(100vw-2rem)]">
      <div className="flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-border bg-card/95 backdrop-blur-sm shadow-lg px-3 py-2">
        <GitBranch className="w-4 h-4 text-primary shrink-0" strokeWidth={1.75} />

        {walk.locked ? (
          <span className="text-xs font-medium text-foreground">{walk.active?.flow.title}</span>
        ) : (
          <select
            aria-label="Walk through a user flow"
            value={walk.active?.flow.id ?? ''}
            onChange={(event) => (event.target.value ? walk.start(event.target.value) : walk.stop())}
            className="bg-transparent text-xs font-medium text-foreground focus:outline-none max-w-48"
          >
            <option value="">Walk through a flow…</option>
            {walk.flows.map(({ flow, route }) => (
              <option key={flow.id} value={flow.id}>
                {flow.title}
                {route.complete ? '' : ' (incomplete)'}
              </option>
            ))}
          </select>
        )}

        {walk.active && walk.step && (
          <>
            <span className="h-4 w-px bg-muted" />
            <span className="text-xs text-muted-foreground">
              <span className="font-mono text-muted-foreground">
                {walk.position}/{walk.active.route.steps.length}
              </span>{' '}
              {walk.step.id} · {walk.step.title}
            </span>
            <button
              onClick={walk.back}
              disabled={!walk.canGoBack}
              className={`${buttonClass} text-muted-foreground hover:bg-accent`}
            >
              <ArrowLeft className="w-3 h-3" strokeWidth={2} />
              Back
            </button>
            {walk.options.length === 0 ? (
              <span className="text-xs text-primary">End of flow</span>
            ) : (
              walk.options.map((option) => (
                <button
                  key={`${option.step.id}-${option.label}`}
                  onClick={() => walk.goTo(option.step.id)}
                  title={`${option.step.id} · ${option.step.title}`}
                  className={`${buttonClass} ${
                    option.kind === 'failure'
                      ? 'bg-destructive/10 text-destructive hover:bg-destructive/10'
                      : 'bg-primary text-primary-foreground hover:bg-primary/90'
                  }`}
                >
                  {option.label || 'Next'}
                  <ArrowRight className="w-3 h-3" strokeWidth={2} />
                </button>
              ))
            )}
            {!walk.locked && (
              <button
                onClick={walk.stop}
                aria-label="Leave the flow"
                className="p-1 rounded-full text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" strokeWidth={2} />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

/**
 * Shown instead of a screen when the current flow step has no screen design.
 * The gap stays visible: no other screen stands in for it.
 */
export function FlowStepGap({ walk }: { walk: FlowWalk }) {
  if (!walk.step) return null
  const wanted = [walk.step.sectionId, walk.step.screen].filter(Boolean).join('/')
  return (
    <div className="flex items-center justify-center min-h-[60vh] p-8">
      <div className="text-center max-w-md">
        <p className="font-mono text-xs text-muted-foreground mb-2">
          {walk.active?.flow.title} · {walk.step.id}
        </p>
        <p className="text-lg font-medium text-foreground">{walk.step.title}</p>
        <p className="text-sm text-muted-foreground mt-2">
          {wanted
            ? `This step is not designed yet. It asks for the screen design ${wanted}.`
            : 'This step has no screen design assigned.'}
        </p>
      </div>
    </div>
  )
}
