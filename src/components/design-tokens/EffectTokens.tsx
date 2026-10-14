import type { DesignTokens, ShadowToken } from '@/types/design-tokens'
import { CodePill, CopyValue, TokenGroup } from './primitives'

function ShadowCard({ shadow }: { shadow: ShadowToken }) {
  return (
    <div className="space-y-2 min-w-0">
      <div className="grid grid-cols-2 gap-2">
        <div className="flex h-20 items-center justify-center rounded-md bg-stone-100 p-3">
          <div className="h-full w-full rounded-md bg-rwe-sand-25" style={{ boxShadow: shadow.light?.css }} />
        </div>
        <div className="flex h-20 items-center justify-center rounded-md bg-stone-900 p-3">
          <div
            className="h-full w-full rounded-md bg-stone-800"
            style={{ boxShadow: (shadow.dark ?? shadow.light)?.css }}
            title={shadow.dark ? 'Dark value' : 'No dark value — light value applies'}
          />
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <CodePill>shadow-{shadow.name}</CodePill>
        {!shadow.dark && <span className="text-[10px] text-stone-400">light only</span>}
      </div>
      {shadow.light && <CopyValue value={shadow.light.css} />}
    </div>
  )
}

export function Shadows({ shadows }: { shadows: ShadowToken[] }) {
  if (!shadows.length) return null
  const roles = [...new Set(shadows.map((s) => s.role))]
  return (
    <TokenGroup title="Shadows" count={shadows.length} hint="Each preview shows light (left) and dark (right).">
      <div className="space-y-6">
        {roles.map((role) => (
          <div key={role} className="space-y-2">
            {roles.length > 1 && <p className="text-xs font-medium capitalize text-stone-600 dark:text-rwe-neutral-300">{role}</p>}
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {shadows
                .filter((s) => s.role === role)
                .map((s) => (
                  <ShadowCard key={s.name} shadow={s} />
                ))}
            </div>
          </div>
        ))}
      </div>
    </TokenGroup>
  )
}

export function BlurEffects({ effects }: { effects: DesignTokens['effects'] }) {
  if (!effects.length) return null
  return (
    <TokenGroup title="Blur effects" count={effects.length} hint="Figma effect styles from DESIGN.md — use Tailwind blur-* / backdrop-blur-*.">
      <div className="flex flex-wrap gap-2">
        {effects.map((e) => (
          <div key={e.name} className="rounded-md bg-stone-50 dark:bg-rwe-neutral-800/50 px-3 py-2">
            <p className="text-xs font-medium text-stone-700 dark:text-rwe-neutral-300">{e.label}</p>
            <p className="font-mono text-[11px] text-stone-500 dark:text-rwe-neutral-400">
              {e.kind} · {e.px}px
            </p>
          </div>
        ))}
      </div>
    </TokenGroup>
  )
}

export function OpacityScale({ opacity }: { opacity: DesignTokens['opacity'] }) {
  if (!opacity.length) return null
  return (
    <TokenGroup title="Opacity" count={opacity.length} hint="Documented only — Tailwind v4 supports opacity-* natively.">
      <div className="flex flex-wrap gap-1">
        {opacity.map((o) => (
          <div key={o.name} className="w-9 space-y-1 text-center">
            <div className="h-6 rounded-sm bg-stone-900 dark:bg-rwe-neutral-100" style={{ opacity: o.value / 100 }} />
            <span className="font-mono text-[10px] text-stone-400">{o.name}</span>
          </div>
        ))}
      </div>
    </TokenGroup>
  )
}
