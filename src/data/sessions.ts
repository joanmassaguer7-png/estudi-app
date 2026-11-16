import { db, newId } from './db'
import type { Attempt, Question, StudyMode, TestSession } from './types'

/** Guarda un test acabat i un intent per cada pregunta. Retorna l'id del test. */
export async function saveFinishedTest(
  courseId: string,
  mode: StudyMode,
  title: string,
  questions: Question[],
  answers: (number | null)[],
  startedAt: string,
): Promise<string> {
  const sessionId = newId()
  const now = new Date().toISOString()
  const attempts: Attempt[] = questions.map((q, i) => ({
    id: newId(),
    courseId,
    sessionId,
    questionId: q.id,
    topicId: q.topicId,
    subtopicId: q.subtopicId,
    concept: q.concept,
    mode,
    chosenIndex: answers[i],
    // Les preguntes sense resposta no compten com a encert.
    correct: answers[i] === q.correctIndex,
    date: now,
  }))
  const session: TestSession = {
    id: sessionId,
    courseId,
    mode,
    title,
    startedAt,
    finishedAt: now,
    questionIds: questions.map((q) => q.id),
    answers,
    correctCount: attempts.filter((a) => a.correct).length,
    total: questions.length,
    snapshot: questions,
  }
  await db.transaction('rw', [db.sessions, db.attempts], async () => {
    await db.sessions.add(session)
    await db.attempts.bulkAdd(attempts)
  })
  return sessionId
}
