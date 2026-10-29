/**
 * Routes of the prototype preview, in the hash of preview.html, so the preview needs no router:
 *
 *   #/screen/<section-id>/<ScreenName>   a screen design (in the shell when the section uses it)
 *   #/shell                              the shell preview
 *   #/clickdummy                         the assembled clickdummy
 */
export type PreviewRoute =
  | { kind: 'screen'; sectionId: string; screenDesignName: string }
  | { kind: 'shell' }
  | { kind: 'clickdummy' }
  | { kind: 'unknown' }

export const PREVIEW_PAGE = '/preview.html'

export function parseRoute(hash: string): PreviewRoute {
  const parts = hash.replace(/^#?\/?/, '').split('/').filter(Boolean).map(decodeURIComponent)
  if (parts[0] === 'screen' && parts.length === 3) return { kind: 'screen', sectionId: parts[1], screenDesignName: parts[2] }
  if (parts[0] === 'shell' && parts.length === 1) return { kind: 'shell' }
  if (parts[0] === 'clickdummy' && parts.length === 1) return { kind: 'clickdummy' }
  return { kind: 'unknown' }
}

export function routeHref(route: Exclude<PreviewRoute, { kind: 'unknown' }>): string {
  const seg = encodeURIComponent
  if (route.kind === 'screen') return `${PREVIEW_PAGE}#/screen/${seg(route.sectionId)}/${seg(route.screenDesignName)}`
  return `${PREVIEW_PAGE}#/${route.kind}`
}
