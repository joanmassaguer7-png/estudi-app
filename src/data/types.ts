// Tipus de dades de l'aplicació.
// Tot es guarda localment al dispositiu (IndexedDB). Els identificadors (id)
// són textos estables: si una pregunta es regenera amb el mateix id, les
// estadístiques antigues continuen tenint sentit.

export interface Course {
  id: string
  title: string
  description?: string
  /** Versió del contingut (s'incrementa cada vegada que s'exporta un paquet nou). */
  contentVersion: number
  updatedAt: string
}

/** Tema: primer nivell del temari (1, 2, 3…). */
export interface Topic {
  id: string
  courseId: string
  number: string
  title: string
  order: number
  /** Data de creació; serveix per decidir quins són els temes «més recents». */
  createdAt: string
}

/** Subtema: segon nivell (1.1, 1.2…). Conté el text del temari. */
export interface Subtopic {
  id: string
  courseId: string
  topicId: string
  number: string
  title: string
  order: number
  content: string
}

export interface Question {
  id: string
  courseId: string
  topicId: string
  subtopicId: string
  /** Concepte concret que avalua (p. ex. «taxa d'alcohol de conductors novells»). */
  concept?: string
  text: string
  options: string[]
  correctIndex: number
  explanation?: string
  generation?: { source: string; createdAt: string; model?: string }
}

export type StudyMode = 'tema' | 'repas-diari' | 'repas-total' | 'errors' | 'trivial'

/** Un intent = una resposta (o no-resposta) a una pregunta dins d'un test. */
export interface Attempt {
  id: string
  courseId: string
  sessionId: string
  questionId: string
  topicId: string
  subtopicId: string
  concept?: string
  mode: StudyMode
  /** null = la pregunta s'ha vist però no s'ha respost. */
  chosenIndex: number | null
  correct: boolean
  date: string
}

/** Un test complet guardat a l'historial. */
export interface TestSession {
  id: string
  courseId: string
  mode: StudyMode
  title: string
  startedAt: string
  finishedAt: string
  questionIds: string[]
  answers: (number | null)[]
  correctCount: number
  total: number
  /** Còpia de les preguntes tal com eren: permet revisar el test encara que el banc s'hagi actualitzat. */
  snapshot: Question[]
}

/** Configuració guardada com a parells clau/valor. */
export interface Setting {
  key: string
  value: unknown
}
