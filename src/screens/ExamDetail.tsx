import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import type { CourseData } from '../data/hooks'
import type { Navigate } from '../nav'
import { db } from '../data/db'
import { Modal, ScreenHeader, useToast } from '../components/ui'
import { compareExam, formatExamDate, formatScore } from '../logic/exams'
import { CompareBars, DiffLine } from './Exams'

const pct = (x: number) => `${Math.round(x * 100)} %`

export function ExamDetail({ examId, data, go }: { examId: string; data: CourseData; go: Navigate }) {
  const toast = useToast()
  const exam = useLiveQuery(() => db.exams.get(examId), [examId])
  const [confirm, setConfirm] = useState(false)
  if (exam === undefined) return null
  if (exam === null || !exam) {
    return (
      <div className="screen">
        <ScreenHeader title="Examen" onBack={() => go({ name: 'exams' })} />
        <p className="muted">Aquest examen ja no existeix.</p>
      </div>
    )
  }
  const c = compareExam(exam, data.attempts)
  const topic = (id: string | null) => data.topics.find((t) => t.id === id)

  async function remove() {
    await db.exams.delete(examId)
    toast('Examen esborrat.')
    go({ name: 'exams' })
  }

  return (
    <div className="screen exam-detail">
      <ScreenHeader
        title={exam.title}
        onBack={() => go({ name: 'exams' })}
        right={
          <button className="link-btn" onClick={() => go({ name: 'exam-edit', examId })}>
            Editar
          </button>
        }
      />

      <section className="card exam-summary">
        <p className="muted small">{formatExamDate(exam.date)}</p>
        <p className="exam-big">{formatScore(exam.score, exam.maxScore)}</p>
        <CompareBars examPct={c.examPct} testPct={c.testPct} />
        <DiffLine diff={c.diff} testPct={c.testPct} examPct={c.examPct} />
        {c.answered > 0 && (
          <p className="muted small">
            La mitjana dels tests compta les {c.answered} respostes d’aquests temes fetes fins al dia de l’examen.
          </p>
        )}
      </section>

      {exam.topicIds.length > 0 && (
        <section className="card">
          <h2>Per tema</h2>
          <p className="muted small">Mitjana dels tests de cada tema fins al dia de l’examen. La línia marca la nota de l’examen.</p>
          <ul className="exam-topics">
            {c.topics.map((t) => {
              const tp = topic(t.topicId)
              return (
                <li key={t.topicId}>
                  <span className="exam-topic-name">
                    <b>{tp?.number}</b> {tp?.title ?? 'Tema esborrat'}
                  </span>
                  <span className="exam-topic-val">{t.pct === null ? 'Sense tests' : pct(t.pct)}</span>
                  <span className="cmp-track">
                    <span className="cmp-fill tests" style={{ width: `${(t.pct ?? 0) * 100}%` }} />
                    {c.examPct !== null && <span className="cmp-marker" style={{ left: `${c.examPct * 100}%` }} />}
                  </span>
                  {t.examKnown > 0 && (
                    <small className="muted">
                      A l’examen: {t.examRight} de {t.examKnown} {t.examKnown === 1 ? 'pregunta encertada' : 'preguntes encertades'}
                    </small>
                  )}
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {exam.notes && (
        <section className="card">
          <h2>Notes</h2>
          <p>{exam.notes}</p>
        </section>
      )}

      <section className="card">
        <h2>Preguntes ({exam.questions.length})</h2>
        {exam.questions.length === 0 ? (
          <p className="muted small">
            Encara no n’has apuntat cap. Toca «Editar» per afegir les preguntes que recordis de l’examen.
          </p>
        ) : (
          <ol className="exam-q-list">
            {exam.questions.map((q) => (
              <li key={q.id}>
                <p>{q.text}</p>
                {q.options.some((o) => o.trim()) && (
                  <ul className="exam-q-options">
                    {q.options.map((o, i) =>
                      o.trim() ? (
                        <li key={i} className={i === q.correctIndex ? 'correct' : ''}>
                          <b>{'ABCDEFGH'[i]}</b> {o}
                        </li>
                      ) : null,
                    )}
                  </ul>
                )}
                <small className="exam-q-meta">
                  {topic(q.topicId) && <span>Tema {topic(q.topicId)?.number}</span>}
                  {q.gotRight !== null && <span className={`weak-tag ${q.gotRight ? 'fixed' : ''}`}>{q.gotRight ? 'Encertada' : 'Fallada'}</span>}
                </small>
              </li>
            ))}
          </ol>
        )}
      </section>

      <button className="danger-link" onClick={() => setConfirm(true)}>
        Esborrar l’examen
      </button>

      {confirm && (
        <Modal onClose={() => setConfirm(false)}>
          <h3>Esborrar «{exam.title}»?</h3>
          <p>S’esborraran la nota i les preguntes apuntades d’aquest examen. Els tests de l’app no es toquen.</p>
          <div className="modal-actions">
            <button className="secondary-btn" onClick={() => setConfirm(false)}>
              Cancel·lar
            </button>
            <button className="danger-btn" onClick={remove}>
              Esborrar
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
