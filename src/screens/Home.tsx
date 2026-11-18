import { useState } from 'react'
import { crownsKey, setSetting } from '../data/db'
import type { CourseData } from '../data/hooks'
import {
  buildExtraTest,
  newErrors,
  shuffle,
  pendingErrors,
  planErrors,
  weeklyErrors,
  EXTRA_TEST_SIZE,
  buildTotalReview,
  MAX_CROWNS,
  mastery,
  TOTAL_PER_TOPIC,
} from '../logic/select'
import { doneToday, planDaily, reminderPhase, streak } from '../logic/daily'
import { BACKUP_SNOOZE_KEY, LAST_BACKUP_KEY, useAppSettings } from '../data/hooks'
import { mascotFace, mascotFor } from '../data/mascots'
import { shareBackup } from '../data/package'
import { useLiveQuery } from 'dexie-react-hooks'
import { getSetting } from '../data/db'
import { Guada } from '../components/Guada'
import { TUTORIAL_KEY, type TutorialState } from './Tutorial'
import { CHAPTERS } from '../tutorial/chapters'
import type { Navigate } from '../nav'
import { AlertIcon, BoltIcon, ChartIcon, CrownIcon, ExamIcon, GamepadIcon, GearIcon, MoonIcon, PawIcon, RepeatIcon, SearchIcon, SunIcon } from '../components/icons'
import { setTheme, useTheme } from '../theme'
import { BirthdayParty } from '../components/BirthdayParty'
import { BIRTHDAY_SEEN_KEY, isBirthday } from '../data/birthday'
import { ProgressBar, useToast } from '../components/ui'
import { db } from '../data/db'
import { compareExam, formatScore } from '../logic/exams'

export function Home({ data, go }: { data: CourseData; go: Navigate }) {
  const theme = useTheme()
  const { course, topics, questions, attempts, sessions, crowns } = data
  const exams = useLiveQuery(() => db.exams.where('courseId').equals(course.id).toArray(), [course.id]) ?? []
  const lastExam = [...exams].filter((e) => e.score !== null).sort((a, b) => b.date.localeCompare(a.date))[0]
  const lastCmp = lastExam ? compareExam(lastExam, attempts) : null
  const examsLine = !exams.length
    ? 'Apunta les notes i les preguntes dels exàmens reals'
    : lastExam
      ? `Últim: ${formatScore(lastExam.score, lastExam.maxScore)}` +
        (lastCmp?.diff != null ? (Math.abs(lastCmp.diff) <= 3 ? ' · com als tests' : ` · ${lastCmp.diff > 0 ? '+' : '−'}${Math.abs(lastCmp.diff)} punts vs. tests`) : '')
      : `${exams.length} ${exams.length === 1 ? 'examen' : 'exàmens'} sense nota`
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [popped, setPopped] = useState<string | null>(null)
  const [partyAgain, setPartyAgain] = useState(false)

  const visibleTopics = topics.filter((t) =>
    `${t.number} ${t.title}`.toLowerCase().includes(search.trim().toLowerCase()),
  )
  const errorsAvailable = pendingErrors(questions, attempts).length
  const errorsNew = newErrors(questions, attempts, sessions).length
  const weekly = weeklyErrors(questions, attempts, sessions)
  const totalCount = topics.reduce(
    (sum, t) => sum + Math.min(TOTAL_PER_TOPIC, questions.filter((q) => q.topicId === t.id).length),
    0,
  )
  const overall = mastery(questions, attempts)
  const settings = useAppSettings()
  const reminder = settings?.reminder
  const dailyDone = doneToday(sessions)
  const days = streak(sessions)
  const late = !dailyDone && reminder?.enabled && reminderPhase(reminder.time) === 'tard'
  const mascot = mascotFor()
  const tutorial = useLiveQuery(() => getSetting<TutorialState>(TUTORIAL_KEY, { done: [] }), [])
  const showTutorial = tutorial && !tutorial.dismissed && tutorial.done.length < CHAPTERS.length
  const birthdayToday = isBirthday(settings?.birthday)
  const thisYear = new Date().getFullYear()
  const showParty = !!settings && birthdayToday && (partyAgain || settings.birthdaySeen !== thisYear)
  const backupDue = settings ? backupDaysDue(settings.lastBackup, settings.backupSnooze, sessions.map((x) => x.finishedAt)) : null

  async function toggleCrown(topicId: string) {
    const active = crowns.includes(topicId)
    if (!active && crowns.length >= MAX_CROWNS) {
      toast(`Només pots seleccionar ${MAX_CROWNS} temes per al Repàs diari.`)
      return
    }
    setPopped(active ? null : topicId)
    const next = active ? crowns.filter((id) => id !== topicId) : [...crowns, topicId]
    await setSetting(crownsKey(course.id), next)
  }

  function startDaily() {
    const test = planDaily(data)
    if (!test) return toast('Encara no hi ha preguntes per als temes seleccionats.')
    go({ name: 'pretest', test })
  }

  async function backupNow() {
    const r = await shareBackup(settings?.backupEmail)
    if (r === 'cancel·lada') return
    await setSetting(LAST_BACKUP_KEY, new Date().toISOString())
    toast(r === 'enviada' ? 'Còpia enviada.' : 'Còpia descarregada. Guarda-la en un lloc segur.')
  }

  function startTotal() {
    const qs = buildTotalReview(topics, questions)
    if (qs.length === 0) return toast('Encara no hi ha preguntes.')
    go({
      name: 'pretest',
      test: {
        mode: 'repas-total',
        title: 'Repàs total',
        description: `${TOTAL_PER_TOPIC} preguntes de cada tema, barrejades.`,
        questions: qs,
      },
    })
  }

  const extraAvailable = data.extraQuestions.length + questions.filter((q) => q.difficulty === 3).length
  function startExtra() {
    const qs = buildExtraTest(data.extraQuestions, questions, attempts)
    if (qs.length === 0) return toast('Aquest curs encara no té preguntes extra difícils.')
    go({
      name: 'pretest',
      test: {
        mode: 'extra',
        title: 'Extra difícil',
        description: 'Preguntes pensades per posar-te a prova: casos pràctics, matisos i trampes habituals. Ideal quan ja domines el temari.',
        questions: qs,
      },
    })
  }

  function startErrors() {
    const plan = planErrors(questions, attempts)
    if (plan.questions.length === 0) return toast('No tens cap pregunta fallada pendent.')
    go({
      name: 'pretest',
      test: {
        mode: 'errors',
        title: 'Test d’errors',
        description:
          (plan.total > plan.questions.length
            ? `Les ${plan.questions.length} preguntes més fallades de les ${plan.total} que tens pendents.`
            : `Les ${plan.total === 1 ? 'pregunta que tens' : `${plan.total} preguntes que tens`} pendent${plan.total === 1 ? '' : 's'} de fer bé.`) +
          ' Cada pregunta surt de la llista quan l’encertes.',
        questions: plan.questions,
      },
    })
  }

  function startWeekly() {
    if (weekly.questions.length === 0) return
    const from = weekly.from.toLocaleDateString('ca-ES', { day: 'numeric', month: 'long' })
    go({
      name: 'pretest',
      test: {
        mode: 'errors-setmanal',
        title: 'Test setmanal d’errors',
        description: `Totes les preguntes que vas fallar la setmana del ${from} i que encara no has fet bé. Les que tornis a fallar tornaran a sortir al test d’errors i al setmanal fins que les encertis.`,
        questions: shuffle(weekly.questions),
      },
    })
  }

  return (
    <div className="screen home">
      <header className="home-header">
        <div>
          {settings?.name && <p className="greeting">Hola, {settings.name}!</p>}
          <h1 className="course-title">{course.title}</h1>
          <p className="course-progress">
            {overall.mastered} de {overall.total} preguntes dominades
          </p>
        </div>
        <div className="home-actions">
          <button
            className="icon-btn theme-btn"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label={theme === 'dark' ? 'Desactivar el mode fosc' : 'Activar el mode fosc'}
            title={theme === 'dark' ? 'Mode clar' : 'Mode fosc'}
          >
            <span key={theme} className="theme-swap">{theme === 'dark' ? <SunIcon /> : <MoonIcon />}</span>
          </button>
          <button className="icon-btn" onClick={() => go({ name: 'stats' })} aria-label="Estadístiques" title="Estadístiques">
            <ChartIcon />
          </button>
          <button className="icon-btn" onClick={() => go({ name: 'manage' })} aria-label="Gestionar" title="Gestionar">
            <GearIcon />
          </button>
        </div>
      </header>

      {showParty && (
        <BirthdayParty
          name={settings?.name ?? ''}
          onClose={() => {
            setPartyAgain(false)
            void setSetting(BIRTHDAY_SEEN_KEY, thisYear)
          }}
        />
      )}

      {birthdayToday && (
        <button className="birthday-banner" onClick={() => setPartyAgain(true)}>
          <PawIcon size={20} />
          <span>
            <strong>Per molts anys, {settings?.name}!</strong>
            <small>Torna a veure la festa</small>
          </span>
        </button>
      )}

      {showTutorial && (
        <div className="tut-banner">
          <Guada mood="hola" size={64} />
          <div>
            <strong>{tutorial.done.length === 0 ? `${settings?.name ? settings.name + ', t' : 'T'}’ensenyo com funciona l’app?` : 'Continuem el tutorial?'}</strong>
            <p>
              {tutorial.done.length === 0
                ? 'Soc la Guada Vet. En pocs minuts sabràs fer-ho tot.'
                : `Portes ${tutorial.done.length} de ${CHAPTERS.length} capítols.`}
            </p>
            <button className="primary-btn small-btn" onClick={() => go({ name: 'tutorial' })}>
              {tutorial.done.length === 0 ? 'Començar el tutorial' : 'Continuar'}
            </button>
          </div>
          <button
            className="tut-banner-close"
            aria-label="Amagar el tutorial"
            onClick={() => setSetting(TUTORIAL_KEY, { ...tutorial, dismissed: true })}
          >
            ✕
          </button>
        </div>
      )}

      {/* L'element protagonista: el Repàs diari com una placa identificativa de collar. */}
      <button className="tag-hero" onClick={startDaily}>
        <span className="tag-ring" aria-hidden="true" />
        <span className="sign-inner">
          <span className="sign-crown has-face" title={`Avui t’acompanya en ${mascot.name}`}>
            <img key={late ? 'trist' : 'content'} src={mascotFace(mascot, late ? 'trist' : 'content')} alt={mascot.name} width={56} height={56} />
          </span>
          <span className="sign-text">
            <span className="sign-title">Repàs diari</span>
            <span className="sign-sub">
              {dailyDone
                ? `Fet avui. En ${mascot.name} ja té la seva galeta.`
                : late
                  ? `En ${mascot.name} està trist: encara no l’has fet.`
                  : crowns.length > 0
                    ? `Fins a 10 preguntes de ${crowns.length === 1 ? 'l’únic tema marcat' : `${crowns.length} temes marcats`}`
                    : 'Fins a 10 preguntes de tots els temes'}
            </span>
            {days > 0 && (
              <span className={`streak ${dailyDone ? 'lit' : ''}`}>
                <PawIcon size={15} /> {days} {days === 1 ? 'dia seguit' : 'dies seguits'}
              </span>
            )}
          </span>
          <span className="sign-go" aria-hidden="true">
            {dailyDone ? 'Repetir' : 'Començar'}
          </span>
        </span>
      </button>

      {weekly.questions.length > 0 && (
        <button className={`weekly-card ${weekly.doneThisWeek ? 'done' : ''}`} onClick={startWeekly}>
          <span className="weekly-icon" aria-hidden="true">
            <AlertIcon size={22} />
          </span>
          <span>
            <strong>{weekly.doneThisWeek ? 'Test setmanal d’errors' : 'Nou test setmanal d’errors'}</strong>
            <small>
              {weekly.doneThisWeek
                ? `Encara ${weekly.questions.length === 1 ? 'te’n queda 1' : `te’n queden ${weekly.questions.length}`} de la setmana passada per fer bé`
                : `${weekly.questions.length} ${weekly.questions.length === 1 ? 'errada' : 'errades'} de la setmana passada`}
            </small>
          </span>
          {!weekly.doneThisWeek && <span className="mode-badge">{weekly.questions.length}</span>}
        </button>
      )}

      {backupDue !== null && (
        <div className="backup-banner" role="status">
          <p>
            {backupDue === 0
              ? 'Encara no has fet cap còpia de seguretat.'
              : `Fa ${backupDue} dies que no fas cap còpia de seguretat.`}{' '}
            Les dades només són en aquest dispositiu.
          </p>
          <div className="backup-actions">
            <button className="link-btn" onClick={() => setSetting(BACKUP_SNOOZE_KEY, new Date().toISOString())}>
              Més tard
            </button>
            <button className="primary-btn small-btn" onClick={backupNow}>
              Enviar una còpia
            </button>
          </div>
        </div>
      )}

      <div className="mode-row">
        <button className="mode-tile" onClick={startTotal}>
          <RepeatIcon size={26} />
          <span className="mode-title">Repàs total</span>
          <span className="mode-sub">{totalCount} preguntes</span>
        </button>
        <button className="mode-tile" onClick={startErrors}>
          <AlertIcon size={26} />
          <span className="mode-title">Errors</span>
          <span className="mode-sub">
            {errorsAvailable === 0 ? 'Cap pendent' : `${errorsAvailable} per repassar`}
          </span>
          {errorsNew > 0 && <span className="mode-badge">{errorsNew}</span>}
        </button>
        <button className="mode-tile" onClick={() => go({ name: 'trivial-pick' })}>
          <GamepadIcon size={28} />
          <span className="mode-title">Trivial</span>
          <span className="mode-sub">Completa els subtemes</span>
        </button>
        <button className="mode-tile extra" onClick={startExtra} disabled={extraAvailable === 0}>
          <BoltIcon size={26} />
          <span className="mode-title">Extra difícil</span>
          <span className="mode-sub">{extraAvailable === 0 ? 'Sense preguntes' : `${Math.min(EXTRA_TEST_SIZE, extraAvailable)} preguntes`}</span>
        </button>
      </div>

      <button className="exams-entry" onClick={() => go({ name: 'exams' })}>
        <ExamIcon size={26} />
        <span>
          <strong>Exàmens</strong>
          <small>{examsLine}</small>
        </span>
      </button>

      <section className="home-section">
        <div className="section-head">
          <h2>Temes</h2>
          <span className="crown-counter" title="Temes marcats per al Repàs diari">
            <CrownIcon size={15} /> {crowns.length}/{MAX_CROWNS}
          </span>
        </div>

        {topics.length > 4 && (
          <label className="search">
            <SearchIcon />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cerca un tema" />
          </label>
        )}
        {visibleTopics.length === 0 && <p className="muted">Cap tema coincideix amb «{search}».</p>}

        <div className="topic-grid">
          {visibleTopics.map((t) => {
            const m = mastery(
              questions.filter((q) => q.topicId === t.id),
              attempts,
            )
            const on = crowns.includes(t.id)
            const subCount = data.subtopics.filter((s) => s.topicId === t.id).length
            return (
              <article key={t.id} className={`topic-card ${on ? 'crowned' : ''}`}>
                <button className="topic-main" onClick={() => go({ name: 'topic', topicId: t.id })}>
                  <span className="topic-number">{t.number}</span>
                  <span className="topic-title">{t.title}</span>
                  <span className="topic-meta">
                    {subCount} subtemes, {m.mastered} de {m.total} dominades
                  </span>
                  <ProgressBar value={m.total ? m.mastered / m.total : 0} />
                </button>
                <button
                  className={`crown-btn ${on ? 'on' : ''} ${popped === t.id ? 'pop' : ''}`}
                  onClick={() => toggleCrown(t.id)}
                  aria-pressed={on}
                  aria-label={on ? `Treure el tema ${t.number} del Repàs diari` : `Afegir el tema ${t.number} al Repàs diari`}
                >
                  <CrownIcon size={20} />
                </button>
              </article>
            )
          })}
        </div>
      </section>

      <section className="home-section">
        <div className="section-head">
          <h2>Últims tests</h2>
          {sessions.length > 4 && (
            <button className="link-btn" onClick={() => go({ name: 'history' })}>
              Veure l’historial
            </button>
          )}
        </div>
        {sessions.length === 0 && <p className="muted">Quan acabis un test, el resultat apareixerà aquí.</p>}
        <ul className="result-list">
          {sessions.slice(0, 4).map((s) => (
            <ResultRow key={s.id} title={s.title} date={s.finishedAt} correct={s.correctCount} total={s.total} onOpen={() => go({ name: 'summary', sessionId: s.id })} />
          ))}
        </ul>
      </section>

      <footer className="home-footer">
        <button className="tut-again" onClick={() => go({ name: 'tutorial', fromStart: true })}>
          <Guada mood="hola" size={40} />
          <span>Repetir el tutorial</span>
        </button>
      </footer>
    </div>
  )
}

export function ResultRow(props: { title: string; date: string; correct: number; total: number; onOpen: () => void }) {
  const pct = props.total ? props.correct / props.total : 0
  const tone = pct >= 0.9 ? 'good' : pct >= 0.6 ? 'mid' : 'bad'
  return (
    <li>
      <button className="result-row" onClick={props.onOpen}>
        <span className={`result-score ${tone}`}>
          {props.correct}
          <small>/{props.total}</small>
        </span>
        <span className="result-text">
          <strong>{props.title}</strong>
          <small>{new Date(props.date).toLocaleString('ca-ES', { dateStyle: 'medium', timeStyle: 'short' })}</small>
        </span>
      </button>
    </li>
  )
}

const DAY = 24 * 60 * 60 * 1000
/**
 * Dies des de l'última còpia si cal recordar-la (null si no cal).
 * Es recorda cada 14 dies, i s'ajorna 3 dies si es prem «Més tard».
 * Si mai s'ha fet cap còpia, es recorda una setmana després del primer test (retorna 0).
 */
function backupDaysDue(last: string | null, snooze: string | null, testDates: string[]): number | null {
  const now = Date.now()
  if (snooze && now - Date.parse(snooze) < 3 * DAY) return null
  if (last) {
    const days = Math.floor((now - Date.parse(last)) / DAY)
    return days >= 14 ? days : null
  }
  if (testDates.length === 0) return null
  const first = Math.min(...testDates.map((d) => Date.parse(d)))
  return now - first >= 7 * DAY ? 0 : null
}
