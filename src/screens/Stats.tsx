import { useMemo, useState } from 'react'
import type { CourseData } from '../data/hooks'
import type { Navigate } from '../nav'
import { ScreenHeader } from '../components/ui'
import { mastery, pendingErrors, planErrors } from '../logic/select'
import { activityWeeks, heatLevel, overview, scoreHistory, weakQuestions } from '../logic/stats'

const pct = (x: number) => `${Math.round(x * 100)}%`
const fmtDate = (d: string | Date) => new Date(d).toLocaleDateString('ca-ES', { day: 'numeric', month: 'short' })
const WEEKDAYS = ['Dl', 'Dt', 'Dc', 'Dj', 'Dv', 'Ds', 'Dg']

export function Stats({ data, go }: { data: CourseData; go: Navigate }) {
  const { topics, subtopics, questions, attempts, sessions } = data
  const ov = useMemo(() => overview(attempts, sessions), [attempts, sessions])
  const scores = useMemo(() => scoreHistory(sessions), [sessions])
  const weeks = useMemo(() => activityWeeks(attempts), [attempts])
  const weak = useMemo(() => weakQuestions(questions, attempts), [questions, attempts])
  const pending = useMemo(() => pendingErrors(questions, attempts).length, [questions, attempts])
  const [score, setScore] = useState<number | null>(null)
  const [day, setDay] = useState<string | null>(null)
  const [open, setOpen] = useState<string | null>(null)

  const shown = scores[score ?? scores.length - 1]
  const allDays = weeks.flat()
  const shownDay = allDays.find((d) => d.key === day)

  function startErrors() {
    const plan = planErrors(questions, attempts)
    go({
      name: 'pretest',
      test: {
        mode: 'errors',
        title: 'Test d’errors',
        description: 'Les preguntes que tens pendents de consolidar i algunes de noves del mateix tema.',
        questions: plan.questions,
      },
    })
  }

  return (
    <div className="screen stats">
      <ScreenHeader title="Estadístiques" onBack={() => go({ name: 'home' })} />

      {ov.answered === 0 ? (
        <p className="muted">Quan facis el primer test, aquí veuràs com vas.</p>
      ) : (
        <>
          <div className="stat-tiles">
            <div className="stat-tile hero">
              <strong>{ov.rate === null ? '—' : pct(ov.rate)}</strong>
              <span>d’encerts en total</span>
            </div>
            <div className="stat-tile">
              <strong>{ov.answered}</strong>
              <span>respostes en {ov.tests} {ov.tests === 1 ? 'test' : 'tests'}</span>
            </div>
            <div className="stat-tile">
              <strong>{ov.currentStreak}</strong>
              <span>
                {ov.currentStreak === 1 ? 'dia seguit' : 'dies seguits'} · rècord {ov.bestStreak}
              </span>
            </div>
            <div className="stat-tile">
              <strong>{ov.daysStudied}</strong>
              <span>{ov.daysStudied === 1 ? 'dia d’estudi' : 'dies d’estudi'}</span>
            </div>
          </div>

          <section className="stat-card">
            <h2>Últims tests</h2>
            {shown && (
              <p className="chart-readout" aria-live="polite">
                <strong>{pct(shown.pct)}</strong> {shown.title}, {fmtDate(shown.date)} ({shown.correct} de {shown.total})
              </p>
            )}
            <div className="score-chart" role="list" onMouseLeave={() => setScore(null)}>
              <span className="score-guide" style={{ bottom: '50%' }} aria-hidden="true" />
              <span className="score-guide top" aria-hidden="true" />
              {scores.map((s, i) => (
                <button
                  key={s.id}
                  role="listitem"
                  className={`score-col ${i === (score ?? scores.length - 1) ? 'on' : ''}`}
                  onMouseEnter={() => setScore(i)}
                  onFocus={() => setScore(i)}
                  onClick={() => setScore(i)}
                  aria-label={`${s.title}, ${fmtDate(s.date)}: ${pct(s.pct)}`}
                >
                  <span className="score-bar" style={{ height: `${Math.max(s.pct * 100, 2)}%` }} />
                </button>
              ))}
            </div>
            <div className="chart-axis">
              <span>{scores.length > 1 ? fmtDate(scores[0].date) : ''}</span>
              <span>{fmtDate(scores[scores.length - 1].date)}</span>
            </div>
          </section>

          <section className="stat-card">
            <h2>Activitat</h2>
            <p className="chart-readout" aria-live="polite">
              {shownDay
                ? `${shownDay.date.toLocaleDateString('ca-ES', { weekday: 'long', day: 'numeric', month: 'long' })}: ${shownDay.count === 0 ? 'sense estudiar' : `${shownDay.count} ${shownDay.count === 1 ? 'resposta' : 'respostes'}`}`
                : 'Preguntes respostes cada dia de les últimes 12 setmanes.'}
            </p>
            <div className="heatmap">
              <div className="heat-days" aria-hidden="true">
                {WEEKDAYS.map((d, i) => (
                  <span key={d}>{i % 2 === 0 ? d : ''}</span>
                ))}
              </div>
              <div className="heat-grid">
                {weeks.map((w, wi) => (
                  <div key={wi} className="heat-week">
                    {w.map((d) => (
                      <button
                        key={d.key}
                        className={`heat-cell l${heatLevel(d.count)} ${d.future ? 'future' : ''} ${d.key === day ? 'on' : ''}`}
                        disabled={d.future}
                        onClick={() => setDay(d.key === day ? null : d.key)}
                        onMouseEnter={() => setDay(d.key)}
                        aria-label={`${d.date.toLocaleDateString('ca-ES')}: ${d.count} respostes`}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <div className="heat-legend" aria-hidden="true">
              <span>Menys</span>
              {[0, 1, 2, 3, 4].map((l) => (
                <i key={l} className={`heat-cell l${l}`} />
              ))}
              <span>Més</span>
            </div>
          </section>

          {weak.length > 0 && (
            <section className="stat-card">
              <h2>Punts febles</h2>
              <ul className="weak-list">
                {weak.map((w) => (
                  <li key={w.question.id}>
                    <p>{w.question.text}</p>
                    <small>
                      Fallada {w.wrong} de {w.total} {w.total === 1 ? 'vegada' : 'vegades'}
                      <span className={`weak-tag ${w.lastCorrect ? 'fixed' : ''}`}>{w.lastCorrect ? 'L’última, bé' : 'Pendent'}</span>
                    </small>
                  </li>
                ))}
              </ul>
              {pending > 0 && (
                <button className="primary-btn wide" onClick={startErrors}>
                  Practicar els errors ({pending})
                </button>
              )}
            </section>
          )}
        </>
      )}

      <section className="stat-card">
        <h2>Domini per tema</h2>
        <p className="muted small">Una pregunta està dominada si l’última vegada la vas encertar.</p>
        <ul className="mastery-list">
          {topics.map((t) => {
            const tq = questions.filter((q) => q.topicId === t.id)
            const m = mastery(tq, attempts)
            const subs = subtopics.filter((s) => s.topicId === t.id)
            const isOpen = open === t.id
            return (
              <li key={t.id}>
                <button className="mastery-row" onClick={() => setOpen(isOpen ? null : t.id)} aria-expanded={isOpen}>
                  <span className="mastery-name">
                    <b>{t.number}</b> {t.title}
                  </span>
                  <span className="mastery-num">
                    {m.mastered}/{m.total}
                  </span>
                  <span className="mastery-track">
                    <span style={{ width: `${m.total ? (m.mastered / m.total) * 100 : 0}%` }} />
                  </span>
                </button>
                {isOpen && (
                  <ul className="mastery-sub">
                    {subs.map((s) => {
                      const sm = mastery(
                        tq.filter((q) => q.subtopicId === s.id),
                        attempts,
                      )
                      return (
                        <li key={s.id}>
                          <span className="mastery-name">
                            <b>{s.number}</b> {s.title}
                          </span>
                          <span className="mastery-num">
                            {sm.mastered}/{sm.total}
                          </span>
                          <span className="mastery-track">
                            <span style={{ width: `${sm.total ? (sm.mastered / sm.total) * 100 : 0}%` }} />
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
