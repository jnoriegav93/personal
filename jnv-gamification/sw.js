// sw.js — Service worker: cache offline-first del shell de la app.
const CACHE = 'jnv-gamification-v5';
const ARCHIVOS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/logo.svg',
  './data/carga_inicial.json',
  './js/app.js',
  './js/db.js',
  './js/vistas.js',
  './js/logica.js',
  './js/iconos.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((claves) =>
      Promise.all(claves.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Cache-first para archivos propios; red para el resto (CDNs).
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  e.respondWith(
    caches.match(e.request).then((resp) => resp || fetch(e.request).then((red) => {
      const copia = red.clone();
      caches.open(CACHE).then((c) => c.put(e.request, copia)).catch(() => {});
      return red;
    }).catch(() => caches.match('./index.html')))
  );
});
