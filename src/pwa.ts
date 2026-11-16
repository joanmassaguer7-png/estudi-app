import { useEffect, useState } from 'react'

// Registre del "service worker": un petit programa que el navegador executa en
// segon pla i que guarda l'aplicació a la memòria cau perquè funcioni sense connexió.
export function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || import.meta.env.DEV) return
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {})
  })
}

interface InstallEvent extends Event {
  prompt: () => Promise<void>
}

/** A Android/Chrome, permet mostrar un botó propi «Instal·lar». Retorna null si no es pot. */
export function useInstallPrompt(): (() => void) | null {
  const [event, setEvent] = useState<InstallEvent | null>(null)
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setEvent(e as InstallEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])
  if (!event) return null
  return () => {
    event.prompt()
    setEvent(null)
  }
}

/** Demana al navegador que no esborri les dades locals si va just d'espai. */
export function requestPersistentStorage() {
  navigator.storage?.persist?.().catch(() => {})
}
