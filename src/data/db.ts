import Dexie, { type EntityTable } from 'dexie'
import type { Attempt, Course, Question, Setting, Subtopic, TestSession, Topic } from './types'

// Dexie és una capa sobre IndexedDB (la base de dades que porta el navegador).
// Aquí declarem les "taules" i quins camps volem poder cercar ràpidament (índexs).
class EstudiDB extends Dexie {
  courses!: EntityTable<Course, 'id'>
  topics!: EntityTable<Topic, 'id'>
  subtopics!: EntityTable<Subtopic, 'id'>
  questions!: EntityTable<Question, 'id'>
  attempts!: EntityTable<Attempt, 'id'>
  sessions!: EntityTable<TestSession, 'id'>
  settings!: EntityTable<Setting, 'key'>

  constructor() {
    super('estudi-app')
    this.version(1).stores({
      courses: 'id',
      topics: 'id, courseId',
      subtopics: 'id, courseId, topicId',
      questions: 'id, courseId, topicId, subtopicId, concept',
      // L'historial va separat del banc de preguntes: substituir preguntes no l'esborra.
      attempts: 'id, courseId, sessionId, questionId, date',
      sessions: 'id, courseId, finishedAt',
      settings: 'key',
    })
  }
}

export const db = new EstudiDB()

// ---------- Configuració ----------

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const row = await db.settings.get(key)
  return row ? (row.value as T) : fallback
}

export async function setSetting(key: string, value: unknown) {
  await db.settings.put({ key, value })
}

export const crownsKey = (courseId: string) => `corones:${courseId}`
export const ACTIVE_COURSE_KEY = 'curs-actiu'

/** Identificador únic. crypto.randomUUID només existeix en contextos segurs (https/localhost). */
export function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}
