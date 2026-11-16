// Lògica de selecció de preguntes per a cada mode d'estudi.
// Són funcions "pures": reben dades i retornen un resultat, sense tocar la base
// de dades ni la pantalla. Així es poden provar fàcilment.

import type { Attempt, Question, Topic } from '../data/types'

export type Rng = () => number

export interface QuestionStats {
  seen: number
  correct: number
  wrong: number
  lastCorrect: boolean | null
  lastDate: string | null
}

export const DAILY_SIZE = 10
export const MAX_CROWNS = 10
export const TOTAL_PER_TOPIC = 5
export const TOPIC_TEST_SIZE = 10
export const ERRORS_TEST_MAX = 20

export function shuffle<T>(items: T[], rng: Rng = Math.random): T[] {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Estadístiques per pregunta a partir de l'historial d'intents. */
export function statsByQuestion(attempts: Attempt[]): Map<string, QuestionStats> {
  const map = new Map<string, QuestionStats>()
  const sorted = [...attempts].sort((a, b) => a.date.localeCompare(b.date))
  for (const a of sorted) {
    const s = map.get(a.questionId) ?? { seen: 0, correct: 0, wrong: 0, lastCorrect: null, lastDate: null }
    s.seen++
    if (a.correct) s.correct++
    else s.wrong++
    s.lastCorrect = a.correct
    s.lastDate = a.date
    map.set(a.questionId, s)
  }
  return map
}

/** Percentatge d'error per concepte (0 a 1). Serveix per prioritzar punts febles. */
export function errorRateByConcept(attempts: Attempt[]): Map<string, number> {
  const totals = new Map<string, { n: number; wrong: number }>()
  for (const a of attempts) {
    if (!a.concept) continue
    const t = totals.get(a.concept) ?? { n: 0, wrong: 0 }
    t.n++
    if (!a.correct) t.wrong++
    totals.set(a.concept, t)
  }
  return new Map([...totals].map(([k, t]) => [k, t.wrong / t.n]))
}

/**
 * Tria `n` preguntes d'una llista donant prioritat a errors i conceptes febles,
 * però amb una part aleatòria perquè hi hagi varietat.
 */
export function pickWeighted(
  pool: Question[],
  n: number,
  attempts: Attempt[],
  rng: Rng = Math.random,
  avoidIds: Set<string> = new Set(),
): Question[] {
  const stats = statsByQuestion(attempts)
  const conceptErr = errorRateByConcept(attempts)
  const scored = pool.map((q) => {
    const s = stats.get(q.id)
    let score = rng() * 1.5
    if (!s) score += 1 // mai vista
    else if (s.lastCorrect === false) score += 3 // l'última vegada es va fallar
    if (q.concept) score += (conceptErr.get(q.concept) ?? 0) * 2
    if (avoidIds.has(q.id)) score -= 2.5 // evitar repetir el repàs anterior
    return { q, score }
  })
  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, n).map((x) => x.q)
}

/** Temes que entren al Repàs diari segons les corones. */
export function dailyCandidateTopics(topics: Topic[], crownIds: string[]): Topic[] {
  const selected = topics.filter((t) => crownIds.includes(t.id))
  if (selected.length > 0) return selected // com a màxim 10: ho garanteix la interfície
  // Totes blanques: tots els temes; si n'hi ha més de 10, els 10 més recents.
  const byRecent = [...topics].sort(
    (a, b) => b.createdAt.localeCompare(a.createdAt) || b.order - a.order,
  )
  return byRecent.slice(0, DAILY_SIZE)
}

/**
 * Repàs diari: 10 preguntes, com a mínim una de cada tema inclòs,
 * i la resta repartida entre els temes.
 */
export function buildDailyReview(
  topics: Topic[],
  crownIds: string[],
  questions: Question[],
  attempts: Attempt[],
  previousDailyIds: string[] = [],
  rng: Rng = Math.random,
): Question[] {
  const avoid = new Set(previousDailyIds)
  const included = dailyCandidateTopics(topics, crownIds).filter((t) =>
    questions.some((q) => q.topicId === t.id),
  )
  if (included.length === 0) return []

  const poolByTopic = new Map(included.map((t) => [t.id, questions.filter((q) => q.topicId === t.id)]))
  const slots = new Map(included.map((t) => [t.id, 0]))
  let remaining = Math.min(
    DAILY_SIZE,
    [...poolByTopic.values()].reduce((sum, p) => sum + p.length, 0),
  )

  // 1) Una pregunta per tema.  2) La resta per torns, en ordre aleatori.
  for (const t of included) {
    slots.set(t.id, 1)
    remaining--
  }
  const order = shuffle(included, rng)
  while (remaining > 0) {
    let assigned = false
    for (const t of order) {
      if (remaining === 0) break
      if (slots.get(t.id)! < poolByTopic.get(t.id)!.length) {
        slots.set(t.id, slots.get(t.id)! + 1)
        remaining--
        assigned = true
      }
    }
    if (!assigned) break
  }

  const picked = included.flatMap((t) =>
    pickWeighted(poolByTopic.get(t.id)!, slots.get(t.id)!, attempts, rng, avoid),
  )
  return shuffle(picked, rng)
}

/** Repàs total: 5 preguntes aleatòries de cada tema, tot barrejat. */
export function buildTotalReview(topics: Topic[], questions: Question[], rng: Rng = Math.random): Question[] {
  const picked = topics.flatMap((t) =>
    shuffle(questions.filter((q) => q.topicId === t.id), rng).slice(0, TOTAL_PER_TOPIC),
  )
  return shuffle(picked, rng)
}

/** Test d'errors: preguntes l'últim intent de les quals va ser incorrecte. */
export function buildErrorsTest(questions: Question[], attempts: Attempt[], rng: Rng = Math.random): Question[] {
  const stats = statsByQuestion(attempts)
  const failed = questions.filter((q) => stats.get(q.id)?.lastCorrect === false)
  const prioritized = [...failed].sort((a, b) => stats.get(b.id)!.wrong - stats.get(a.id)!.wrong)
  return shuffle(prioritized.slice(0, ERRORS_TEST_MAX), rng)
}

/** Test d'un tema concret: fins a 10 preguntes, prioritzant punts febles. */
export function buildTopicTest(
  topicId: string,
  questions: Question[],
  attempts: Attempt[],
  rng: Rng = Math.random,
): Question[] {
  const pool = questions.filter((q) => q.topicId === topicId)
  return shuffle(pickWeighted(pool, TOPIC_TEST_SIZE, attempts, rng), rng)
}

/** Grau de domini d'un conjunt de preguntes (0 a 1), segons l'últim intent de cada una. */
export function mastery(questions: Question[], attempts: Attempt[]): { seen: number; mastered: number; total: number } {
  const stats = statsByQuestion(attempts)
  let seen = 0
  let mastered = 0
  for (const q of questions) {
    const s = stats.get(q.id)
    if (s) {
      seen++
      if (s.lastCorrect) mastered++
    }
  }
  return { seen, mastered, total: questions.length }
}
