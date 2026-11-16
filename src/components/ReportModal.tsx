import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, newId } from '../data/db'
import type { Question, QuestionReport } from '../data/types'
import { Modal, useToast } from './ui'
import { REPORT_REASONS } from '../data/reports'

/** Botó «Revisar pregunta»: marca la pregunta perquè algú la comprovi. */
export function ReportButton({ question, courseId }: { question: Question; courseId: string }) {
  const [open, setOpen] = useState(false)
  const existing = useLiveQuery(() => db.reports.where('questionId').equals(question.id).first(), [question.id])
  return (
    <>
      <button type="button" className={`report-btn ${existing ? 'done' : ''}`} onClick={() => setOpen(true)}>
        {existing ? 'Pregunta marcada per revisar' : 'Revisar pregunta'}
      </button>
      {open && <ReportModal question={question} courseId={courseId} existing={existing} onClose={() => setOpen(false)} />}
    </>
  )
}

function ReportModal({ question, courseId, existing, onClose }: { question: Question; courseId: string; existing?: QuestionReport; onClose: () => void }) {
  const toast = useToast()
  const [reason, setReason] = useState<QuestionReport['reason'] | null>(existing?.reason ?? null)
  const [comment, setComment] = useState(existing?.comment ?? '')

  async function save() {
    if (!reason) return
    await db.reports.put({
      id: existing?.id ?? newId(),
      courseId,
      questionId: question.id,
      reason,
      comment: comment.trim(),
      date: new Date().toISOString(),
      question: { text: question.text, options: question.options, correctIndex: question.correctIndex, subtopicId: question.subtopicId },
    })
    toast('Pregunta marcada. La trobaràs a Gestionar → Preguntes marcades.')
    onClose()
  }

  async function remove() {
    if (existing) await db.reports.delete(existing.id)
    toast('Marca treta.')
    onClose()
  }

  return (
    <Modal onClose={onClose}>
      <h2>Revisar pregunta</h2>
      <p className="muted report-q">{question.text}</p>
      <fieldset className="report-reasons">
        <legend>Què hi passa?</legend>
        {REPORT_REASONS.map((r) => (
          <label key={r.id} className={reason === r.id ? 'on' : ''}>
            <input type="radio" name="reason" checked={reason === r.id} onChange={() => setReason(r.id)} />
            <span>{r.label}</span>
          </label>
        ))}
      </fieldset>
      <label className="field">
        <span>Comentari (opcional)</span>
        <textarea rows={3} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Per exemple: al temari diu que són 3 dies, no 5." />
      </label>
      <div className="modal-actions">
        {existing && (
          <button type="button" className="secondary-btn" onClick={remove}>
            Treure la marca
          </button>
        )}
        <button type="button" className="secondary-btn" onClick={onClose}>
          Cancel·lar
        </button>
        <button type="button" className="primary-btn" disabled={!reason} onClick={save}>
          Marcar
        </button>
      </div>
    </Modal>
  )
}
