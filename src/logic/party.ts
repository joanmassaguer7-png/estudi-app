import { MASCOTS, mascotFor, type Mascot } from '../data/mascots'

/** Qui ve a felicitar: aprovat → dues mascotes (la d'avui i la de demà); més d'un 8,5 → totes. */
export function examPartyMascots(pct: number, today = new Date()): Mascot[] {
  if (pct > 0.85) return MASCOTS
  const m = mascotFor(today)
  const i = MASCOTS.indexOf(m)
  return [m, MASCOTS[(i + 1) % MASCOTS.length]]
}
