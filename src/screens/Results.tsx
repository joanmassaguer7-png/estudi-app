import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { mascotFor } from '../data/mascots'
import { streak } from '../logic/daily'
import { TreatModal } from '../components/TreatModal'
import { ReportButton } from '../components/ReportModal'
import { db } from '../data/db'
import type { CourseData } from '../data/hooks'
import type { Navigate } from '../nav'
import { ScreenHeader } from '../components/ui'
import { ResultRow } from './Home'

const LETTERS = 'ABCDEFGH'
const DIFFICULTY = { 1: 'Fàcil', 2: 'Mitjana', 3: 'Difícil', 4: 'Extra difícil' } as const

/** Pantalla resum que es veu en acabar un test. */
export function Summary({ data, sessionId, celebrate = false, go }: { data: CourseData; sessionId: string; celebrate?: boolean; go: Navigate }) {
  const s = useLiveQuery(() => db.sessions.get(sessionId), [sessionId])
  const [showTreat, setShowTreat] = useState(celebrate)
  if (!s) return null

  const unanswered = s.answers.filter((a) => a === null).length
  const wrong = s.total - s.correctCount - unanswered
  const pct = s.total ? Math.round((s.correctCount / s.total) * 100) : 0
  const byTopic = data.topics
    .map((t) => {
      const idx = s.snapshot.map((q, i) => (q.topicId === t.id ? i : -1)).filter((i) => i >= 0)
      return { t, n: idx.length, ok: idx.filter((i) => s.answers[i] === s.snapshot[i].correctIndex).length }
    })
    .filter((x) => x.n > 0)

  return (
    <div className="screen">
      <ScreenHeader title="Resultat" onBack={() => go({ name: 'home' })} />
      <div className="summary-hero">
        <ScoreSign correct={s.correctCount} total={s.total} />
        <p className="summary-title">{s.title}</p>
        <p className="summary-verdict">{verdict(pct)}</p>
        <div className="stat-row">
          <span className="stat good">
            <strong>{s.correctCount}</strong> encerts
          </span>
          <span className="stat bad">
            <strong>{wrong}</strong> errors
          </span>
          <span className="stat">
            <strong>{unanswered}</strong> sense resposta
          </span>
        </div>
      </div>

      <h2>Per tema</h2>
      <ul className="plain-list">
        {byTopic.map(({ t, n, ok }) => (
          <li key={t.id}>
            <span className="list-topic">
              <span className="mini-number">{t.number}</span>
              {t.title}
            </span>
            <strong>
              {ok}/{n}
            </strong>
          </li>
        ))}
      </ul>

      <div className="button-stack">
        <button
          className="primary-btn"
          disabled={s.correctCount === s.total}
          onClick={() => go({ name: 'review', sessionId, onlyErrors: true })}
        >
          Revisar errors
        </button>
        <button className="secondary-btn" onClick={() => go({ name: 'review', sessionId, onlyErrors: false })}>
          Revisar totes les preguntes
        </button>
        <button className="link-btn" onClick={() => go({ name: 'home' })}>
          Tornar a l’inici
        </button>
      </div>

      {/* En acabar el Repàs diari, la mascota del dia espera el seu premi. */}
      {showTreat && <TreatModal mascot={mascotFor()} days={streak(data.sessions)} onClose={() => setShowTreat(false)} />}
    </div>
  )
}

function verdict(pct: number) {
  if (pct === 100) return 'Perfecte. Cap error.'
  if (pct >= 90) return 'Molt bé. Ho tens gairebé tot.'
  if (pct >= 70) return 'Bé. Repassa els errors per consolidar-ho.'
  if (pct >= 50) return 'Hi ha feina per fer. Revisa els errors amb calma.'
  return 'Cal repassar-ho més. Comença pels errors.'
}

/** Resultat dins d'un cercle, com un senyal de límit de velocitat. El cercle s'omple en aparèixer. */
function ScoreSign({ correct, total }: { correct: number; total: number }) {
  const r = 54
  const c = 2 * Math.PI * r
  const frac = total ? correct / total : 0
  const tone = frac >= 0.9 ? 'good' : frac >= 0.6 ? 'mid' : 'bad'
  return (
    <div className={`score-sign ${tone}`} role="img" aria-label={`${correct} de ${total} encerts`}>
      <svg viewBox="0 0 128 128">
        <circle className="score-track" cx="64" cy="64" r={r} />
        <circle
          className="score-fill"
          cx="64"
          cy="64"
          r={r}
          strokeDasharray={c}
          style={{ ['--dash-from' as string]: c, ['--dash-to' as string]: c * (1 - frac) }}
          strokeDashoffset={c * (1 - frac)}
        />
      </svg>
      <span className="score-number">
        {correct}
        <small>/{total}</small>
      </span>
    </div>
  )
}

/** Revisió: resposta de l'usuari, resposta correcta i explicació. */
export function Review({ sessionId, onlyErrors, go }: { sessionId: string; onlyErrors: boolean; go: Navigate }) {
  const s = useLiveQuery(() => db.sessions.get(sessionId), [sessionId])
  if (!s) return null

  const items = s.snapshot
    .map((q, i) => ({ q, i, chosen: s.answers[i] }))
    .filter((x) => !onlyErrors || x.chosen !== x.q.correctIndex)

  return (
    <div className="screen">
      <ScreenHeader
        title={onlyErrors ? 'Revisió d’errors' : 'Revisió completa'}
        onBack={() => go({ name: 'summary', sessionId })}
      />
      {items.length === 0 && <p className="muted">En aquest test no hi ha cap error.</p>}
      {items.map(({ q, i, chosen }) => {
        const ok = chosen === q.correctIndex
        return (
          <article key={q.id + i} className={`review-item ${ok ? 'ok' : 'ko'}`}>
            <h3>
              <span className="review-mark" aria-label={ok ? 'Encertada' : 'No encertada'}>
                {ok ? '✓' : '✗'}
              </span>
              <span>
                {i + 1}. {q.text}
              </span>
            </h3>
            {q.difficulty && <span className={`difficulty d${q.difficulty}`}>{DIFFICULTY[q.difficulty]}</span>}
            <ul className="review-options">
              {q.options.map((opt, j) => (
                <li
                  key={j}
                  className={j === q.correctIndex ? 'correct' : j === chosen ? 'chosen-wrong' : ''}
                >
                  <span className="option-letter">{LETTERS[j]}</span>
                  <span>{opt}</span>
                  {j === q.correctIndex && <em>Correcta</em>}
                  {j === chosen && j !== q.correctIndex && <em>La teva resposta</em>}
                </li>
              ))}
            </ul>
            {chosen === null && <p className="muted">No la vas respondre.</p>}
            {q.explanation && <p className="explanation">{q.explanation}</p>}
            {q.source && <p className="source">Font: {q.source}</p>}
            <ReportButton question={q} courseId={s.courseId} />
          </article>
        )
      })}
    </div>
  )
}

/** Historial de tots els tests fets en aquest curs. */
export function History({ data, go }: { data: CourseData; go: Navigate }) {
  return (
    <div className="screen">
      <ScreenHeader title="Historial" onBack={() => go({ name: 'home' })} />
      <ul className="result-list">
        {data.sessions.map((s) => (
          <ResultRow key={s.id} title={s.title} date={s.finishedAt} correct={s.correctCount} total={s.total} onOpen={() => go({ name: 'summary', sessionId: s.id })} />
        ))}
      </ul>
    </div>
  )
}
