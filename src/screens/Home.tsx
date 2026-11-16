import { useState } from 'react'
import { crownsKey, setSetting } from '../data/db'
import type { CourseData } from '../data/hooks'
import {
  buildDailyReview,
  buildErrorsTest,
  buildTotalReview,
  dailyCandidateTopics,
  MAX_CROWNS,
  mastery,
  TOTAL_PER_TOPIC,
} from '../logic/select'
import type { Navigate } from '../nav'
import { AlertIcon, CrownIcon, GamepadIcon, GearIcon, RepeatIcon, SearchIcon } from '../components/icons'
import { ProgressBar, useToast } from '../components/ui'

export function Home({ data, go }: { data: CourseData; go: Navigate }) {
  const { course, topics, questions, attempts, sessions, crowns } = data
  const toast = useToast()
  const [search, setSearch] = useState('')

  const visibleTopics = topics.filter((t) =>
    `${t.number} ${t.title}`.toLowerCase().includes(search.trim().toLowerCase()),
  )
  const errorsAvailable = buildErrorsTest(questions, attempts).length
  const totalCount = topics.reduce(
    (sum, t) => sum + Math.min(TOTAL_PER_TOPIC, questions.filter((q) => q.topicId === t.id).length),
    0,
  )

  async function toggleCrown(topicId: string) {
    const active = crowns.includes(topicId)
    if (!active && crowns.length >= MAX_CROWNS) {
      toast(`Només pots seleccionar ${MAX_CROWNS} temes per al Repàs diari.`)
      return
    }
    const next = active ? crowns.filter((id) => id !== topicId) : [...crowns, topicId]
    await setSetting(crownsKey(course.id), next)
  }

  function startDaily() {
    const lastDaily = sessions.find((s) => s.mode === 'repas-diari')
    const qs = buildDailyReview(topics, crowns, questions, attempts, lastDaily?.questionIds)
    if (qs.length === 0) return toast('Encara no hi ha preguntes per als temes seleccionats.')
    const included = dailyCandidateTopics(topics, crowns)
    go({
      name: 'pretest',
      test: {
        mode: 'repas-diari',
        title: 'Repàs diari',
        description:
          crowns.length > 0
            ? `Temes amb corona: ${included.map((t) => t.number).join(', ')}.`
            : `Cap corona activa: s’inclouen ${included.length === topics.length ? 'tots els temes' : 'els 10 temes més recents'}.`,
        questions: qs,
      },
    })
  }

  function startTotal() {
    const qs = buildTotalReview(topics, questions)
    if (qs.length === 0) return toast('Encara no hi ha preguntes.')
    go({
      name: 'pretest',
      test: {
        mode: 'repas-total',
        title: 'Repàs total',
        description: `${TOTAL_PER_TOPIC} preguntes de cada un dels ${topics.length} temes, en ordre aleatori.`,
        questions: qs,
      },
    })
  }

  function startErrors() {
    const qs = buildErrorsTest(questions, attempts)
    if (qs.length === 0) return toast('No tens cap pregunta fallada pendent. Molt bé!')
    go({
      name: 'pretest',
      test: {
        mode: 'errors',
        title: 'Test d’errors',
        description: 'Preguntes que vas fallar l’últim cop que les vas respondre.',
        questions: qs,
      },
    })
  }

  return (
    <div className="screen">
      <header className="home-header">
        <div>
          <p className="eyebrow">Curs</p>
          <h1>{course.title}</h1>
        </div>
        <button className="icon-btn" onClick={() => go({ name: 'manage' })} aria-label="Gestionar">
          <GearIcon />
        </button>
      </header>

      <label className="search">
        <SearchIcon />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar tema" />
      </label>

      <section>
        <h2>Jocs</h2>
        <div className="game-grid">
          <button className="game-card accent" onClick={startDaily}>
            <CrownIcon size={40} />
            <span className="game-title">Repàs diari</span>
            <span className="game-sub">Fins a 10 preguntes</span>
          </button>
          <button className="game-card" onClick={startTotal}>
            <RepeatIcon size={36} />
            <span className="game-title">Repàs total</span>
            <span className="game-sub">{totalCount} preguntes</span>
          </button>
          <button className="game-card" onClick={startErrors}>
            <AlertIcon size={36} />
            <span className="game-title">Test d’errors</span>
            <span className="game-sub">{errorsAvailable} pendents</span>
          </button>
          <button className="game-card" disabled title="Properament">
            <GamepadIcon size={40} />
            <span className="game-title">Trivial</span>
            <span className="game-sub">Properament</span>
          </button>
        </div>
      </section>

      <section>
        <div className="section-head">
          <h2>Temes</h2>
          <span className="hint">
            <CrownIcon size={16} className="crown on" /> {crowns.length}/{MAX_CROWNS} al Repàs diari
          </span>
        </div>
        {visibleTopics.length === 0 && <p className="muted">Cap tema coincideix amb la cerca.</p>}
        <div className="topic-grid">
          {visibleTopics.map((t) => {
            const m = mastery(
              questions.filter((q) => q.topicId === t.id),
              attempts,
            )
            const on = crowns.includes(t.id)
            return (
              <div key={t.id} className="topic-card">
                <button className="topic-main" onClick={() => go({ name: 'topic', topicId: t.id })}>
                  <span className="topic-number">T{t.number}</span>
                  <span className="topic-title">{t.title}</span>
                  <ProgressBar value={m.total ? m.mastered / m.total : 0} />
                  <span className="topic-meta">
                    {m.mastered}/{m.total} dominades
                  </span>
                </button>
                <button
                  className={`crown-btn ${on ? 'on' : ''}`}
                  onClick={() => toggleCrown(t.id)}
                  aria-pressed={on}
                  aria-label={on ? 'Treure del Repàs diari' : 'Afegir al Repàs diari'}
                >
                  <CrownIcon size={22} />
                </button>
              </div>
            )
          })}
        </div>
      </section>

      <section>
        <div className="section-head">
          <h2>Resultats</h2>
          {sessions.length > 0 && (
            <button className="link-btn" onClick={() => go({ name: 'history' })}>
              Veure tot
            </button>
          )}
        </div>
        {sessions.length === 0 && <p className="muted">Encara no has fet cap test.</p>}
        <ul className="result-list">
          {sessions.slice(0, 4).map((s) => (
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
      </section>
    </div>
  )
}
