import { useState } from 'react'
import { setSetting } from '../data/db'
import { PROFILE_KEY, useAppSettings } from '../data/hooks'
import { useToast } from './ui'

/** Canviar el nom que fa servir l'app (pantalla Gestionar). */
export function NameCard() {
  const settings = useAppSettings()
  const toast = useToast()
  const [draft, setDraft] = useState<string | null>(null)
  if (!settings) return null
  const value = draft ?? settings.name
  const clean = value.trim().replace(/\s+/g, ' ')
  const changed = clean !== settings.name

  async function save() {
    if (!clean) return
    await setSetting(PROFILE_KEY, { name: clean })
    setDraft(null)
    toast(`Fet! A partir d’ara et diré «${clean}»`)
  }

  return (
    <section className="card name-card">
      <h2>El teu nom</h2>
      <div className="name-row">
        <input value={value} onChange={(e) => setDraft(e.target.value)} maxLength={30} aria-label="El teu nom" />
        <button className="primary-btn small-btn" disabled={!clean || !changed} onClick={save}>
          Desar
        </button>
      </div>
    </section>
  )
}
