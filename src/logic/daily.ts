// Repàs diari: preparar-lo, saber si ja s'ha fet avui i calcular la ratxa de dies.

import type { CourseData } from '../data/hooks'
import type { TestSession } from '../data/types'
import type { PlannedTest } from '../nav'
import { buildDailyReview, dailyCandidateTopics } from './select'

/** Dia local en format AAAA-MM-DD (no UTC: a les 00:30 d'aquí encara seria «ahir» en UTC). */
export function dayKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function dailyDays(sessions: TestSession[]): Set<string> {
  return new Set(sessions.filter((s) => s.mode === 'repas-diari').map((s) => dayKey(new Date(s.finishedAt))))
}

export function doneToday(sessions: TestSession[], now = new Date()): boolean {
  return dailyDays(sessions).has(dayKey(now))
}

/**
 * Dies seguits fent el Repàs diari. Si avui encara no s'ha fet, la ratxa
 * es compta fins ahir (encara hi ets a temps de mantenir-la).
 */
export function streak(sessions: TestSession[], now = new Date()): number {
  const days = dailyDays(sessions)
  const cursor = new Date(now)
  if (!days.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1)
  let count = 0
  while (days.has(dayKey(cursor))) {
    count++
    cursor.setDate(cursor.getDate() - 1)
  }
  return count
}

/** En quin moment del dia som respecte a l'hora del recordatori. */
export type ReminderPhase = 'abans' | 'hora' | 'tard'
export const LATE_AFTER_MIN = 120

export function reminderPhase(time: string, now = new Date()): ReminderPhase {
  const [h, m] = time.split(':').map(Number)
  const minutesNow = now.getHours() * 60 + now.getMinutes()
  const target = h * 60 + m
  if (minutesNow < target) return 'abans'
  if (minutesNow < target + LATE_AFTER_MIN) return 'hora'
  return 'tard'
}

/** Prepara el test del Repàs diari (null si no hi ha preguntes). */
export function planDaily(data: CourseData): PlannedTest | null {
  const { topics, crowns, questions, attempts, sessions } = data
  const lastDaily = sessions.find((s) => s.mode === 'repas-diari')
  const qs = buildDailyReview(topics, crowns, questions, attempts, lastDaily?.questionIds)
  if (qs.length === 0) return null
  const included = dailyCandidateTopics(topics, crowns)
  return {
    mode: 'repas-diari',
    title: 'Repàs diari',
    description:
      crowns.length > 0
        ? 'Inclou els temes que has marcat amb la corona.'
        : included.length === topics.length
          ? 'No has marcat cap tema amb la corona, així que inclou tots els temes.'
          : 'No has marcat cap tema amb la corona, així que inclou els 10 temes més recents.',
    questions: qs,
  }
}
