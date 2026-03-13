// A simple, no-op Service Worker capable of satisfying the PWA install requirement.
// It intercepts fetch requests but just falls back to the network.

const CACHE_NAME = 'poupameta-v1'

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim())
})

self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => {
      return new Response('Offline content - Please check your connection.', {
        headers: { 'Content-Type': 'text/plain' }
      })
    })
  )
})
