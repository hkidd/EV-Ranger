import { useState, useCallback, useEffect, type ReactNode } from 'react'
import { ThemeContext, type ThemeMode } from './ThemeContext'

function getSavedTheme(): ThemeMode {
  try {
    const saved = localStorage.getItem('theme')
    if (saved === 'light' || saved === 'dark' || saved === 'system')
      return saved
  } catch {
    // The theme toggle remains usable when browser storage is unavailable.
  }
  return 'dark'
}

function resolvesToDark(theme: ThemeMode) {
  return (
    theme === 'dark' ||
    (theme === 'system' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches)
  )
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(getSavedTheme)
  const [isDarkMode, setIsDarkMode] = useState(() => resolvesToDark(theme))

  const applyTheme = useCallback((next: ThemeMode) => {
    const dark = resolvesToDark(next)
    document.documentElement.classList.toggle('dark', dark)
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light'
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', dark ? '#14231c' : '#eef2ef')
  }, [])

  const setTheme = useCallback(
    (next: ThemeMode) => {
      setThemeState(next)
      setIsDarkMode(resolvesToDark(next))
      applyTheme(next)
      try {
        localStorage.setItem('theme', next)
      } catch {
        /* Keep the in-memory preference. */
      }
    },
    [applyTheme]
  )

  const toggleTheme = useCallback(
    () => setTheme(isDarkMode ? 'light' : 'dark'),
    [isDarkMode, setTheme]
  )

  useEffect(() => {
    applyTheme(theme)
    if (theme !== 'system') return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const update = () => {
      setIsDarkMode(resolvesToDark('system'))
      applyTheme('system')
    }
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [theme, applyTheme])

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
