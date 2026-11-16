import { useLiveQuery } from 'dexie-react-hooks'
import { crownsKey, db } from './db'

// useLiveQuery torna a executar la consulta automàticament cada vegada que
// canvien les dades: la pantalla sempre mostra l'estat actual.

export function useCourseData(courseId: string | undefined) {
  return useLiveQuery(async () => {
    if (!courseId) return undefined
    const [course, topics, subtopics, questions, attempts, sessions, crownsRow] = await Promise.all([
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
    // Si un tema s'ha eliminat del temari, la seva corona deixa de comptar.
    const crowns = ((crownsRow?.value as string[] | undefined) ?? []).filter((id) => topicIds.has(id))
    return { course, topics, subtopics, questions, attempts, sessions, crowns }
  }, [courseId])
}

export type CourseData = NonNullable<ReturnType<typeof useCourseData>>
