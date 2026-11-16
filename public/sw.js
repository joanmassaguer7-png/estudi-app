// Service worker: guarda els fitxers de l'aplicació perquè funcioni sense connexió.
// Estratègia: primer la xarxa (per tenir sempre la versió nova); si no hi ha
// connexió, la còpia guardada. Les dades d'estudi NO passen per aquí: són a IndexedDB.

const CACHE = 'estudi-app-v1'

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(['./', './index.html', './manifest.webmanifest', './icon.svg'])),
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
        const cached = await caches.match(req)
        if (cached) return cached
        // Navegació sense connexió: retornar la pàgina principal.
        if (req.mode === 'navigate') return caches.match('./index.html')
        return Response.error()
      }),
  )
})
