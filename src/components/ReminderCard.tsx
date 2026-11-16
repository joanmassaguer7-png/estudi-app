import { useState } from 'react'
import { useAppSettings } from '../data/hooks'
import { MASCOTS, mascotFace, mascotFor } from '../data/mascots'
import {
  disableReinforcement,
  enableReinforcement,
  googleCalendarUrl,
  icsFile,
  type ReinforcementStatus,
  type ReminderSettings,
  saveReminder,
  showTestNotification,
} from '../data/reminder'
import { useToast } from './ui'

const STATUS_TEXT: Record<ReinforcementStatus, string> = {
  actiu: 'Avís de reforç activat. Chrome decideix quan desperta l’app, així que pot arribar una mica més tard.',
  'sense-permis': 'Sense permís de notificacions. Pots donar-lo des de la configuració de l’app al mòbil.',
  'no-instal·lada': 'L’avís de reforç només funciona amb l’app instal·lada i oberta des de la seva icona.',
  'no-compatible': 'Aquest navegador no permet l’avís de reforç. El recordatori del calendari funciona igual.',
}

/** Configuració del recordatori del Repàs diari (a la pantalla Gestionar). */
export function ReminderCard() {
  const settings = useAppSettings()
  const toast = useToast()
  const [status, setStatus] = useState<ReinforcementStatus | null>(null)
  if (!settings) return null
  const r = settings.reminder
  const today = mascotFor()

  async function update(patch: Partial<ReminderSettings>) {
    await saveReminder({ ...r, ...patch })
  }

  async function toggle() {
    if (r.enabled) {
      await update({ enabled: false })
      await disableReinforcement()
      setStatus(null)
      return
    }
    await update({ enabled: true })
    setStatus(await enableReinforcement())
  }

  function downloadIcs() {
    const blob = new Blob([icsFile(r.time)], { type: 'text/calendar' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'repas-diari.ics'
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  async function test(mood: 'content' | 'trist') {
    const ok = await showTestNotification(mood, settings?.name)
    if (!ok) toast('No s’ha pogut mostrar l’avís. Revisa el permís de notificacions.')
  }

  return (
    <section className="card reminder-card">
      <div className="reminder-head">
        <img src={mascotFace(today, 'content')} alt="" width={56} height={56} />
        <div>
          <h2>Recordatori del Repàs diari</h2>
          <p className="muted small">Un avís cada dia a l’hora que triïs, amb la mascota del dia.</p>
        </div>
        <button
          className={`switch ${r.enabled ? 'on' : ''}`}
          role="switch"
          aria-checked={r.enabled}
          aria-label="Activar el recordatori"
          onClick={toggle}
        >
          <span />
        </button>
      </div>

      {r.enabled && (
        <div className="reminder-body">
          <label className="field">
            <span>Hora</span>
            <input type="time" value={r.time} onChange={(e) => e.target.value && update({ time: e.target.value })} />
          </label>

          <div className="field">
            <span>Mascotes de la setmana</span>
            <ul className="week-mascots">
              {MASCOTS.map((m) => (
                <li key={m.id} className={m.id === today.id ? 'today' : ''} title={`${m.day}: ${m.name}, ${m.description.toLowerCase()}`}>
                  <img src={mascotFace(m, 'content')} alt="" width={46} height={46} />
                  <strong>{m.name}</strong>
                  <small>{m.id === today.id ? 'Avui' : m.short}</small>
                </li>
              ))}
            </ul>
          </div>

          <ol className="reminder-steps">
            <li>
              <strong>Afegeix l’avís al calendari.</strong> Sonarà cada dia a les {r.time} i, en tocar-lo, s’obrirà
              directament el repàs.
              <div className="button-stack">
                <a className="primary-btn as-link" href={googleCalendarUrl(r.time)} target="_blank" rel="noreferrer">
                  Afegir a Google Calendar
                </a>
                <button className="secondary-btn" onClick={downloadIcs}>
                  Descarregar per a un altre calendari
                </button>
              </div>
            </li>
            <li>
              <strong>Avís de reforç.</strong> Si a les {r.time} encara no l’has fet, t’avisa la mascota del dia
              contenta. Si han passat dues hores i continua pendent, l’avís surt amb la mascota trista.
              {status && <p className="muted small reminder-status">{STATUS_TEXT[status]}</p>}
              <div className="test-row">
                <span className="muted small">Prova com es veu:</span>
                <button className="chip-btn" onClick={() => test('content')}>
                  <img src={mascotFace(today, 'content')} alt="" width={22} height={22} /> Content
                </button>
                <button className="chip-btn" onClick={() => test('trist')}>
                  <img src={mascotFace(today, 'trist')} alt="" width={22} height={22} /> Trist
                </button>
              </div>
            </li>
          </ol>
        </div>
      )}
    </section>
  )
}
