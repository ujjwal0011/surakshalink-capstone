// SurakshaLink Service Worker — Workbox-powered offline support
importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js');

if (workbox) {
  console.log('[SW] Workbox loaded successfully');

  // ─── Precaching ─────────────────────────────────────────────
  workbox.precaching.precacheAndRoute([
    { url: '/contacts.json', revision: '1' },
    { url: '/manifest.json', revision: '1' },
  ]);

  // ─── Cache-First for contacts.json ──────────────────────────
  // Critical: emergency contacts must be available offline
  workbox.routing.registerRoute(
    ({ url }) => url.pathname.endsWith('/contacts.json'),
    new workbox.strategies.CacheFirst({
      cacheName: 'emergency-contacts-cache',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 5,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        }),
      ],
    })
  );

  // ─── StaleWhileRevalidate for static assets ─────────────────
  // CSS, JS, fonts — serve cached, update in background
  workbox.routing.registerRoute(
    ({ request }) =>
      request.destination === 'style' ||
      request.destination === 'script' ||
      request.destination === 'font',
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: 'static-assets-cache',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 60,
          maxAgeSeconds: 30 * 24 * 60 * 60,
        }),
      ],
    })
  );

  // ─── Cache-First for images ─────────────────────────────────
  workbox.routing.registerRoute(
    ({ request }) => request.destination === 'image',
    new workbox.strategies.CacheFirst({
      cacheName: 'image-cache',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 30,
          maxAgeSeconds: 30 * 24 * 60 * 60,
        }),
      ],
    })
  );

  // ─── NetworkFirst for HTML navigation ───────────────────────
  // SPA: serve fresh HTML when online, cached when offline
  workbox.routing.registerRoute(
    ({ request }) => request.mode === 'navigate',
    new workbox.strategies.NetworkFirst({
      cacheName: 'html-cache',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 10,
          maxAgeSeconds: 7 * 24 * 60 * 60,
        }),
      ],
    })
  );

  // ─── NetworkFirst for API calls ─────────────────────────────
  workbox.routing.registerRoute(
    ({ url }) => url.pathname.startsWith('/api'),
    new workbox.strategies.NetworkFirst({
      cacheName: 'api-cache',
      networkTimeoutSeconds: 5,
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 50,
          maxAgeSeconds: 24 * 60 * 60,
        }),
      ],
    })
  );

  // ─── Google Fonts caching ───────────────────────────────────
  workbox.routing.registerRoute(
    ({ url }) =>
      url.origin === 'https://fonts.googleapis.com' ||
      url.origin === 'https://fonts.gstatic.com',
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: 'google-fonts-cache',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 20,
          maxAgeSeconds: 365 * 24 * 60 * 60,
        }),
      ],
    })
  );

} else {
  console.error('[SW] Workbox failed to load');
}

// ─── Skip waiting & claim clients immediately ────────────────
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
