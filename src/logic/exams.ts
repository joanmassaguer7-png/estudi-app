import type { Attempt, Exam, ExamQuestion, Question, Topic } from '../data/types'

export interface TopicAverage {
  topicId: string
  /** 0–1, o null si no hi ha respostes d'aquest tema abans de l'examen. */
  pct: number | null
  answered: number
  /** Resultat a l'examen per a aquest tema, si les preguntes porten tema i se sap si es van encertar. */
  examRight: number
  examKnown: number
}

export interface ExamComparison {
  /** Nota de l'examen en tant per u (0–1), o null si encara no hi ha nota. */
  examPct: number | null
  /** Mitjana dels tests dels temes de l'examen, fins al dia de l'examen inclòs. */
  testPct: number | null
  answered: number
  /** Diferència en punts percentuals (examen − tests). */
  diff: number | null
  topics: TopicAverage[]
}

const endOfDay = (d: string) => `${d}T23:59:59.999Z`

/** Compara la nota d'un examen amb la mitjana dels tests dels temes que hi entraven. */
export function compareExam(exam: Exam, attempts: Attempt[]): ExamComparison {
  const limit = endOfDay(exam.date)
  // Només compten les respostes del banc de preguntes, fetes fins al dia de l'examen.
  const relevant = attempts.filter((a) => a.chosenIndex !== null && a.mode !== 'examens' && a.date <= limit)
  const topics: TopicAverage[] = exam.topicIds.map((topicId) => {
    const own = relevant.filter((a) => a.topicId === topicId)
    const qs = exam.questions.filter((q) => q.topicId === topicId && q.gotRight !== null)
    return {
      topicId,
      pct: own.length ? own.filter((a) => a.correct).length / own.length : null,
      answered: own.length,
      examRight: qs.filter((q) => q.gotRight).length,
      examKnown: qs.length,
    }
  })
  const answered = topics.reduce((s, t) => s + t.answered, 0)
  const right = topics.reduce((s, t) => s + (t.pct ?? 0) * t.answered, 0)
  const testPct = answered ? right / answered : null
  const examPct = exam.score === null || !exam.maxScore ? null : Math.max(0, Math.min(1, exam.score / exam.maxScore))
  return {
    examPct,
    testPct,
    answered,
    diff: examPct !== null && testPct !== null ? Math.round((examPct - testPct) * 100) : null,
    topics,
  }
}

/** Les preguntes d'examen que es poden practicar: tenen opcions i resposta correcta. */
export function practicableQuestions(exams: Exam[]): Question[] {
  const out: Question[] = []
  for (const e of exams) {
    for (const q of e.questions) {
      if (q.options.filter((o) => o.trim()).length < 2 || q.correctIndex === null || !q.options[q.correctIndex]?.trim()) continue
      const options = q.options.map((o) => o.trim()).filter(Boolean)
      const correct = q.options[q.correctIndex].trim()
      out.push({
        id: `examen-${e.id}-${q.id}`,
        courseId: e.courseId,
        topicId: q.topicId ?? e.topicIds[0] ?? '',
        subtopicId: '',
        text: q.text,
        options,
        correctIndex: options.indexOf(correct),
        explanation: q.note || undefined,
        source: `Examen real: ${e.title} (${formatExamDate(e.date)})`,
      })
    }
  }
  return out
}

function todayIso(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** L'examen ja s'ha fet? Si no s'ha marcat mai, fet si té nota o si la data ja ha passat. */
export function isDone(e: Exam): boolean {
  return e.done ?? (e.score !== null || e.date < todayIso())
}

/** Número de tema més baix de l'examen (per ordenar), o Infinity si no en té cap. */
export function firstTopicNumber(e: Exam, topics: Topic[]): number {
  const nums = e.topicIds
    .map((id) => parseFloat(topics.find((t) => t.id === id)?.number ?? ''))
    .filter((n) => !Number.isNaN(n))
  return nums.length ? Math.min(...nums) : Infinity
}

/**
 * Exàmens pendents (primer el dels temes més baixos, que és el proper) i exàmens fets (també per temes).
 */
export function splitExams(exams: Exam[], topics: Topic[]): { pending: Exam[]; done: Exam[] } {
  const byTopics = (a: Exam, b: Exam) => firstTopicNumber(a, topics) - firstTopicNumber(b, topics) || a.date.localeCompare(b.date)
  return {
    pending: exams.filter((e) => !isDone(e)).sort(byTopics),
    done: exams.filter(isDone).sort(byTopics),
  }
}

/** Nota per mostrar: «Pendent» si encara no s'ha fet. */
export function examScoreLabel(e: Exam): string {
  return isDone(e) ? formatScore(e.score, e.maxScore) : 'Pendent'
}

export function formatExamDate(d: string): string {
  const [y, m, day] = d.split('-').map(Number)
  if (!y || !m || !day) return d
  return new Date(y, m - 1, day).toLocaleDateString('ca-ES', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function formatScore(score: number | null, max: number): string {
  if (score === null) return 'Sense nota'
  const n = (x: number) => x.toLocaleString('ca-ES', { maximumFractionDigits: 2 })
  return `${n(score)}/${n(max)}`
}

const LETTERS = 'ABCDEFGH'

/**
 * Text amb tots els exàmens i les seves preguntes, pensat per enviar-lo a Claude perquè
 * adapti el generador de preguntes a l'estil dels exàmens reals.
 */
export function examsReport(exams: Exam[], topics: Topic[], attempts: Attempt[], courseTitle: string): string {
  const tname = (id: string | null) => {
    const t = topics.find((x) => x.id === id)
    return t ? `Tema ${t.number}. ${t.title}` : 'Tema no indicat'
  }
  const lines: string[] = [
    `EXÀMENS REALS · ${courseTitle}`,
    `Exportat el ${new Date().toLocaleDateString('ca-ES')} des de l’app d’estudi.`,
    'Format: estudi-app/examens (versió 1). Per a Claude: fes servir aquestes preguntes per ajustar l’estil, la dificultat i els temes de les preguntes generades.',
    '',
  ]
  for (const e of [...exams].sort((a, b) => a.date.localeCompare(b.date))) {
    const c = compareExam(e, attempts)
    lines.push('════════════════════════════════════════')
    lines.push(`EXAMEN: ${e.title}`)
    lines.push(`Data: ${formatExamDate(e.date)}`)
    lines.push(`Nota: ${examScoreLabel(e)}${c.examPct !== null ? ` (${Math.round(c.examPct * 100)} %)` : ''}`)
    lines.push(`Temes: ${e.topicIds.map(tname).join(' · ') || 'no indicats'}`)
    if (c.testPct !== null) lines.push(`Mitjana dels tests d’aquests temes fins al dia de l’examen: ${Math.round(c.testPct * 100)} % (${c.answered} respostes)`)
    if (e.notes) lines.push(`Notes: ${e.notes}`)
    if (e.photos?.length) lines.push(`Fotos adjuntes: ${e.photos.map((_, i) => photoName(e, i)).join(', ')}`)
    lines.push(`Preguntes recollides: ${e.questions.length}`)
    lines.push('')
    e.questions.forEach((q, i) => lines.push(...questionLines(q, i + 1, tname)))
  }
  return lines.join('\n') + '\n'
}

function questionLines(q: ExamQuestion, n: number, tname: (id: string | null) => string): string[] {
  const out = [`${n}. ${q.text}`]
  q.options.forEach((o, i) => {
    if (o.trim()) out.push(`   ${LETTERS[i]}) ${o.trim()}${i === q.correctIndex ? '   ← correcta' : ''}`)
  })
  if (q.options.every((o) => !o.trim())) out.push('   (pregunta oberta o sense opcions recordades)')
  out.push(`   ${tname(q.topicId)} · ${q.gotRight === null ? 'no se sap si es va encertar' : q.gotRight ? 'encertada' : 'fallada'}`)
  if (q.note) out.push(`   Nota: ${q.note}`)
  out.push('')
  return out
}

/** Nom del fitxer de cada foto quan s'envia (ajuda a saber de quin examen és). */
export function photoName(e: Exam, i: number): string {
  const slug = e.title.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30) || 'examen'
  return `${e.date}-${slug}-foto-${i + 1}.jpg`
}
