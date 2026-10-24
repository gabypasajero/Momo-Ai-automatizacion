// Momo AI · service worker mínimo: permite instalar la app y muestra un aviso sin conexión.
const OFFLINE = '/offline.html'
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open('momo-v2').then((c) => c.addAll([OFFLINE, '/icons/icon-192.png'])))
  self.skipWaiting()
})
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))
self.addEventListener('fetch', (e) => {
  if (e.request.mode !== 'navigate') return
  e.respondWith(fetch(e.request).catch(() => caches.match(OFFLINE)))
})

// Avisos al teléfono: "Juan te escribió".
self.addEventListener('push', (e) => {
  let data = {}
  try { data = e.data ? e.data.json() : {} } catch { data = { title: 'Momo AI', body: e.data ? e.data.text() : '' } }
  e.waitUntil(self.registration.showNotification(data.title || 'Momo AI', {
    body: data.body || 'Tienes un mensaje nuevo.',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: data.tag,
    renotify: true,
    data: { url: data.url || '/hoy' },
  }))
})
self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  const url = new URL(e.notification.data?.url || '/hoy', self.location.origin).href
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
    for (const c of list) if ('focus' in c) { c.navigate(url); return c.focus() }
    return self.clients.openWindow(url)
  }))
})
