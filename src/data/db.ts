import Dexie, { type EntityTable } from 'dexie'
import type { Attempt, Course, Question, QuestionReport, Setting, Subtopic, TestSession, Topic, Exam } from './types'

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
  reports!: EntityTable<QuestionReport, 'id'>
  exams!: EntityTable<Exam, 'id'>

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
    // Versió 2: preguntes marcades per revisar.
    this.version(2).stores({
      reports: 'id, courseId, questionId, date',
    })
    // Versió 3: exàmens reals.
    this.version(3).stores({
      exams: 'id, courseId, date',
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

/** Esborra un curs i tot el que en depèn (temari, preguntes, historial, corones i marques). */
export async function deleteCourse(courseId: string) {
  await db.transaction('rw', [db.courses, db.topics, db.subtopics, db.questions, db.attempts, db.sessions, db.settings, db.reports, db.exams], async () => {
    await db.courses.delete(courseId)
    await db.topics.where('courseId').equals(courseId).delete()
    await db.subtopics.where('courseId').equals(courseId).delete()
    await db.questions.where('courseId').equals(courseId).delete()
    await db.attempts.where('courseId').equals(courseId).delete()
    await db.sessions.where('courseId').equals(courseId).delete()
    await db.reports.where('courseId').equals(courseId).delete()
    await db.exams.where('courseId').equals(courseId).delete()
    await db.settings.delete(crownsKey(courseId))
    const active = await db.settings.get(ACTIVE_COURSE_KEY)
    if (active?.value === courseId) await db.settings.delete(ACTIVE_COURSE_KEY)
  })
}
