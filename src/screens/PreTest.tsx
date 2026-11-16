import type { CourseData } from '../data/hooks'
import type { Navigate, PlannedTest } from '../nav'
import { ScreenHeader } from '../components/ui'

/** Pantalla resum abans de començar un test. */
export function PreTest({ data, test, go }: { data: CourseData; test: PlannedTest; go: Navigate }) {
  const perTopic = data.topics
    .map((t) => ({ t, n: test.questions.filter((q) => q.topicId === t.id).length }))
    .filter((x) => x.n > 0)

  return (
    <div className="screen">
      <ScreenHeader title={test.title} onBack={() => go({ name: 'home' })} />
      <div className="pretest-hero">
        <span className="pretest-count" aria-label={`${test.questions.length} preguntes`}>
          {test.questions.length}
        </span>
        <div>
          <h2>{test.questions.length} preguntes</h2>
          <p>{test.description}</p>
        </div>
      </div>

      <h2>Preguntes per tema</h2>
      <ul className="plain-list">
        {perTopic.map(({ t, n }) => (
          <li key={t.id}>
            <span className="list-topic">
              <span className="mini-number">{t.number}</span>
              {t.title}
            </span>
            <strong>{n}</strong>
          </li>
        ))}
      </ul>

      <div className="card soft">
        <p>
          No sabràs si l’encertes fins al final. Pots tornar a les preguntes que ja has vist i canviar-ne la
          resposta. «Finalitzar test» s’activa quan arribes a l’última.
        </p>
      </div>

      <button className="primary-btn wide" onClick={() => go({ name: 'test', test })}>
        Començar
      </button>
    </div>
  )
}
