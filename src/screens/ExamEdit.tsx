import { useEffect, useState } from 'react'
import type { CourseData } from '../data/hooks'
import type { Navigate } from '../nav'
import { db, newId } from '../data/db'
import type { Exam, ExamQuestion } from '../data/types'
import { ScreenHeader, useToast } from '../components/ui'

const LETTERS = 'ABCD'
const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const emptyQuestion = (topicId: string | null): ExamQuestion => ({
  id: newId(),
  text: '',
  options: ['', '', '', ''],
  correctIndex: null,
  topicId,
  gotRight: null,
  note: '',
})

/** Formulari per afegir o editar un examen real i les preguntes que hi van sortir. */
export function ExamEdit({ examId, data, go }: { examId?: string; data: CourseData; go: Navigate }) {
  const toast = useToast()
  const [exam, setExam] = useState<Exam | null>(null)
  const [scoreText, setScoreText] = useState('')
  const [maxText, setMaxText] = useState('10')
  const [open, setOpen] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      const found = examId ? await db.exams.get(examId) : undefined
      if (!alive) return
      const now = new Date().toISOString()
      const e: Exam = found ?? {
        id: newId(),
        courseId: data.course.id,
        title: '',
        date: today(),
        topicIds: [],
        score: null,
        maxScore: 10,
        notes: '',
        questions: [],
        createdAt: now,
        updatedAt: now,
      }
      setExam(e)
      setScoreText(e.score === null ? '' : String(e.score).replace('.', ','))
      setMaxText(String(e.maxScore).replace('.', ','))
    })()
    return () => {
      alive = false
    }
  }, [examId, data.course.id])

  if (!exam) return null
  const num = (t: string) => {
    const v = Number(t.trim().replace(',', '.'))
    return t.trim() === '' || Number.isNaN(v) ? null : v
  }
  const score = num(scoreText)
  const max = num(maxText)
  const scoreError =
    scoreText.trim() !== '' && score === null
      ? 'Escriu la nota amb números, per exemple 7,5.'
      : max === null || max <= 0
        ? 'La nota màxima ha de ser un número més gran que 0.'
        : score !== null && score > max
          ? 'La nota no pot ser més alta que la màxima.'
          : score !== null && score < 0
            ? 'La nota no pot ser negativa.'
            : null
  const canSave = exam.title.trim() !== '' && !scoreError

  const set = (patch: Partial<Exam>) => setExam({ ...exam, ...patch })
  const setQ = (id: string, patch: Partial<ExamQuestion>) =>
    set({ questions: exam.questions.map((q) => (q.id === id ? { ...q, ...patch } : q)) })
  const toggleTopic = (id: string) =>
    set({ topicIds: exam.topicIds.includes(id) ? exam.topicIds.filter((t) => t !== id) : [...exam.topicIds, id] })

  function addQuestion() {
    const q = emptyQuestion(exam!.topicIds.length === 1 ? exam!.topicIds[0] : null)
    set({ questions: [...exam!.questions, q] })
    setOpen(q.id)
  }

  async function save() {
    if (!canSave || !exam) return
    const clean: Exam = {
      ...exam,
      title: exam.title.trim(),
      score,
      maxScore: max ?? 10,
      notes: exam.notes?.trim() || undefined,
      // Les preguntes sense enunciat no es guarden.
      questions: exam.questions
        .filter((q) => q.text.trim())
        .map((q) => ({
          ...q,
          text: q.text.trim(),
          note: q.note?.trim() || undefined,
          correctIndex: q.correctIndex !== null && q.options[q.correctIndex]?.trim() ? q.correctIndex : null,
        })),
      updatedAt: new Date().toISOString(),
    }
    await db.exams.put(clean)
    toast(examId ? 'Examen desat.' : 'Examen afegit.')
    go({ name: 'exam', examId: clean.id })
  }

  const examTopics = data.topics.filter((t) => exam.topicIds.includes(t.id))
  const topicChoices = examTopics.length ? examTopics : data.topics

  return (
    <div className="screen exam-edit">
      <ScreenHeader
        title={examId ? 'Editar l’examen' : 'Nou examen'}
        onBack={() => go(examId ? { name: 'exam', examId } : { name: 'exams' })}
      />

      <section className="card">
        <label className="field">
          <span>Nom de l’examen</span>
          <input value={exam.title} onChange={(e) => set({ title: e.target.value })} placeholder="Per exemple: Parcial temes 1 a 3" maxLength={60} />
        </label>
        <label className="field">
          <span>Data</span>
          <input type="date" value={exam.date} onChange={(e) => e.target.value && set({ date: e.target.value })} />
        </label>
        <div className="field">
          <span>Nota</span>
          <div className="score-row">
            <input inputMode="decimal" value={scoreText} onChange={(e) => setScoreText(e.target.value)} placeholder="7,5" aria-label="Nota obtinguda" />
            <span>sobre</span>
            <input inputMode="decimal" value={maxText} onChange={(e) => setMaxText(e.target.value)} aria-label="Nota màxima" />
          </div>
          {scoreError ? <small className="field-error">{scoreError}</small> : <small className="muted">Si encara no la saps, deixa-la en blanc.</small>}
        </div>
        <div className="field">
          <span>Temes que entraven</span>
          <div className="topic-chips">
            {data.topics.map((t) => (
              <button key={t.id} type="button" className={`topic-chip ${exam.topicIds.includes(t.id) ? 'on' : ''}`} onClick={() => toggleTopic(t.id)} aria-pressed={exam.topicIds.includes(t.id)}>
                <b>{t.number}</b> {t.title}
              </button>
            ))}
          </div>
        </div>
        <label className="field">
          <span>Notes (opcional)</span>
          <textarea rows={2} value={exam.notes ?? ''} onChange={(e) => set({ notes: e.target.value })} placeholder="Per exemple: moltes preguntes de casos pràctics." />
        </label>
      </section>

      <section className="card">
        <h2>Preguntes que van sortir</h2>
        <p className="muted small">
          Apunta les que recordis. Si saps les opcions i la correcta, les podràs practicar a l’app.
        </p>
        <ol className="exam-q-edit">
          {exam.questions.map((q, n) => (
            <li key={q.id} className={open === q.id ? 'open' : ''}>
              {open !== q.id ? (
                <button className="exam-q-collapsed" onClick={() => setOpen(q.id)}>
                  <span>
                    {n + 1}. {q.text.trim() || <em className="muted">Pregunta sense enunciat</em>}
                  </span>
                  <small className="muted">Editar</small>
                </button>
              ) : (
                <div className="exam-q-form">
                  <label className="field">
                    <span>Pregunta {n + 1}</span>
                    <textarea rows={3} value={q.text} onChange={(e) => setQ(q.id, { text: e.target.value })} placeholder="Enunciat de la pregunta" autoFocus />
                  </label>
                  <div className="field">
                    <span>Opcions (marca la correcta)</span>
                    {q.options.map((o, i) => (
                      <div key={i} className="opt-row">
                        <input type="radio" name={`correct-${q.id}`} checked={q.correctIndex === i} onChange={() => setQ(q.id, { correctIndex: i })} aria-label={`L’opció ${LETTERS[i]} és la correcta`} />
                        <b>{LETTERS[i]}</b>
                        <input value={o} onChange={(e) => setQ(q.id, { options: q.options.map((x, j) => (j === i ? e.target.value : x)) })} placeholder={i < 2 ? 'Opció' : 'Opció (si n’hi havia)'} />
                      </div>
                    ))}
                  </div>
                  <label className="field">
                    <span>Tema</span>
                    <select value={q.topicId ?? ''} onChange={(e) => setQ(q.id, { topicId: e.target.value || null })}>
                      <option value="">No ho sé</option>
                      {topicChoices.map((t) => (
                        <option key={t.id} value={t.id}>
                          Tema {t.number}. {t.title}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="field">
                    <span>La vas encertar?</span>
                    <div className="seg">
                      {([
                        [true, 'Sí'],
                        [false, 'No'],
                        [null, 'No ho sé'],
                      ] as const).map(([v, label]) => (
                        <button key={label} type="button" className={q.gotRight === v ? 'on' : ''} onClick={() => setQ(q.id, { gotRight: v })}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <label className="field">
                    <span>Comentari (opcional)</span>
                    <input value={q.note ?? ''} onChange={(e) => setQ(q.id, { note: e.target.value })} placeholder="Per exemple: era una pregunta trampa" />
                  </label>
                  <div className="exam-q-actions">
                    <button className="danger-link" onClick={() => set({ questions: exam.questions.filter((x) => x.id !== q.id) })}>
                      Treure la pregunta
                    </button>
                    <button className="secondary-btn small-btn" onClick={() => setOpen(null)}>
                      Fet
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ol>
        <button className="secondary-btn wide-btn" onClick={addQuestion}>
          Afegir una pregunta
        </button>
      </section>

      <button className="primary-btn wide-btn save-exam" disabled={!canSave} onClick={save}>
        {examId ? 'Desar els canvis' : 'Desar l’examen'}
      </button>
      {!exam.title.trim() && <p className="muted small center">Posa-li un nom per poder-lo desar.</p>}
    </div>
  )
}
