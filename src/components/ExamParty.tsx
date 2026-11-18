import { useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { mascotFace, type Mascot } from '../data/mascots'
import { examPartyMascots } from '../logic/party'
import { useAppSettings } from '../data/hooks'
import { Modal } from './ui'

const COLORS = ['#f2a33a', '#e2654f', '#2e9d63', '#3a8fd9', '#c25ec9', '#f2d03a', '#1f6b5c', '#ff8fb3']

const names = (ms: Mascot[]) => (ms.length === 2 ? `en ${ms[0].name} i en ${ms[1].name}` : 'tota la colla')

/**
 * Felicitació per un examen aprovat. Es tanca donant UNA galeta (en forma de petjada)
 * al grup: s'arrossega fins a qualsevol de les mascotes. Amb el teclat, Enter la dona.
 */
export function ExamParty({ pct, scoreText, onClose }: { pct: number; scoreText: string; onClose: () => void }) {
  const mascots = useMemo(() => examPartyMascots(pct), [pct])
  const all = mascots.length > 2
  const name = useAppSettings()?.name
  const groupRef = useRef<HTMLDivElement>(null)
  const biscuitRef = useRef<HTMLButtonElement>(null)
  const start = useRef<{ x: number; y: number } | null>(null)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const [eating, setEating] = useState(false)
  const [nudge, setNudge] = useState(0)

  const confetti = useMemo(
    () =>
      Array.from({ length: all ? 70 : 0 }, (_, i) => ({
        id: i,
        left: (i * 37) % 100,
        delay: ((i * 13) % 40) / 10,
        dur: 3 + ((i * 7) % 30) / 10,
        color: COLORS[i % COLORS.length],
        drift: ((i % 9) - 4) * 25,
        spin: 360 + ((i * 53) % 720),
      })),
    [all],
  )

  const center = (el: Element) => {
    const r = el.getBoundingClientRect()
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
  }

  function feed() {
    if (eating || !groupRef.current || !biscuitRef.current) return
    const g = center(groupRef.current)
    const b = center(biscuitRef.current)
    setOffset((o) => ({ x: o.x + g.x - b.x, y: o.y + g.y - b.y }))
    setDragging(false)
    setEating(true)
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.setTimeout(onClose, reduce ? 500 : 1900)
  }

  function onPointerDown(e: PointerEvent<HTMLButtonElement>) {
    if (eating) return
    e.currentTarget.setPointerCapture(e.pointerId)
    start.current = { x: e.clientX - offset.x, y: e.clientY - offset.y }
    setDragging(true)
  }
  function onPointerMove(e: PointerEvent<HTMLButtonElement>) {
    if (!dragging || !start.current) return
    setOffset({ x: e.clientX - start.current.x, y: e.clientY - start.current.y })
  }
  function onPointerUp() {
    if (!dragging) return
    start.current = null
    const g = groupRef.current?.getBoundingClientRect()
    const b = biscuitRef.current ? center(biscuitRef.current) : null
    const m = 24
    if (g && b && b.x > g.left - m && b.x < g.right + m && b.y > g.top - m && b.y < g.bottom + m) return feed()
    setDragging(false)
    setOffset({ x: 0, y: 0 })
    setNudge((n) => n + 1)
  }
  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      feed()
    }
  }

  return (
    <>
      {all && (
        <div className="party-confetti exam-confetti" aria-hidden="true">
          {confetti.map((c) => (
            <i
              key={c.id}
              style={{
                left: `${c.left}%`,
                width: 8,
                height: 12,
                borderRadius: 2,
                background: c.color,
                animationDelay: `${c.delay}s`,
                animationDuration: `${c.dur}s`,
                ['--drift' as string]: `${c.drift}px`,
                ['--spin' as string]: `${c.spin}deg`,
              }}
            />
          ))}
        </div>
      )}
      <Modal onClose={onClose}>
        <div className={`treat exam-party ${eating ? 'eating' : ''} ${all ? 'all' : 'two'}`}>
          <div key={nudge} ref={groupRef} className={`exam-party-group ${nudge > 0 && !eating ? 'asking' : ''}`}>
            {mascots.map((m, i) => (
              <span key={m.id} className="exam-party-mascot" style={{ animationDelay: `${0.15 + i * 0.1}s` }}>
                <span className="party-hat" aria-hidden="true" style={{ background: COLORS[i % COLORS.length] }} />
                <img src={mascotFace(m, 'content')} alt={m.name} width={all ? 64 : 104} height={all ? 64 : 104} />
                {eating && <span className="exam-party-heart" aria-hidden="true">♥</span>}
              </span>
            ))}
          </div>
          <h3>
            {all
              ? `Quin examen${name ? `, ${name}` : ''}! Un ${scoreText}!`
              : `Has aprovat${name ? `, ${name}` : ''}! Un ${scoreText}!`}
          </h3>
          <p>
            {eating
              ? all
                ? 'Tota la colla està encantada. Moltes felicitats!'
                : 'Estan encantats. Felicitats!'
              : `${names(mascots).replace(/^./, (c) => c.toUpperCase())} ${all ? 'ha vingut' : 'han vingut'} a felicitar-te. Dona’ls una galeta per celebrar-ho.`}
          </p>
          <p className="treat-hint" aria-hidden={eating}>
            {eating ? ' ' : 'Arrossega la galeta fins a les mascotes.'}
          </p>
          <button
            ref={biscuitRef}
            className={`treat-btn paw ${dragging ? 'dragging' : ''}`}
            style={{ transform: `translate(${offset.x}px, ${offset.y}px)${eating ? ' scale(0.25) rotate(-25deg)' : ''}` }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onKeyDown={onKeyDown}
            aria-label="Donar la galeta a les mascotes i tancar"
          >
            <PawBiscuit />
          </button>
        </div>
      </Modal>
    </>
  )
}

/** Galeta en forma de petjada: serveix per a gossos i gats alhora. */
function PawBiscuit() {
  return (
    <svg className="biscuit paw-biscuit" viewBox="0 0 120 110" aria-hidden="true">
      <g fill="#d9a066" stroke="#a8713c" strokeWidth="4">
        <ellipse cx="60" cy="74" rx="30" ry="25" />
        <ellipse cx="24" cy="44" rx="12" ry="15" transform="rotate(-20 24 44)" />
        <ellipse cx="46" cy="22" rx="12" ry="15" transform="rotate(-6 46 22)" />
        <ellipse cx="74" cy="22" rx="12" ry="15" transform="rotate(6 74 22)" />
        <ellipse cx="96" cy="44" rx="12" ry="15" transform="rotate(20 96 44)" />
      </g>
      <g fill="#b9814a">
        <circle cx="50" cy="70" r="3" />
        <circle cx="68" cy="80" r="3" />
        <circle cx="62" cy="64" r="3" />
      </g>
    </svg>
  )
}
