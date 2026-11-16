import { useEffect, useId, useRef } from 'react'

// Petjada de gos que s'omple com un got: el nivell puja amb cada encert.
// `frac` va de 0 (buida) a 1 (plena). `mood` decideix l'animació puntual:
//  - 'hit': salt petit · 'miss': tremolor · 'complete': salt gran i ona · 'won': celebració.
// `bump` és un comptador: cada vegada que canvia, es torna a reproduir l'animació.

export type PawMood = 'idle' | 'hit' | 'miss' | 'complete' | 'won'

const PAW_SHAPES = (
  <>
    <ellipse cx="27" cy="50" rx="11" ry="14" transform="rotate(-18 27 50)" />
    <ellipse cx="47" cy="27" rx="11" ry="15" transform="rotate(-6 47 27)" />
    <ellipse cx="73" cy="27" rx="11" ry="15" transform="rotate(6 73 27)" />
    <ellipse cx="93" cy="50" rx="11" ry="14" transform="rotate(18 93 50)" />
    <path d="M60 55c13 0 29 18 29 31 0 10-7 15-15 15-6 0-9-3-14-3s-8 3-14 3c-8 0-15-5-15-15 0-13 16-31 29-31z" />
  </>
)

// Animacions amb la Web Animations API: es poden repetir sense desmuntar l'SVG,
// així el nivell del líquid continua pujant suaument.
const MOTIONS: Record<PawMood, Keyframe[] | null> = {
  idle: null,
  hit: [{ transform: 'scale(1)' }, { transform: 'scale(1.08) translateY(-6px)' }, { transform: 'scale(1)' }],
  miss: [
    { transform: 'translateX(0) rotate(0)' },
    { transform: 'translateX(-7px) rotate(-5deg)' },
    { transform: 'translateX(6px) rotate(4deg)' },
    { transform: 'translateX(-3px) rotate(-2deg)' },
    { transform: 'translateX(0) rotate(0)' },
  ],
  complete: [
    { transform: 'scale(1) rotate(0)' },
    { transform: 'scale(1.18) rotate(-8deg)' },
    { transform: 'scale(0.96) rotate(4deg)' },
    { transform: 'scale(1) rotate(0)' },
  ],
  won: [
    { transform: 'scale(0.6) rotate(-20deg)', opacity: 0.4 },
    { transform: 'scale(1.15) rotate(6deg)', opacity: 1 },
    { transform: 'scale(1) rotate(0)', opacity: 1 },
  ],
}

export function PawMeter({ frac, mood = 'idle', bump = 0, size = 150 }: { frac: number; mood?: PawMood; bump?: number; size?: number }) {
  const id = useId().replace(/:/g, '')
  const ref = useRef<HTMLDivElement>(null)
  const level = 108 - Math.max(0, Math.min(1, frac)) * 100 // 108 = buida, 8 = plena

  useEffect(() => {
    const frames = MOTIONS[mood]
    if (!frames || !ref.current || bump === 0) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    ref.current.animate(frames, { duration: mood === 'won' ? 900 : mood === 'complete' ? 700 : 420, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' })
  }, [bump, mood])

  return (
    <div className="paw-meter" style={{ width: size, height: size }}>
      {(mood === 'complete' || mood === 'won') && <span key={bump} className="paw-wave" aria-hidden="true" />}
      <div ref={ref} className="paw-body">
        <svg viewBox="0 0 120 120" role="img" aria-label={`Petjada plena al ${Math.round(frac * 100)}%`}>
          <defs>
            <clipPath id={`paw-${id}`}>{PAW_SHAPES}</clipPath>
          </defs>
          <g className="paw-base">{PAW_SHAPES}</g>
          <g clipPath={`url(#paw-${id})`}>
            <g className="paw-level" style={{ transform: `translateY(${level}px)` }}>
              {/* Dues ones que es desplacen en sentits diferents: sensació de líquid. */}
              <path className="paw-liquid back" d="M-120 4 Q-90 -5 -60 4 T0 4 T60 4 T120 4 T180 4 T240 4 V140 H-120 Z" />
              <path className="paw-liquid front" d="M-120 7 Q-90 0 -60 7 T0 7 T60 7 T120 7 T180 7 T240 7 V140 H-120 Z" />
            </g>
          </g>
          <g className="paw-outline">{PAW_SHAPES}</g>
        </svg>
      </div>
    </div>
  )
}
