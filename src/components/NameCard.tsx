import { useState } from 'react'
import { useAppSettings } from '../data/hooks'
import { formatBirthday, saveProfile, validBirthday, type Birthday } from '../data/birthday'
import { BirthdayPicker } from './BirthdayPicker'
import { useToast } from './ui'

/** Nom i aniversari (pantalla Gestionar). */
export function NameCard() {
  const settings = useAppSettings()
  const toast = useToast()
  const [draft, setDraft] = useState<string | null>(null)
  const [bday, setBday] = useState<Partial<Birthday> | null>(null)
  if (!settings) return null
  const value = draft ?? settings.name
  const clean = value.trim().replace(/\s+/g, ' ')
  const changed = clean !== settings.name
  const b = bday ?? settings.birthday ?? {}
  const bChanged = bday !== null && (bday.day !== settings.birthday?.day || bday.month !== settings.birthday?.month)

  async function save() {
    if (!clean) return
    await saveProfile({ name: clean })
    setDraft(null)
    toast(`Fet! A partir d’ara et diré «${clean}»`)
  }

  async function saveBirthday() {
    if (!validBirthday(b)) return
    await saveProfile({ birthday: b })
    setBday(null)
    toast(`Apuntat: el ${formatBirthday(b)} la clínica et prepararà una sorpresa.`)
  }

  async function removeBirthday() {
    await saveProfile({ birthday: null })
    setBday(null)
    toast('Aniversari esborrat.')
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
      <h2 className="birthday-title">El teu aniversari</h2>
      <div className="name-row">
        <BirthdayPicker value={b} onChange={setBday} idPrefix="aniv-gestio" />
        <button className="primary-btn small-btn" disabled={!validBirthday(b) || !bChanged} onClick={saveBirthday}>
          Desar
        </button>
      </div>
      {settings.birthday && (
        <button className="link-btn small" onClick={removeBirthday}>
          Esborrar l’aniversari
        </button>
      )}
    </section>
  )
}
