/* ============================================================
   SERVICE WORKER – La Casa du Don
   ============================================================ */

/* Modifier UNIQUEMENT ce numéro lors d'une mise à jour */
const VERSION = 'v24';

const CACHE_STATIC = `lacasadudon-static-${VERSION}`;
const CACHE_IMAGES = `lacasadudon-images-${VERSION}`;

/* ============================================================
   Assets à mettre en cache immédiatement
   ============================================================ */

const PRECACHE_URLS = [
  './',
  './index.html',
  './evenements.html',
  './manifest.json',
  './images/logo.png',
  './musique/casa01.mp3'
];

/* ============================================================
   Images à mettre en cache automatiquement
   ============================================================ */

const IMAGE_EXTENSIONS = [
  'jpg',
  'jpeg',
  'png',
  'webp',
  'gif',
  'svg'
];

/* ============================================================
   INSTALL
   ============================================================ */

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_STATIC)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

/* ============================================================
   ACTIVATE
   ============================================================ */

self.addEventListener('activate', event => {

  const validCaches = [
    CACHE_STATIC,
    CACHE_IMAGES
  ];

  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key => !validCaches.includes(key))
            .map(key => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );

});

/* ============================================================
   FETCH
   ============================================================ */

self.addEventListener('fetch', event => {

  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;

  if (url.origin !== self.location.origin) return;

  const ext = url.pathname.split('.').pop().toLowerCase();

  /* Images */
  if (IMAGE_EXTENSIONS.includes(ext)) {
    event.respondWith(cacheFirst(request, CACHE_IMAGES));
    return;
  }

  /* HTML */
  if (
    request.headers.get('accept')?.includes('text/html') ||
    ext === 'html'
  ) {
    event.respondWith(networkFirst(request, CACHE_STATIC));
    return;
  }

  /* MP3 */
  if (ext === 'mp3') {
    event.respondWith(cacheFirst(request, CACHE_STATIC));
    return;
  }

  /* Autres fichiers */
  event.respondWith(cacheFirst(request, CACHE_STATIC));

});

/* ============================================================
   CACHE FIRST
   ============================================================ */

async function cacheFirst(request, cacheName) {

  const cached = await caches.match(request);

  if (cached) return cached;

  try {

    const response = await fetch(request);

    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }

    return response;

  } catch {

    return new Response(
      'Hors ligne',
      {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8'
        }
      }
    );

  }

}

/* ============================================================
   NETWORK FIRST
   ============================================================ */

async function networkFirst(request, cacheName) {

  try {

    const response = await fetch(request);

    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }

    return response;

  } catch {

    const cached = await caches.match(request);

    if (cached) return cached;

    return caches.match('./index.html');

  }

}

/* ============================================================
   MESSAGE
   ============================================================ */

self.addEventListener('message', event => {

  if (event.data?.action === 'skipWaiting') {
    self.skipWaiting();
  }

});
