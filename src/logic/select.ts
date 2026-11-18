// Lògica de selecció de preguntes per a cada mode d'estudi.
// Són funcions "pures": reben dades i retornen un resultat, sense tocar la base
// de dades ni la pantalla. Així es poden provar fàcilment.

import type { Attempt, Question, TestSession, Topic } from '../data/types'

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
export const EXTRA_TEST_SIZE = 15

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

/** Últim intent de cada pregunta. */
function lastAttempts(attempts: Attempt[]): Map<string, Attempt> {
  const map = new Map<string, Attempt>()
  for (const a of attempts) {
    const prev = map.get(a.questionId)
    if (!prev || a.date >= prev.date) map.set(a.questionId, a)
  }
  return map
}

/**
 * Registre d'errades: preguntes l'últim intent de les quals va ser incorrecte (o sense resposta).
 * Una pregunta surt del registre quan es respon bé, faci's al test que es faci.
 */
export function pendingErrors(questions: Question[], attempts: Attempt[]): Question[] {
  const last = lastAttempts(attempts)
  return questions.filter((q) => {
    const a = last.get(q.id)
    return !!a && !a.correct
  })
}

/** Data (ISO) de l'últim test d'errors normal acabat, o '' si no se n'ha fet cap. */
export function lastErrorsTestDate(sessions: TestSession[]): string {
  return sessions.filter((s) => s.mode === 'errors').reduce((m, s) => (s.finishedAt > m ? s.finishedAt : m), '')
}

/**
 * Errades noves des de l'últim test d'errors: són les que fan sortir l'avís (el número vermell).
 * Les que es tornen a fallar dins del mateix test d'errors no tornen a encendre l'avís,
 * però continuen al registre i surten al proper test.
 */
export function newErrors(questions: Question[], attempts: Attempt[], sessions: TestSession[]): Question[] {
  const since = lastErrorsTestDate(sessions)
  const last = lastAttempts(attempts)
  return pendingErrors(questions, attempts).filter((q) => (last.get(q.id)?.date ?? '') > since)
}

export interface ErrorsPlan {
  questions: Question[]
  /** Quantes errades hi ha en total al registre (el test en mostra com a màxim ERRORS_TEST_MAX). */
  total: number
}

/** Test d'errors: les preguntes del registre d'errades, primer les més fallades i les més recents. */
export function planErrors(questions: Question[], attempts: Attempt[], rng: Rng = Math.random): ErrorsPlan {
  const stats = statsByQuestion(attempts)
  const pending = pendingErrors(questions, attempts).sort(
    (a, b) => stats.get(b.id)!.wrong - stats.get(a.id)!.wrong || (stats.get(b.id)!.lastDate ?? '').localeCompare(stats.get(a.id)!.lastDate ?? ''),
  )
  return { questions: shuffle(pending.slice(0, ERRORS_TEST_MAX), rng), total: pending.length }
}

/** Compatibilitat: només les preguntes del test d'errors. */
export function buildErrorsTest(questions: Question[], attempts: Attempt[], rng: Rng = Math.random): Question[] {
  return planErrors(questions, attempts, rng).questions
}

// ---------- Test setmanal d'errors ----------

/** Dilluns a les 00:00 de la setmana de la data donada (hora local). */
export function weekStart(date = new Date()): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return d
}

export interface WeeklyErrors {
  /** Preguntes fallades la setmana passada que encara no s'han fet bé. */
  questions: Question[]
  /** Si ja s'ha fet el test setmanal aquesta setmana. */
  doneThisWeek: boolean
  /** Dilluns de la setmana passada (per als textos). */
  from: Date
}

/**
 * Cada dilluns s'habilita un test amb totes les errades de la setmana anterior (de dilluns a diumenge).
 * Durant la setmana es pot repetir: hi continuen sortint les que encara no s'han fet bé.
 * Les errades d'aquest test van al registre normal, com qualsevol altra.
 */
export function weeklyErrors(questions: Question[], attempts: Attempt[], sessions: TestSession[], now = new Date()): WeeklyErrors {
  const thisWeek = weekStart(now)
  const from = new Date(thisWeek)
  from.setDate(from.getDate() - 7)
  const a = from.toISOString()
  const b = thisWeek.toISOString()
  const failedLastWeek = new Set(attempts.filter((x) => !x.correct && x.date >= a && x.date < b).map((x) => x.questionId))
  const pending = new Set(pendingErrors(questions, attempts).map((q) => q.id))
  return {
    questions: questions.filter((q) => failedLastWeek.has(q.id) && pending.has(q.id)),
    doneThisWeek: sessions.some((s) => s.mode === 'errors-setmanal' && s.finishedAt >= b),
    from,
  }
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

/**
 * Mode Extra difícil: 15 preguntes de les extra difícils de tot el curs,
 * prioritzant les fallades i les no vistes. Si no n'hi ha prou, es completa
 * amb preguntes difícils (dificultat 3) del banc normal.
 */
export function buildExtraTest(extra: Question[], base: Question[], attempts: Attempt[], rng: Rng = Math.random): Question[] {
  const picked = pickWeighted(extra, EXTRA_TEST_SIZE, attempts, rng)
  if (picked.length < EXTRA_TEST_SIZE) {
    const hard = base.filter((q) => q.difficulty === 3)
    picked.push(...pickWeighted(hard, EXTRA_TEST_SIZE - picked.length, attempts, rng))
  }
  return shuffle(picked, rng)
}
