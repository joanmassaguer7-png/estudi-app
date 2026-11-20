// Recordatori del Repàs diari.
//
// Com funciona (sense servidor):
//  1. L'avís principal el fa el calendari del mòbil, a l'hora exacta. L'app només
//     prepara l'esdeveniment (Google Calendar o fitxer .ics) amb l'enllaç directe.
//  2. L'avís de reforç el fa el service worker quan Chrome el desperta
//     (sincronització periòdica). Chrome decideix quan: no hi ha hora exacta.
//     Si és dins les 2 hores següents a l'hora triada → la mascota del dia contenta.
//     Si ja han passat 2 hores i el repàs no està fet → la mascota del dia trista.
//
// La configuració es guarda a la taula `settings` perquè el service worker la pugui llegir.

import { getSetting, setSetting } from './db'
import { type Mascot, mascotFace, mascotFor, WithArticle, adj } from './mascots'

export interface ReminderSettings {
  enabled: boolean
  time: string // "HH:MM"
}

export const REMINDER_KEY = 'recordatori'
export const DEFAULT_REMINDER: ReminderSettings = { enabled: false, time: '20:00' }
export const PERIODIC_TAG = 'repas-diari'

export const getReminder = () => getSetting<ReminderSettings>(REMINDER_KEY, DEFAULT_REMINDER)
export const saveReminder = (r: ReminderSettings) => setSetting(REMINDER_KEY, r)

/** Adreça que obre directament el Repàs diari. */
export function dailyLink(): string {
  const url = new URL(import.meta.env.BASE_URL, window.location.href)
  url.searchParams.set('obre', 'repas-diari')
  return url.toString()
}

// ---------- Calendari ----------

function nextOccurrence(time: string): Date {
  const [h, m] = time.split(':').map(Number)
  const d = new Date()
  d.setHours(h, m, 0, 0)
  if (d.getTime() < Date.now()) d.setDate(d.getDate() + 1)
  return d
}

const pad = (n: number) => String(n).padStart(2, '0')
const stamp = (d: Date) =>
  `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`

const EVENT_TITLE = 'Repàs diari'
const eventDetails = () => `Toca el teu Repàs diari: ${dailyLink()}`

/** Enllaç que obre Google Calendar amb l'esdeveniment diari ja omplert. */
export function googleCalendarUrl(time: string): string {
  const start = nextOccurrence(time)
  const end = new Date(start.getTime() + 15 * 60 * 1000)
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: EVENT_TITLE,
    details: eventDetails(),
    dates: `${stamp(start)}/${stamp(end)}`,
    ctz: Intl.DateTimeFormat().resolvedOptions().timeZone,
    recur: 'RRULE:FREQ=DAILY',
  })
  return `https://calendar.google.com/calendar/render?${params}`
}

/** Fitxer .ics per a altres calendaris, amb avís a l'hora exacta. */
export function icsFile(time: string): string {
  const start = nextOccurrence(time)
  const end = new Date(start.getTime() + 15 * 60 * 1000)
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//estudi-app//ca',
    'BEGIN:VEVENT',
    `UID:repas-diari-${Date.now()}@estudi-app`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    'RRULE:FREQ=DAILY',
    `SUMMARY:${EVENT_TITLE}`,
    `DESCRIPTION:${eventDetails()}`,
    `URL:${dailyLink()}`,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${EVENT_TITLE}`,
    'TRIGGER:PT0M',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}

// ---------- Avís de reforç ----------

export type ReinforcementStatus = 'actiu' | 'sense-permis' | 'no-instal·lada' | 'no-compatible'

/** Demana permís de notificacions i registra la sincronització periòdica. */
export async function enableReinforcement(): Promise<ReinforcementStatus> {
  if (!('Notification' in window) || !('serviceWorker' in navigator)) return 'no-compatible'
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return 'sense-permis'
  const reg = await navigator.serviceWorker.ready
  const periodic = (reg as ServiceWorkerRegistration & { periodicSync?: { register: (tag: string, o: object) => Promise<void> } })
    .periodicSync
  if (!periodic) return 'no-compatible'
  try {
    // Chrome decideix la freqüència real; com a molt, unes quantes vegades al dia.
    await periodic.register(PERIODIC_TAG, { minInterval: 60 * 60 * 1000 })
    return 'actiu'
  } catch {
    return 'no-instal·lada'
  }
}

export async function disableReinforcement() {
  if (!('serviceWorker' in navigator)) return
  const reg = await navigator.serviceWorker.ready
  const periodic = (reg as ServiceWorkerRegistration & { periodicSync?: { unregister: (tag: string) => Promise<void> } }).periodicSync
  await periodic?.unregister(PERIODIC_TAG).catch(() => {})
}

/** Mostra ara mateix l'avís, per veure com és. */
export async function showTestNotification(mood: 'content' | 'trist', name = '', mascot: Mascot = mascotFor()): Promise<boolean> {
  if (!('Notification' in window) || !('serviceWorker' in navigator)) return false
  if ((await Notification.requestPermission()) !== 'granted') return false
  const reg = await navigator.serviceWorker.ready
  const text = notificationText(mascot, mood, name)
  await reg.showNotification(text.title, {
    body: text.body,
    icon: mascotFace(mascot, mood, 'png'),
    badge: `${import.meta.env.BASE_URL}avisos/badge.png`,
    tag: 'repas-diari-prova',
    data: { url: dailyLink() },
  })
  return true
}

/** Mateixos textos que fa servir el service worker (public/sw.js). */
export function notificationText(mascot: Mascot, mood: 'content' | 'trist', name = '') {
  const who = name ? `${name}, ` : ''
  return mood === 'content'
    ? { title: `${who}hora del Repàs diari!`.replace(/^h/, 'H'), body: `${WithArticle(mascot)} et fa companyia: 10 preguntes i llestos.` }
    : { title: `${who}encara no has fet el repàs d’avui`.replace(/^e/, 'E'), body: `${WithArticle(mascot)} està ${adj(mascot, 'trist')}… Només són 10 preguntes. Som-hi?` }
}
