import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Link } from 'react-router-dom'
import { BookOpen, ChevronDown, ChevronRight, GitBranch, PanelTop, Square } from 'lucide-react'
import { EmptyState } from '@/components/EmptyState'
import { MermaidDiagram } from '@/components/MermaidDiagram'
import { loadFlow } from '@/lib/flow-loader'
import { getWikiPage } from '@/lib/wiki-loader'
import type { ParsedSpec } from '@/types/section'

interface SpecCardProps {
  spec: ParsedSpec | null
  sectionTitle?: string
  sectionName?: string
}

interface LinkedFlowItemProps {
  text: string
  flowId: string
}

function LinkedFlowItem({ text, flowId }: LinkedFlowItemProps) {
  const [open, setOpen] = useState(false)
  const flow = loadFlow(flowId)

  return (
    <li>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger className="flex items-start gap-3 w-full text-left group">
          <GitBranch className="w-3.5 h-3.5 text-lime-600 dark:text-lime-400 mt-0.5 shrink-0" strokeWidth={1.75} />
          <span className="flex-1 text-stone-700 dark:text-stone-300 text-sm group-hover:text-stone-900 dark:group-hover:text-stone-100">
            {text}
            <span className="ml-2 font-mono text-xs text-stone-400 dark:text-stone-500">flow: {flowId}</span>
          </span>
          <ChevronRight
            className={`w-4 h-4 text-stone-400 dark:text-stone-500 transition-transform ${open ? 'rotate-90' : ''}`}
            strokeWidth={1.5}
          />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="ml-6 mt-3 mb-1 space-y-3 rounded-md border border-stone-200 dark:border-stone-700 p-4">
            {flow ? (
              <>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-stone-900 dark:text-stone-100">{flow.title}</span>
                  <span className="text-xs uppercase tracking-wide text-stone-500 dark:text-stone-400">{flow.status}</span>
                </div>
                {flow.overview && (
                  <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">{flow.overview}</p>
                )}
                {flow.mermaid ? (
                  <MermaidDiagram chart={flow.mermaid} />
                ) : (
                  <p className="text-sm text-stone-500 dark:text-stone-400">No Mermaid diagram in this flow yet.</p>
                )}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-mono text-xs text-stone-400 dark:text-stone-500">product/flows/{flowId}.md</p>
                  {getWikiPage(`flows/${flowId}`) && (
                    <Link
                      to={`/wiki/flows/${flowId}`}
                      className="inline-flex items-center gap-1 text-xs text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100"
                    >
                      <BookOpen className="w-3.5 h-3.5" strokeWidth={1.5} />
                      Open in wiki
                    </Link>
                  )}
                </div>
              </>
            ) : (
              <p className="text-sm text-stone-500 dark:text-stone-400">
                Flow file <span className="font-mono">product/flows/{flowId}.md</span> not found. Create it with{' '}
                <span className="font-mono">/design-os:userflow</span>.
              </p>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </li>
  )
}

export function SpecCard({ spec, sectionTitle, sectionName }: SpecCardProps) {
  const [userFlowsOpen, setUserFlowsOpen] = useState(false)
  const [uiReqOpen, setUiReqOpen] = useState(false)

  // Empty state
  if (!spec) {
    return <EmptyState type="spec" sectionName={sectionName} />
  }

  return (
    <Card className="border-stone-200 dark:border-stone-700 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-stone-900 dark:text-stone-100">
          {sectionTitle || 'Specification'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overview */}
        {spec.overview && (
          <p className="text-stone-600 dark:text-stone-400 leading-relaxed">
            {spec.overview}
          </p>
        )}

        {/* User Flows - Expandable */}
        {spec.userFlows.length > 0 && (
          <Collapsible open={userFlowsOpen} onOpenChange={setUserFlowsOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-left group">
              <span className="text-sm font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                User Flows
                <span className="ml-2 text-stone-400 dark:text-stone-500 normal-case tracking-normal">
                  ({spec.userFlows.length})
                </span>
              </span>
              <ChevronDown
                className={`w-4 h-4 text-stone-400 dark:text-stone-500 transition-transform ${userFlowsOpen ? 'rotate-180' : ''
                  }`}
                strokeWidth={1.5}
              />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <ul className="space-y-2 pt-2">
                {spec.userFlowItems.map((item, index) =>
                  item.flowId ? (
                    <LinkedFlowItem key={index} text={item.text} flowId={item.flowId} />
                  ) : (
                    <li key={index} className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-stone-900 dark:bg-stone-100 mt-2 shrink-0" />
                      <span className="text-stone-700 dark:text-stone-300 text-sm">
                        {item.text}
                      </span>
                    </li>
                  )
                )}
              </ul>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* UI Requirements - Expandable */}
        {spec.uiRequirements.length > 0 && (
          <Collapsible open={uiReqOpen} onOpenChange={setUiReqOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-left group">
              <span className="text-sm font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                UI Requirements
                <span className="ml-2 text-stone-400 dark:text-stone-500 normal-case tracking-normal">
                  ({spec.uiRequirements.length})
                </span>
              </span>
              <ChevronDown
                className={`w-4 h-4 text-stone-400 dark:text-stone-500 transition-transform ${uiReqOpen ? 'rotate-180' : ''
                  }`}
                strokeWidth={1.5}
              />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <ul className="space-y-2 pt-2">
                {spec.uiRequirements.map((req, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-stone-900 dark:bg-stone-100 mt-2 shrink-0" />
                    <span className="text-stone-700 dark:text-stone-300 text-sm">
                      {req}
                    </span>
                  </li>
                ))}
              </ul>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Display Configuration */}
        <div className="flex items-center gap-2 pt-2 border-t border-stone-100 dark:border-stone-800">
          {spec.useShell ? (
            <>
              <PanelTop className="w-4 h-4 text-stone-400 dark:text-stone-500" strokeWidth={1.5} />
              <span className="text-sm text-stone-500 dark:text-stone-400">
                Displays inside app shell
              </span>
            </>
          ) : (
            <>
              <Square className="w-4 h-4 text-stone-400 dark:text-stone-500" strokeWidth={1.5} />
              <span className="text-sm text-stone-500 dark:text-stone-400">
                Standalone page (no shell)
              </span>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
