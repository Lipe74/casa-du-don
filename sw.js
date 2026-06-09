/* ============================================================
   SERVICE WORKER – La Casa du Don
   ============================================================ */

/* Une seule version à modifier */
const VERSION = 'v22';

const CACHE_STATIC = `lacasadudon-static-${VERSION}`;
const CACHE_IMAGES = `lacasadudon-images-${VERSION}`;

/* ── Assets à mettre en cache immédiatement ── */
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/evenements.html',
  '/manifest.json',
  '/images/logo.png',
  '/musique/casa01.mp3'
];

/* ── Images à cacher à la volée ── */
const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'];
