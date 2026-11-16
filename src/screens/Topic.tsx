import { useState } from 'react'
import type { CourseData } from '../data/hooks'
import { buildTopicTest, mastery } from '../logic/select'
import type { Navigate } from '../nav'
import { ProgressBar, ScreenHeader, useToast } from '../components/ui'

export function TopicScreen({ data, topicId, go }: { data: CourseData; topicId: string; go: Navigate }) {
  const toast = useToast()
  const [open, setOpen] = useState<string | null>(null)
  const topic = data.topics.find((t) => t.id === topicId)
  if (!topic) return <ScreenHeader title="Tema no trobat" onBack={() => go({ name: 'home' })} />

  const subs = data.subtopics.filter((s) => s.topicId === topicId)
  const topicQuestions = data.questions.filter((q) => q.topicId === topicId)

  function startTest() {
    const qs = buildTopicTest(topicId, data.questions, data.attempts)
    if (qs.length === 0) return toast('Aquest tema encara no té preguntes.')
    go({
      name: 'pretest',
      test: {
        mode: 'tema',
        title: `Test · T${topic!.number} ${topic!.title}`,
        description: 'Preguntes del tema, amb prioritat per a les que has fallat i les que no has vist.',
        questions: qs,
      },
    })
  }

  return (
    <div className="screen">
      <ScreenHeader title={`T${topic.number} · ${topic.title}`} onBack={() => go({ name: 'home' })} />

      <button className="primary-btn wide" onClick={startTest}>
        Fer test del tema
      </button>

      <h2>Subtemes</h2>
      <ul className="subtopic-list">
        {subs.map((s) => {
          const m = mastery(
            topicQuestions.filter((q) => q.subtopicId === s.id),
            data.attempts,
          )
          const isOpen = open === s.id
          return (
            <li key={s.id} className="subtopic">
              <button className="subtopic-head" onClick={() => setOpen(isOpen ? null : s.id)} aria-expanded={isOpen}>
                <span className="subtopic-number">{s.number}</span>
                <span className="subtopic-title">{s.title}</span>
                <span className="topic-meta">
                  {m.mastered}/{m.total}
                </span>
              </button>
              <ProgressBar value={m.total ? m.mastered / m.total : 0} />
              {isOpen && <p className="subtopic-content">{s.content || 'Sense contingut.'}</p>}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
