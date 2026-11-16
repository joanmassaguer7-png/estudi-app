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
      <div className="card center">
        <p className="big-number">{test.questions.length}</p>
        <p className="muted">preguntes</p>
        <p>{test.description}</p>
      </div>

      <h2>Repartiment per tema</h2>
      <ul className="plain-list">
        {perTopic.map(({ t, n }) => (
          <li key={t.id}>
            <span>
              T{t.number} · {t.title}
            </span>
            <strong>{n}</strong>
          </li>
        ))}
      </ul>

      <div className="card soft">
        <p>
          Durant el test no veuràs si l’encertes. Pots tornar a les preguntes ja vistes i canviar la resposta.
          El botó «Finalitzar» s’activa quan arribes a l’última.
        </p>
      </div>

      <button className="primary-btn wide" onClick={() => go({ name: 'test', test })}>
        Començar
      </button>
    </div>
  )
}
