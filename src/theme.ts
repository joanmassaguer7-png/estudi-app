import { useSyncExternalStore } from 'react'

export type Theme = 'light' | 'dark'
const KEY = 'estudi-app-tema'
const COLORS: Record<Theme, string> = { light: '#1f6b5c', dark: '#16201c' }

function stored(): Theme | null {
  try {
    const v = localStorage.getItem(KEY)
    return v === 'dark' || v === 'light' ? v : null
  } catch {
    return null
  }
}

function initial(): Theme {
  return stored() ?? (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
}

let current: Theme = 'light'
const listeners = new Set<() => void>()

function apply(t: Theme) {
  current = t
  document.documentElement.dataset.theme = t
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', COLORS[t])
  listeners.forEach((l) => l())
}

/** S'executa abans de pintar l'app, perquè no hi hagi un flaix de color clar. */
export function initTheme() {
  apply(initial())
  // Si mai s'ha triat manualment, segueix el sistema.
  window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener?.('change', (e) => {
    if (!stored()) apply(e.matches ? 'dark' : 'light')
  })
}

export function setTheme(t: Theme) {
  try {
    localStorage.setItem(KEY, t)
  } catch {
    /* sense emmagatzematge: només per aquesta sessió */
  }
  apply(t)
}

export function useTheme(): Theme {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => current,
  )
}
