// Les pantalles de l'aplicació. En lloc d'un "router" fem servir un estat senzill:
// cada valor descriu quina pantalla es veu i amb quines dades.
import type { Question, StudyMode } from './data/types'

export interface PlannedTest {
  mode: StudyMode
  title: string
  description: string
  questions: Question[]
}

export type Screen =
  | { name: 'home' }
  | { name: 'topic'; topicId: string }
  | { name: 'pretest'; test: PlannedTest }
  | { name: 'test'; test: PlannedTest }
  | { name: 'summary'; sessionId: string }
  | { name: 'review'; sessionId: string; onlyErrors: boolean }
  | { name: 'history' }
  | { name: 'manage' }

export type Navigate = (s: Screen) => void
