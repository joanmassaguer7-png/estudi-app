import { useState, type FormEvent } from 'react'
import { Guada } from '../components/Guada'
import { BirthdayPicker } from '../components/BirthdayPicker'
import { saveProfile, validBirthday, type Birthday } from '../data/birthday'

/**
 * Primera pantalla de l'app: la Guada es presenta i demana el nom.
 * El nom només es guarda en aquest dispositiu.
 */
export function NameSetup({ initial = '', onSaved }: { initial?: string; onSaved?: () => void }) {
  const [name, setName] = useState(initial)
  const [saved, setSaved] = useState<string | null>(null)
  const [birthday, setBirthday] = useState<Partial<Birthday>>({})
  const clean = name.trim().replace(/\s+/g, ' ')

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!clean) return
    setSaved(clean)
    // Un moment perquè la Guada saludi abans de continuar.
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.setTimeout(async () => {
      await saveProfile({ name: clean, ...(validBirthday(birthday) ? { birthday } : {}) })
      onSaved?.()
    }, reduce ? 200 : 1600)
  }

  return (
    <div className="screen name-setup">
      <div className="name-hero">
        <Guada mood={saved ? 'content' : 'hola'} talking={false} size={150} />
        <div key={saved ? 'ok' : 'ask'} className="name-bubble">
          {saved ? (
            <>
              <strong>Encantada, {saved}!</strong>
              <span>Som-hi, que tenim molta feina a la clínica.</span>
            </>
          ) : (
            <>
              <strong>Hola! Soc la Guada Vet.</strong>
              <span>T’acompanyaré mentre estudies. Com et dius?</span>
            </>
          )}
        </div>
      </div>

      {!saved && (
        <form className="name-form" onSubmit={submit}>
          <label htmlFor="nom">El teu nom</label>
          <input
            id="nom"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={30}
            autoComplete="given-name"
            autoFocus
            placeholder="Escriu el teu nom"
          />
          <label htmlFor="aniv-dia">
            Quan és el teu aniversari? <span className="muted">(opcional)</span>
          </label>
          <BirthdayPicker value={birthday} onChange={setBirthday} />
          <button className="primary-btn" type="submit" disabled={!clean}>
            Som-hi!
          </button>
          <p className="muted small">El nom i l’aniversari només es guarden en aquest mòbil. No cal cap registre ni contrasenya.</p>
        </form>
      )}
    </div>
  )
}
