import { useMemo, useState } from 'react'
import type { CourseData } from '../data/hooks'
import { saveFinishedTest } from '../data/sessions'
import {
  answerTrivial,
  completedCount,
  HITS_TO_COMPLETE,
  nextTurn,
  playableSubtopics,
  startTrivial,
  type TrivialState,
} from '../logic/trivial'
import type { Navigate } from '../nav'
import { CloseIcon, CrownIcon, PawIcon } from '../components/icons'
import { PawMeter, type PawMood } from '../components/PawMeter'
import { PawTrail } from '../components/PawTrail'
import { Modal, ScreenHeader } from '../components/ui'

const LETTERS = 'ABCDEFGH'

const trivialTitle = (number: string, title: string, won: boolean) =>
  `Trivial, tema ${number}. ${title} (${won ? 'guanyada' : 'perduda'})`

/** Triar el tema amb què es vol jugar. */
export function TrivialPick({ data, go }: { data: CourseData; go: Navigate }) {
  return (
    <div className="screen">
      <ScreenHeader title="Trivial" onBack={() => go({ name: 'home' })} />
      <div className="trivial-intro">
        <PawMeter frac={0.45} size={96} />
        <p>
          Omple la petjada! Tria un tema i encerta {HITS_TO_COMPLETE} preguntes de cada subtema. Si falles, el subtema
          tornarà a sortir, però si se t’acaben les preguntes d’algun, perds.
        </p>
      </div>
      <ul className="pick-list">
        {data.topics.map((t) => {
          const subs = data.subtopics.filter((s) => s.topicId === t.id).map((s) => s.id)
          const playable = playableSubtopics(subs, data.questions)
          const ok = subs.length > 0 && playable.length === subs.length
          const wins = data.sessions.filter((s) => s.mode === 'trivial' && s.title === trivialTitle(t.number, t.title, true)).length
          return (
            <li key={t.id}>
              <button className="pick-row" disabled={!ok} onClick={() => go({ name: 'trivial', topicId: t.id })}>
                <span className="topic-number">{t.number}</span>
                <span className="pick-text">
                  <strong>{t.title}</strong>
                  <small>
                    {ok
                      ? `${subs.length} subtemes per completar`
                      : 'Calen almenys 2 preguntes a cada subtema'}
                  </small>
                </span>
                {wins > 0 && (
                  <span className="pick-wins" title="Partides guanyades">
                    <CrownIcon size={16} /> {wins}
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/** La partida. */
export function TrivialGame({ data, topicId, go }: { data: CourseData; topicId: string; go: Navigate }) {
  const topic = data.topics.find((t) => t.id === topicId)!
  const subtopics = data.subtopics.filter((s) => s.topicId === topicId)
  const byId = useMemo(() => new Map(data.questions.map((q) => [q.id, q])), [data.questions])

  const [game, setGame] = useState<TrivialState>(() =>
    startTrivial(
      topicId,
      subtopics.map((s) => s.id),
      data.questions,
    ),
  )
  const [chosen, setChosen] = useState<number | null>(null)
  const [startedAt] = useState(() => new Date().toISOString())
  const [confirmExit, setConfirmExit] = useState(false)
  const [justCompleted, setJustCompleted] = useState<string | null>(null)
  const [mood, setMood] = useState<PawMood>('idle')
  const [bump, setBump] = useState(0)

  const q = game.current ? byId.get(game.current)! : null
  // Subtemes en l'ordre del temari: cada un ocupa una part de la petjada.
  const trailSubs = subtopics.filter((s) => game.subtopicIds.includes(s.id))
  const answered = chosen !== null

  function choose(i: number) {
    if (answered || !q) return
    setChosen(i)
    const before = game.hits[q.subtopicId]
    const next = answerTrivial(game, q, i)
    const completed = before < HITS_TO_COMPLETE && next.hits[q.subtopicId] >= HITS_TO_COMPLETE
    if (completed) setJustCompleted(q.subtopicId)
    setMood(completed ? 'complete' : i === q.correctIndex ? 'hit' : 'miss')
    setBump((b) => b + 1)
    setGame(next)
  }

  async function advance() {
    const next = nextTurn(game)
    setChosen(null)
    setJustCompleted(null)
    setMood(next.status === 'won' ? 'won' : 'idle')
    setBump((b) => b + 1)
    if (next.status !== 'playing') {
      // La partida s'acaba: es guarda a l'historial com un test més.
      const played = next.history.map((h) => byId.get(h.questionId)!)
      await saveFinishedTest(
        data.course.id,
        'trivial',
        trivialTitle(topic.number, topic.title, next.status === 'won'),
        played,
        next.history.map((h) => h.chosenIndex),
        startedAt,
      )
    }
    setGame(next)
  }

  if (game.status !== 'playing') {
    const won = game.status === 'won'
    const correct = game.history.filter((h) => h.correct).length
    return (
      <div className="screen">
        {won && <PawConfetti />}
        <div className={`trivial-end ${won ? 'won' : 'lost'}`}>
          <div className={won ? 'trail-win' : ''}>
            <PawTrail subtopics={trailSubs} hits={game.hits} needed={HITS_TO_COMPLETE} greyed={!won} />
          </div>
          <h1>{won ? 'Partida guanyada' : 'Partida perduda'}</h1>
          <p>
            {won
              ? `Has completat els ${game.subtopicIds.length} subtemes amb ${game.history.length} preguntes.`
              : `T’has quedat sense preguntes d’un subtema. Has completat ${completedCount(game)} de ${game.subtopicIds.length}.`}
          </p>
          <p className="muted">
            {correct} encerts de {game.history.length} preguntes
          </p>
        </div>
        <div className="button-stack wide">
          <button className="primary-btn" onClick={() => go({ name: 'trivial-pick' })}>
            Jugar una altra partida
          </button>
          <button className="link-btn" onClick={() => go({ name: 'home' })}>
            Tornar a l’inici
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="screen test-screen">
      <header className="test-header">
        <div className="test-heading">
          <span className="test-title">Trivial: {topic.title}</span>
          <span className="test-count">
            {completedCount(game)} de {game.subtopicIds.length} subtemes completats
          </span>
        </div>
        <button className="icon-btn" onClick={() => setConfirmExit(true)} aria-label="Sortir de la partida">
          <CloseIcon />
        </button>
      </header>

      <div className="paw-stage">
        <PawTrail
          subtopics={trailSubs}
          hits={game.hits}
          needed={HITS_TO_COMPLETE}
          current={q?.subtopicId}
          mood={mood}
          bump={bump}
        />
      </div>

      {q && (
        <div key={q.id} className="question-block fwd">
          <p className="trivial-sub">{subtopics.find((s) => s.id === q.subtopicId)?.title}</p>
          <h2 className="question">{q.text}</h2>
          <div className="options">
            {q.options.map((opt, i) => {
              let cls = ''
              if (answered) {
                if (i === q.correctIndex) cls = 'is-correct'
                else if (i === chosen) cls = 'is-wrong'
                else cls = 'is-dim'
              }
              return (
                <button key={i} className={`option ${cls}`} onClick={() => choose(i)} disabled={answered && cls === 'is-dim'}>
                  <span className="option-letter">{LETTERS[i]}</span>
                  <span className="option-text">{opt}</span>
                </button>
              )
            })}
          </div>

          {answered && (
            <div className={`feedback ${chosen === q.correctIndex ? 'ok' : 'ko'}`} role="status">
              <div className="feedback-head">
                <strong>
                  {justCompleted
                    ? `Subtema ${subtopics.find((s) => s.id === justCompleted)?.number} completat!`
                    : chosen === q.correctIndex
                      ? 'Correcte'
                      : 'Incorrecte'}
                </strong>
                {chosen === q.correctIndex && (
                  <span className="steps" aria-hidden="true">
                    <PawIcon size={18} />
                    <PawIcon size={18} />
                    <PawIcon size={18} />
                  </span>
                )}
              </div>
              {q.explanation && <p>{q.explanation}</p>}
              <button className="primary-btn" onClick={advance} autoFocus>
                Continuar
              </button>
            </div>
          )}
        </div>
      )}

      {confirmExit && (
        <Modal onClose={() => setConfirmExit(false)}>
          <h3>Vols abandonar la partida?</h3>
          <p>Aquesta partida no es guardarà.</p>
          <div className="modal-actions">
            <button className="secondary-btn" onClick={() => setConfirmExit(false)}>
              Continuar jugant
            </button>
            <button className="danger-btn" onClick={() => go({ name: 'home' })}>
              Abandonar
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

/** Pluja de petjades quan es guanya una partida. */
function PawConfetti() {
  const [pieces] = useState(() =>
    Array.from({ length: 16 }, (_, i) => ({
      left: Math.random() * 100,
      delay: Math.random() * 0.9,
      duration: 2.2 + Math.random() * 1.6,
      rotate: Math.round(Math.random() * 80 - 40),
      size: 16 + Math.round(Math.random() * 16),
      tone: i % 3,
    })),
  )
  return (
    <div className="paw-confetti" aria-hidden="true">
      {pieces.map((p, i) => (
        <span
          key={i}
          className={`tone-${p.tone}`}
          style={{ left: `${p.left}%`, animationDelay: `${p.delay}s`, animationDuration: `${p.duration}s`, ['--rot' as string]: `${p.rotate}deg` }}
        >
          <PawIcon size={p.size} />
        </span>
      ))}
    </div>
  )
}
