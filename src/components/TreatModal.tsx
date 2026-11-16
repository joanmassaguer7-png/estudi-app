import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { type Mascot, mascotFace } from '../data/mascots'
import { Modal } from './ui'
import { useAppSettings } from '../data/hooks'

/**
 * «Ja has fet el repàs d'avui!»: la mascota del dia espera el seu premi.
 * La galeta (un os per als gossos, un peixet per als gats) s'arrossega fins a la cara
 * de la mascota. Si es deixa anar lluny, torna al seu lloc. Amb el teclat, Enter la dona.
 */
export function TreatModal({ mascot, days, onClose }: { mascot: Mascot; days: number; onClose: () => void }) {
  const faceRef = useRef<HTMLImageElement>(null)
  const biscuitRef = useRef<HTMLButtonElement>(null)
  const start = useRef<{ x: number; y: number } | null>(null)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const [eating, setEating] = useState(false)
  const [nudge, setNudge] = useState(0)
  const name = useAppSettings()?.name

  function centerOf(el: Element) {
    const r = el.getBoundingClientRect()
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
  }

  /** Porta la galeta fins a la boca i tanca després de l'animació. */
  function feed() {
    if (eating || !faceRef.current || !biscuitRef.current) return
    const face = centerOf(faceRef.current)
    const biscuit = centerOf(biscuitRef.current)
    // La posició actual ja inclou el desplaçament; hi sumem el que falta fins a la boca.
    setOffset((o) => ({ x: o.x + face.x - biscuit.x, y: o.y + face.y - biscuit.y + 20 }))
    setDragging(false)
    setEating(true)
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.setTimeout(onClose, reduce ? 400 : 1700)
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
    const face = faceRef.current?.getBoundingClientRect()
    const biscuit = biscuitRef.current ? centerOf(biscuitRef.current) : null
    const margin = 30
    const onFace =
      face &&
      biscuit &&
      biscuit.x > face.left - margin &&
      biscuit.x < face.right + margin &&
      biscuit.y > face.top - margin &&
      biscuit.y < face.bottom + margin
    if (onFace) return feed()
    // Massa lluny: la galeta torna al seu lloc i la mascota la reclama.
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
    <Modal onClose={onClose}>
      <div className={`treat ${eating ? 'eating' : ''}`}>
        <div className="treat-stage">
          <img
            key={nudge}
            ref={faceRef}
            className={`treat-face ${nudge > 0 && !eating ? 'asking' : ''}`}
            src={mascotFace(mascot, 'content')}
            alt={mascot.name}
            width={136}
            height={136}
          />
          {eating && (
            <span className="treat-hearts" aria-hidden="true">
              <span>♥</span>
              <span>♥</span>
              <span>♥</span>
            </span>
          )}
        </div>
        <h3>{name ? `Molt bé, ${name}!` : 'Molt bé!'} Ja has fet el repàs d’avui!</h3>
        <p>
          {eating ? `En ${mascot.name} està molt content. Fins demà!` : `Dona un premi a en ${mascot.name}.`}
          {!eating && days > 1 && <span className="treat-streak"> Portes {days} dies seguits.</span>}
        </p>
        <p className="treat-hint" aria-hidden={eating}>
          {eating ? ' ' : 'Arrossega la galeta fins a la seva cara.'}
        </p>
        <button
          ref={biscuitRef}
          className={`treat-btn ${mascot.species} ${dragging ? 'dragging' : ''}`}
          style={{ transform: `translate(${offset.x}px, ${offset.y}px)${eating ? ' scale(0.25) rotate(-25deg)' : ''}` }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onKeyDown={onKeyDown}
          aria-label={`Donar la galeta a en ${mascot.name} i tancar`}
        >
          {mascot.species === 'gos' ? <BoneBiscuit /> : <FishBiscuit />}
        </button>
      </div>
    </Modal>
  )
}

/** Galeta en forma d'os, per als gossos. */
function BoneBiscuit() {
  return (
    <svg className="biscuit" viewBox="0 0 240 90" aria-hidden="true">
      <path
        d="M44 18a20 20 0 0 1 34 10h84a20 20 0 1 1 34 17 20 20 0 1 1-34 17H78a20 20 0 1 1-34-17 20 20 0 0 1 0-27z"
        fill="#d9a066"
        stroke="#a8713c"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <g fill="#b9814a">
        <circle cx="96" cy="38" r="3" />
        <circle cx="118" cy="52" r="3" />
        <circle cx="140" cy="36" r="3" />
        <circle cx="152" cy="54" r="3" />
        <circle cx="84" cy="56" r="3" />
      </g>
    </svg>
  )
}

/** Galeta en forma de peixet, per als gats. */
function FishBiscuit() {
  return (
    <svg className="biscuit" viewBox="0 0 240 90" aria-hidden="true">
      <path
        d="M30 45c20-30 110-36 160 0 0 0 18-22 34-26-6 16-6 36 0 52-16-4-34-26-34-26-50 36-140 30-160 0z"
        fill="#e7a35c"
        stroke="#b5722f"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <circle cx="62" cy="40" r="6" fill="#5a3315" />
      <path d="M100 26q10 19 0 38M124 26q10 19 0 38M176 32q8 13 0 26" fill="none" stroke="#c98843" strokeWidth="4" strokeLinecap="round" />
    </svg>
  )
}
