import { useLiveQuery } from 'dexie-react-hooks'
import type { CourseData } from '../data/hooks'
import type { Navigate } from '../nav'
import { db } from '../data/db'
import type { Exam } from '../data/types'
import { shareTextFile } from '../data/package'
import { ScreenHeader, useToast } from '../components/ui'
import { compareExam, examsReport, formatExamDate, formatScore, photoName, practicableQuestions } from '../logic/exams'
import { dataUrlToFile } from '../data/photos'
import { shuffle } from '../logic/select'

const pct = (x: number) => `${Math.round(x * 100)} %`

/** Llista d'exàmens reals: nota, comparació amb els tests i accés a practicar-ne les preguntes. */
export function Exams({ data, go }: { data: CourseData; go: Navigate }) {
  const toast = useToast()
  const exams = useLiveQuery(() => db.exams.where('courseId').equals(data.course.id).toArray(), [data.course.id])
  if (!exams) return null
  const sorted = [...exams].sort((a, b) => b.date.localeCompare(a.date))
  const practice = practicableQuestions(exams)
  const totalQuestions = exams.reduce((s, e) => s + e.questions.length, 0)
  const totalPhotos = exams.reduce((s, e) => s + (e.photos?.length ?? 0), 0)

  function startPractice() {
    go({
      name: 'pretest',
      test: {
        mode: 'examens',
        title: 'Preguntes d’exàmens',
        description: 'Preguntes que han sortit als exàmens reals. Els resultats no compten per al domini dels temes.',
        questions: shuffle(practice).slice(0, 20),
      },
    })
  }

  async function sendToClaude() {
    const text = examsReport(exams!, data.topics, data.attempts, data.course.title)
    const photos = exams!.flatMap((e) => (e.photos ?? []).map((ph, i) => dataUrlToFile(ph.dataUrl, photoName(e, i))))
    const r = await shareTextFile(
      text,
      `examens-${new Date().toISOString().slice(0, 10)}.txt`,
      'Preguntes d’exàmens per a Claude',
      'Preguntes, notes i fotos dels exàmens reals, per ajustar les preguntes de l’app.',
      photos,
    )
    if (r === 'descarregada') toast('S’ha descarregat el text (sense fotos). Passa’l a Claude a la conversa de l’app.')
  }

  return (
    <div className="screen exams">
      <ScreenHeader title="Exàmens" onBack={() => go({ name: 'home' })} />

      {sorted.length === 0 ? (
        <section className="card exams-empty">
          <h2>Apunta els teus exàmens</h2>
          <p>
            Posa-hi la nota i els temes que entraven, i veuràs com et va a l’examen comparat amb els tests de l’app.
            Si hi apuntes les preguntes que van sortir, les podràs practicar i ajudaran a fer preguntes més semblants a
            les reals.
          </p>
        </section>
      ) : (
        <ul className="exam-list">
          {sorted.map((e) => (
            <ExamCard key={e.id} exam={e} data={data} onOpen={() => go({ name: 'exam', examId: e.id })} />
          ))}
        </ul>
      )}

      <button className="primary-btn wide-btn" onClick={() => go({ name: 'exam-edit' })}>
        Afegir un examen
      </button>

      {(totalQuestions > 0 || totalPhotos > 0) && (
        <section className="card">
          <h2>Preguntes dels exàmens</h2>
          <p className="muted small">
            {totalQuestions} {totalQuestions === 1 ? 'pregunta apuntada' : 'preguntes apuntades'}
            {practice.length < totalQuestions && `, ${practice.length} amb opcions i resposta correcta per practicar`}
            {totalPhotos > 0 && ` i ${totalPhotos} ${totalPhotos === 1 ? 'foto' : 'fotos'}`}.
          </p>
          <div className="button-stack">
            <button className="secondary-btn" disabled={practice.length === 0} onClick={startPractice}>
              Practicar-les ({Math.min(practice.length, 20)})
            </button>
            <button className="secondary-btn" onClick={sendToClaude}>
              Enviar-les a Claude
            </button>
          </div>
          <p className="muted small">
            Envia-ho a Claude (amb les fotos) perquè ajusti les preguntes de l’app a l’estil i la dificultat dels
            exàmens reals, i perquè les afegeixi al banc de preguntes.
          </p>
        </section>
      )}
    </div>
  )
}

function ExamCard({ exam, data, onOpen }: { exam: Exam; data: CourseData; onOpen: () => void }) {
  const c = compareExam(exam, data.attempts)
  const nums = exam.topicIds
    .map((id) => data.topics.find((t) => t.id === id)?.number)
    .filter(Boolean)
    .join(', ')
  return (
    <li>
      <button className="exam-card" onClick={onOpen}>
        <span className="exam-card-head">
          <strong>{exam.title}</strong>
          <span className="exam-score">{formatScore(exam.score, exam.maxScore)}</span>
        </span>
        <small className="muted">
          {formatExamDate(exam.date)}
          {nums && ` · ${exam.topicIds.length === 1 ? 'Tema' : 'Temes'} ${nums}`}
          {exam.questions.length > 0 && ` · ${exam.questions.length} preguntes`}
          {(exam.photos?.length ?? 0) > 0 && ` · ${exam.photos!.length} fotos`}
        </small>
        <CompareBars examPct={c.examPct} testPct={c.testPct} />
        <DiffLine diff={c.diff} testPct={c.testPct} examPct={c.examPct} />
      </button>
    </li>
  )
}

/** Dues barres alineades: nota de l'examen i mitjana dels tests dels mateixos temes. */
export function CompareBars({ examPct, testPct }: { examPct: number | null; testPct: number | null }) {
  return (
    <span className="compare-bars">
      <span className="cmp-row">
        <span className="cmp-label">Examen</span>
        <span className="cmp-track">
          <span className="cmp-fill exam" style={{ width: `${(examPct ?? 0) * 100}%` }} />
        </span>
        <span className="cmp-val">{examPct === null ? '—' : pct(examPct)}</span>
      </span>
      <span className="cmp-row">
        <span className="cmp-label">Tests</span>
        <span className="cmp-track">
          <span className="cmp-fill tests" style={{ width: `${(testPct ?? 0) * 100}%` }} />
        </span>
        <span className="cmp-val">{testPct === null ? '—' : pct(testPct)}</span>
      </span>
    </span>
  )
}

export function DiffLine({ diff, testPct, examPct }: { diff: number | null; testPct: number | null; examPct: number | null }) {
  if (examPct === null) return <span className="cmp-diff muted">Afegeix la nota quan la sàpigues.</span>
  if (testPct === null) return <span className="cmp-diff muted">Encara no hi ha tests d’aquests temes fets abans de l’examen.</span>
  if (diff === null) return null
  if (Math.abs(diff) <= 3) return <span className="cmp-diff">Com als tests: l’app reflecteix bé el teu nivell.</span>
  return diff > 0 ? (
    <span className="cmp-diff up">{diff} punts per sobre de la mitjana dels tests</span>
  ) : (
    <span className="cmp-diff down">{-diff} punts per sota de la mitjana dels tests</span>
  )
}
