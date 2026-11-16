import { useLiveQuery } from 'dexie-react-hooks'
import { crownsKey, db } from './db'
import { DEFAULT_REMINDER, REMINDER_KEY, type ReminderSettings } from './reminder'

// useLiveQuery torna a executar la consulta automàticament cada vegada que
// canvien les dades: la pantalla sempre mostra l'estat actual.

export function useCourseData(courseId: string | undefined) {
  return useLiveQuery(async () => {
    if (!courseId) return undefined
    const [course, topics, subtopics, allQuestions, attempts, sessions, crownsRow] = await Promise.all([
      db.courses.get(courseId),
      db.topics.where('courseId').equals(courseId).sortBy('order'),
      db.subtopics.where('courseId').equals(courseId).sortBy('order'),
      db.questions.where('courseId').equals(courseId).toArray(),
      db.attempts.where('courseId').equals(courseId).toArray(),
      db.sessions.where('courseId').equals(courseId).reverse().sortBy('finishedAt'),
      db.settings.get(crownsKey(courseId)),
    ])
    if (!course) return undefined
    const topicIds = new Set(topics.map((t) => t.id))
    // Les preguntes extra difícils només es fan servir al mode Extra difícil.
    const extraQuestions = allQuestions.filter((q) => q.difficulty === 4)
    const questions = allQuestions.filter((q) => q.difficulty !== 4)
    // Si un tema s'ha eliminat del temari, la seva corona deixa de comptar.
    const crowns = ((crownsRow?.value as string[] | undefined) ?? []).filter((id) => topicIds.has(id))
    return { course, topics, subtopics, questions, extraQuestions, attempts, sessions, crowns }
  }, [courseId])
}

export type CourseData = NonNullable<ReturnType<typeof useCourseData>>

/** Configuració general que fan servir diverses pantalles. */
export function useAppSettings() {
  return useLiveQuery(async () => {
    const [reminder, lastBackup, backupSnooze, profile, backupEmail] = await Promise.all([
      db.settings.get(REMINDER_KEY),
      db.settings.get(LAST_BACKUP_KEY),
      db.settings.get(BACKUP_SNOOZE_KEY),
      db.settings.get(PROFILE_KEY),
      db.settings.get(BACKUP_EMAIL_KEY),
    ])
    return {
      /** Nom de la persona que fa servir l'app (es demana el primer cop). */
      name: ((profile?.value as { name?: string } | undefined)?.name ?? '').trim(),
      reminder: { ...DEFAULT_REMINDER, ...((reminder?.value as Partial<ReminderSettings>) ?? {}) },
      lastBackup: (lastBackup?.value as string | undefined) ?? null,
      backupSnooze: (backupSnooze?.value as string | undefined) ?? null,
      /** Correu on la persona s'envia les còpies de seguretat (només es guarda al dispositiu). */
      backupEmail: (backupEmail?.value as string | undefined) ?? '',
    }
  }, [])
}

export const LAST_BACKUP_KEY = 'darrera-copia'
export const PROFILE_KEY = 'perfil'
export const BACKUP_SNOOZE_KEY = 'copia-ajornada'
export const BACKUP_EMAIL_KEY = 'correu-copia'
