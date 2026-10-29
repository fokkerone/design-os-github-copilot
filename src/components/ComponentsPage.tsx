import { Component } from 'lucide-react'
import { AppLayout } from '@/components/AppLayout'
import { PageTabs } from '@/components/PageTabs'
import { designSystemTabs } from '@/components/tabs'
import { uiComponents, type UiComponent } from '@/lib/ui-components'

const muted = 'text-muted-foreground'

/**
 * Design System › Components: the primitives of the product UI layer and their variants, read
 * from their props types (scripts/component-props.mjs). The tree in Live Edit uses the same data.
 */
export function ComponentsPage() {
  const components = uiComponents()
  return (
    <AppLayout>
      <PageTabs label="Design system views" tabs={designSystemTabs} />
      <div className="mb-8">
        <h1 className="mb-2 text-2xl font-semibold text-foreground">Components</h1>
        <p className="text-muted-foreground">
          The UI primitives in <code className="font-mono text-[13px]">src/ui/</code> that screen designs and the shell are built from, with their variants and where designs use them. A design imports primitives only from here (<code className="font-mono text-[13px]">npm run ui:check</code>).
        </p>
      </div>
      {components.length === 0 ? (
        <p className={`rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm ${muted}`}>
          No components in <code className="font-mono">src/ui/</code> yet. Design a screen or the shell to add them.
        </p>
      ) : (
        <ul className="grid gap-4 @3xl:grid-cols-2">
          {components.map((c) => (
            <li key={`${c.file}:${c.name}`}>
              <ComponentCard component={c} />
            </li>
          ))}
        </ul>
      )}
    </AppLayout>
  )
}

function ComponentCard({ component }: { component: UiComponent }) {
  const variants = component.props.filter((p) => p.kind === 'choice' || p.kind === 'boolean')
  const others = component.props.filter((p) => p.kind !== 'choice' && p.kind !== 'boolean')
  return (
    <article aria-label={component.name} className="h-full rounded-lg border border-border bg-card p-4 shadow-sm">
      <header className="mb-3 flex items-center gap-2">
        <Component className="size-4 shrink-0 text-primary" strokeWidth={1.75} />
        <h2 className="font-semibold text-foreground">{component.name}</h2>
        <span className={`ml-auto truncate font-mono text-[11px] ${muted}`}>{component.file}</span>
      </header>
      {variants.length > 0 && (
        <dl className="space-y-2">
          {variants.map((p) => (
            <div key={p.name} className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <dt className="w-20 shrink-0 font-mono text-[12px] text-foreground">
                {p.name}
                {p.from && <span className={`block text-[10px] ${muted}`}>{p.from}</span>}
              </dt>
              <dd className="flex min-w-0 flex-1 flex-wrap gap-1">
                {(p.kind === 'boolean' ? ['true', 'false'] : (p.options ?? [])).map((option) => {
                  const isDefault = String(p.default ?? (p.kind === 'boolean' ? false : '')) === option
                  return (
                    <span
                      key={option}
                      title={isDefault ? 'Default' : undefined}
                      className={`rounded px-1.5 py-0.5 font-mono text-[11px] ${
                        isDefault
                          ? 'bg-primary/15 text-primary'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {option}
                    </span>
                  )
                })}
              </dd>
            </div>
          ))}
        </dl>
      )}
      {others.length > 0 && (
        <p className={`mt-3 font-mono text-[11px] ${muted}`}>
          {others.map((p) => `${p.name}${p.optional ? '?' : ''}: ${p.type ?? p.kind}`).join(' · ')}
        </p>
      )}
      {component.props.length === 0 && <p className={`text-[12px] ${muted}`}>No props of its own</p>}
      <p className={`mt-3 border-t border-border pt-2 text-[11px] ${muted}`} title={component.usedIn.join('\n')}>
        {component.usedIn.length
          ? `Used in ${component.usedIn.map((f) => f.split('/').pop()?.replace(/\.tsx?$/, '')).join(', ')}`
          : 'Not used in a design yet'}
      </p>
    </article>
  )
}
