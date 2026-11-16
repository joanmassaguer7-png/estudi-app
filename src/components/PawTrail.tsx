import { useEffect, useId, useRef } from 'react'
import type { PawMood } from './PawMeter'

// Rastre de petjades del Trivial.
// Cada subtema és una part d'una petjada: primer els quatre dits i després el coixinet.
// Si hi ha més de 5 subtemes, s'hi afegeixen més petjades, com un gos que camina.
// Cada part s'omple a mitges amb el primer encert i del tot amb el segon.

export interface TrailSubtopic {
  id: string
  number: string
}

interface Part {
  shape: React.ReactElement
  top: number
  bottom: number
  label: [number, number]
  pad?: boolean
}

// Ordre d'ompliment: coixinet, dits centrals i dits exteriors.
// Així, amb pocs subtemes, la petjada ja es reconeix.
const PARTS: Part[] = [
  {
    shape: <path d="M60 55c13 0 29 18 29 31 0 10-7 15-15 15-6 0-9-3-14-3s-8 3-14 3c-8 0-15-5-15-15 0-13 16-31 29-31z" />,
    top: 55,
    bottom: 101,
    label: [60, 85],
    pad: true,
  },
  { shape: <ellipse cx="47" cy="27" rx="11" ry="15" transform="rotate(-6 47 27)" />, top: 12, bottom: 42, label: [47, 30] },
  { shape: <ellipse cx="73" cy="27" rx="11" ry="15" transform="rotate(6 73 27)" />, top: 12, bottom: 42, label: [73, 30] },
  { shape: <ellipse cx="27" cy="50" rx="11" ry="14" transform="rotate(-18 27 50)" />, top: 36, bottom: 64, label: [27, 53] },
  { shape: <ellipse cx="93" cy="50" rx="11" ry="14" transform="rotate(18 93 50)" />, top: 36, bottom: 64, label: [93, 53] },
]
const PER_PAW = PARTS.length

const MOTIONS: Partial<Record<PawMood, Keyframe[]>> = {
  hit: [{ transform: 'scale(1)' }, { transform: 'scale(1.07) translateY(-5px)' }, { transform: 'scale(1)' }],
  miss: [
    { transform: 'translateX(0) rotate(0)' },
    { transform: 'translateX(-6px) rotate(-4deg)' },
    { transform: 'translateX(5px) rotate(3deg)' },
    { transform: 'translateX(0) rotate(0)' },
  ],
  complete: [
    { transform: 'scale(1) rotate(0)' },
    { transform: 'scale(1.15) rotate(-6deg)' },
    { transform: 'scale(0.97) rotate(3deg)' },
    { transform: 'scale(1) rotate(0)' },
  ],
}

export function PawTrail({
  subtopics,
  hits,
  needed,
  current,
  mood = 'idle',
  bump = 0,
  greyed = false,
}: {
  subtopics: TrailSubtopic[]
  hits: Record<string, number>
  needed: number
  current?: string | null
  mood?: PawMood
  bump?: number
  greyed?: boolean
}) {
  const pawCount = Math.max(1, Math.ceil(subtopics.length / PER_PAW))
  const size = pawCount === 1 ? 168 : pawCount === 2 ? 128 : 100
  const activePaw = current ? Math.floor(subtopics.findIndex((s) => s.id === current) / PER_PAW) : -1

  return (
    <div className={`paw-trail ${greyed ? 'greyed' : ''}`}>
      {Array.from({ length: pawCount }, (_, p) => (
        <Paw
          key={p}
          index={p}
          size={size}
          subs={subtopics.slice(p * PER_PAW, p * PER_PAW + PER_PAW)}
          hits={hits}
          needed={needed}
          current={current}
          mood={p === activePaw ? mood : 'idle'}
          bump={p === activePaw ? bump : 0}
        />
      ))}
    </div>
  )
}

function Paw({
  index,
  size,
  subs,
  hits,
  needed,
  current,
  mood,
  bump,
}: {
  index: number
  size: number
  subs: TrailSubtopic[]
  hits: Record<string, number>
  needed: number
  current?: string | null
  mood: PawMood
  bump: number
}) {
  const uid = useId().replace(/:/g, '')
  const ref = useRef<HTMLDivElement>(null)
  const complete = subs.length > 0 && subs.every((s) => (hits[s.id] ?? 0) >= needed)

  useEffect(() => {
    const frames = MOTIONS[mood]
    if (!frames || !ref.current || bump === 0) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    ref.current.animate(frames, { duration: mood === 'complete' ? 700 : 420, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' })
  }, [bump, mood])

  // Les petjades alternen amunt i avall i giren una mica, com un rastre de veritat.
  const tilt = index % 2 === 0 ? -8 : 8
  return (
    <div className={`trail-paw ${index % 2 ? 'low' : 'high'} ${complete ? 'complete' : ''}`} style={{ width: size, height: size }}>
      {mood === 'complete' && bump > 0 && <span key={bump} className="paw-wave" aria-hidden="true" />}
      <div ref={ref} className="paw-body" style={{ rotate: `${tilt}deg` }}>
        <svg viewBox="0 0 120 120" role="img" aria-label={describe(subs, hits, needed)}>
          {PARTS.map((part, i) => {
            const sub = subs[i]
            if (!sub) {
              // Part sense subtema assignat: es dibuixa apagada.
              return (
                <g key={i} className="paw-part unused">
                  {part.shape}
                </g>
              )
            }
            const h = Math.min(needed, hits[sub.id] ?? 0)
            const frac = h / needed
            const level = part.bottom + 2 - frac * (part.bottom - part.top + 8)
            const done = h >= needed
            return (
              <g key={i} className={`paw-part ${part.pad ? 'pad' : ''} ${done ? 'done' : ''} ${current === sub.id ? 'current' : ''}`}>
                <clipPath id={`${uid}-${i}`}>{part.shape}</clipPath>
                <g className="paw-base">{part.shape}</g>
                <g clipPath={`url(#${uid}-${i})`}>
                  <g className="paw-level" style={{ transform: `translateY(${level}px)` }}>
                    <path className="paw-liquid back" d="M-120 2 Q-105 -3 -90 2 T-60 2 T-30 2 T0 2 T30 2 T60 2 T90 2 T120 2 T150 2 T180 2 T210 2 T240 2 V140 H-120 Z" />
                    <path className="paw-liquid front" d="M-120 4 Q-105 0 -90 4 T-60 4 T-30 4 T0 4 T30 4 T60 4 T90 4 T120 4 T150 4 T180 4 T210 4 T240 4 V140 H-120 Z" />
                  </g>
                </g>
                <g className="paw-outline">{part.shape}</g>
                <text className="paw-label" x={part.label[0]} y={part.label[1]} textAnchor="middle" dominantBaseline="middle">
                  {sub.number}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}

function describe(subs: TrailSubtopic[], hits: Record<string, number>, needed: number) {
  return subs.map((s) => `Subtema ${s.number}: ${Math.min(needed, hits[s.id] ?? 0)} de ${needed}`).join('. ')
}
