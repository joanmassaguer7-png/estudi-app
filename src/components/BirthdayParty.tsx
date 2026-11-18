import { useMemo } from 'react'
import { MASCOTS, mascotFace } from '../data/mascots'
import { Guada } from './Guada'
import { PawIcon } from './icons'

const COLORS = ['#f2a33a', '#e2654f', '#2e9d63', '#3a8fd9', '#c25ec9', '#f2d03a', '#1f6b5c', '#ff8fb3']

/** Pseudoaleatori amb llavor, perquè el confeti no canviï a cada render. */
function rand(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

/**
 * Festa d'aniversari: la Guada i totes les mascotes feliciten la persona,
 * amb confeti i petjades de colors per tota la pantalla.
 */
export function BirthdayParty({ name, onClose }: { name: string; onClose: () => void }) {
  const { confetti, paws } = useMemo(() => {
    const r = rand(20261117)
    return {
      confetti: Array.from({ length: 90 }, (_, i) => ({
        id: i,
        left: r() * 100,
        delay: r() * 4,
        dur: 3.2 + r() * 3,
        color: COLORS[i % COLORS.length],
        w: 6 + r() * 6,
        h: 8 + r() * 10,
        drift: (r() - 0.5) * 120,
        spin: 360 + r() * 720,
        round: r() < 0.25,
      })),
      // Les petjades van pels marges (dalt, baix i costats), on la targeta no les tapa.
      paws: Array.from({ length: 30 }, (_, i) => {
        const zone = i % 4
        const [left, top] =
          zone === 0 ? [2 + r() * 90, 1 + r() * 14]
          : zone === 1 ? [2 + r() * 90, 83 + r() * 13]
          : zone === 2 ? [r() * 5, 18 + r() * 62]
          : [88 + r() * 6, 18 + r() * 62]
        return {
        id: i,
        left,
        top,
        size: 22 + r() * 26,
        rot: (r() - 0.5) * 80,
        delay: 0.3 + i * 0.12 + r() * 0.3,
        color: COLORS[(i * 3) % COLORS.length],
        }
      }),
    }
  }, [])

  return (
    <div className="party" role="dialog" aria-modal="true" aria-labelledby="party-title">
      <div className="party-paws" aria-hidden="true">
        {paws.map((p) => (
          <span
            key={p.id}
            className="party-paw"
            style={{ left: `${p.left}%`, top: `${p.top}%`, color: p.color, animationDelay: `${p.delay}s`, ['--rot' as string]: `${p.rot}deg` }}
          >
            <PawIcon size={p.size} />
          </span>
        ))}
      </div>
      <div className="party-confetti" aria-hidden="true">
        {confetti.map((c) => (
          <i
            key={c.id}
            style={{
              left: `${c.left}%`,
              width: c.round ? c.w : c.w,
              height: c.round ? c.w : c.h,
              borderRadius: c.round ? '50%' : 2,
              background: c.color,
              animationDelay: `${c.delay}s`,
              animationDuration: `${c.dur}s`,
              ['--drift' as string]: `${c.drift}px`,
              ['--spin' as string]: `${c.spin}deg`,
            }}
          />
        ))}
      </div>

      <div className="party-card">
        <div className="party-guada">
          <span className="party-hat big" aria-hidden="true" />
          <Guada mood="content" size={140} />
        </div>
        <h2 id="party-title">Per molts anys, {name || 'amiga'}!</h2>
        <p>Avui tota la clínica ha vingut a felicitar-te.</p>
        <ul className="party-mascots">
          {MASCOTS.map((m, i) => (
            <li key={m.id} style={{ animationDelay: `${0.4 + i * 0.12}s` }}>
              <span className="party-hat" aria-hidden="true" style={{ background: COLORS[i % COLORS.length] }} />
              <img src={mascotFace(m, 'content')} alt="" width={52} height={52} />
              <small>{m.name}</small>
            </li>
          ))}
        </ul>
        <button className="primary-btn" onClick={onClose} autoFocus>
          Gràcies a tots!
        </button>
      </div>
    </div>
  )
}
