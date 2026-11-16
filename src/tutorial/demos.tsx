// Demostracions interactives del tutorial.
// Totes funcionen amb dades de mentida: no toquen la base de dades ni les estadístiques.
// Cada demo rep `stage` (quina tasca toca ara) i `onDone` (s'ha completat la tasca).

import { useEffect, useReducer, useState } from 'react'
import { AlertIcon, BoltIcon, CrownIcon, GamepadIcon, RepeatIcon } from '../components/icons'
import { PawTrail } from '../components/PawTrail'
import { TreatModal } from '../components/TreatModal'
import { MASCOTS, mascotFace, mascotFor } from '../data/mascots'
import { canFinish, initialTestState, testReducer, unansweredCount } from '../logic/testState'

export interface DemoProps {
  stage: number
  onDone: () => void
}

// ---------- 1. Estructura: curs > temes > subtemes ----------

export function DemoStructure({ stage, onDone }: DemoProps) {
  const [open, setOpen] = useState<string | null>(null)
  const topics = [
    { n: '1', t: 'La clínica veterinària', subs: ['1.1 La clínica i les seves àrees', '1.2 El recorregut del pacient'] },
    { n: '2', t: 'Recepció i atenció al client', subs: ['2.1 Imatge i comunicació', '2.2 Fitxa clínica i cites'] },
  ]
  return (
    <div className="demo demo-tree">
      <div className="tree-course">📚 Auxiliar de veterinària</div>
      {topics.map((t) => (
        <div key={t.n} className="tree-topic">
          <button
            className={`tree-topic-btn ${stage === 1 && !open ? 'pulse-target' : ''}`}
            onClick={() => {
              setOpen(open === t.n ? null : t.n)
              if (stage === 1) onDone()
            }}
          >
            <span className="mini-number">{t.n}</span> {t.t}
          </button>
          {open === t.n && (
            <ul className="tree-subs">
              {t.subs.map((s, i) => (
                <li key={s} style={{ animationDelay: `${i * 0.08}s` }}>
                  {s}
                  <span className="tree-q">20 preguntes</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  )
}

// ---------- 2. Pantalla d'inici ----------

const HOME_TARGETS = ['', 'repas', 'modes', 'tema', 'corona'] as const

export function DemoHome({ stage, onDone }: DemoProps) {
  const target = HOME_TARGETS[stage] ?? ''
  const hit = (name: string) => () => {
    if (name === target) onDone()
  }
  const cls = (name: string) => (name === target ? 'pulse-target' : target ? 'dimmed' : '')
  const mascot = mascotFor()
  return (
    <div className="demo phone">
      <div className="phone-screen">
        <p className="m-title">Auxiliar de veterinària</p>
        <button className={`m-hero ${cls('repas')}`} onClick={hit('repas')}>
          <img src={mascotFace(mascot, 'content')} alt="" width={34} height={34} />
          <span>
            <strong>Repàs diari</strong>
            <small>Fins a 10 preguntes</small>
          </span>
        </button>
        <div className={`m-modes ${cls('modes')}`} onClick={hit('modes')}>
          <span>
            <RepeatIcon size={16} /> Repàs total
          </span>
          <span>
            <AlertIcon size={16} /> Errors
          </span>
          <span>
            <GamepadIcon size={16} /> Trivial
          </span>
          <span className="x">
            <BoltIcon size={16} /> Extra difícil
          </span>
        </div>
        <div className="m-topics">
          <button className={`m-topic ${cls('tema')}`} onClick={hit('tema')}>
            <span className="mini-number">1</span> La clínica
          </button>
          <div className="m-topic">
            <span className="mini-number">2</span> Recepció
            <button className={`m-crown ${cls('corona')}`} onClick={hit('corona')} aria-label="Corona">
              <CrownIcon size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------- 3. Un test ----------

const DEMO_QUESTIONS = [
  { q: 'De quin color és la corona d’un tema que entra al Repàs diari?', o: ['Taronja', 'Blanca', 'Verda'] },
  { q: 'Quantes preguntes té el Repàs diari?', o: ['Fins a 10', 'Fins a 50', 'Una per subtema'] },
  { q: 'Què vol dir un «?» a l’índex?', o: ['Una pregunta que encara no has vist', 'Una pregunta sense resposta', 'Una pregunta difícil'] },
  { q: 'Quan s’activa el botó «Finalitzar test»?', o: ['Quan arribes a l’última pregunta', 'Quan respons totes les preguntes', 'Des del principi'] },
]

export function DemoTest({ stage, onDone }: DemoProps) {
  const [s, dispatch] = useReducer(testReducer, DEMO_QUESTIONS.length, initialTestState)
  const [shake, setShake] = useState(-1)
  const [warn, setWarn] = useState(false)
  const [finished, setFinished] = useState(false)

  // Comprovar si s'ha complert la tasca de l'etapa actual.
  useEffect(() => {
    if (stage === 1 && s.answers[0] !== null && s.index >= 1) onDone()
    // Tornar enrere: ja s'havia avançat i ara s'és a la primera.
    if (stage === 2 && s.maxVisited >= 1 && s.index === 0) onDone()
    // Si ja s'han vist totes les preguntes, no queda cap interrogant per tocar: es dona per fet.
    if (stage === 3 && s.maxVisited >= DEMO_QUESTIONS.length - 1) onDone()
  }, [stage, s, onDone])
  // El test només es pot acabar a l'última etapa; abans, la Guada encara ha d'ensenyar coses.
  const finishAllowed = canFinish(s) && stage >= 4
  // El test avança al ritme de la Guada: abans de l'etapa 1 no es pot respondre, i fins a
  // l'etapa 4 només es pot arribar a la pregunta 2 (així queden interrogants per a l'etapa 3).
  const canAnswer = stage >= 1
  const lastAllowed = stage >= 4 ? DEMO_QUESTIONS.length - 1 : stage >= 1 ? 1 : 0

  const q = DEMO_QUESTIONS[s.index]
  if (finished) {
    return (
      <div className="demo demo-test">
        <div className="demo-result">
          <span className="result-score mid">
            {s.answers.filter((a) => a === 0).length}
            <small>/4</small>
          </span>
          <p>
            Test acabat. Ara veuries el resum i podries revisar els errors amb la resposta correcta i l’explicació.
          </p>
        </div>
      </div>
    )
  }
  return (
    <div className="demo demo-test">
      <p className="demo-q">
        <strong>{s.index + 1}.</strong> {q.q}
      </p>
      <div className="demo-options">
        {q.o.map((o, i) => (
          <button key={i} className={`option small ${s.answers[s.index] === i ? 'selected' : ''}`} disabled={!canAnswer} onClick={() => dispatch({ type: 'answer', option: i })}>
            <span className="option-letter">{'ABC'[i]}</span>
            <span className="option-text">{o}</span>
          </button>
        ))}
      </div>
      <div className="demo-nav">
        <button className="secondary-btn small-btn" disabled={s.index === 0} onClick={() => dispatch({ type: 'prev' })}>
          Anterior
        </button>
        <button
          className={`secondary-btn small-btn ${stage === 1 && s.answers[0] !== null ? 'pulse-target' : ''}`}
          disabled={s.index >= lastAllowed}
          onClick={() => dispatch({ type: 'next' })}
        >
          Següent
        </button>
      </div>
      <div className="q-index small">
        {DEMO_QUESTIONS.map((_, i) => {
          const visited = i <= s.maxVisited
          return (
            <button
              key={i}
              className={`q-dot ${i === s.index ? 'current' : ''} ${s.answers[i] !== null ? 'answered' : ''} ${shake === i ? 'shake' : ''} ${
                stage === 2 && i === 0 && s.index !== 0 ? 'pulse-target' : ''
              } ${stage === 3 && !visited ? 'pulse-target' : ''}`}
              aria-disabled={!visited}
              onClick={() => {
                if (visited) return dispatch({ type: 'goto', index: i })
                setShake(i)
                setTimeout(() => setShake(-1), 500)
                if (stage === 3) onDone()
              }}
            >
              {visited ? i + 1 : '?'}
            </button>
          )
        })}
      </div>
      <button
        className={`primary-btn small-btn wide-demo ${finishAllowed ? 'pulse-target' : ''}`}
        disabled={!finishAllowed}
        onClick={() => (unansweredCount(s) > 0 ? setWarn(true) : (setFinished(true), stage === 4 && onDone()))}
      >
        Finalitzar test
      </button>
      {warn && (
        <div className="demo-warn">
          <strong>Tens {unansweredCount(s)} sense respondre</strong>
          <p>Comptaran com a no encertades.</p>
          <div className="demo-nav">
            <button className="secondary-btn small-btn" onClick={() => setWarn(false)}>
              Tornar al test
            </button>
            <button
              className="primary-btn small-btn"
              onClick={() => {
                setWarn(false)
                setFinished(true)
                if (stage === 4) onDone()
              }}
            >
              Finalitzar igualment
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ---------- 4. Corones ----------

export function DemoCrowns({ stage, onDone }: DemoProps) {
  const topics = ['La clínica', 'Recepció', 'Laboratori', 'Quiròfan']
  const [on, setOn] = useState<number[]>([])
  useEffect(() => {
    if (stage === 1 && on.length >= 2) onDone()
    if (stage === 2 && on.length === 0) onDone()
  }, [stage, on, onDone])
  return (
    <div className="demo demo-crowns">
      <div className="crown-grid">
        {topics.map((t, i) => {
          const active = on.includes(i)
          return (
            <div key={t} className={`m-topic big ${active ? 'crowned' : ''}`}>
              <span className="mini-number">{i + 1}</span> {t}
              <button
                className={`crown-btn ${active ? 'on pop' : ''}`}
                onClick={() => setOn(active ? on.filter((x) => x !== i) : [...on, i])}
                aria-pressed={active}
                aria-label={`Corona del tema ${i + 1}`}
              >
                <CrownIcon size={18} />
              </button>
            </div>
          )
        })}
      </div>
      <p className="demo-caption">
        {on.length === 0
          ? 'Cap corona: el Repàs diari agafa preguntes de tots els temes.'
          : `El Repàs diari només farà servir ${on.length === 1 ? 'el tema' : 'els temes'} ${on
              .slice()
              .sort()
              .map((i) => i + 1)
              .join(' i ')}.`}
      </p>
    </div>
  )
}

// ---------- 5. Mascotes i galeta ----------

export function DemoMascots({ stage, onDone }: DemoProps) {
  const today = mascotFor()
  const [picked, setPicked] = useState<string | null>(null)
  const [treat, setTreat] = useState(false)
  return (
    <div className="demo demo-mascots">
      <ul className="week-mascots">
        {MASCOTS.map((m) => (
          <li key={m.id} className={`${m.id === today.id ? 'today' : ''} ${picked === m.id ? 'picked' : ''}`}>
            <button
              className={stage === 1 && m.id === today.id ? 'pulse-target' : ''}
              onClick={() => {
                setPicked(m.id)
                if (stage === 1 && m.id === today.id) onDone()
              }}
            >
              <img src={mascotFace(m, picked === m.id ? 'content' : 'content')} alt="" width={46} height={46} />
              <strong>{m.name}</strong>
              <small>{m.id === today.id ? 'Avui' : m.short}</small>
            </button>
          </li>
        ))}
      </ul>
      {picked && <p className="demo-caption">{MASCOTS.find((m) => m.id === picked)!.description}. Surt els {MASCOTS.find((m) => m.id === picked)!.day.toLowerCase()}.</p>}
      {stage === 2 && (
        <button className="primary-btn small-btn pulse-target" onClick={() => setTreat(true)}>
          Acabar el Repàs diari de prova
        </button>
      )}
      {treat && (
        <TreatModal
          mascot={today}
          days={0}
          onClose={() => {
            setTreat(false)
            onDone()
          }}
        />
      )}
    </div>
  )
}

// ---------- 6. Els modes ----------

const MODES = [
  { id: 'total', icon: <RepeatIcon size={22} />, name: 'Repàs total', text: '5 preguntes de cada tema, barrejades. Ideal abans d’un examen.' },
  { id: 'errors', icon: <AlertIcon size={22} />, name: 'Errors', text: 'Les preguntes que vas fallar l’última vegada. Quan les encertes, desapareixen.' },
  { id: 'trivial', icon: <GamepadIcon size={22} />, name: 'Trivial', text: 'Un joc per temes: omple la petjada encertant 2 preguntes de cada subtema.' },
  { id: 'extra', icon: <BoltIcon size={22} />, name: 'Extra difícil', text: '15 preguntes de casos pràctics i trampes. Per quan ja domines el temari.' },
]

export function DemoModes({ stage, onDone }: DemoProps) {
  const [seen, setSeen] = useState<string[]>([])
  const [current, setCurrent] = useState<string | null>(null)
  useEffect(() => {
    if (stage === 1 && seen.length === MODES.length) onDone()
  }, [stage, seen, onDone])
  const mode = MODES.find((m) => m.id === current)
  return (
    <div className="demo demo-modes">
      <div className="mode-row">
        {MODES.map((m) => (
          <button
            key={m.id}
            className={`mode-tile ${m.id === 'extra' ? 'extra' : ''} ${seen.includes(m.id) ? 'seen' : stage === 1 ? 'pulse-target' : ''}`}
            onClick={() => {
              setCurrent(m.id)
              if (!seen.includes(m.id)) setSeen([...seen, m.id])
            }}
          >
            {m.icon}
            <span className="mode-title">{m.name}</span>
          </button>
        ))}
      </div>
      {mode && (
        <p key={mode.id} className="demo-caption pop-in">
          <strong>{mode.name}:</strong> {mode.text}
        </p>
      )}
    </div>
  )
}

// ---------- 7. Trivial ----------

export function DemoTrivial({ stage, onDone }: DemoProps) {
  const subs = Array.from({ length: 7 }, (_, i) => ({ id: `d${i}`, number: `1.${i + 1}` }))
  const [hits, setHits] = useState<Record<string, number>>({})
  const [turn, setTurn] = useState(0)
  const [flash, setFlash] = useState<'ok' | 'ko' | null>(null)
  const pending = subs.filter((s) => (hits[s.id] ?? 0) < 2)
  const current = pending.length ? pending[turn % pending.length] : null
  const completed = subs.length - pending.length

  useEffect(() => {
    if (stage === 1 && completed >= 1) onDone()
    if (stage === 2 && subs.slice(0, 5).every((s) => (hits[s.id] ?? 0) >= 2)) onDone()
  }, [stage, completed, hits, subs, onDone])

  function answer(ok: boolean) {
    if (!current) return
    setFlash(ok ? 'ok' : 'ko')
    setTimeout(() => setFlash(null), 400)
    if (ok) setHits({ ...hits, [current.id]: (hits[current.id] ?? 0) + 1 })
    setTurn(turn + 1)
  }

  return (
    <div className={`demo demo-trivial ${flash ?? ''}`}>
      <PawTrail subtopics={subs} hits={hits} needed={2} current={current?.id} />
      <p className="demo-caption">
        {current ? (
          <>
            Pregunta del subtema <strong>{current.number}</strong>. Has encertat?
          </>
        ) : (
          'Petjades plenes! Partida guanyada.'
        )}
      </p>
      {current && (
        <div className="demo-nav">
          <button className="secondary-btn small-btn" onClick={() => answer(false)}>
            ✗ He fallat
          </button>
          <button className="primary-btn small-btn" onClick={() => answer(true)}>
            ✓ He encertat
          </button>
        </div>
      )}
    </div>
  )
}

// ---------- 8. Avisos ----------

export function DemoReminder({ stage, onDone }: DemoProps) {
  const m = mascotFor()
  const [shown, setShown] = useState<'content' | 'trist' | null>(null)
  // En passar a l'etapa següent, l'avís anterior desapareix.
  const [prevStage, setPrevStage] = useState(stage)
  if (prevStage !== stage) {
    setPrevStage(stage)
    setShown(null)
  }
  const time = stage >= 2 ? '22:00' : '20:00'
  return (
    <div className="demo phone lock">
      <div className="phone-screen lockscreen">
        <p className="lock-time">{shown ? time : stage >= 2 ? '21:59' : '19:59'}</p>
        {shown && (
          <button key={shown} className="notif" onClick={onDone}>
            <img src={mascotFace(m, shown)} alt="" width={40} height={40} />
            <span>
              <strong>{shown === 'content' ? 'Hora del Repàs diari!' : 'Encara no has fet el repàs d’avui'}</strong>
              <small>
                {shown === 'content'
                  ? `En ${m.name} et fa companyia: 10 preguntes i llestos.`
                  : `En ${m.name} està trist… Només són 10 preguntes.`}
              </small>
            </span>
          </button>
        )}
        {!shown && stage >= 1 && (
          <button className="primary-btn small-btn pulse-target" onClick={() => setShown(stage >= 2 ? 'trist' : 'content')}>
            {stage >= 2 ? 'Fer passar dues hores' : 'Fer passar un minut'}
          </button>
        )}
        {shown && <p className="lock-hint">Toca l’avís</p>}
      </div>
    </div>
  )
}

// ---------- 9. Ordinador ↔ mòbil ----------

export function DemoSync({ stage, onDone }: DemoProps) {
  const [step, setStep] = useState(0) // 0 inici, 1 fitxer en camí, 2 fitxer arribat
  const forward = stage <= 1 // preguntes: ordinador → mòbil; progrés: mòbil → ordinador
  const startLabel = forward ? 'Exportar preguntes al mòbil' : 'Exportar progrés'
  const endLabel = forward ? 'Importar actualització' : 'Importar progrés del mòbil'

  function start() {
    setStep(1)
    setTimeout(() => setStep(2), 1200)
  }
  function finish() {
    setStep(3)
    onDone()
  }
  // En canviar d'etapa, tornar a començar l'animació.
  const [prevStage, setPrevStage] = useState(stage)
  if (prevStage !== stage) {
    setPrevStage(stage)
    setStep(0)
  }

  const pcButton = forward ? (step === 0 ? start : undefined) : step === 2 ? finish : undefined
  const phoneButton = forward ? (step === 2 ? finish : undefined) : step === 0 ? start : undefined
  return (
    <div className={`demo demo-sync ${forward ? 'fwd' : 'back'} s${step}`}>
      <div className="sync-device">
        <span className="device-icon">💻</span>
        <strong>Ordinador</strong>
        <button className={`small-btn ${pcButton ? 'primary-btn pulse-target' : 'secondary-btn'}`} disabled={!pcButton} onClick={pcButton}>
          {forward ? startLabel : endLabel}
        </button>
      </div>
      <div className="sync-path" aria-hidden="true">
        <span className="sync-file">📄</span>
        <small>WhatsApp, correu o cable</small>
      </div>
      <div className="sync-device">
        <span className="device-icon">📱</span>
        <strong>Mòbil</strong>
        <button className={`small-btn ${phoneButton ? 'primary-btn pulse-target' : 'secondary-btn'}`} disabled={!phoneButton} onClick={phoneButton}>
          {forward ? endLabel : startLabel}
        </button>
      </div>
      {step === 3 && <p className="demo-caption pop-in">{forward ? 'Preguntes noves al mòbil. El teu progrés no s’ha tocat.' : 'L’ordinador ja sap què has estudiat al mòbil.'}</p>}
    </div>
  )
}
