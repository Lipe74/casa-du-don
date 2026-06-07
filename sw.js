/* ============================================================
   SERVICE WORKER – La Casa du Don
   Stratégie : Cache First pour les assets statiques
                Network First pour les pages HTML
   ============================================================ */

const CACHE_NAME = 'lacasadudon-v2';
const CACHE_STATIC = 'lacasadudon-static-v3';
const CACHE_IMAGES = 'lacasadudon-images-v3';

/* ── Assets à mettre en cache immédiatement (App Shell) ── */
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/evenements.html',
  '/manifest.json',
  '/images/logo.png',
  /* Pages offline fallback */
];

/* ── Images à cacher à la volée ── */
const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'];

/* ============================================================
   INSTALL – précache l'app shell
   ============================================================ */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_STATIC)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

/* ============================================================
   ACTIVATE – nettoie les anciens caches
   ============================================================ */
self.addEventListener('activate', event => {
  const validCaches = [CACHE_STATIC, CACHE_IMAGES];
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => !validCaches.includes(key))
          .map(key => {
            console.log('[SW] Suppression ancien cache :', key);
            return caches.delete(key);
          })
      ))
      .then(() => self.clients.claim())
  );
});

/* ============================================================
   FETCH – stratégies par type de ressource
   ============================================================ */
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  /* Ignore les requêtes non-GET et externes (Google Fonts, etc.) */
  if (request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;

  const ext = url.pathname.split('.').pop().toLowerCase();

  /* ── IMAGES : Cache First (longue durée) ── */
  if (IMAGE_EXTENSIONS.includes(ext)) {
    event.respondWith(cacheFirst(request, CACHE_IMAGES));
    return;
  }

  /* ── HTML : Network First (toujours fresh si dispo) ── */
  if (request.headers.get('accept')?.includes('text/html') || ext === 'html' || url.pathname === '/') {
    event.respondWith(networkFirst(request, CACHE_STATIC));
    return;
  }

  /* ── Autres (CSS inliné, manifest, etc.) : Cache First ── */
  event.respondWith(cacheFirst(request, CACHE_STATIC));
});

/* ============================================================
   STRATÉGIES
   ============================================================ */

/** Cache First : sert depuis le cache, tombe en réseau si absent */
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
    /* Offline et pas en cache → page de fallback si HTML */
    const fallback = await caches.match('/index.html');
    return fallback || new Response('Hors ligne – contenu non disponible.', {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
}

/** Network First : tente le réseau, tombe sur le cache si offline */
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

    /* Fallback sur index.html si page HTML introuvable offline */
    const fallback = await caches.match('/index.html');
    return fallback || new Response('Hors ligne – page non disponible.', {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
}

/* ============================================================
   MESSAGE – permet de forcer la mise à jour depuis l'app
   Usage : navigator.serviceWorker.controller.postMessage({action:'skipWaiting'})
   ============================================================ */
self.addEventListener('message', event => {
  if (event.data?.action === 'skipWaiting') {
    self.skipWaiting();
  }
});
