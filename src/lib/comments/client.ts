/**
 * Comments, page side: reads and writes the comments of one screen through the dev server
 * (scripts/comments-store.mjs), which keeps them in wiki/comments/.
 */
import type { LiveTarget } from '@/lib/live-edit/selection'
import type { CommentAnchor, CommentStatus, DesignComment } from './format'

export const COMMENTS_ENDPOINT = '/__designos/comments'
const HEADERS = { 'content-type': 'application/json', 'x-designos-live-edit': '1' }

/** The wiki page a target's comments live on */
export function commentsPage(target: LiveTarget): string {
  return `wiki/comments/${target.kind === 'shell' ? 'shell' : target.sectionId}.md`
}

export interface NewComment {
  text: string
  command: string | null
  element: string
  anchor: CommentAnchor
}

export type CommentChange =
  | { action: 'create'; comment: NewComment }
  | { action: 'update'; number: number; patch: { text?: string; command?: string | null; status?: CommentStatus } }
  | { action: 'delete'; number: number }

type Result = { ok: true; comments: DesignComment[]; comment?: DesignComment } | { ok: false; error: string }

async function call(url: string, init: RequestInit): Promise<Result> {
  try {
    const res = await fetch(url, { ...init, headers: HEADERS })
    const body = (await res.json().catch(() => ({}))) as { comments?: DesignComment[]; comment?: DesignComment; error?: string }
    return res.ok && body.comments ? { ok: true, comments: body.comments, ...(body.comment && { comment: body.comment }) } : { ok: false, error: body.error ?? `HTTP ${res.status}` }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}

export function loadComments(target: LiveTarget): Promise<Result> {
  const query = target.kind === 'shell' ? 'shell=1' : `section=${encodeURIComponent(target.sectionId)}&screen=${encodeURIComponent(target.screenDesignName)}`
  return call(`${COMMENTS_ENDPOINT}?${query}`, { method: 'GET' })
}

export function changeComment(target: LiveTarget, change: CommentChange): Promise<Result> {
  return call(COMMENTS_ENDPOINT, { method: 'POST', body: JSON.stringify({ ...change, target }) })
}
