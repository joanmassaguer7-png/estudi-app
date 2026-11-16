// Paquets de fitxers per passar dades entre l'ordinador i el mòbil.
//
//  - Paquet de contingut (ordinador → mòbil): curs + temari (opcional) + preguntes.
//  - Fitxer de progrés (mòbil → ordinador): intents, tests i corones.
//  - Còpia de seguretat: tot el contingut de la base de dades.
//
// De moment són fitxers JSON. Si més endavant hi ha imatges, es pot passar a ZIP.

import { crownsKey, db } from './db'
import type { Attempt, Course, Question, Subtopic, TestSession, Topic } from './types'

export const CONTENT_FORMAT = 'estudi-app/contingut'
export const PROGRESS_FORMAT = 'estudi-app/progres'
export const BACKUP_FORMAT = 'estudi-app/copia'
export const FORMAT_VERSION = 1

export interface ContentPackage {
  format: typeof CONTENT_FORMAT
  formatVersion: number
  createdAt: string
  course: Course
  /** Si hi és, substitueix el temari. Si no hi és, es manté el temari actual. */
  syllabus?: { topics: Topic[]; subtopics: Subtopic[] }
  questions: Question[]
}

export interface ProgressFile {
  format: typeof PROGRESS_FORMAT
  formatVersion: number
  exportedAt: string
  attempts: Attempt[]
  sessions: TestSession[]
  crowns: Record<string, string[]>
}

// ---------- Validació (funcions pures, sense base de dades) ----------

const isStr = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0

/**
 * Comprova que el paquet té l'estructura correcta.
 * `existing` és el temari que ja hi ha al dispositiu (per si el paquet no porta temari).
 * Retorna una llista d'errors; si és buida, el paquet és vàlid.
 */
export function validateContentPackage(
  data: unknown,
  existing?: { topicIds: Set<string>; subtopicIds: Map<string, string> },
): string[] {
  const errors: string[] = []
  if (!data || typeof data !== 'object') return ['El fitxer no conté un objecte JSON.']
  const p = data as Partial<ContentPackage>

  if (p.format !== CONTENT_FORMAT) return ['Aquest fitxer no és un paquet de contingut d’aquesta aplicació.']
  if (typeof p.formatVersion !== 'number' || p.formatVersion > FORMAT_VERSION)
    errors.push('La versió del paquet és més nova que l’aplicació. Actualitza l’aplicació.')
  if (!p.course || !isStr(p.course.id) || !isStr(p.course.title)) errors.push('Falta la informació del curs.')
  if (!Array.isArray(p.questions)) errors.push('Falta la llista de preguntes.')
  if (errors.length) return errors

  const courseId = p.course!.id
  let subtopicToTopic: Map<string, string>

  if (p.syllabus) {
    const { topics, subtopics } = p.syllabus
    if (!Array.isArray(topics) || !Array.isArray(subtopics)) return ['El temari del paquet està mal format.']
    const topicIds = new Set<string>()
    for (const t of topics) {
      if (!isStr(t.id) || !isStr(t.title)) errors.push(`Tema sense id o títol (${t.number ?? '?'}).`)
      else if (topicIds.has(t.id)) errors.push(`Tema duplicat: ${t.id}.`)
      else if (t.courseId !== courseId) errors.push(`El tema ${t.id} no pertany al curs.`)
      else topicIds.add(t.id)
    }
    subtopicToTopic = new Map()
    for (const s of subtopics) {
      if (!isStr(s.id) || !isStr(s.title)) errors.push(`Subtema sense id o títol (${s.number ?? '?'}).`)
      else if (subtopicToTopic.has(s.id)) errors.push(`Subtema duplicat: ${s.id}.`)
      else if (!topicIds.has(s.topicId)) errors.push(`El subtema ${s.id} apunta a un tema inexistent.`)
      else subtopicToTopic.set(s.id, s.topicId)
    }
  } else if (existing) {
    subtopicToTopic = existing.subtopicIds
  } else {
    return ['El paquet no porta temari i aquest curs encara no existeix al dispositiu.']
  }

  const qIds = new Set<string>()
  p.questions!.forEach((q, i) => {
    const where = `Pregunta ${i + 1} (${q?.id ?? 'sense id'})`
    if (!isStr(q?.id)) return errors.push(`${where}: falta l’id.`)
    if (qIds.has(q.id)) errors.push(`${where}: id duplicat.`)
    qIds.add(q.id)
    if (q.courseId !== courseId) errors.push(`${where}: curs incorrecte.`)
    if (!isStr(q.text)) errors.push(`${where}: falta l’enunciat.`)
    if (!Array.isArray(q.options) || q.options.length < 2 || !q.options.every(isStr))
      errors.push(`${where}: calen com a mínim 2 opcions.`)
    else if (!Number.isInteger(q.correctIndex) || q.correctIndex < 0 || q.correctIndex >= q.options.length)
      errors.push(`${where}: la resposta correcta no és vàlida.`)
    if (subtopicToTopic.get(q.subtopicId) !== q.topicId)
      errors.push(`${where}: el tema/subtema no existeix al temari.`)
  })
  return errors.slice(0, 20)
}

// ---------- Importació i exportació ----------

/**
 * Importa un paquet de contingut. Tot passa dins d'una transacció:
 * si alguna cosa falla, la base de dades queda exactament com estava.
 */
export async function importContentPackage(data: unknown): Promise<{ questions: number; syllabus: boolean }> {
  const courseId = (data as ContentPackage)?.course?.id
  const existingTopics = courseId ? await db.topics.where('courseId').equals(courseId).toArray() : []
  const existingSubs = courseId ? await db.subtopics.where('courseId').equals(courseId).toArray() : []
  const existing = existingTopics.length
    ? {
        topicIds: new Set(existingTopics.map((t) => t.id)),
        subtopicIds: new Map(existingSubs.map((s) => [s.id, s.topicId])),
      }
    : undefined

  const errors = validateContentPackage(data, existing)
  if (errors.length) throw new Error(errors.join('\n'))
  const pkg = data as ContentPackage

  await db.transaction('rw', [db.courses, db.topics, db.subtopics, db.questions], async () => {
    await db.courses.put(pkg.course)
    if (pkg.syllabus) {
      await db.topics.where('courseId').equals(pkg.course.id).delete()
      await db.subtopics.where('courseId').equals(pkg.course.id).delete()
      await db.topics.bulkAdd(pkg.syllabus.topics)
      await db.subtopics.bulkAdd(pkg.syllabus.subtopics)
    }
    // Les preguntes antigues deixen d'estar disponibles; l'historial d'intents es conserva.
    await db.questions.where('courseId').equals(pkg.course.id).delete()
    await db.questions.bulkAdd(pkg.questions)
  })
  return { questions: pkg.questions.length, syllabus: Boolean(pkg.syllabus) }
}

export async function buildContentPackage(courseId: string, includeSyllabus = true): Promise<ContentPackage> {
  const course = await db.courses.get(courseId)
  if (!course) throw new Error('Curs no trobat.')
  const updated: Course = { ...course, contentVersion: course.contentVersion + 1, updatedAt: new Date().toISOString() }
  await db.courses.put(updated)
  return {
    format: CONTENT_FORMAT,
    formatVersion: FORMAT_VERSION,
    createdAt: new Date().toISOString(),
    course: updated,
    syllabus: includeSyllabus
      ? {
          topics: await db.topics.where('courseId').equals(courseId).toArray(),
          subtopics: await db.subtopics.where('courseId').equals(courseId).toArray(),
        }
      : undefined,
    questions: await db.questions.where('courseId').equals(courseId).toArray(),
  }
}

export async function buildProgressFile(): Promise<ProgressFile> {
  const courses = await db.courses.toArray()
  const crowns: Record<string, string[]> = {}
  for (const c of courses) {
    const row = await db.settings.get(crownsKey(c.id))
    if (row) crowns[c.id] = row.value as string[]
  }
  return {
    format: PROGRESS_FORMAT,
    formatVersion: FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    attempts: await db.attempts.toArray(),
    sessions: await db.sessions.toArray(),
    crowns,
  }
}

/** Fusiona el progrés d'un altre dispositiu. Els intents tenen id únic: no es dupliquen. */
export async function importProgressFile(data: unknown): Promise<{ attempts: number; sessions: number }> {
  const p = data as Partial<ProgressFile>
  if (!p || p.format !== PROGRESS_FORMAT) throw new Error('Aquest fitxer no és un fitxer de progrés.')
  if (!Array.isArray(p.attempts) || !Array.isArray(p.sessions)) throw new Error('El fitxer de progrés està mal format.')
  const before = await db.attempts.count()
  const beforeS = await db.sessions.count()
  await db.transaction('rw', [db.attempts, db.sessions, db.settings], async () => {
    await db.attempts.bulkPut(p.attempts!)
    await db.sessions.bulkPut(p.sessions!)
    for (const [courseId, ids] of Object.entries(p.crowns ?? {})) {
      await db.settings.put({ key: crownsKey(courseId), value: ids })
    }
  })
  return { attempts: (await db.attempts.count()) - before, sessions: (await db.sessions.count()) - beforeS }
}

export async function buildBackup() {
  return {
    format: BACKUP_FORMAT,
    formatVersion: FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    courses: await db.courses.toArray(),
    topics: await db.topics.toArray(),
    subtopics: await db.subtopics.toArray(),
    questions: await db.questions.toArray(),
    attempts: await db.attempts.toArray(),
    sessions: await db.sessions.toArray(),
    settings: await db.settings.toArray(),
  }
}

export async function restoreBackup(data: unknown) {
  const b = data as Awaited<ReturnType<typeof buildBackup>>
  if (!b || b.format !== BACKUP_FORMAT) throw new Error('Aquest fitxer no és una còpia de seguretat.')
  const tables = [db.courses, db.topics, db.subtopics, db.questions, db.attempts, db.sessions, db.settings]
  await db.transaction('rw', tables, async () => {
    for (const t of tables) await t.clear()
    await db.courses.bulkAdd(b.courses)
    await db.topics.bulkAdd(b.topics)
    await db.subtopics.bulkAdd(b.subtopics)
    await db.questions.bulkAdd(b.questions)
    await db.attempts.bulkAdd(b.attempts)
    await db.sessions.bulkAdd(b.sessions)
    await db.settings.bulkAdd(b.settings)
  })
}

// ---------- Utilitats de fitxers ----------

export function downloadJson(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export async function readJsonFile(file: File): Promise<unknown> {
  const text = await file.text()
  try {
    return JSON.parse(text)
  } catch {
    throw new Error('El fitxer no és un JSON vàlid.')
  }
}

export const dateStamp = () => new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')
