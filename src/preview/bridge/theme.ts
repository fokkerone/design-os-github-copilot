/**
 * Light or dark mode of the preview. preview.html has its own theme; only the mode follows the
 * page: `dos:theme` from the step page, the `theme` key in localStorage (written by the shell,
 * `src/lib/shell-theme.ts`) on its own, and its storage event when the page switches.
 */
export const THEME_KEY = 'theme'

export function storedDark(): boolean {
  try {
    const theme = localStorage.getItem(THEME_KEY) ?? 'system'
    return theme === 'system' ? window.matchMedia('(prefers-color-scheme: dark)').matches : theme === 'dark'
  } catch {
    return false
  }
}

export function applyDark(dark: boolean) {
  document.documentElement.classList.toggle('dark', dark)
}

/** Follows the stored mode; returns the cleanup */
export function followStoredTheme(): () => void {
  applyDark(storedDark())
  const onStorage = (e: StorageEvent) => {
    if (e.key === THEME_KEY) applyDark(storedDark())
  }
  window.addEventListener('storage', onStorage)
  return () => window.removeEventListener('storage', onStorage)
}
