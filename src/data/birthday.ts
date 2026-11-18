import { db, getSetting, setSetting } from './db'
import { PROFILE_KEY } from './hooks'

/** Només dia i mes: no cal l'any (ni es demana). */
export interface Birthday {
  day: number
  month: number // 1–12
}

export const MONTHS = ['gener', 'febrer', 'març', 'abril', 'maig', 'juny', 'juliol', 'agost', 'setembre', 'octubre', 'novembre', 'desembre']
export const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

/** Clau on es guarda l'any en què ja s'ha vist la festa (perquè surti un sol cop per aniversari). */
export const BIRTHDAY_SEEN_KEY = 'aniversari-vist'

const isLeap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0

/** És l'aniversari avui? Qui va néixer el 29 de febrer el celebra el 28 els anys que no són de traspàs. */
export function isBirthday(b: Birthday | null | undefined, date = new Date()): boolean {
  if (!b) return false
  const d = date.getDate()
  const m = date.getMonth() + 1
  if (b.month === 2 && b.day === 29 && !isLeap(date.getFullYear())) return m === 2 && d === 28
  return b.day === d && b.month === m
}

export function formatBirthday(b: Birthday): string {
  const mes = MONTHS[b.month - 1]
  return `${b.day} ${/^[aeiouà]/.test(mes) ? 'd’' : 'de '}${mes}`
}

export function validBirthday(b: Partial<Birthday> | null | undefined): b is Birthday {
  return !!b && !!b.day && !!b.month && b.month >= 1 && b.month <= 12 && b.day >= 1 && b.day <= DAYS_IN_MONTH[b.month - 1]
}

/** Desa canvis al perfil sense esborrar la resta de camps (nom, aniversari…). */
export async function saveProfile(patch: { name?: string; birthday?: Birthday | null }) {
  await db.transaction('rw', db.settings, async () => {
    const current = await getSetting<Record<string, unknown>>(PROFILE_KEY, {})
    const next: Record<string, unknown> = { ...current, ...patch }
    if (patch.birthday === null) delete next.birthday
    await setSetting(PROFILE_KEY, next)
  })
}
