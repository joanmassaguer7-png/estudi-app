import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { ACTIVE_COURSE_KEY, db } from './data/db'
import { useCourseData } from './data/hooks'
import type { Screen } from './nav'
import { Home } from './screens/Home'
import { Manage } from './screens/Manage'
import { PreTest } from './screens/PreTest'
import { History, Review, Summary } from './screens/Results'
import { TestRunner } from './screens/TestRunner'
import { TopicScreen } from './screens/Topic'
import { ToastProvider } from './components/ui'

export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'home' })

  // Curs actiu: el guardat a la configuració o, si no n'hi ha, el primer que existeixi.
  const courseId = useLiveQuery(async () => {
    const saved = (await db.settings.get(ACTIVE_COURSE_KEY))?.value as string | undefined
    if (saved && (await db.courses.get(saved))) return saved
    return (await db.courses.toCollection().first())?.id ?? ''
  }, [])
  const data = useCourseData(courseId || undefined)

  // En canviar de pantalla, tornar a dalt de tot.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [screen])

  if (courseId === undefined) return null // carregant la base de dades

  // Sense cap curs: només es pot importar o carregar el de mostra.
  if (!courseId || !data) {
    return (
      <ToastProvider>
        <main className="app">
          <div className="welcome">
            <h1>Benvingut/da!</h1>
            <p>Encara no hi ha cap curs en aquest dispositiu. Importa un paquet de preguntes o prova el curs de mostra.</p>
          </div>
          <Manage go={setScreen} />
        </main>
      </ToastProvider>
    )
  }

  return (
    <ToastProvider>
      <main className="app">{render()}</main>
    </ToastProvider>
  )

  function render() {
    const go = setScreen
    switch (screen.name) {
      case 'home':
        return <Home data={data!} go={go} />
      case 'topic':
        return <TopicScreen data={data!} topicId={screen.topicId} go={go} />
      case 'pretest':
        return <PreTest data={data!} test={screen.test} go={go} />
      case 'test':
        return <TestRunner courseId={courseId!} test={screen.test} go={go} />
      case 'summary':
        return <Summary data={data!} sessionId={screen.sessionId} go={go} />
      case 'review':
        return <Review sessionId={screen.sessionId} onlyErrors={screen.onlyErrors} go={go} />
      case 'history':
        return <History data={data!} go={go} />
      case 'manage':
        return <Manage courseId={courseId!} go={go} />
    }
  }
}
