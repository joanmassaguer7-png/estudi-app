import type { QuestionReport } from './types'

export const REPORT_REASONS: { id: QuestionReport['reason']; label: string }[] = [
  { id: 'resposta', label: 'La resposta marcada com a correcta no ho és' },
  { id: 'diverses', label: 'Hi ha més d’una resposta correcta' },
  { id: 'confusa', label: 'L’enunciat és confús o té errors' },
  { id: 'temari', label: 'No surt al temari o el contradiu' },
  { id: 'altres', label: 'Una altra cosa' },
]

export const reasonLabel = (r: QuestionReport['reason']) => REPORT_REASONS.find((x) => x.id === r)?.label ?? r
