import { useEffect, useState } from 'react'
import type { ShellTheme } from '@/components/app-shell/AppShell'

export const SHELL_THEME_KEY = 'designos:theme'

function read(): ShellTheme {
  try {
    return localStorage.getItem(SHELL_THEME_KEY) === 'light' ? 'light' : 'dark'
  } catch {
    return 'dark'
  }
}

/** Dark by default. Mirrors the choice on <html> so shadcn page content follows the shell. */
export function useShellTheme(): [ShellTheme, (theme: ShellTheme) => void] {
  const [theme, setTheme] = useState<ShellTheme>(read)
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    try {
      localStorage.setItem(SHELL_THEME_KEY, theme)
    } catch {
      /* storage unavailable: the choice lasts for this session */
    }
  }, [theme])
  return [theme, setTheme]
}
