// Offline-first service worker for the MOBA Manager PWA.
const VERSION = 'v1.9.0';
const STATIC_CACHE = `moba-static-${VERSION}`;
const RUNTIME_CACHE = `moba-runtime-${VERSION}`;

const PRECACHE = [
  './',
  './index.html',
  './privacy.html',
  './manifest.webmanifest',
  './css/base.css',
  './css/components.css',
  './src/main.js',
  './src/config.js',
  './src/state.js',
  './src/storage.js',
  './src/utils.js',
  './src/pwa.js',
  './src/core/audio.js',
  './src/core/haptics.js',
  './src/core/i18n.js',
  './src/core/preferences.js',
  './src/core/missions.js',
  './src/core/analytics.js',
  './src/core/cloud.js',
  './src/core/remote-config.js',
  './src/core/stats.js',
  './src/data/champions.js',
  './src/data/missions.js',
  './src/data/difficulty.js',
  './src/data/items.js',
  './src/data/abilities.js',
  './src/data/modes.js',
  './src/data/progression.js',
  './src/three/scene.js',
  './src/three/meshes.js',
  './src/three/camera.js',
  './src/three/labels.js',
  './src/game/match.js',
  './src/game/simulation.js',
  './src/game/combat.js',
  './src/game/ai.js',
  './src/game/abilities.js',
  './src/game/feedback.js',
  './src/ui/nav.js',
  './src/ui/squad.js',
  './src/ui/hud.js',
  './src/ui/command-sheet.js',
  './src/ui/gameover.js',
  './src/ui/menu.js',
  './src/ui/missions.js',
  './src/ui/stats.js',
  './src/ui/tutorial.js',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/maskable-512.png',
  './assets/icons/favicon-64.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((k) => k !== STATIC_CACHE && k !== RUNTIME_CACHE).map((k) => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // App navigation: network-first, fall back to cached shell (offline).
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Same-origin assets: cache-first.
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request).then((res) => {
        const copy = res.clone();
        caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
        return res;
      }).catch(() => cached))
    );
    return;
  }

  // Cross-origin (three.js CDN, fonts): stale-while-revalidate.
  event.respondWith(
    caches.open(RUNTIME_CACHE).then((cache) =>
      cache.match(request).then((cached) => {
        const network = fetch(request).then((res) => {
          cache.put(request, res.clone()).catch(() => {});
          return res;
        }).catch(() => cached);
        return cached || network;
      })
    )
  );
});


