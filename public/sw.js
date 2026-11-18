// Service worker de l'app.
//  1. Guarda els fitxers de l'app perquè funcioni sense connexió.
//  2. Avís de reforç del Repàs diari (sincronització periòdica de Chrome).
//  3. En tocar un avís, obre l'app directament al Repàs diari.
// Les dades d'estudi són a IndexedDB; aquí només es llegeixen per decidir l'avís.

const CACHE = 'estudi-app-v12'
const LATE_AFTER_MIN = 120
// Mascota de cada dia, de dilluns a diumenge (còpia de src/data/mascots.ts).
const MASCOTS = [
  { id: 'cheto', name: 'Cheto' },
  { id: 'toby', name: 'Toby' },
  { id: 'lambo', name: 'Lambo' },
  { id: 'duke', name: 'Duke' },
  { id: 'olaf', name: 'Olaf' },
  { id: 'valto', name: 'Valto' },
  { id: 'teo', name: 'Teo' },
]

// ---------- Memòria cau ----------

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) =>
        cache.addAll(['./', './index.html', './manifest.webmanifest', './icon.svg', './avisos/badge.png']),
      ),
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))),
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone()
          caches.open(CACHE).then((cache) => cache.put(req, copy))
        }
        return res
      })
      .catch(async () => {
        const cached = await caches.match(req, { ignoreSearch: req.mode === 'navigate' })
        if (cached) return cached
        if (req.mode === 'navigate') return caches.match('./index.html')
        return Response.error()
      }),
  )
})

// ---------- Lectura de la base de dades ----------

function openDb() {
  return new Promise((resolve, reject) => {
    const r = indexedDB.open('estudi-app')
    r.onsuccess = () => resolve(r.result)
    r.onerror = () => reject(r.error)
  })
}

function request(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function dayKey(date) {
  const p = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`
}

// ---------- Avís de reforç ----------

async function maybeRemind() {
  const db = await openDb()
  if (!db.objectStoreNames.contains('settings')) return db.close()
  const tx = db.transaction(['settings', 'sessions'], 'readonly')
  const reminder = (await request(tx.objectStore('settings').get('recordatori')))?.value
  const sent = (await request(tx.objectStore('settings').get('avis-enviat')))?.value
  const name = ((await request(tx.objectStore('settings').get('perfil')))?.value?.name || '').trim()
  const sessions = await request(tx.objectStore('sessions').getAll())
  if (!reminder || !reminder.enabled) return db.close()

  const now = new Date()
  const today = dayKey(now)
  const done = sessions.some((s) => s.mode === 'repas-diari' && dayKey(new Date(s.finishedAt)) === today)
  if (done) return db.close()

  const [h, m] = reminder.time.split(':').map(Number)
  const minutes = now.getHours() * 60 + now.getMinutes()
  if (minutes < h * 60 + m) return db.close() // encara no és l'hora
  const mood = minutes < h * 60 + m + LATE_AFTER_MIN ? 'content' : 'trist'

  // Com a molt un avís content i un de trist cada dia.
  const already = sent && sent.date === today ? sent.moods : []
  if (already.includes(mood) || (mood === 'content' && already.includes('trist'))) return db.close()

  const mascot = MASCOTS[(now.getDay() + 6) % 7]
  const text =
    mood === 'content'
      ? { title: name ? `${name}, hora del Repàs diari!` : 'Hora del Repàs diari!', body: `En ${mascot.name} et fa companyia: 10 preguntes i llestos.` }
      : { title: name ? `${name}, encara no has fet el repàs d’avui` : 'Encara no has fet el repàs d’avui', body: `En ${mascot.name} està trist… Només són 10 preguntes. Som-hi?` }

  await self.registration.showNotification(text.title, {
    body: text.body,
    icon: `./avisos/${mascot.id}-${mood}.png`,
    badge: './avisos/badge.png',
    tag: 'repas-diari',
    renotify: true,
    data: { url: './?obre=repas-diari' },
  })

  const wtx = db.transaction('settings', 'readwrite')
  wtx.objectStore('settings').put({ key: 'avis-enviat', value: { date: today, moods: [...already, mood] } })
  wtx.oncomplete = () => db.close()
}

self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'repas-diari') event.waitUntil(maybeRemind().catch(() => {}))
})

// ---------- Tocar un avís ----------

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = new URL(event.notification.data?.url || './?obre=repas-diari', self.registration.scope).href
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((wins) => {
      const open = wins.find((w) => w.url.startsWith(self.registration.scope))
      if (open) {
        open.postMessage({ type: 'obre', valor: 'repas-diari' })
        return open.focus()
      }
      return self.clients.openWindow(target)
    }),
  )
})
