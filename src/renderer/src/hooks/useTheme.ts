import { useEffect } from 'react'
import type { Theme } from '../types'

export function useTheme(theme: Theme): void {
  useEffect(() => {
    const root = document.documentElement

    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      root.classList.toggle('dark', mq.matches)

      const onChange = (e: MediaQueryListEvent): void => {
        root.classList.toggle('dark', e.matches)
      }
      mq.addEventListener('change', onChange)
      return () => mq.removeEventListener('change', onChange)
    }

    root.classList.toggle('dark', theme === 'dark')
  }, [theme])
}
