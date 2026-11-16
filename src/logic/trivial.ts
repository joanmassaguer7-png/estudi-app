// Lògica del Trivial (funcions pures, sense pantalla ni base de dades).
//
// Regles acordades:
//  - Es juga amb les preguntes dels subtemes d'un tema.
//  - Un subtema queda completat amb 2 encerts, independentment dels intents.
//  - Fallar no fa perdre: es continua i el subtema torna a sortir més endavant.
//  - Les preguntes no es repeteixen dins la mateixa partida.
//  - Guanyes quan tots els subtemes tenen 2 encerts.
//  - Perds quan un subtema pendent ja no té preguntes noves.
//
// Política de torns (decisió d'implementació): els subtemes pendents surten per
// torns, en un ordre barrejat. Cada subtema que surt passa al final de la cua.

import type { Question } from '../data/types'
import { shuffle, type Rng } from './select'

export const HITS_TO_COMPLETE = 2

export interface TrivialState {
  topicId: string
  subtopicIds: string[]
  /** Preguntes que encara no han sortit, per subtema. */
  remaining: Record<string, string[]>
  hits: Record<string, number>
  /** Ordre de torns dels subtemes pendents. */
  queue: string[]
  current: string | null
  history: { questionId: string; subtopicId: string; chosenIndex: number; correct: boolean }[]
  status: 'playing' | 'won' | 'lost'
}

/** Un subtema només és jugable si té prou preguntes per arribar als encerts necessaris. */
export function playableSubtopics(subtopicIds: string[], questions: Question[]): string[] {
  return subtopicIds.filter((id) => questions.filter((q) => q.subtopicId === id).length >= HITS_TO_COMPLETE)
}

export function startTrivial(
  topicId: string,
  subtopicIds: string[],
  questions: Question[],
  rng: Rng = Math.random,
): TrivialState {
  const subs = playableSubtopics(subtopicIds, questions)
  const remaining: Record<string, string[]> = {}
  const hits: Record<string, number> = {}
  for (const id of subs) {
    remaining[id] = shuffle(
      questions.filter((q) => q.subtopicId === id).map((q) => q.id),
      rng,
    )
    hits[id] = 0
  }
  const state: TrivialState = {
    topicId,
    subtopicIds: subs,
    remaining,
    hits,
    queue: shuffle(subs, rng),
    current: null,
    history: [],
    status: 'playing',
  }
  return nextTurn(state)
}

/** Prepara la pregunta següent, o tanca la partida si s'ha guanyat o perdut. */
export function nextTurn(state: TrivialState): TrivialState {
  const pending = state.subtopicIds.filter((id) => state.hits[id] < HITS_TO_COMPLETE)
  if (pending.length === 0) return { ...state, current: null, status: 'won' }

  // Si algun subtema pendent ja no té preguntes, és impossible completar-lo.
  if (pending.some((id) => state.remaining[id].length === 0)) return { ...state, current: null, status: 'lost' }

  const queue = state.queue.filter((id) => pending.includes(id))
  const sub = queue[0]
  const [questionId, ...rest] = state.remaining[sub]
  return {
    ...state,
    queue: [...queue.slice(1), sub],
    remaining: { ...state.remaining, [sub]: rest },
    current: questionId,
  }
}

/** Registra la resposta a la pregunta actual (sense passar encara a la següent). */
export function answerTrivial(state: TrivialState, question: Question, chosenIndex: number): TrivialState {
  if (state.status !== 'playing' || state.current !== question.id) return state
  const correct = chosenIndex === question.correctIndex
  const sub = question.subtopicId
  return {
    ...state,
    hits: correct ? { ...state.hits, [sub]: Math.min(HITS_TO_COMPLETE, state.hits[sub] + 1) } : state.hits,
    history: [...state.history, { questionId: question.id, subtopicId: sub, chosenIndex, correct }],
  }
}

export const completedCount = (s: TrivialState) =>
  s.subtopicIds.filter((id) => s.hits[id] >= HITS_TO_COMPLETE).length
