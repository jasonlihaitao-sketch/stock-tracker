import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'light' | 'dark' | 'system'

interface ThemeState {
  theme: Theme
  resolvedTheme: 'light' | 'dark'
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(theme: 'light' | 'dark') {
  const root = document.documentElement
  if (theme === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      resolvedTheme: 'light',

      setTheme: (theme: Theme) => {
        const resolvedTheme = theme === 'system' ? getSystemTheme() : theme
        applyTheme(resolvedTheme)
        set({ theme, resolvedTheme })
      },

      toggleTheme: () => {
        const currentTheme = get().theme
        const currentResolved = get().resolvedTheme

        let nextTheme: Theme
        if (currentTheme === 'system') {
          nextTheme = currentResolved === 'dark' ? 'light' : 'dark'
        } else {
          nextTheme = currentTheme === 'dark' ? 'light' : 'dark'
        }

        applyTheme(nextTheme)
        set({ theme: nextTheme, resolvedTheme: nextTheme })
      },
    }),
    {
      name: 'stock-tracker-theme',
      onRehydrateStorage: () => (state) => {
        if (state) {
          const resolvedTheme = state.theme === 'system' ? getSystemTheme() : state.theme
          applyTheme(resolvedTheme)
          state.resolvedTheme = resolvedTheme
        }
      },
    }
  )
)

export function initTheme() {
  const stored = localStorage.getItem('stock-tracker-theme')
  let theme: Theme = 'system'

  if (stored) {
    try {
      const parsed = JSON.parse(stored)
      theme = parsed.state?.theme || 'system'
    } catch {
      theme = 'system'
    }
  }

  const resolvedTheme = theme === 'system'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : theme

  if (resolvedTheme === 'dark') {
    document.documentElement.classList.add('dark')
  }
}
