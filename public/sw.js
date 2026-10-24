// Momo AI · service worker mínimo: permite instalar la app y muestra un aviso sin conexión.
const OFFLINE = '/offline.html'
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open('momo-v1').then((c) => c.addAll([OFFLINE, '/icons/icon-192.png'])))
  self.skipWaiting()
})
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))
self.addEventListener('fetch', (e) => {
  if (e.request.mode !== 'navigate') return
  e.respondWith(fetch(e.request).catch(() => caches.match(OFFLINE)))
})
