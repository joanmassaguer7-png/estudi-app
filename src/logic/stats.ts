import type { Attempt, Question, TestSession } from '../data/types'
import { dayKey } from './daily'
import { statsByQuestion } from './select'

export interface Overview {
  answered: number
  correct: number
  /** 0–1, o null si encara no hi ha cap resposta. */
  rate: number | null
  daysStudied: number
  currentStreak: number
  bestStreak: number
  tests: number
}

const prevDay = (k: string) => {
  const [y, m, d] = k.split('-').map(Number)
  return dayKey(new Date(y, m - 1, d - 1))
}

/** Ratxes de dies seguits amb algun test (de qualsevol mode). */
export function studyStreaks(sessions: TestSession[], now = new Date()): { current: number; best: number; days: Set<string> } {
  const days = new Set(sessions.map((s) => dayKey(new Date(s.finishedAt))))
  let best = 0
  for (const d of days) {
    if (days.has(prevDay(d))) continue // no és l'inici d'una ratxa
    let len = 0
    let k = d
    while (days.has(k)) {
      len++
      const [y, m, dd] = k.split('-').map(Number)
      k = dayKey(new Date(y, m - 1, dd + 1))
    }
    best = Math.max(best, len)
  }
  let cursor = dayKey(now)
  if (!days.has(cursor)) cursor = prevDay(cursor)
  let current = 0
  while (days.has(cursor)) {
    current++
    cursor = prevDay(cursor)
  }
  return { current, best, days }
}

export function overview(attempts: Attempt[], sessions: TestSession[], now = new Date()): Overview {
  const answered = attempts.filter((a) => a.chosenIndex !== null)
  const correct = answered.filter((a) => a.correct).length
  const st = studyStreaks(sessions, now)
  return {
    answered: answered.length,
    correct,
    rate: answered.length ? correct / answered.length : null,
    daysStudied: st.days.size,
    currentStreak: st.current,
    bestStreak: st.best,
    tests: sessions.length,
  }
}

export interface ScorePoint {
  id: string
  title: string
  date: string
  pct: number
  correct: number
  total: number
}

/** Les últimes n puntuacions, de la més antiga a la més recent. */
export function scoreHistory(sessions: TestSession[], n = 15): ScorePoint[] {
  return [...sessions]
    .sort((a, b) => a.finishedAt.localeCompare(b.finishedAt))
    .slice(-n)
    .map((s) => ({ id: s.id, title: s.title, date: s.finishedAt, pct: s.total ? s.correctCount / s.total : 0, correct: s.correctCount, total: s.total }))
}

export interface HeatDay {
  key: string
  date: Date
  count: number
  future: boolean
}

/** Setmanes (de dilluns a diumenge) amb el nombre de preguntes respostes cada dia. */
export function activityWeeks(attempts: Attempt[], weeks = 12, now = new Date()): HeatDay[][] {
  const counts = new Map<string, number>()
  for (const a of attempts) {
    const k = dayKey(new Date(a.date))
    counts.set(k, (counts.get(k) ?? 0) + 1)
  }
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekday = (today.getDay() + 6) % 7 // 0 = dilluns
  const start = new Date(today)
  start.setDate(today.getDate() - weekday - (weeks - 1) * 7)
  const out: HeatDay[][] = []
  for (let w = 0; w < weeks; w++) {
    const col: HeatDay[] = []
    for (let d = 0; d < 7; d++) {
      const date = new Date(start)
      date.setDate(start.getDate() + w * 7 + d)
      const key = dayKey(date)
      col.push({ key, date, count: counts.get(key) ?? 0, future: date > today })
    }
    out.push(col)
  }
  return out
}

/** Nivell 0–4 per pintar el mapa d'activitat. */
export function heatLevel(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count === 0) return 0
  if (count < 10) return 1
  if (count < 20) return 2
  if (count < 40) return 3
  return 4
}

export interface WeakQuestion {
  question: Question
  wrong: number
  total: number
  lastCorrect: boolean | null
}

/** Preguntes més fallades (com a mínim una fallada), primer les que encara no s'han corregit. */
export function weakQuestions(questions: Question[], attempts: Attempt[], n = 5): WeakQuestion[] {
  const stats = statsByQuestion(attempts)
  return questions
    .map((q) => {
      const s = stats.get(q.id)
      return s ? { question: q, wrong: s.wrong, total: s.seen, lastCorrect: s.lastCorrect } : null
    })
    .filter((x): x is WeakQuestion => !!x && x.wrong > 0)
    .sort((a, b) => Number(a.lastCorrect) - Number(b.lastCorrect) || b.wrong - a.wrong || b.wrong / b.total - a.wrong / a.total)
    .slice(0, n)
}
