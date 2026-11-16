import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../data/db'
import type { CourseData } from '../data/hooks'
import type { Navigate } from '../nav'
import { ScreenHeader } from '../components/ui'

const LETTERS = 'ABCDEFGH'

/** Pantalla resum que es veu en acabar un test. */
export function Summary({ data, sessionId, go }: { data: CourseData; sessionId: string; go: Navigate }) {
  const s = useLiveQuery(() => db.sessions.get(sessionId), [sessionId])
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
      <div className="card center">
        <p className="muted">{s.title}</p>
        <p className="big-number">
          {s.correctCount}/{s.total}
        </p>
        <p className={pct >= 90 ? 'good' : pct >= 60 ? '' : 'bad'}>{pct}% d’encerts</p>
        <div className="stat-row">
          <span className="good">✓ {s.correctCount} encerts</span>
          <span className="bad">✗ {wrong} errors</span>
          <span className="muted">– {unanswered} sense resposta</span>
        </div>
      </div>

      <h2>Per tema</h2>
      <ul className="plain-list">
        {byTopic.map(({ t, n, ok }) => (
          <li key={t.id}>
            <span>
              T{t.number} · {t.title}
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
      {items.length === 0 && <p className="muted">No hi ha cap error. 🎉</p>}
      {items.map(({ q, i, chosen }) => {
        const ok = chosen === q.correctIndex
        return (
          <article key={q.id + i} className={`review-item ${ok ? 'ok' : 'ko'}`}>
            <h3>
              {i + 1}. {q.text}
            </h3>
            <ul className="review-options">
              {q.options.map((opt, j) => (
                <li
                  key={j}
                  className={j === q.correctIndex ? 'correct' : j === chosen ? 'chosen-wrong' : ''}
                >
                  <span className="option-letter">{LETTERS[j]}</span> {opt}
                  {j === q.correctIndex && <em> · correcta</em>}
                  {j === chosen && j !== q.correctIndex && <em> · la teva resposta</em>}
                </li>
              ))}
            </ul>
            {chosen === null && <p className="muted">No la vas respondre.</p>}
            {q.explanation && <p className="explanation">{q.explanation}</p>}
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
          <li key={s.id}>
            <button onClick={() => go({ name: 'summary', sessionId: s.id })}>
              <span>
                <strong>{s.title}</strong>
                <small>{new Date(s.finishedAt).toLocaleString('ca-ES', { dateStyle: 'short', timeStyle: 'short' })}</small>
              </span>
              <span className="score">
                {s.correctCount}/{s.total}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
