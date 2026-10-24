import type { RouteObject } from 'react-router-dom'
import { AppFrame, LegacyOrNotFound } from '@/components/app-shell/AppFrame'

/** Lazy route for a named export, so pages load on demand */
const page = <T extends Record<string, unknown>>(load: () => Promise<T>, name: keyof T): Pick<RouteObject, 'lazy'> => ({
  lazy: async () => ({ Component: (await load())[name] as React.ComponentType }),
})


export const appRoutes: RouteObject[] = [
  // Fullscreen previews render outside the shell
  {
    path: '/prototype/sections/:sectionId/screen-designs/:screenDesignName/fullscreen',
    ...page(() => import('@/components/ScreenDesignPage'), 'ScreenDesignFullscreen'),
  },
  {
    path: '/prototype/preview/fullscreen',
    ...page(() => import('@/components/ClickdummyFullscreen'), 'ClickdummyFullscreen'),
  },
  {
    path: '/prototype/shell/fullscreen',
    ...page(() => import('@/components/ShellDesignPage'), 'ShellDesignFullscreen'),
  },
  {
    element: <AppFrame />,
    children: [
      { path: '/prototype/vision', ...page(() => import('@/components/VisionPage'), 'VisionPage') },
      { path: '/prototype/shell', ...page(() => import('@/components/ShellDesignPage'), 'ShellDesignPage') },
      { path: '/prototype/roadmap', ...page(() => import('@/components/RoadmapPage'), 'RoadmapPage') },
      { path: '/prototype/roadmap/data-shape', ...page(() => import('@/components/DataShapePage'), 'DataShapePage') },
      { path: '/prototype/sections', ...page(() => import('@/components/SectionsPage'), 'SectionsPage') },
      { path: '/prototype/sections/:sectionId', ...page(() => import('@/components/SectionPage'), 'SectionPage') },
      {
        path: '/prototype/sections/:sectionId/screen-designs/:screenDesignName',
        ...page(() => import('@/components/ScreenDesignPage'), 'ScreenDesignPage'),
      },
      { path: '/prototype/preview', ...page(() => import('@/components/ClickdummyPage'), 'ClickdummyPage') },
      { path: '/prototype/export', ...page(() => import('@/components/ExportPage'), 'ExportPage') },
      { path: '/personas', ...page(() => import('@/components/PersonasPage'), 'PersonasPage') },
      { path: '/personas/:personaId', ...page(() => import('@/components/PersonaPage'), 'PersonaPage') },
      { path: '/flows', ...page(() => import('@/components/FlowsPage'), 'FlowsPage') },
      { path: '/flows/:flowId', ...page(() => import('@/components/FlowPage'), 'FlowPage') },
      { path: '/design-system', ...page(() => import('@/components/DesignPage'), 'DesignPage') },
      { path: '/design-system/components', ...page(() => import('@/components/ComponentsPage'), 'ComponentsPage') },
      { path: '/techstack', ...page(() => import('@/components/TechstackPage'), 'TechstackPage') },
      { path: '/wiki', ...page(() => import('@/components/WikiPage'), 'WikiPage') },
      { path: '/wiki/*', ...page(() => import('@/components/WikiArticlePage'), 'WikiArticlePage') },
      { path: '*', element: <LegacyOrNotFound /> },
    ],
  },
]
