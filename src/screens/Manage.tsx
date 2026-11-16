import { useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { ACTIVE_COURSE_KEY, db, setSetting } from '../data/db'
import {
  buildBackup,
  buildContentPackage,
  buildProgressFile,
  dateStamp,
  downloadJson,
  importContentPackage,
  importProgressFile,
  readJsonFile,
  restoreBackup,
} from '../data/package'
import { samplePackage } from '../data/sample'
import type { Navigate } from '../nav'
import { Modal, ScreenHeader } from '../components/ui'
import { useInstallPrompt } from '../pwa'

type Kind = 'content' | 'progress' | 'backup'

export function Manage({ courseId, go }: { courseId?: string; go: Navigate }) {
  const courses = useLiveQuery(() => db.courses.toArray(), []) ?? []
  const fileInput = useRef<HTMLInputElement>(null)
  const [pendingKind, setPendingKind] = useState<Kind>('content')
  const [message, setMessage] = useState<{ title: string; body: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const install = useInstallPrompt()

  function pickFile(kind: Kind) {
    setPendingKind(kind)
    fileInput.current?.click()
  }

  async function onFile(file: File | undefined) {
    if (!file) return
    setBusy(true)
    try {
      const data = await readJsonFile(file)
      if (pendingKind === 'content') {
        const r = await importContentPackage(data)
        const id = (data as { course: { id: string } }).course.id
        await setSetting(ACTIVE_COURSE_KEY, id)
        setMessage({
          title: 'Actualització importada',
          body: `${r.questions} preguntes carregades${r.syllabus ? ' i temari actualitzat' : ''}. L’historial i les corones es conserven.`,
        })
      } else if (pendingKind === 'progress') {
        const r = await importProgressFile(data)
        setMessage({ title: 'Progrés importat', body: `${r.attempts} intents nous i ${r.sessions} tests nous afegits.` })
      } else {
        await restoreBackup(data)
        setMessage({ title: 'Còpia restaurada', body: 'S’han recuperat totes les dades de la còpia.' })
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
        accept=".json,application/json"
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

      <section className="card">
        <h2>Mòbil</h2>
        <div className="button-stack">
          <button className="primary-btn" onClick={() => pickFile('content')} disabled={busy}>
            Importar actualització
          </button>
          <button className="secondary-btn" onClick={async () => downloadJson(await buildProgressFile(), `progres-${dateStamp()}.json`)}>
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
        <div className="button-stack">
          <button className="secondary-btn" onClick={async () => downloadJson(await buildBackup(), `copia-estudi-${dateStamp()}.json`)}>
            Descarregar còpia completa
          </button>
          <button className="secondary-btn" onClick={() => pickFile('backup')} disabled={busy}>
            Restaurar una còpia
          </button>
        </div>
        <p className="muted small">Restaurar substitueix totes les dades d’aquest dispositiu per les de la còpia.</p>
      </section>

      <section className="card">
        <h2>Curs de mostra</h2>
        <p className="muted small">3 temes i 24 preguntes per provar l’aplicació.</p>
        <button className="secondary-btn" onClick={loadSample}>
          Carregar curs de mostra
        </button>
      </section>

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
