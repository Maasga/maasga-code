// Mobile API endpoints updated 2026-09-12
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import { setCookie, getCookie, deleteCookie } from 'hono/cookie'
import type { D1Database } from '@cloudflare/workers-types'
import { appointments, reviews, orders, clients, notifications, setMaintenanceDueCount, setPendingMaintenanceContractsCount, setPendingMaintenanceRequestsCount, pendingMaintenanceContracts } from './data/store'
import type { Order } from './data/store'
import { products } from './data/products'
import { quartiers } from './data/quartiers'
import { createAppointment, updateAppointmentStatus, createOrder, createReview, getProducts, getReviews, getQuartiers, createClient, getClients, getAppointments, getAppointmentById, getOrders, deleteProduct, deleteClient, deleteOrder, getClientById, getProductById } from './db'
import type { HonoEnv } from './types'
import { SITE_URL } from './types'
import { escapeHtml, sanitizeText, isValidEmail, isValidPhone, normalizePhone, validateImageMagicBytes } from './utils/helpers'
import { sendSmsWithLog, notifyAdmin, logActivity, logSecurityEvent, sendTelegramMessage, ensureActivityLog, ensureNotificationsTable } from './utils/notifications'
import { webRouter } from './routes/web'
import { mobileRouter } from './routes/api-mobile'
import { clientRouter } from './routes/client'
import { adminRouter } from './routes/admin'
import { cronRouter } from './routes/cron'
import { telegramRouter } from './routes/telegram'
import { rateLimit } from './utils/security'

// App Hono — types et utilitaires importés depuis ./types et ./utils/

const app = new Hono<HonoEnv>()

// SITE_URL importé depuis src/types.ts — modifier lÃ -bas quand le domaine change.

app.use('/api/*', cors({
  origin: (origin) => {
    if (!origin) return '*' // curl/server-to-server sans Origin
    const allowed = [SITE_URL, 'http://localhost:5173', 'http://127.0.0.1:5173']
    return allowed.includes(origin) ? origin : null
  },
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  maxAge: 86400
}))

// ============================================================
// CF EDGE CACHE — Cache public HTML pages at the Cloudflare PoP
// Uses the Worker Cache API (caches.default) for sub-50ms TTFB
// ============================================================
const CACHEABLE_PATHS = new Set(['/', '/catalogue', '/simulateur', '/rendez-vous', '/avis', '/a-propos', '/contact', '/realisations', '/contrat-maintenance'])
const EDGE_CACHE_TTL = 600 // 10 minutes

app.use(async (c, next) => {
  // Only cache GET requests for public pages
  if (c.req.method !== 'GET') return next()
  const url = new URL(c.req.url)
  if (!CACHEABLE_PATHS.has(url.pathname)) return next()

  // @ts-ignore — caches.default is available in CF Workers runtime
  const cache = (caches as any).default
  const cacheKey = new Request(url.toString(), { method: 'GET' })

  // Try to serve from edge cache
  const cached = await cache.match(cacheKey)
  if (cached) {
    // Add header to indicate cache hit
    const resp = new Response(cached.body, cached)
    resp.headers.set('X-Cache', 'HIT')
    return resp
  }

  // Generate fresh response
  await next()

  // Clone and cache the response at the edge
  if (c.res.status === 200) {
    const resp = c.res.clone()
    resp.headers.set('Cache-Control', `public, s-maxage=${EDGE_CACHE_TTL}, max-age=30`)
    resp.headers.set('X-Cache', 'MISS')
    // waitUntil lets us cache without blocking the response
    // @ts-ignore — executionCtx available in CF Workers
    const ctx = c.executionCtx
    if (ctx?.waitUntil) {
      ctx.waitUntil(cache.put(cacheKey, resp.clone()))
    }
  }
})

// ============================================================
// SECURITY HEADERS — CSP, HSTS, X-Frame-Options, etc.
// ============================================================
app.use(async (c, next) => {
  await next()
  c.res.headers.set('X-Content-Type-Options', 'nosniff')
  c.res.headers.set('X-Frame-Options', 'DENY')
  c.res.headers.set('X-XSS-Protection', '1; mode=block')
  c.res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  c.res.headers.set('Permissions-Policy', 'camera=(), microphone=()')
  c.res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  // CSP: allow inline styles/scripts for SSR JSX, Font Awesome CDN, Google Analytics
  c.res.headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net https://www.googletagmanager.com https://www.google-analytics.com; style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net https://fonts.googleapis.com; font-src 'self' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net https://fonts.gstatic.com; img-src 'self' data: https:; media-src 'self' data: https:; connect-src 'self' https://app.ligdicash.com https://www.google-analytics.com https://analytics.google.com https://www.google.com https://cdn.jsdelivr.net https://api.imgbb.com;")
  // Cache control per route type
  const path = new URL(c.req.url).pathname
  if (path.startsWith('/api/')) {
    // Prevent caching of API/JSON responses
    c.res.headers.set('Cache-Control', 'no-store')
    c.res.headers.set('Vary', 'Accept, Authorization')
  } else if (path.startsWith('/admin')) {
    // No caching for admin pages
    c.res.headers.set('Cache-Control', 'no-store, private')
  } else if (path.startsWith('/espace-client')) {
    // Short cache for authenticated pages
    c.res.headers.set('Cache-Control', 'private, max-age=0, no-cache')
  } else {
    // Cache public HTML pages at CF edge for 2 min, serve stale up to 10 min while revalidating
    c.res.headers.set('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=600, max-age=30')
    c.res.headers.set('Vary', 'Accept-Encoding')
  }
})

// ============================================================
// CSRF protection: verify Origin/Referer header on all state-changing requests
const ALLOWED_ORIGINS = [SITE_URL]
// Hôtes de développement. Ils ne sont acceptés que si la requête arrive
// elle-même sur un hôte local (npm run dev / wrangler pages dev) : en production
// le worker répond sur pages.dev, donc une origine http://localhost est refusée.
const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '::1', '[::1]'])

function csrfCheck(c: any): boolean {
  if (c.req.method === 'GET' || c.req.method === 'HEAD') return true
  let reqUrl: URL
  try { reqUrl = new URL(c.req.url) } catch { return false }
  const localRequest = LOCAL_HOSTNAMES.has(reqUrl.hostname)
  // Comparaison exacte de l'origine (scheme + host + port). L'ancien
  // origin.startsWith(o) acceptait https://maasga-website.pages.dev.attaquant.com,
  // ce qui vidait la protection CSRF de son intérêt.
  const isAllowed = (value: string): boolean => {
    let u: URL
    try { u = new URL(value) } catch { return false }
    if (u.origin === reqUrl.origin) return true          // même origine : prod, preview Pages, domaine custom
    if (ALLOWED_ORIGINS.includes(u.origin)) return true
    if (localRequest && LOCAL_HOSTNAMES.has(u.hostname)) return true
    return false
  }
  const origin = c.req.header('Origin') || ''
  if (origin) return isAllowed(origin)
  const referer = c.req.header('Referer') || ''
  if (referer) return isAllowed(referer)
  // If neither Origin nor Referer is present, block (safer default)
  return false
}

// Global CSRF middleware for all POST/PUT/DELETE requests (except payment callbacks from external providers)
app.use(async (c, next) => {
  if (c.req.method !== 'GET' && c.req.method !== 'HEAD') {
    // Allow external callbacks and API routes with Bearer auth
    const path = new URL(c.req.url).pathname
    if (path === '/api/payment/callback') return next()
    if (path === '/api/telegram/webhook') return next()
    if (path === '/api/products' && c.req.header('Authorization')?.startsWith('Bearer ')) return next()
    // Bootstrap endpoint: protégé par ADMIN_SECRET dans le body, pas besoin de CSRF
    if (path === '/api/admin/set-role-secret') return next()
    // Mobile app routes: no browser origin, authenticated via Bearer token
    if (path.startsWith('/api/mobile/') || path === '/api/auth/google/mobile') return next()
    // Push token endpoints — authenticated via Bearer Firebase, no browser origin
    if (path === '/api/client/push-token' && c.req.header('Authorization')?.startsWith('Bearer ')) return next()
    if (!csrfCheck(c)) {
      console.warn(`[CSRF] Blocked ${c.req.method} ${path} from origin: ${c.req.header('Origin') || 'none'}`)
      const csrfIp = c.req.header('cf-connecting-ip') || 'unknown'
      logSecurityEvent(c.env?.DB, { event: 'csrf_blocked', severity: 'warn', ip: csrfIp, details: `${c.req.method} ${path} from ${c.req.header('Origin') || 'no-origin'}` })
      return c.text('Requête rejetée (origine non autorisée).', 403)
    }
  }
  return next()
})

// Charger les produits ET orders depuis D1 en parallèle (une seule fois par isolate)
let _d1LoadPromise: Promise<void> | null = null

app.use(async (c, next) => {
  if (products.length === 0 && c.env.DB) {
    // Deduplicate: if already loading, wait for the same promise
    if (!_d1LoadPromise) {
      _d1LoadPromise = (async () => {
        const db = c.env.DB!
        const [prodResult, ordResult] = await Promise.allSettled([
          db.prepare('SELECT * FROM products').all(),
          getOrders(db)
        ])

        if (prodResult.status === 'fulfilled' && prodResult.value.results) {
          prodResult.value.results.forEach((p: any) => {
            products.push({
              id: p.id,
              name: p.name,
              brand: p.brand,
              model: p.model,
              btu: p.btu,
              price: p.price,
              price_install: 0,
              stock: p.stock,
              surface_min: p.surface_min,
              surface_max: p.surface_max,
              energy_class: p.energy_class,
              description: p.description,
              inverter: p.inverter === 1,
              available: p.available === 1,
              image: p.image || 'â„ï¸',
              imageUrl: p.imageUrl || p.image_url,
              features: (() => { try { return JSON.parse(p.features || '[]') } catch { return [] } })(),
              warranty: p.warranty || '1 an constructeur',
              techSpecs: (() => { try { return p.tech_specs ? JSON.parse(p.tech_specs) : undefined } catch { return undefined } })(),
              media: (() => { try { return p.media_urls ? JSON.parse(p.media_urls) : [] } catch { return [] } })()
            })
          })
        }

        if (ordResult.status === 'fulfilled' && Array.isArray(ordResult.value)) {
          (ordResult.value as any[]).forEach((o: any) => {
            orders.push({
              id: o.id,
              appointment_id: o.appointment_id,
              client_id: o.client_id,
              product_id: o.product_id,
              client_name: o.client_name,
              client_phone: o.client_phone,
              client_email: o.client_email || '',
              quartier: o.quartier,
              quantity: o.quantity || 1,
              total_price: o.total_price || 0,
              installation_price: o.installation_price || 0,
              type: o.type || 'devis',
              status: o.status || 'pending',
              notes: o.notes,
              created_at: o.created_at
            })
          })
        }
      })()
    }
    await _d1LoadPromise
  }
  await next()
})

// Servir les fichiers statiques avec cache
// @ts-ignore – manifest requis en prod CF Pages uniquement
app.use('/static/*', async (c, next) => {
  await next()
  if (c.res.status === 200) {
    c.res.headers.set('Cache-Control', 'public, max-age=2592000, immutable') // 30 jours
  }
})
app.use('/static/*', serveStatic({ root: './' } as any))

// ============================================================
// PAGES PUBLIQUES SSR & CDN R2 — Sous-application modulaire (src/routes/web)
// ============================================================
app.route('', webRouter)

// Favicon inline
app.get('/favicon.ico', (c) => c.body(null, 204))
app.get('/favicon.svg', (c) => {
  return new Response(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#0077b6"/><g transform="translate(16,16)" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round"><line y1="-10" y2="10"/><line x1="-8.66" y1="-5" x2="8.66" y2="5"/><line x1="-8.66" y1="5" x2="8.66" y2="-5"/><line x1="0" y1="-10" x2="-2.5" y2="-7"/><line x1="0" y1="-10" x2="2.5" y2="-7"/><line x1="0" y1="10" x2="-2.5" y2="7"/><line x1="0" y1="10" x2="2.5" y2="7"/><line x1="-8.66" y1="-5" x2="-7" y2="-2"/><line x1="-8.66" y1="-5" x2="-5.5" y2="-5.8"/><line x1="8.66" y1="5" x2="7" y2="2"/><line x1="8.66" y1="5" x2="5.5" y2="5.8"/><line x1="-8.66" y1="5" x2="-7" y2="2"/><line x1="-8.66" y1="5" x2="-5.5" y2="5.8"/><line x1="8.66" y1="-5" x2="7" y2="-2"/><line x1="8.66" y1="-5" x2="5.5" y2="-5.8"/><circle r="1.5" fill="white" stroke="none"/></g></svg>`,
    { headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'max-age=86400' } }
  )
})

// OG Image for social sharing (1200x630 standard)
// OG image — served as static PNG from public/og-image.png via Cloudflare Pages
// The _routes.json excludes /*.png so Pages serves public/og-image.png directly
// No worker route needed — social platforms (Facebook, WhatsApp, Twitter) get a real 1200x630 PNG

// Robots.txt
app.get('/robots.txt', (c) => {
  return new Response(
    `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\nSitemap: ${SITE_URL}/sitemap.xml`,
    { headers: { 'Content-Type': 'text/plain', 'Cache-Control': 'public, max-age=86400' } }
  )
})

// Sitemap.xml
app.get('/sitemap.xml', (c) => {
  const now = new Date().toISOString().split('T')[0]
  const pages = [
    { path: '/', freq: 'weekly', priority: '1.0' },
    { path: '/catalogue', freq: 'weekly', priority: '0.9' },
    { path: '/simulateur', freq: 'monthly', priority: '0.8' },
    { path: '/rendez-vous', freq: 'monthly', priority: '0.8' },
    { path: '/realisations', freq: 'monthly', priority: '0.7' },
    { path: '/avis', freq: 'weekly', priority: '0.7' },
    { path: '/a-propos', freq: 'monthly', priority: '0.6' },
    { path: '/contact', freq: 'monthly', priority: '0.7' },
    { path: '/espace-client', freq: 'monthly', priority: '0.6' },
    { path: '/contrat-maintenance', freq: 'monthly', priority: '0.7' }
  ]
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(p => `  <url><loc>${SITE_URL}${p.path}</loc><lastmod>${now}</lastmod><changefreq>${p.freq}</changefreq><priority>${p.priority}</priority></url>`).join('\n')}
</urlset>`
  return new Response(xml, { headers: { 'Content-Type': 'application/xml', 'Cache-Control': 'public, max-age=3600' } })
})

// ============================================================
// ERROR HANDLERS (500 & 404)
// ============================================================

// Global error handler — catch unhandled exceptions and display nice error page
app.onError((err, c) => {
  console.error('Unhandled error:', err.message, err.stack)
  return c.html(
    <html lang="fr">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="robots" content="noindex,nofollow" />
        <title>Erreur - MAASGA</title>
        <link rel="stylesheet" href="/static/tailwind.css" />
      </head>
      <body class="bg-gray-50 min-h-screen flex items-center justify-center p-4">
        <div class="text-center max-w-md">
          <div class="text-6xl mb-6">âš ï¸</div>
          <h1 class="text-2xl font-bold text-gray-900 mb-3">Erreur serveur</h1>
          <p class="text-gray-500 mb-8">Une erreur inattendue s'est produite. Veuillez réessayer.</p>
          <a href="/" class="bg-blue-600 text-white font-semibold px-8 py-3 rounded-xl hover:bg-blue-700 transition-colors inline-flex items-center space-x-2">
            <span>Retour Ã  l'accueil</span>
          </a>
        </div>
      </body>
    </html>,
    500
  )
})

app.notFound((c) => {
  return c.html(
    <html lang="fr">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="robots" content="noindex,nofollow" />
        <title>Page non trouvée - MAASGA</title>
        <link rel="stylesheet" href="/static/tailwind.css" />
      </head>
      <body class="bg-gray-50 min-h-screen flex items-center justify-center p-4">
        <div class="text-center max-w-md">
          <div class="text-8xl font-black text-blue-100 mb-4">404</div>
          <div class="text-6xl mb-6">â„ï¸</div>
          <h1 class="text-2xl font-bold text-gray-900 mb-3">Page introuvable</h1>
          <p class="text-gray-500 mb-8">Cette page n'existe pas ou a été déplacée.</p>
          <a href="/" class="bg-blue-600 text-white font-semibold px-8 py-3 rounded-xl hover:bg-blue-700 transition-colors inline-flex items-center space-x-2">
            <span>Retour Ã  l'accueil</span>
          </a>
        </div>
      </body>
    </html>,
    404
  )
})

// API MOBILE & CLIENT — Sous-application modulaire (src/routes/api-mobile)
// ============================================================
app.route('', mobileRouter)
app.route('', clientRouter)
app.route('', adminRouter)
app.route('', cronRouter)
app.route('', telegramRouter)

// ============================================================
// EXPORT : Hono app (Pages-compatible)
// For Workers with cron, use: export default { fetch: app.fetch, scheduled(...) { ... } }
// ============================================================


export default app
