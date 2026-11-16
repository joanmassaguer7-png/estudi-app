import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { ACTIVE_COURSE_KEY, db } from './data/db'
import { useAppSettings, useCourseData } from './data/hooks'
import type { Screen } from './nav'
import { Home } from './screens/Home'
import { Manage } from './screens/Manage'
import { PreTest } from './screens/PreTest'
import { History, Review, Summary } from './screens/Results'
import { TestRunner } from './screens/TestRunner'
import { TopicScreen } from './screens/Topic'
import { TrivialGame, TrivialPick } from './screens/Trivial'
import { Stats } from './screens/Stats'
import { CHAPTERS } from './tutorial/chapters'
import { Tutorial } from './screens/Tutorial'
import { NameSetup } from './screens/NameSetup'
import { ToastProvider } from './components/ui'
import { DailyPrompt } from './components/DailyPrompt'
import { useServiceWorkerUpdate } from './pwa'
import { enableReinforcement } from './data/reminder'

function screenKey(s: Screen) {
  if (s.name === 'topic') return `topic-${s.topicId}`
  if (s.name === 'trivial') return `trivial-${s.topicId}`
  if (s.name === 'summary' || s.name === 'review') return `${s.name}-${s.sessionId}`
  return s.name
}

export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'home' })

  // Curs actiu: el guardat a la configuració o, si no n'hi ha, el primer que existeixi.
  const courseId = useLiveQuery(async () => {
    const saved = (await db.settings.get(ACTIVE_COURSE_KEY))?.value as string | undefined
    if (saved && (await db.courses.get(saved))) return saved
    return (await db.courses.toCollection().first())?.id ?? ''
  }, [])
  const data = useCourseData(courseId || undefined)
  const settings = useAppSettings()
  const updateReady = useServiceWorkerUpdate()

  // Enllaç directe (?obre=repas-diari): des d'un avís, del calendari o de la drecera de la icona.
  const [openDaily, setOpenDaily] = useState(() => new URLSearchParams(window.location.search).get('obre') === 'repas-diari')
  useEffect(() => {
    if (window.location.search) window.history.replaceState(null, '', window.location.pathname)
    // Si l'app ja estava oberta, el service worker ens avisa amb un missatge.
    const onMessage = (e: MessageEvent) => {
      if (e.data?.type === 'obre' && e.data.valor === 'repas-diari') setOpenDaily(true)
    }
    navigator.serviceWorker?.addEventListener('message', onMessage)
    return () => navigator.serviceWorker?.removeEventListener('message', onMessage)
  }, [])
  const inGame = screen.name === 'test' || screen.name === 'trivial' || screen.name === 'tutorial'

  // Si el recordatori està actiu, tornar a registrar l'avís de reforç en obrir l'app.
  // (Per exemple, si es va activar abans d'instal·lar-la, ara ja pot funcionar.)
  const reminderOn = settings?.reminder.enabled
  useEffect(() => {
    if (reminderOn && 'Notification' in window && Notification.permission === 'granted') enableReinforcement().catch(() => {})
  }, [reminderOn])

  // En canviar de pantalla, tornar a dalt de tot.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [screen])

  if (courseId === undefined || !settings) return null // carregant la base de dades

  // Primer ús: la Guada demana el nom abans de res.
  if (!settings.name) {
    return (
      <ToastProvider>
        <main className="app">
          <NameSetup />
        </main>
      </ToastProvider>
    )
  }

  // Sense cap curs: només es pot importar o carregar el de mostra.
  if (!courseId || !data) {
    return (
      <ToastProvider>
        <main className="app">
          <div className="welcome">
            <h1>Benvingut/da!</h1>
            <p>Encara no hi ha cap curs en aquest dispositiu. Importa un paquet de preguntes o prova el curs de mostra.</p>
          </div>
          <Manage go={setScreen} welcome />
        </main>
      </ToastProvider>
    )
  }

  return (
    <ToastProvider>
      <main className="app">
        {updateReady && (
          <div className="update-banner" role="status">
            <span>Hi ha una versió nova de l’app.</span>
            <button className="link-btn" onClick={() => window.location.reload()}>
              Actualitzar
            </button>
          </div>
        )}
        <div key={screenKey(screen)} className="screen-enter">
          {render()}
        </div>
        {openDaily && !inGame && settings && (
          <DailyPrompt data={data} reminder={settings.reminder} go={setScreen} onClose={() => setOpenDaily(false)} />
        )}
      </main>
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
        return <Summary data={data!} sessionId={screen.sessionId} celebrate={screen.celebrate} go={go} />
      case 'review':
        return <Review sessionId={screen.sessionId} onlyErrors={screen.onlyErrors} go={go} />
      case 'history':
        return <History data={data!} go={go} />
      case 'manage':
        return <Manage courseId={courseId!} go={go} />
      case 'tutorial':
        return <Tutorial go={go} startAt={screen.fromStart ? CHAPTERS[0].id : undefined} />
      case 'stats':
        return <Stats data={data!} go={go} />
      case 'trivial-pick':
        return <TrivialPick data={data!} go={go} />
      case 'trivial':
        return <TrivialGame data={data!} topicId={screen.topicId} go={go} />
    }
  }
}
