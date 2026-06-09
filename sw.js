/* ============================================================
   SERVICE WORKER – La Casa du Don
   ============================================================ */

const VERSION = 'v4';

const CACHE_STATIC = `casa-static-${VERSION}`;
const CACHE_IMAGES = `casa-images-${VERSION}`;

const PRECACHE_URLS = [
  './',
  './index.html',
  './evenements.html',
  './manifest.json',
  './favicon.ico',
  './favicon.png',
  './images/logo.png',
  './musique/casa01.mp3'
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

    caches.keys().then(keys =>

      Promise.all(
        keys
          .filter(key => !validCaches.includes(key))
          .map(key => caches.delete(key))
      )

    ).then(() => self.clients.claim())

  );

});

/* ============================================================
   FETCH
   ============================================================ */

self.addEventListener('fetch', event => {

  const request = event.request;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  if (url.origin !== location.origin) return;

  /* HTML = Network First */

  if (
    request.headers.get('accept')?.includes('text/html')
  ) {

    event.respondWith(

      fetch(request)
        .then(response => {

          const clone = response.clone();

          caches.open(CACHE_STATIC)
            .then(cache => cache.put(request, clone));

          return response;

        })
        .catch(() => caches.match(request))

    );

    return;

  }

  /* Images, MP3, CSS, JS = Cache First */

  event.respondWith(

    caches.match(request)
      .then(cached => {

        if (cached) return cached;

        return fetch(request)
          .then(response => {

            const clone = response.clone();

            const cacheName =
              request.destination === 'image'
                ? CACHE_IMAGES
                : CACHE_STATIC;

            caches.open(cacheName)
              .then(cache => cache.put(request, clone));

            return response;

          });

      })

  );

});

/* ============================================================
   UPDATE MANUELLE
   ============================================================ */

self.addEventListener('message', event => {

  if (event.data?.action === 'skipWaiting') {
    self.skipWaiting();
  }

});
