import { useReducer, useState } from 'react'
import { saveFinishedTest } from '../data/sessions'
import { canFinish, initialTestState, testReducer, unansweredCount } from '../logic/testState'
import type { Navigate, PlannedTest } from '../nav'
import { CloseIcon } from '../components/icons'
import { Modal } from '../components/ui'

const LETTERS = 'ABCDEFGH'

export function TestRunner({ courseId, test, go }: { courseId: string; test: PlannedTest; go: Navigate }) {
  const [state, dispatch] = useReducer(testReducer, test.questions.length, initialTestState)
  const [startedAt] = useState(() => new Date().toISOString())
  const [dialog, setDialog] = useState<'none' | 'finish' | 'exit'>('none')
  const [saving, setSaving] = useState(false)

  const q = test.questions[state.index]
  const isLast = state.index === test.questions.length - 1
  const pending = unansweredCount(state)

  async function finish() {
    setSaving(true)
    const sessionId = await saveFinishedTest(courseId, test.mode, test.title, test.questions, state.answers, startedAt)
    go({ name: 'summary', sessionId })
  }

  function onFinishClick() {
    if (pending > 0) setDialog('finish')
    else finish()
  }

  return (
    <div className="screen test-screen">
      <header className="test-header">
        <span className="muted">{test.title}</span>
        <button className="icon-btn" onClick={() => setDialog('exit')} aria-label="Sortir del test">
          <CloseIcon />
        </button>
      </header>

      <h2 className="question">
        <span className="q-number">{state.index + 1}.</span> {q.text}
      </h2>

      <div className="options">
        {q.options.map((opt, i) => (
          <button
            key={i}
            className={`option ${state.answers[state.index] === i ? 'selected' : ''}`}
            onClick={() => dispatch({ type: 'answer', option: i })}
          >
            <span className="option-letter">{LETTERS[i]}</span>
            <span>{opt}</span>
          </button>
        ))}
      </div>

      <div className="test-nav">
        <button className="secondary-btn" onClick={() => dispatch({ type: 'prev' })} disabled={state.index === 0}>
          Anterior
        </button>
        <button className="secondary-btn" onClick={() => dispatch({ type: 'next' })} disabled={isLast}>
          Següent
        </button>
      </div>

      {/* Índex: número = visitada, ? = encara no vista. Només es pot saltar a les visitades. */}
      <nav className="q-index" aria-label="Índex de preguntes">
        {test.questions.map((_, i) => {
          const visited = i <= state.maxVisited
          const answered = state.answers[i] !== null
          return (
            <button
              key={i}
              className={`q-dot ${i === state.index ? 'current' : ''} ${answered ? 'answered' : ''}`}
              disabled={!visited}
              onClick={() => dispatch({ type: 'goto', index: i })}
              aria-label={visited ? `Pregunta ${i + 1}${answered ? ', resposta' : ', sense resposta'}` : 'Pregunta no vista'}
            >
              {visited ? i + 1 : '?'}
            </button>
          )
        })}
      </nav>

      <button className="primary-btn wide" disabled={!canFinish(state) || saving} onClick={onFinishClick}>
        Finalitzar test
      </button>

      {dialog === 'finish' && (
        <Modal onClose={() => setDialog('none')}>
          <h3>Tens {pending === 1 ? '1 pregunta' : `${pending} preguntes`} sense respondre</h3>
          <p>Les preguntes sense resposta comptaran com a no encertades.</p>
          <div className="modal-actions">
            <button className="secondary-btn" onClick={() => setDialog('none')}>
              Tornar al test
            </button>
            <button className="primary-btn" onClick={finish} disabled={saving}>
              Finalitzar igualment
            </button>
          </div>
        </Modal>
      )}

      {dialog === 'exit' && (
        <Modal onClose={() => setDialog('none')}>
          <h3>Vols sortir del test?</h3>
          <p>Aquest test no es guardarà.</p>
          <div className="modal-actions">
            <button className="secondary-btn" onClick={() => setDialog('none')}>
              Continuar
            </button>
            <button className="danger-btn" onClick={() => go({ name: 'home' })}>
              Sortir
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
