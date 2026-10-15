import { paths } from '@/lib/paths'
import type { PageTab } from './PageTabs'

export const roadmapTabs: PageTab[] = [
  { to: paths.roadmap, label: 'Roadmap' },
  { to: paths.dataShape, label: 'Data Shape' },
]

export const designSystemTabs: PageTab[] = [
  { to: paths.designSystem, label: 'Tokens' },
  { to: paths.shell, label: 'Shell' },
]
