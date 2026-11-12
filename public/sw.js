/* MAASGA — service worker (PWA, résilience réseau).
 *
 * Stratégies :
 *  - /static/* (CSS/JS versionnés ?v=hash), polices, icônes : cache d'abord (immuables)
 *  - images (hero, équipe, produits R2) : cache puis mise à jour en arrière-plan
 *  - pages HTML publiques : réseau d'abord, repli sur la dernière version en cache,
 *    puis sur /offline (offline.html servi sans extension)
 *  - jamais mis en cache : /admin, /api, /espace-client (données privées ou dynamiques)
 */
const VERSION = 'maasga-v1'
const STATIC_CACHE = `${VERSION}-static`
const PAGE_CACHE = `${VERSION}-pages`
const IMG_CACHE = `${VERSION}-images`
// '/offline' (et non '/offline.html') : Pages redirige l'extension en 308, ce qui faisait échouer l'installation
const PRECACHE = ['/offline', '/logo-site.webp', '/favicon.svg']
const PRIVATE = [/^\/admin/, /^\/api\//, /^\/espace-client/, /^\/devis\//]
const MAX_PAGES = 30
const MAX_IMAGES = 80

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(STATIC_CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

async function trim(cacheName, max) {
  const cache = await caches.open(cacheName)
  const keys = await cache.keys()
  for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i])
}

async function cacheFirst(req, cacheName) {
  const cached = await caches.match(req)
  if (cached) return cached
  const res = await fetch(req)
  if (res.ok) (await caches.open(cacheName)).put(req, res.clone())
  return res
}

async function staleWhileRevalidate(req) {
  const cache = await caches.open(IMG_CACHE)
  const cached = await cache.match(req)
  const network = fetch(req).then((res) => {
    if (res.ok || res.type === 'opaque') { cache.put(req, res.clone()); trim(IMG_CACHE, MAX_IMAGES) }
    return res
  }).catch(() => cached)
  return cached || network
}

async function networkFirstPage(req) {
  const cache = await caches.open(PAGE_CACHE)
  try {
    const res = await fetch(req)
    if (res.ok && res.headers.get('content-type')?.includes('text/html')) {
      cache.put(req, res.clone()); trim(PAGE_CACHE, MAX_PAGES)
    }
    return res
  } catch {
    return (await cache.match(req, { ignoreSearch: false })) ||
      (await caches.match('/offline'))
  }
}

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)

  if (url.origin === self.location.origin) {
    if (PRIVATE.some((r) => r.test(url.pathname))) return
    if (url.pathname.startsWith('/static/')) return event.respondWith(cacheFirst(req, STATIC_CACHE))
    if (/\.(webp|png|jpe?g|svg|gif|avif)$/i.test(url.pathname)) return event.respondWith(staleWhileRevalidate(req))
    // navigations PJAX (fetch du HTML) et navigations classiques
    if (req.mode === 'navigate' || req.headers.get('accept')?.includes('text/html')) {
      return event.respondWith(networkFirstPage(req))
    }
    return
  }

  // CDN versionnés (GSAP, Font Awesome, polices Google) : immuables
  if (/^(cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net|fonts\.(googleapis|gstatic)\.com)$/.test(url.hostname)) {
    return event.respondWith(cacheFirst(req, STATIC_CACHE))
  }
})
