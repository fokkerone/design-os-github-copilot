import { Suspense, useEffect, useState, type ComponentType, type ReactNode } from 'react'
import { usePreviewFonts } from './bridge/fonts'
import { useBridge } from './bridge/useBridge'
import { lazyAppShell, lazyClickdummy, lazyScreenDesign, lazyShellPreview } from './registry'
import { parseRoute, type PreviewRoute } from './route'

function useRoute(): PreviewRoute {
  const [route, setRoute] = useState(() => parseRoute(window.location.hash))
  useEffect(() => {
    const onHash = () => setRoute(parseRoute(window.location.hash))
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  return route
}

/** The preview's own states, styled with the prototype theme */
function Message({ children }: { children: ReactNode }) {
  return <div className="flex h-screen items-center justify-center p-6 text-center text-sm text-muted-foreground">{children}</div>
}

/**
 * Renders a component chosen at runtime (a lazily loaded screen design). The component must have
 * a stable identity (the registry caches it), so it is not remounted on every render.
 */
function Render({ component: Component, children }: { component: ComponentType<{ children?: ReactNode }>; children?: ReactNode }) {
  return <Component>{children}</Component>
}

function Screen({ sectionId, screenDesignName }: { sectionId: string; screenDesignName: string }) {
  const Design = lazyScreenDesign(sectionId, screenDesignName)
  const Shell = lazyAppShell(sectionId)
  if (!Design) return <Message>Screen design not found.</Message>
  if (!Shell) return <Render component={Design} />
  return (
    <Render component={Shell}>
      <Render component={Design} />
    </Render>
  )
}

/**
 * The prototype preview (preview.html): one screen design, the shell or the clickdummy, in its
 * own document with its own stylesheet. Design OS shows it in an iframe; opened on its own (new
 * tab, screenshots) it renders the same without the Live Edit bridge.
 */
export function PreviewApp() {
  const route = useRoute()
  useBridge()
  usePreviewFonts()

  let content: ReactNode
  if (route.kind === 'screen') content = <Screen sectionId={route.sectionId} screenDesignName={route.screenDesignName} />
  else if (route.kind === 'shell') {
    const ShellPreview = lazyShellPreview()
    content = ShellPreview ? <Render component={ShellPreview} /> : <Message>No shell preview yet.</Message>
  } else if (route.kind === 'clickdummy') {
    const App = lazyClickdummy()
    content = App ? <Render component={App} /> : <Message>The clickdummy has not been assembled yet.</Message>
  } else content = <Message>Unknown preview.</Message>

  return <Suspense fallback={<Message>Loading…</Message>}>{content}</Suspense>
}
