import { type CourseData, useAppSettings } from '../data/hooks'
import { adj, mascotFace, mascotFor, withArticle, WithArticle } from '../data/mascots'
import type { ReminderSettings } from '../data/reminder'
import { doneToday, planDaily, reminderPhase, streak } from '../logic/daily'
import type { Navigate } from '../nav'
import { TreatModal } from './TreatModal'
import { Modal, useToast } from './ui'

/**
 * Finestra que surt quan s'obre l'app des d'un avís o des de la drecera del Repàs diari.
 * Si ja està fet, la mascota del dia espera la galeta; si no, convida a començar
 * (contenta o trista segons l'hora).
 */
export function DailyPrompt({
  data,
  reminder,
  go,
  onClose,
}: {
  data: CourseData
  reminder: ReminderSettings
  go: Navigate
  onClose: () => void
}) {
  const toast = useToast()
  const name = useAppSettings()?.name
  const mascot = mascotFor()
  const done = doneToday(data.sessions)
  const days = streak(data.sessions)
  const late = !done && reminder.enabled && reminderPhase(reminder.time) === 'tard'

  if (done) return <TreatModal mascot={mascot} days={days} onClose={onClose} />

  function start() {
    const test = planDaily(data)
    onClose()
    if (!test) return toast('Encara no hi ha preguntes per al Repàs diari.')
    go({ name: 'pretest', test })
  }

  return (
    <Modal onClose={onClose}>
      <div className={`daily-prompt ${late ? 'trist' : 'content'}`}>
        <img className="daily-face" src={mascotFace(mascot, late ? 'trist' : 'content')} alt={mascot.name} width={120} height={120} />
        {late ? (
          <>
            <h3>{WithArticle(mascot)} està {adj(mascot, 'trist')}</h3>
            <p>
              Encara no has fet el repàs d’avui. Només són 10 preguntes.
              {days > 0 ? ` No perdis la ratxa de ${days} ${days === 1 ? 'dia' : 'dies'}.` : ''}
            </p>
          </>
        ) : (
          <>
            <h3>{name ? `${name}, és hora` : 'Hora'} del Repàs diari!</h3>
            <p>
              Avui t’acompanya {withArticle(mascot)}.
              {days > 0 ? ` Portes ${days} ${days === 1 ? 'dia' : 'dies'} seguits.` : ''}
            </p>
          </>
        )}
      </div>
      <div className="modal-actions">
        <button className="secondary-btn" onClick={onClose}>
          Ara no
        </button>
        <button className="primary-btn" onClick={start}>
          Començar el repàs
        </button>
      </div>
    </Modal>
  )
}
