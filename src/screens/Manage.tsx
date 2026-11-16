import { useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { ACTIVE_COURSE_KEY, db, deleteCourse, setSetting } from '../data/db'
import type { Course } from '../data/types'
import { reasonLabel } from '../data/reports'
import {
  buildBackup,
  buildContentPackage,
  buildProgressFile,
  shareBackup,
  dateStamp,
  downloadJson,
  importContentPackage,
  importProgressFile,
  readJsonFile,
  restoreBackup,
} from '../data/package'
import { samplePackage } from '../data/sample'
import type { Navigate } from '../nav'
import { Modal, ScreenHeader, useToast } from '../components/ui'
import { ReminderCard } from '../components/ReminderCard'
import { Guada } from '../components/Guada'
import { NameCard } from '../components/NameCard'
import { BACKUP_EMAIL_KEY, LAST_BACKUP_KEY, useAppSettings } from '../data/hooks'
import { useInstallPrompt } from '../pwa'

type Kind = 'content' | 'progress' | 'backup'

export function Manage({ courseId, go, welcome = false }: { courseId?: string; go: Navigate; welcome?: boolean }) {
  const toast = useToast()
  const courses = useLiveQuery(() => db.courses.toArray(), []) ?? []
  const fileInput = useRef<HTMLInputElement>(null)
  const [pendingKind, setPendingKind] = useState<Kind>('content')
  const [message, setMessage] = useState<{ title: string; body: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [toDelete, setToDelete] = useState<Course | null>(null)
  const reports = useLiveQuery(() => db.reports.orderBy('date').reverse().toArray(), []) ?? []
  const install = useInstallPrompt()
  const settings = useAppSettings()
  const [emailDraft, setEmailDraft] = useState<string | null>(null)
  const email = emailDraft ?? settings?.backupEmail ?? ''
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())

  function pickFile(kind: Kind) {
    setPendingKind(kind)
    fileInput.current?.click()
  }

  async function onFile(file: File | undefined) {
    if (!file) return
    setBusy(true)
    // A la pantalla de benvinguda, en importar el primer curs l'app canvia de pantalla de seguida:
    // per això el missatge d'èxit es mostra com a avís breu, que sobreviu al canvi.
    const done = (title: string, body: string) => (welcome ? toast(`${title}. ${body}`) : setMessage({ title, body }))
    try {
      const data = await readJsonFile(file)
      if (pendingKind === 'content') {
        const r = await importContentPackage(data)
        const id = (data as { course: { id: string } }).course.id
        await setSetting(ACTIVE_COURSE_KEY, id)
        done(
          'Actualització importada',
          `${r.questions} preguntes carregades${r.syllabus ? ' i temari actualitzat' : ''}. L’historial i les corones es conserven.`,
        )
      } else if (pendingKind === 'progress') {
        const r = await importProgressFile(data)
        done('Progrés importat', `${r.attempts} intents nous i ${r.sessions} tests nous afegits.`)
      } else {
        await restoreBackup(data)
        done('Còpia restaurada', 'S’han recuperat totes les dades de la còpia.')
      }
    } catch (e) {
      setMessage({
        title: 'No s’ha pogut importar',
        body: `${(e as Error).message}\n\nNo s’ha modificat cap dada.`,
      })
    } finally {
      setBusy(false)
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  async function exportContent() {
    if (!courseId) return
    const pkg = await buildContentPackage(courseId)
    downloadJson(pkg, `preguntes-${courseId}-v${pkg.course.contentVersion}.json`)
  }

  async function confirmDelete() {
    if (!toDelete) return
    const title = toDelete.title
    await deleteCourse(toDelete.id)
    setToDelete(null)
    toast(`S’ha esborrat «${title}».`)
    go({ name: 'home' })
  }

  function exportReports() {
    const lines = reports.map((r, i) => {
      const opts = r.question.options.map((o, j) => `   ${'ABCD'[j]}) ${o}${j === r.question.correctIndex ? '  ← marcada com a correcta' : ''}`).join('\n')
      return `${i + 1}. ${r.question.text}\n${opts}\n   Motiu: ${reasonLabel(r.reason)}${r.comment ? `\n   Comentari: ${r.comment}` : ''}\n   Id: ${r.questionId} · ${new Date(r.date).toLocaleDateString('ca')}`
    })
    const blob = new Blob([`Preguntes marcades per revisar (${reports.length})\n\n${lines.join('\n\n')}\n`], { type: 'text/plain' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `preguntes-marcades-${dateStamp()}.txt`
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 1000)
  }

  async function loadSample() {
    await importContentPackage(samplePackage)
    await setSetting(ACTIVE_COURSE_KEY, samplePackage.course.id)
    go({ name: 'home' })
  }

  return (
    <div className="screen">
      <ScreenHeader title="Gestionar" onBack={courseId ? () => go({ name: 'home' }) : undefined} />

      <input
        ref={fileInput}
        type="file"
        accept=".json,.gz,.txt,application/json,application/gzip,application/x-gzip,text/plain"
        hidden
        onChange={(e) => onFile(e.target.files?.[0])}
      />

      {install && (
        <section className="card">
          <h2>Instal·lar l’aplicació</h2>
          <p className="muted">Afegeix-la a la pantalla d’inici per fer-la servir sense connexió.</p>
          <button className="primary-btn" onClick={install}>
            Instal·lar
          </button>
        </section>
      )}

      {!welcome && (
        <button className="tut-manage" onClick={() => go({ name: 'tutorial' })}>
          <Guada mood="hola" size={56} />
          <span>
            <strong>Tutorial amb la Guada Vet</strong>
            <small>Aprèn a fer servir l’app, de bàsic a avançat</small>
          </span>
        </button>
      )}

      {!welcome && <NameCard />}

      {!welcome && <ReminderCard />}

      <section className="card">
        <h2>Mòbil</h2>
        <div className="button-stack">
          <button className="primary-btn" onClick={() => pickFile('content')} disabled={busy}>
            Importar actualització
          </button>
          <button className="secondary-btn" onClick={async () => {
              await downloadJson(await buildProgressFile(), `progres-${dateStamp()}.json`, true)
              await setSetting(LAST_BACKUP_KEY, new Date().toISOString())
            }}>
            Exportar progrés
          </button>
        </div>
        <p className="muted small">
          Rep el fitxer de preguntes (per WhatsApp, correu…), desa’l i tria’l aquí. Si el fitxer no és vàlid, no es
          toca res.
        </p>
      </section>

      <section className="card">
        <h2>Ordinador</h2>
        <div className="button-stack">
          <button className="primary-btn" onClick={exportContent} disabled={!courseId}>
            Exportar preguntes al mòbil
          </button>
          <button className="secondary-btn" onClick={() => pickFile('progress')} disabled={busy}>
            Importar progrés del mòbil
          </button>
        </div>
        <p className="muted small">L’editor del temari i la generació de preguntes arriben a la propera fase.</p>
      </section>

      {courses.length > 1 && (
        <section className="card">
          <h2>Curs actiu</h2>
          <div className="button-stack">
            {courses.map((c) => (
              <button
                key={c.id}
                className={c.id === courseId ? 'primary-btn' : 'secondary-btn'}
                onClick={() => setSetting(ACTIVE_COURSE_KEY, c.id)}
              >
                {c.title}
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="card">
        <h2>Còpia de seguretat</h2>
        <label className="field">
          <span>El teu correu</span>
          <div className="name-row">
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="nom@gmail.com"
              value={email}
              onChange={(e) => setEmailDraft(e.target.value)}
            />
            <button
              className="primary-btn small-btn"
              disabled={!emailOk || email.trim() === settings?.backupEmail}
              onClick={async () => {
                await setSetting(BACKUP_EMAIL_KEY, email.trim())
                setEmailDraft(null)
                toast('Correu desat.')
              }}
            >
              Desar
            </button>
          </div>
        </label>
        <div className="button-stack backup-stack">
          <button className="primary-btn" onClick={async () => {
              const r = await shareBackup(settings?.backupEmail)
              if (r === 'cancel·lada') return
              await setSetting(LAST_BACKUP_KEY, new Date().toISOString())
              toast(r === 'enviada' ? 'Còpia enviada.' : 'Aquest navegador no pot compartir fitxers: s’ha descarregat.')
            }}>
            Enviar-me la còpia per correu
          </button>
          <button className="secondary-btn" onClick={async () => {
              await downloadJson(await buildBackup(), `copia-estudi-${dateStamp()}.json`, true)
              await setSetting(LAST_BACKUP_KEY, new Date().toISOString())
            }}>
            Descarregar-la al mòbil
          </button>
          <button className="secondary-btn" onClick={() => pickFile('backup')} disabled={busy}>
            Restaurar una còpia
          </button>
        </div>
        <p className="muted small">
          En prémer «Enviar-me la còpia», tria Gmail (o la teva app de correu).{' '}
          {settings?.backupEmail
            ? 'El teu correu ja estarà copiat: enganxa’l al camp «Per a» i envia.'
            : 'Escriu el teu correu al camp «Per a» i envia (si el deses aquí dalt, el copiarem per tu).'} Totes les còpies porten el mateix assumpte, així les trobaràs i esborraràs
          fàcilment. Restaurar substitueix totes les dades d’aquest dispositiu per les de la còpia.
        </p>
      </section>

      {!welcome && (
        <section className="card">
          <h2>Preguntes marcades</h2>
          {reports.length === 0 ? (
            <p className="muted small">
              Encara no n’has marcat cap. Quan revisis un test, toca «Revisar pregunta» si creus que una pregunta té
              un error.
            </p>
          ) : (
            <>
              <ul className="report-list">
                {reports.map((r) => (
                  <li key={r.id}>
                    <strong>{r.question.text}</strong>
                    <small>
                      {reasonLabel(r.reason)}
                      {r.comment && ` — ${r.comment}`}
                    </small>
                    <button className="link-btn" onClick={() => db.reports.delete(r.id)}>
                      Treure
                    </button>
                  </li>
                ))}
              </ul>
              <button className="secondary-btn wide-btn" onClick={exportReports}>
                Exportar la llista ({reports.length})
              </button>
              <p className="muted small">Envia el fitxer a qui prepara les preguntes perquè les corregeixi.</p>
            </>
          )}
        </section>
      )}

      {!courses.some((c) => c.id === samplePackage.course.id) && (
        <section className="card">
          <h2>Curs de mostra</h2>
          <p className="muted small">3 temes i 24 preguntes per provar l’aplicació.</p>
          <button className="secondary-btn" onClick={loadSample}>
            Carregar curs de mostra
          </button>
        </section>
      )}

      {!welcome && courses.length > 0 && (
        <section className="card">
          <h2>Esborrar un curs</h2>
          <p className="muted small">S’esborren les preguntes, l’historial i les corones d’aquell curs. Els altres no es toquen.</p>
          <ul className="delete-list">
            {courses.map((c) => (
              <li key={c.id}>
                <span>
                  {c.title}
                  {c.id === samplePackage.course.id && <small> (mostra)</small>}
                </span>
                <button className="danger-link" onClick={() => setToDelete(c)}>
                  Esborrar
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {toDelete && (
        <Modal onClose={() => setToDelete(null)}>
          <h3>Esborrar «{toDelete.title}»?</h3>
          <p>
            S’esborraran totes les preguntes, l’historial de tests i les corones d’aquest curs. No es pot desfer, tret
            que tinguis una còpia de seguretat.
          </p>
          <div className="modal-actions">
            <button className="secondary-btn" onClick={() => setToDelete(null)}>
              Cancel·lar
            </button>
            <button className="danger-btn" onClick={confirmDelete}>
              Esborrar
            </button>
          </div>
        </Modal>
      )}

      {message && (
        <Modal onClose={() => setMessage(null)}>
          <h3>{message.title}</h3>
          <p className="pre">{message.body}</p>
          <div className="modal-actions">
            <button
              className="primary-btn"
              onClick={() => {
                setMessage(null)
                if (message.title !== 'No s’ha pogut importar') go({ name: 'home' })
              }}
            >
              D’acord
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
