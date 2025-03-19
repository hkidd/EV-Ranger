// ThemeProvider.tsx
import React, { useState, useCallback, useEffect, ReactNode } from 'react'
import { ThemeContext, ThemeContextType, ThemeMode } from './ThemeContext'

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({
  children
}) => {
  // Get saved theme from localStorage or default to 'system'
  const getSavedTheme = (): ThemeMode => {
    const savedTheme = localStorage.getItem('theme')
    return (savedTheme as ThemeMode) || 'system'
  }

  const [theme, setThemeState] = useState<ThemeMode>(getSavedTheme())
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false)

  // Detect if system prefers dark mode
  const prefersDarkMode = window.matchMedia(
    '(prefers-color-scheme: dark)'
  ).matches

  // Apply theme to document and update isDarkMode state
  const applyTheme = useCallback(
    (newTheme: ThemeMode) => {
      const rootElement = document.documentElement
      const isSystemDark = prefersDarkMode

      if (newTheme === 'system') {
        if (isSystemDark) {
          rootElement.classList.add('dark')
          setIsDarkMode(true)
        } else {
          rootElement.classList.remove('dark')
          setIsDarkMode(false)
        }
      } else if (newTheme === 'dark') {
        rootElement.classList.add('dark')
        setIsDarkMode(true)
      } else {
        rootElement.classList.remove('dark')
        setIsDarkMode(false)
      }
    },
    [prefersDarkMode]
  )

  // Set theme and save to localStorage
  const setTheme = useCallback(
    (newTheme: ThemeMode) => {
      setThemeState(newTheme)
      localStorage.setItem('theme', newTheme)
      applyTheme(newTheme)
    },
    [applyTheme]
  )

  // Toggle between light and dark (not system)
  const toggleTheme = useCallback(() => {
    const newTheme = isDarkMode ? 'light' : 'dark'
    setTheme(newTheme)
  }, [isDarkMode, setTheme])

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handleChange = () => {
      if (theme === 'system') {
        applyTheme('system')
      }
    }

    mediaQuery.addEventListener('change', handleChange)

    // Initial theme application
    applyTheme(theme)

    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [theme, applyTheme])

  const contextValue: ThemeContextType = {
    theme,
    isDarkMode,
    setTheme,
    toggleTheme
  }

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  )
}
