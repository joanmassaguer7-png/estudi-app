import { useCallback, useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { getSetting, setSetting } from '../data/db'
import { Guada } from '../components/Guada'
import { PawIcon } from '../components/icons'
import { ScreenHeader } from '../components/ui'
import { CHAPTERS, LEVELS, type Chapter } from '../tutorial/chapters'
import type { Navigate } from '../nav'
import { useAppSettings } from '../data/hooks'

export const TUTORIAL_KEY = 'tutorial'
export interface TutorialState {
  done: string[]
  dismissed?: boolean
}

async function markDone(id: string) {
  const s = await getSetting<TutorialState>(TUTORIAL_KEY, { done: [] })
  if (!s.done.includes(id)) await setSetting(TUTORIAL_KEY, { ...s, done: [...s.done, id] })
}

/** Mapa de capítols, agrupats per nivell. Cada capítol es desbloqueja en acabar l'anterior. */
export function Tutorial({ go, startAt }: { go: Navigate; startAt?: string }) {
  const state = useLiveQuery(() => getSetting<TutorialState>(TUTORIAL_KEY, { done: [] }), [])
  const [playing, setPlaying] = useState<string | null>(startAt ?? null)
  const name = useAppSettings()?.name ?? ''
  if (!state) return null

  const done = new Set(state.done)
  const allDone = CHAPTERS.every((c) => done.has(c.id))
  const nextId = CHAPTERS.find((c) => !done.has(c.id))?.id

  if (playing) {
    const idx = CHAPTERS.findIndex((c) => c.id === playing)
    return (
      <ChapterPlayer
        key={playing}
        name={name}
        chapter={CHAPTERS[idx]}
        number={idx + 1}
        onExit={() => setPlaying(null)}
        onFinish={() => {
          // Primer es canvia de capítol i després es desa el progrés: si desar falla o va lent
          // (passava en algun mòbil), el botó «Següent capítol» no es queda encallat.
          const next = CHAPTERS[idx + 1]
          setPlaying(next ? next.id : null)
          markDone(playing).catch((e) => console.error('No s’ha pogut desar el progrés del tutorial', e))
        }}
      />
    )
  }

  return (
    <div className="screen tutorial">
      <ScreenHeader title="Tutorial amb la Guada" onBack={() => go({ name: 'home' })} />
      <div className="tut-intro">
        <Guada mood={allDone ? 'content' : 'hola'} size={96} />
        <p>
          {allDone
            ? `${name ? `${name}, j` : 'J'}a domines l’app! Pots repetir qualsevol capítol quan vulguis.`
            : done.size === 0
              ? `Hola${name ? `, ${name}` : ''}! Et faré de guia per l’app. Comencem pel més bàsic i anirem pujant de nivell.`
              : `${name ? `${name}, p` : 'P'}ortes ${done.size} de ${CHAPTERS.length} capítols. Continuem?`}
        </p>
      </div>

      {allDone && <Diploma name={name} />}

      {LEVELS.map((level) => (
        <section key={level} className="tut-level">
          <h2>{level}</h2>
          <ol className="tut-path">
            {CHAPTERS.filter((c) => c.level === level).map((c) => {
              const n = CHAPTERS.indexOf(c) + 1
              const isDone = done.has(c.id)
              const unlocked = isDone || c.id === nextId
              return (
                <li key={c.id} className={`tut-node ${isDone ? 'done' : ''} ${c.id === nextId ? 'next' : ''} ${unlocked ? '' : 'locked'}`}>
                  <button disabled={!unlocked} onClick={() => setPlaying(c.id)}>
                    <span className="tut-badge">{isDone ? <PawIcon size={22} /> : n}</span>
                    <span className="tut-text">
                      <strong>{c.title}</strong>
                      <small>{unlocked ? c.summary : 'Acaba l’anterior per desbloquejar-lo'}</small>
                    </span>
                    {c.id === nextId && <span className="tut-go">{done.size === 0 ? 'Comença' : 'Continua'}</span>}
                  </button>
                </li>
              )
            })}
          </ol>
        </section>
      ))}

      {done.size > 0 && (
        <button className="link-btn" onClick={() => setSetting(TUTORIAL_KEY, { done: [], dismissed: false })}>
          Esborrar el progrés del tutorial
        </button>
      )}
    </div>
  )
}

/** Un capítol: la Guada parla, i a sota hi ha la demo per practicar. */
function ChapterPlayer({ chapter, number, name, onExit, onFinish }: { chapter: Chapter; number: number; name: string; onExit: () => void; onFinish: () => void }) {
  const [stepIdx, setStepIdx] = useState(0)
  const [tasksDone, setTasksDone] = useState<number[]>([])
  const [typed, setTyped] = useState(false)
  const [finished, setFinished] = useState(false)
  const step = chapter.steps[stepIdx]
  const Demo = chapter.demo
  // L'etapa de la demo és la del pas actual o, si no en té, la de l'últim pas que en tenia.
  const stage = chapter.steps.slice(0, stepIdx + 1).reduce((acc, s) => (s.stage !== undefined ? s.stage : acc), 0)
  const taskDone = !step.task || tasksDone.includes(stepIdx)
  const canNext = typed && taskDone
  const isLast = stepIdx === chapter.steps.length - 1

  const onDemoDone = useCallback(() => {
    setTasksDone((prev) => (prev.includes(stepIdx) ? prev : [...prev, stepIdx]))
  }, [stepIdx])

  function next() {
    if (!canNext) return
    if (isLast) {
      setFinished(true)
      return
    }
    setTyped(false)
    setStepIdx(stepIdx + 1)
  }

  if (finished) {
    return (
      <div className="screen tutorial">
        <div className="tut-done">
          <Guada mood="content" size={140} />
          <h1>{name ? `Molt bé, ${name}!` : 'Molt bé!'}</h1>
          <p className="tut-done-sub">Capítol {number} completat</p>
          <p>{chapter.title}</p>
          <div className="button-stack">
            <button className="primary-btn" onClick={onFinish}>
              {number < CHAPTERS.length ? 'Següent capítol' : 'Veure el diploma'}
            </button>
            <button
              className="link-btn"
              onClick={() => {
                onExit()
                markDone(chapter.id).catch((e) => console.error('No s’ha pogut desar el progrés del tutorial', e))
              }}
            >
              Tornar al mapa
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="screen tutorial">
      <header className="test-header">
        <div className="test-heading">
          <span className="test-title">
            {number}. {chapter.title}
          </span>
          <span className="test-count">{chapter.level}</span>
        </div>
        <button className="icon-btn" onClick={onExit} aria-label="Sortir del capítol">
          ✕
        </button>
      </header>
      <div className="tut-dots" aria-hidden="true">
        {chapter.steps.map((_, i) => (
          <span key={i} className={i < stepIdx ? 'past' : i === stepIdx ? 'now' : ''} />
        ))}
      </div>

      <div className="tut-talk">
        <Guada mood={step.mood} talking={!typed} size={92} />
        <SpeechBubble key={stepIdx} text={personalize(step.say, name)} onTyped={() => setTyped(true)} />
      </div>
      {step.task && (
        <p className={`tut-task ${taskDone ? 'ok' : ''}`}>
          {taskDone ? '✓ Fet!' : `👉 ${step.task}`}
        </p>
      )}

      <div className="tut-demo">
        <Demo key={chapter.id} stage={stage} onDone={onDemoDone} />
      </div>

      <div className="tut-nav">
        <button className="secondary-btn" disabled={stepIdx === 0} onClick={() => (setTyped(true), setStepIdx(stepIdx - 1))}>
          Enrere
        </button>
        <button className={`primary-btn ${canNext ? 'ready' : ''}`} disabled={!canNext} onClick={next}>
          {isLast ? 'Acabar' : 'Següent'}
        </button>
      </div>
    </div>
  )
}

/** Substitueix {nom} pel nom de la persona (o el treu si no n'hi ha). */
function personalize(text: string, name: string) {
  return name ? text.replaceAll('{nom}', name) : text.replaceAll(', {nom}', '').replaceAll('{nom}', '')
}

/** Bafarada amb efecte de màquina d'escriure. Tocant-la, es mostra tota de cop. */
function SpeechBubble({ text, onTyped }: { text: string; onTyped: () => void }) {
  const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const [shown, setShown] = useState(reduce ? text.length : 0)

  useEffect(() => {
    if (shown >= text.length) {
      onTyped()
      return
    }
    const t = window.setTimeout(() => setShown((n) => Math.min(text.length, n + 2)), 22)
    return () => window.clearTimeout(t)
  }, [shown, text, onTyped])

  return (
    <button className="bubble" onClick={() => setShown(text.length)} aria-live="polite">
      <span className="bubble-text">{text.slice(0, shown)}</span>
      <span className="bubble-ghost" aria-hidden="true">
        {text}
      </span>
    </button>
  )
}

function Diploma({ name }: { name: string }) {
  return (
    <div className="diploma">
      <span className="diploma-seal">
        <PawIcon size={34} />
      </span>
      <h2>Diploma de la Guada Vet</h2>
      <p>{name ? `${name}, has` : 'Has'} completat tots els capítols del tutorial. Ja saps fer servir l’app de dalt a baix. Ara, a estudiar!</p>
      <div className="paw-confetti" aria-hidden="true">
        {Array.from({ length: 14 }, (_, i) => (
          <span
            key={i}
            className={`tone-${i % 3}`}
            style={{ left: `${(i * 73) % 100}%`, animationDelay: `${(i % 7) * 0.15}s`, animationDuration: `${2.4 + (i % 5) * 0.3}s`, ['--rot' as string]: `${(i % 2 ? 1 : -1) * 30}deg` }}
          >
            <PawIcon size={18 + (i % 3) * 6} />
          </span>
        ))}
      </div>
    </div>
  )
}
