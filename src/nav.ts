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
  | { name: 'summary'; sessionId: string; celebrate?: boolean }
  | { name: 'review'; sessionId: string; onlyErrors: boolean }
  | { name: 'history' }
  | { name: 'manage' }
  | { name: 'trivial-pick' }
  | { name: 'tutorial'; fromStart?: boolean }
  | { name: 'stats' }
  | { name: 'exams' }
  | { name: 'exam'; examId: string; celebrate?: boolean }
  | { name: 'exam-edit'; examId?: string }
  | { name: 'trivial'; topicId: string }

export type Navigate = (s: Screen) => void
