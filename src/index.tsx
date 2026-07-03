import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import { setCookie, getCookie, deleteCookie } from 'hono/cookie'
import type { D1Database } from '@cloudflare/workers-types'
import { HomePage } from './pages/home'
import { CataloguePage } from './pages/catalogue'
import { SimulateurPage } from './pages/simulateur'
import { RendezVousPage } from './pages/rendez-vous'
import { AvisPage } from './pages/avis'
import { AProposPage } from './pages/a-propos'
import { ContactPage } from './pages/contact'
import { EspaceClientPage } from './pages/espace-client'
import { AdminPage, AdminProduitsPage, AdminRDVPage, AdminClientsPage, AdminCommandesPage, AdminAvisPage, AdminParametresPage, AdminDevisListPage, AdminDevisNewPage, AdminDevisDetailPage, AdminPaiementsPage, AdminMaintenancePage, AdminMessagesPage, AdminRealisationsPage, AdminSAVPage, AdminSAVDetailPage, AdminAuditLogPage, AdminNotificationsPage } from './pages/admin'
import { RealisationsPage } from './pages/realisations'
import { ContratMaintenancePage } from './pages/contrat-maintenance'
import { appointments, reviews, orders, clients, setMaintenanceDueCount } from './data/store'
import type { Order } from './data/store'
import { products } from './data/products'
import { quartiers } from './data/quartiers'
import { createAppointment, updateAppointmentStatus, createOrder, createReview, getProducts, getReviews, getQuartiers, createClient, getClients, getAppointments, getOrders, deleteProduct, deleteClient, deleteOrder, getClientById, getProductById } from './db'
import type { HonoEnv } from './types'
import { escapeHtml, isValidEmail, isValidPhone, normalizePhone, validateImageMagicBytes } from './utils/helpers'
import { sendSmsWithLog, notifyAdmin, logActivity, logSecurityEvent, sendTelegramMessage, ensureActivityLog, ensureNotificationsTable } from './utils/notifications'

// App Hono — types et utilitaires importés depuis ./types et ./utils/

const app = new Hono<HonoEnv>()

// SITE_URL centralisé — à synchroniser avec Layout.tsx si le domaine change
const SITE_URL = 'https://maasga-website.pages.dev'

app.use('/api/*', cors({
  origin: [SITE_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
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
  c.res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)')
  c.res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  // CSP: allow inline styles/scripts for SSR JSX, Google Maps embeds, Font Awesome CDN, Google Analytics
  c.res.headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net https://cdn.lordicon.com https://www.googletagmanager.com https://www.google-analytics.com; style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net https://fonts.googleapis.com; font-src 'self' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net https://fonts.gstatic.com; img-src 'self' data: https:; media-src 'self' data: https:; frame-src https://www.google.com; connect-src 'self' https://app.ligdicash.com https://www.google-analytics.com https://analytics.google.com https://cdn.jsdelivr.net https://cdn.lordicon.com;")
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
// RATE LIMITING (in-memory per isolate, sliding window)
// ============================================================
const rateLimitStore = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_MAX_ENTRIES = 10000 // Cap in-memory rate limit store to prevent OOM

function rateLimit(key: string, maxRequests: number, windowMs: number): { allowed: boolean; remaining: number } {
  rateLimitCleanup()
  const now = Date.now()
  const entry = rateLimitStore.get(key)
  if (!entry || now > entry.resetAt) {
    // Enforce size cap — evict expired entries first, then oldest if still over limit
    if (rateLimitStore.size >= RATE_LIMIT_MAX_ENTRIES) {
      for (const [k, v] of rateLimitStore) {
        if (now > v.resetAt) rateLimitStore.delete(k)
      }
      // If still over limit after purge, evict oldest entries
      if (rateLimitStore.size >= RATE_LIMIT_MAX_ENTRIES) {
        const iter = rateLimitStore.keys()
        rateLimitStore.delete(iter.next().value!)
      }
    }
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: maxRequests - 1 }
  }
  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0 }
  }
  entry.count++
  return { allowed: true, remaining: maxRequests - entry.count }
}

// Lazy cleanup of expired rate limit entries (runs during rateLimit checks)
let _lastRateLimitCleanup = 0
function rateLimitCleanup() {
  const now = Date.now()
  if (now - _lastRateLimitCleanup < 300000) return // max every 5 min
  _lastRateLimitCleanup = now
  for (const [key, entry] of rateLimitStore) {
    if (now > entry.resetAt) rateLimitStore.delete(key)
  }
}

// ADMIN AUTH HELPERS (must be defined before routes that use them)
// ============================================================

// Middleware auth admin — HMAC signed cookie
// Secret HMAC : OBLIGATOIRE via variable d'environnement ADMIN_SECRET
// Aucun fallback hardcodé — fail closed si non configuré
const TOKEN_MAX_AGE_MS = 24 * 60 * 60 * 1000 // 24h d'expiration

function getAdminSecret(env: any): string {
  const secret = env?.ADMIN_SECRET
  if (!secret || typeof secret !== 'string' || secret.length < 16) {
    throw new Error('ADMIN_SECRET env var manquante ou trop courte (min 16 chars). Configurez-la via: wrangler secret put ADMIN_SECRET')
  }
  return secret
}

async function signToken(payload: string, secret: string): Promise<string> {
  if (!secret) throw new Error('Secret HMAC requis pour signer le token')
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload))
  return payload + '.' + Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('')
}

async function verifyToken(token: string, secret: string): Promise<boolean> {
  if (!secret) return false
  const parts = token.split('.')
  if (parts.length < 2) return false
  const payload = parts.slice(0, -1).join('.')
  // Vérifier l'expiration du token (payload = admin_<timestamp>)
  const tsMatch = payload.match(/_(\d+)$/)
  if (tsMatch) {
    const tokenTime = parseInt(tsMatch[1], 10)
    if (Date.now() - tokenTime > TOKEN_MAX_AGE_MS) return false // Token expiré
  }
  const expected = await signToken(payload, secret)
  // Constant-time comparison to prevent timing attacks
  const enc = new TextEncoder()
  const a = enc.encode(token)
  const b = enc.encode(expected)
  if (a.byteLength !== b.byteLength) return false
  const keyData = crypto.getRandomValues(new Uint8Array(32))
  const hmacKey = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const [sigA, sigB] = await Promise.all([
    crypto.subtle.sign('HMAC', hmacKey, a),
    crypto.subtle.sign('HMAC', hmacKey, b),
  ])
  const arrA = new Uint8Array(sigA)
  const arrB = new Uint8Array(sigB)
  let diff = 0
  for (let i = 0; i < arrA.length; i++) diff |= arrA[i] ^ arrB[i]
  return diff === 0
}

// CSRF protection: verify Origin/Referer header on all state-changing requests
const ALLOWED_ORIGINS = [SITE_URL, 'http://localhost', 'http://127.0.0.1']
function csrfCheck(c: any): boolean {
  if (c.req.method === 'GET' || c.req.method === 'HEAD') return true
  const origin = c.req.header('Origin') || ''
  const referer = c.req.header('Referer') || ''
  if (origin) {
    return ALLOWED_ORIGINS.some(o => origin.startsWith(o))
  }
  if (referer) {
    return ALLOWED_ORIGINS.some(o => referer.startsWith(o))
  }
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
    if (!csrfCheck(c)) {
      console.warn(`[CSRF] Blocked ${c.req.method} ${path} from origin: ${c.req.header('Origin') || 'none'}`)
      const csrfIp = c.req.header('cf-connecting-ip') || 'unknown'
      logSecurityEvent(c.env?.DB, { event: 'csrf_blocked', severity: 'warn', ip: csrfIp, details: `${c.req.method} ${path} from ${c.req.header('Origin') || 'no-origin'}` })
      return c.text('Requête rejetée (origine non autorisée).', 403)
    }
  }
  return next()
})

const adminAuth = async (c: any, next: any) => {
  let secret: string
  try {
    secret = getAdminSecret(c.env)
  } catch (e: any) {
    console.error('[SECURITY] ' + e.message)
    return c.text('Configuration serveur incomplète. Contactez l\'administrateur.', 503)
  }
  const cookie = c.req.header('Cookie') || ''
  const match = cookie.match(/maasga_admin=([^;]+)/)
  if (match) {
    const valid = await verifyToken(decodeURIComponent(match[1]), secret)
    if (valid) {
      return next()
    }
    // Invalid token — potential tampering
    const adminIp = c.req.header('cf-connecting-ip') || 'unknown'
    logSecurityEvent(c.env?.DB, { event: 'admin_auth_invalid_token', severity: 'warn', ip: adminIp, details: 'Invalid admin cookie signature' })
  }
  // Forward error query param to login page
  const url = new URL(c.req.url)
  const error = url.searchParams.get('error')
  return c.html(AdminLoginPage({ error: error || undefined }))
}

// Charger les produits ET orders depuis D1 en parallèle (une seule fois par isolate)
let _d1LoadPromise: Promise<void> | null = null

app.use(async (c, next) => {
  if (products.length === 0 && c.env.DB) {
    // Deduplicate: if already loading, wait for the same promise
    if (!_d1LoadPromise) {
      _d1LoadPromise = (async () => {
        const db = c.env.DB!
        const [prodResult, ordResult] = await Promise.allSettled([
          db.prepare('SELECT * FROM products WHERE available = 1').all(),
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
              image: p.image || '❄️',
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
    `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\nSitemap: https://maasga-website.pages.dev/sitemap.xml`,
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
${pages.map(p => `  <url><loc>https://maasga-website.pages.dev${p.path}</loc><lastmod>${now}</lastmod><changefreq>${p.freq}</changefreq><priority>${p.priority}</priority></url>`).join('\n')}
</urlset>`
  return new Response(xml, { headers: { 'Content-Type': 'application/xml', 'Cache-Control': 'public, max-age=3600' } })
})

// ============================================================
// ROUTES PUBLIQUES
// ============================================================

// In-memory review cache (avoid D1 query on every homepage hit)
let _cachedReviews: any[] | null = null
let _reviewCacheTime = 0
const REVIEW_CACHE_TTL = 5 * 60 * 1000 // 5 minutes

app.get('/', async (c) => {
  const db = c.env.DB
  let approvedReviews: any[] = reviews.filter(r => r.approved)
  let clientCount = clients.length

  if (db) {
    const now = Date.now()
    if (_cachedReviews && (now - _reviewCacheTime) < REVIEW_CACHE_TTL) {
      approvedReviews = _cachedReviews
    } else {
      try {
        const dbReviews = await getReviews(db, true)
        if (dbReviews.length > 0) {
          approvedReviews = dbReviews as any[]
          _cachedReviews = approvedReviews
          _reviewCacheTime = now
        }
      } catch (_) {}
    }
    // Load client count from D1 for public visitors
    if (clientCount === 0) {
      try {
        const countResult = await db.prepare('SELECT COUNT(*) as cnt FROM clients').first() as any
        clientCount = countResult?.cnt || 0
      } catch (_) {}
    }
  }

  const avgNote = approvedReviews.length > 0
    ? approvedReviews.reduce((s: number, r: any) => s + r.note, 0) / approvedReviews.length
    : 0
  const stats = {
    clientCount,
    avgNote,
    reviewCount: approvedReviews.length
  }
  const topReviews = approvedReviews.filter((r: any) => r.note >= 4).slice(0, 6)
  return c.html(<HomePage stats={stats} topReviews={topReviews} />)
})

app.get('/catalogue', (c) => {
  const brand = c.req.query('brand')
  const btu = c.req.query('btu')
  const inverter = c.req.query('inverter')
  const available = c.req.query('available')
  const product = c.req.query('product')
  const page = Math.max(1, parseInt(c.req.query('page') || '1') || 1)
  return c.html(<CataloguePage filters={{ brand, btu, inverter, available, product }} page={page} />)
})

app.get('/simulateur', (c) => {
  const productId = c.req.query('product')
  let productData = null
  
  if (productId) {
    const id = parseInt(productId)
    productData = products.find(p => p.id === id)
  }
  
  return c.html(
    <SimulateurPage 
      product={productData?.id}
      productBtu={productData?.btu}
      productName={productData?.name}
      productBrand={productData?.brand}
      productModel={productData?.model}
    />
  )
})

app.get('/rendez-vous', (c) => {
  const productId = c.req.query('product')
  const type = c.req.query('type')
  const success = c.req.query('success') === '1'
  const error = c.req.query('error')
  const clientName = c.req.query('name')
  const clientPhone = c.req.query('phone')
  const surface = c.req.query('surface') || ''
  const btu = c.req.query('btu') || ''
  return c.html(<RendezVousPage success={success} error={error} productId={productId} type={type} clientName={clientName} clientPhone={clientPhone} surface={surface} btu={btu} />)
})

app.get('/avis', async (c) => {
  const success = c.req.query('success') === '1'
  const errorMsg = c.req.query('error')
  const db = c.env.DB
  let approvedReviews: any[] = reviews.filter(r => r.approved)
  if (db) {
    try {
      const dbReviews = await getReviews(db, true)
      approvedReviews = dbReviews as any[]
    } catch (_) {}
  }
  return c.html(<AvisPage success={success} error={errorMsg} approvedReviews={approvedReviews} />)
})

app.get('/a-propos', (c) => c.html(<AProposPage />))

app.get('/realisations', async (c) => {
  const db = c.env.DB
  let realisationsList: any[] = []
  if (db) {
    try {
      await ensureRealisationsTable(db)
      const result = await db.prepare('SELECT id, title, description, category, client_name, quartier, image_url, date_realisation, is_featured FROM realisations WHERE is_visible = 1 ORDER BY is_featured DESC, date_realisation DESC LIMIT 30').all()
      realisationsList = result?.results || []
    } catch(_) {}
  }
  return c.html(<RealisationsPage realisations={realisationsList} />)
})

app.get('/contrat-maintenance', (c) => {
  const success = c.req.query('success') === '1'
  const error = c.req.query('error')
  return c.html(<ContratMaintenancePage success={success} error={error} />)
})

app.get('/contact', (c) => {
  const success = c.req.query('success') === '1'
  return c.html(<ContactPage success={success} />)
})

// ============================================================
// ESPACE CLIENT
// ============================================================

// (Session-aware handler is defined below after session/auth utilities)

// Helper : rendre le dashboard directement (pas de redirect — évite les problèmes Set-Cookie en dev)
// Tables are now pre-created via migrations (0018_all_runtime_tables.sql)
// These ensure* functions kept as fallback for first-time setup only
let _tablesChecked = false
async function ensureMaintenanceTables(db: any) {
  if (_tablesChecked) return
  _tablesChecked = true
  try {
    await db.prepare(`CREATE TABLE IF NOT EXISTS maintenance_contracts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER,
      client_name TEXT NOT NULL,
      client_phone TEXT NOT NULL,
      order_id INTEGER DEFAULT NULL,
      plan_type TEXT NOT NULL CHECK(plan_type IN ('trimestriel','semestriel','annuel','sav_gratuit')),
      plan_price INTEGER NOT NULL DEFAULT 0,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','expired','cancelled')),
      total_visits INTEGER NOT NULL DEFAULT 0,
      completed_visits INTEGER NOT NULL DEFAULT 0,
      next_visit_date TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`).run()
    await db.prepare(`CREATE TABLE IF NOT EXISTS maintenance_visits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contract_id INTEGER,
      client_id INTEGER NOT NULL DEFAULT 0,
      client_name TEXT NOT NULL DEFAULT '',
      client_phone TEXT NOT NULL DEFAULT '',
      visit_type TEXT NOT NULL DEFAULT 'preventive' CHECK(visit_type IN ('preventive','occasionnelle','urgence')),
      visit_date TEXT NOT NULL,
      status TEXT DEFAULT 'planifiee' CHECK(status IN ('planifiee','confirmee','effectuee','annulee')),
      technician TEXT,
      description TEXT,
      actions_performed TEXT,
      gas_recharged INTEGER DEFAULT 0,
      filters_cleaned INTEGER DEFAULT 0,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (contract_id) REFERENCES maintenance_contracts(id)
    )`).run()
    await db.prepare(`CREATE TABLE IF NOT EXISTS maintenance_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      quartier TEXT,
      request_type TEXT NOT NULL DEFAULT 'occasionnelle' CHECK(request_type IN ('occasionnelle','urgence','contrat')),
      description TEXT,
      preferred_date TEXT,
      equipment_type TEXT,
      plan_type TEXT,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','contacted','scheduled','done','cancelled')),
      admin_notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`).run()
  } catch(_) { /* tables may already exist */ }
  // Ensure missing columns are added to existing tables (migration-safe)
  try { await db.prepare('ALTER TABLE maintenance_requests ADD COLUMN plan_type TEXT').run() } catch(_) { /* column already exists */ }
}


// Ensure payments table
async function ensurePaymentTables(db: any) {
  try {
    await db.prepare(`CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER,
      client_name TEXT,
      client_phone TEXT,
      order_id INTEGER,
      maintenance_request_id INTEGER,
      payment_type TEXT NOT NULL DEFAULT 'order' CHECK(payment_type IN ('order','maintenance_contract','maintenance_request')),
      amount INTEGER NOT NULL,
      currency TEXT NOT NULL DEFAULT 'XOF',
      method TEXT CHECK(method IN ('ligdicash','carte','orange_money','moov_money','wave','cash')),
      provider_ref TEXT,
      provider_status TEXT,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','processing','completed','failed','cancelled','refunded')),
      metadata TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`).run()
  } catch(_) {}
}
  

// Ensure contact_messages table
async function ensureContactMessages(db: any) {
  try {
    await db.prepare(`CREATE TABLE IF NOT EXISTS contact_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      message TEXT NOT NULL,
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`).run()
  } catch(_) {}
}

// Ensure realisations table
async function ensureRealisationsTable(db: any) {
  try {
    await db.prepare(`CREATE TABLE IF NOT EXISTS realisations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT DEFAULT 'climatisation',
      client_name TEXT,
      quartier TEXT,
      image_url TEXT,
      date_realisation TEXT,
      is_featured INTEGER DEFAULT 0,
      is_visible INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`).run()
  } catch(_) {}
}

// Ensure stock_alerts table
async function ensureStockAlerts(db: any) {
  try {
    await db.prepare(`CREATE TABLE IF NOT EXISTS stock_alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      phone TEXT NOT NULL,
      notified INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`).run()
  } catch(_) {}
}

// Ensure stock_movements table
async function ensureStockMovements(db: any) {
  try {
    await db.prepare(`CREATE TABLE IF NOT EXISTS stock_movements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      product_name TEXT DEFAULT '',
      movement_type TEXT NOT NULL DEFAULT 'ajustement',
      quantity INTEGER NOT NULL,
      stock_before INTEGER NOT NULL,
      stock_after INTEGER NOT NULL,
      reason TEXT DEFAULT '',
      reference TEXT DEFAULT '',
      created_by TEXT DEFAULT 'admin',
      created_at TEXT DEFAULT (datetime('now'))
    )`).run()
    await db.prepare(`CREATE INDEX IF NOT EXISTS idx_stock_moves_product ON stock_movements(product_id)`).run()
  } catch(_) {}
}

// Log stock movement
async function logStockMovement(db: any, productId: number, productName: string, type: string, quantity: number, stockBefore: number, stockAfter: number, reason: string = '', reference: string = '') {
  try {
    await ensureStockMovements(db)
    await db.prepare('INSERT INTO stock_movements (product_id, product_name, movement_type, quantity, stock_before, stock_after, reason, reference) VALUES (?,?,?,?,?,?,?,?)').bind(productId, productName, type, quantity, stockBefore, stockAfter, reason, reference).run()
  } catch(_) {}
}

// Ensure site_settings table
async function ensureSiteSettings(db: any) {
  try {
    await db.prepare(`CREATE TABLE IF NOT EXISTS site_settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL DEFAULT '',
      updated_at TEXT DEFAULT (datetime('now'))
    )`).run()
    // Insert defaults if empty
    const count = await db.prepare('SELECT COUNT(*) as cnt FROM site_settings').first()
    if (!(count as any)?.cnt) {
      const defaults: [string, string][] = [
        ['phone', '+226 55 99 64 18'], ['email', 'maasgabf@gmail.com'],
        ['address', 'Ouagadougou, Burkina Faso'], ['hours', 'Lundi–Dimanche · 8h00–18h00'],
        ['company_name', 'MAASGA'], ['whatsapp', '+226 55 99 64 18'],
        ['facebook', ''], ['instagram', ''], ['slogan', 'Spécialiste climatisation & froid à Ouagadougou']
      ]
      for (const [k, v] of defaults) {
        await db.prepare('INSERT OR IGNORE INTO site_settings (key, value) VALUES (?, ?)').bind(k, v).run()
      }
    }
  } catch(_) {}
}

// Get all site settings as object
async function getSiteSettings(db: any): Promise<Record<string, string>> {
  try {
    await ensureSiteSettings(db)
    const rows = (await db.prepare('SELECT key, value FROM site_settings').all())?.results || []
    const settings: Record<string, string> = {}
    ;(rows as any[]).forEach((r: any) => { settings[r.key] = r.value })
    return settings
  } catch(_) { return {} }
}

// Ensure SAV tickets tables
async function ensureSavTables(db: any) {
  try {
    await db.prepare(`CREATE TABLE IF NOT EXISTS sav_tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_ref TEXT NOT NULL UNIQUE,
      client_phone TEXT NOT NULL,
      client_name TEXT DEFAULT '',
      client_email TEXT DEFAULT '',
      category TEXT NOT NULL DEFAULT 'autre',
      priority TEXT NOT NULL DEFAULT 'normal',
      subject TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'ouvert',
      assigned_to TEXT DEFAULT '',
      order_id INTEGER DEFAULT NULL,
      product_info TEXT DEFAULT '',
      resolution_notes TEXT DEFAULT '',
      resolved_at TEXT DEFAULT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )`).run()
    await db.prepare(`CREATE TABLE IF NOT EXISTS sav_ticket_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id INTEGER NOT NULL,
      sender_type TEXT NOT NULL DEFAULT 'client',
      sender_name TEXT DEFAULT '',
      message TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )`).run()
    await db.prepare(`CREATE INDEX IF NOT EXISTS idx_tickets_status ON sav_tickets(status)`).run()
    await db.prepare(`CREATE INDEX IF NOT EXISTS idx_ticket_msgs ON sav_ticket_messages(ticket_id)`).run()
  } catch(_) {}
}

// Notification utilities imported from ./utils/notifications

async function renderDashboard(c: any, clientId: number) {
  const db = c.env.DB
  if (!_tablesChecked) {
    await ensureMaintenanceTables(db)
    await ensurePaymentTables(db)
    await ensureActivityLog(db)
    _tablesChecked = true
  }
  const client = await db.prepare(
    'SELECT id, name, phone, email, quartier, created_at FROM clients WHERE id = ?'
  ).bind(clientId).first() as any
  if (!client) {
    // Clear invalid session cookie to prevent redirect loop
    return new Response(null, {
      status: 302,
      headers: {
        'Location': '/espace-client?error=' + encodeURIComponent('Session invalide.'),
        'Set-Cookie': 'maasga_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'
      }
    })
  }
  // Rétroactivement lier les commandes créées avec ce téléphone mais sans client_id
  // Gère les variantes de format : "55996418", "+22655996418", "0022655996418"
  if (client.phone) {
    try {
      const rawPhone = client.phone.replace(/\D/g, '')
      const last8 = rawPhone.slice(-8)
      await db.prepare("UPDATE orders SET client_id = ? WHERE (client_phone = ? OR client_phone LIKE ?) AND (client_id IS NULL OR client_id = 0)")
        .bind(clientId, client.phone, `%${last8}`).run()
    } catch(_) {}
  }
  // Batch all dashboard queries for performance — wrapped in try/catch for resilience
  let orders: any[] = [], rdvs: any[] = [], maintenanceContracts: any[] = []
  let maintenanceVisits: any[] = [], maintenanceRequests: any[] = []
  let clientPayments: any[] = [], activityLog: any[] = []
  try {
    const [ordersRes, rdvsRes, contractsRes, visitsRes, requestsRes, paymentsRes, activityRes] = await db.batch([
      db.prepare('SELECT o.id, o.type, o.status, o.notes, o.total_price, o.delivered_at, o.installed_at, o.created_at, p.name as product_name, p.btu, p.brand, p.image FROM orders o LEFT JOIN products p ON o.product_id = p.id WHERE (o.client_phone = ? OR o.client_id = ?) GROUP BY o.id ORDER BY o.created_at DESC').bind(client.phone, clientId),
      db.prepare('SELECT id, date, heure_debut, heure_fin, type, status, quartier, notes, created_at FROM appointments WHERE phone = ? ORDER BY date DESC').bind(client.phone),
      db.prepare('SELECT id, plan_type, plan_price, start_date, end_date, status, total_visits, completed_visits, next_visit_date, notes, order_id FROM maintenance_contracts WHERE (client_phone = ? OR (client_id IS NOT NULL AND client_id = ?)) GROUP BY id ORDER BY created_at DESC').bind(client.phone, clientId),
      db.prepare('SELECT id, contract_id, visit_type, visit_date, status, technician, description, actions_performed, notes FROM maintenance_visits WHERE (client_phone = ? OR (client_id IS NOT NULL AND client_id = ?)) GROUP BY id ORDER BY visit_date DESC').bind(client.phone, clientId),
      db.prepare('SELECT id, request_type, description, preferred_date, equipment_type, plan_type, status, created_at FROM maintenance_requests WHERE phone = ? ORDER BY created_at DESC').bind(client.phone),
      db.prepare('SELECT id, payment_type, amount, method, status, provider_ref, order_id, created_at FROM payments WHERE client_phone = ? ORDER BY created_at DESC').bind(client.phone),
      db.prepare('SELECT id, action, category, details, created_at FROM user_activity_log WHERE client_id = ? ORDER BY created_at DESC LIMIT 50').bind(clientId)
    ])
    orders = ordersRes.results || []
    rdvs = rdvsRes.results || []
    maintenanceContracts = contractsRes.results || []
    maintenanceVisits = visitsRes.results || []
    maintenanceRequests = requestsRes.results || []
    clientPayments = paymentsRes.results || []
    activityLog = activityRes.results || []

    // Auto-sync : passe les commandes encore à 'pending' dont le paiement est 'completed' → 'paid'
    for (const p of clientPayments.filter((p: any) => p.status === 'completed' && p.order_id)) {
      const ord = (orders as any[]).find((o: any) => o.id === p.order_id && o.status === 'pending')
      if (ord) {
        try {
          await db.prepare('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?')
            .bind('paid', new Date().toISOString(), ord.id).run()
          ord.status = 'paid'
        } catch(_) {}
      }
    }
  } catch (batchErr) {
    console.error('Dashboard batch query error:', batchErr)
    // Fallback: run core queries individually so dashboard still renders
    try { orders = (await db.prepare('SELECT o.id, o.type, o.status, o.notes, o.total_price, o.delivered_at, o.installed_at, o.created_at, p.name as product_name, p.btu, p.brand, p.image FROM orders o LEFT JOIN products p ON o.product_id = p.id WHERE (o.client_phone = ? OR o.client_id = ?) GROUP BY o.id ORDER BY o.created_at DESC').bind(client.phone, clientId).all()).results || [] } catch(_) {}
    try { rdvs = (await db.prepare('SELECT id, date, heure_debut, heure_fin, type, status, quartier, notes, created_at FROM appointments WHERE phone = ? ORDER BY date DESC').bind(client.phone).all()).results || [] } catch(_) {}
    try { activityLog = (await db.prepare('SELECT id, action, category, details, created_at FROM user_activity_log WHERE client_id = ? ORDER BY created_at DESC LIMIT 50').bind(clientId).all()).results || [] } catch(_) {}
  }
  return c.html(<EspaceClientPage
    loggedIn={true}
    clientName={client.name || ''}
    clientPhone={client.phone || ''}
    clientEmail={client.email || ''}
    clientQuartier={client.quartier || ''}
    clientOrders={orders as any[]}
    clientRdvs={rdvs as any[]}
    clientSince={client.created_at || ''}
    clientMaintenanceContracts={maintenanceContracts as any[]}
    clientMaintenanceVisits={maintenanceVisits as any[]}
    clientMaintenanceRequests={maintenanceRequests as any[]}
    clientPayments={clientPayments as any[]}
    clientActivityLog={activityLog as any[]}
  />)
}

// Helper : hachage mot de passe sécurisé (PBKDF2 avec salt unique par utilisateur)
async function hashPassword(password: string, salt?: string): Promise<string> {
  const encoder = new TextEncoder()
  // Si pas de salt fourni, en générer un nouveau (16 bytes hex)
  if (!salt) {
    const saltBytes = new Uint8Array(16)
    crypto.getRandomValues(saltBytes)
    salt = Array.from(saltBytes).map(b => b.toString(16).padStart(2, '0')).join('')
  }
  const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits'])
  const derivedBits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: encoder.encode(salt), iterations: 100000, hash: 'SHA-256' },
    keyMaterial, 256
  )
  const hash = Array.from(new Uint8Array(derivedBits)).map(b => b.toString(16).padStart(2, '0')).join('')
  return `pbkdf2:${salt}:${hash}`
}

// Vérifier un mot de passe contre un hash stocké (supporte ancien SHA-256 + nouveau PBKDF2)
async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (storedHash.startsWith('pbkdf2:')) {
    const parts = storedHash.split(':')
    if (parts.length !== 3) return false
    const salt = parts[1]
    const rehashed = await hashPassword(password, salt)
    return rehashed === storedHash
  }
  // Rétrocompatibilité : ancien format SHA-256 simple (migration automatique au login)
  console.warn('Legacy SHA-256 password verification attempt — will auto-migrate to PBKDF2')
  const encoder = new TextEncoder()
  const data = encoder.encode(password + 'maasga_salt_2025')
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const legacyHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')
  return legacyHash === storedHash
}

// Générer un token de session sécurisé (non devinable)
function generateSessionToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

// Store sessions serveur — D1-backed with in-memory cache for performance
const SESSION_TTL_MS = 86400000 // 24h
const SESSION_CACHE_MAX_SIZE = 500 // Max entries in memory cache
const sessionCache = new Map<string, { clientId: number; createdAt: number }>()

async function ensureSessionTable(db: any) {
  try {
    await db.prepare(`CREATE TABLE IF NOT EXISTS client_sessions (
      token TEXT PRIMARY KEY,
      client_id INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL
    )`).run()
  } catch(_) {}
}

async function setSession(db: any, token: string, clientId: number) {
  const now = Date.now()
  // Enforce session cache size limit — evict oldest entries
  if (sessionCache.size >= SESSION_CACHE_MAX_SIZE) {
    let oldest: string | null = null, oldestTime = Infinity
    for (const [k, v] of sessionCache) {
      if (v.createdAt < oldestTime) { oldest = k; oldestTime = v.createdAt }
    }
    if (oldest) sessionCache.delete(oldest)
  }
  sessionCache.set(token, { clientId, createdAt: now })
  if (db) {
    try {
      await ensureSessionTable(db)
      await db.prepare('INSERT OR REPLACE INTO client_sessions (token, client_id, created_at, expires_at) VALUES (?, ?, ?, ?)')
        .bind(token, clientId, now, now + SESSION_TTL_MS).run()
    } catch(_) {}
  }
}

async function getSession(db: any, token: string): Promise<{ clientId: number; createdAt: number } | null> {
  // Check in-memory cache first
  const cached = sessionCache.get(token)
  if (cached) {
    if (Date.now() - cached.createdAt < SESSION_TTL_MS) return cached
    sessionCache.delete(token)
  }
  // Fallback to D1 (survives redeploys)
  if (db) {
    try {
      await ensureSessionTable(db)
      // Probabilistic cleanup: ~1% of requests purge expired sessions
      if (Math.random() < 0.01) {
        await db.prepare('DELETE FROM client_sessions WHERE expires_at < ?').bind(Date.now()).run()
      }
      const row = await db.prepare('SELECT client_id, created_at FROM client_sessions WHERE token = ? AND expires_at > ?')
        .bind(token, Date.now()).first() as any
      if (row) {
        const session = { clientId: row.client_id, createdAt: row.created_at }
        sessionCache.set(token, session)
        return session
      }
    } catch(_) {}
  }
  return null
}

async function deleteSession(db: any, token: string) {
  sessionCache.delete(token)
  if (db) {
    try {
      await ensureSessionTable(db)
      await db.prepare('DELETE FROM client_sessions WHERE token = ?').bind(token).run()
    } catch(_) {}
  }
}

// ============================================================
// EMAIL VERIFICATION (Brevo / Sendinblue API)
// ============================================================

// Ensure email_verifications table
async function ensureEmailVerificationTable(db: any) {
  try {
    await db.prepare(`CREATE TABLE IF NOT EXISTS email_verifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      email TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      verified INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL
    )`).run()
  } catch(_) {}
}

const EMAIL_VERIFY_TTL = 24 * 60 * 60 * 1000 // 24h

function generateEmailToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

async function sendVerificationEmail(env: any, toEmail: string, toName: string, verifyUrl: string): Promise<boolean> {
  const apiKey = env.BREVO_API_KEY
  if (!apiKey) {
    console.warn('[EMAIL] BREVO_API_KEY not configured — skipping verification email')
    return false
  }

  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        sender: { name: 'MAASGA', email: 'maasgabf@gmail.com' },
        to: [{ email: toEmail, name: toName }],
        subject: 'Vérifiez votre email — MAASGA',
        htmlContent: `<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f8fafc;">
<div style="max-width:560px;margin:40px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
  <div style="background:linear-gradient(135deg,#03045e,#0077b6);padding:32px;text-align:center;">
    <div style="font-size:28px;font-weight:800;color:white;">MAASGA &#10052;</div>
    <div style="font-size:13px;color:rgba(255,255,255,0.8);margin-top:4px;">Froid &amp; Climatisation</div>
  </div>
  <div style="padding:32px;">
    <h2 style="font-size:20px;font-weight:700;color:#03045e;margin:0 0 16px;">Bonjour ${escapeHtml(toName)} !</h2>
    <p style="font-size:14px;color:#475569;line-height:1.6;margin:0 0 24px;">
      Merci de votre inscription. Pour activer votre espace client MAASGA, veuillez confirmer votre adresse email en cliquant sur le bouton ci-dessous.
    </p>
    <div style="text-align:center;margin:32px 0;">
      <a href="${escapeHtml(verifyUrl)}" style="display:inline-block;background:linear-gradient(135deg,#03045e,#0077b6);color:white;font-weight:700;font-size:15px;padding:14px 36px;border-radius:12px;text-decoration:none;">
        Verifier mon email
      </a>
    </div>
    <p style="font-size:12px;color:#94a3b8;line-height:1.6;">
      Ce lien expire dans 24 heures. Si vous n'avez pas cree de compte sur MAASGA, ignorez cet email.
    </p>
    <div style="margin-top:20px;padding-top:20px;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8;text-align:center;">
      MAASGA — Froid &amp; Climatisation - Ouagadougou, Burkina Faso<br>
      Tel: +226 55 99 64 18 - maasgabf@gmail.com
    </div>
  </div>
</div>
</body></html>`
      })
    })

    return res.ok
  } catch (e) {
    console.error('[EMAIL] Brevo send error:', e)
    return false
  }
}

// Send password reset code via email (Brevo SMTP API)
async function sendPasswordResetEmail(env: any, toEmail: string, toName: string, code: string): Promise<boolean> {
  const apiKey = env.BREVO_API_KEY
  if (!apiKey) {
    console.warn('[EMAIL] BREVO_API_KEY not configured — cannot send reset email')
    return false
  }

  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        sender: { name: 'MAASGA', email: 'maasgabf@gmail.com' },
        to: [{ email: toEmail, name: toName }],
        subject: 'Code de réinitialisation — MAASGA',
        htmlContent: `<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f8fafc;">
<div style="max-width:560px;margin:40px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
  <div style="background:linear-gradient(135deg,#03045e,#0077b6);padding:32px;text-align:center;">
    <div style="font-size:28px;font-weight:800;color:white;">MAASGA &#10052;</div>
    <div style="font-size:13px;color:rgba(255,255,255,0.8);margin-top:4px;">Froid &amp; Climatisation</div>
  </div>
  <div style="padding:32px;">
    <h2 style="font-size:20px;font-weight:700;color:#03045e;margin:0 0 16px;">Reinitialisation de mot de passe</h2>
    <p style="font-size:14px;color:#475569;line-height:1.6;margin:0 0 8px;">
      Bonjour ${escapeHtml(toName || 'Client')} !
    </p>
    <p style="font-size:14px;color:#475569;line-height:1.6;margin:0 0 24px;">
      Vous avez demande la reinitialisation de votre mot de passe. Voici votre code de verification :
    </p>
    <div style="text-align:center;margin:32px 0;">
      <div style="display:inline-block;background:linear-gradient(135deg,#03045e,#0077b6);color:white;font-weight:800;font-size:32px;padding:16px 40px;border-radius:16px;letter-spacing:0.3em;">
        ${escapeHtml(code)}
      </div>
    </div>
    <p style="font-size:14px;color:#475569;line-height:1.6;margin:0 0 8px;">
      Ce code expire dans <strong>15 minutes</strong>.
    </p>
    <p style="font-size:12px;color:#94a3b8;line-height:1.6;">
      Si vous n'avez pas demande cette reinitialisation, ignorez cet email. Votre mot de passe ne sera pas modifie.
    </p>
    <div style="margin-top:20px;padding-top:20px;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8;text-align:center;">
      MAASGA — Froid &amp; Climatisation - Ouagadougou, Burkina Faso<br>
      Tel: +226 55 99 64 18 - maasgabf@gmail.com
    </div>
  </div>
</div>
</body></html>`
      })
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error('[EMAIL] Brevo reset email failed:', res.status, errText)
    }
    return res.ok
  } catch (e) {
    console.error('[EMAIL] Brevo reset email error:', e)
    return false
  }
}

// Route: Verify email via link
app.get('/api/verify-email', async (c) => {
  const token = c.req.query('token') || ''
  const db = c.env.DB
  if (!db || !token) return c.redirect('/espace-client?error=' + encodeURIComponent('Lien de vérification invalide.'))

  try {
    await ensureEmailVerificationTable(db)
    const row = await db.prepare(
      'SELECT id, client_id, email FROM email_verifications WHERE token = ? AND verified = 0 AND expires_at > ?'
    ).bind(token, Date.now()).first() as any

    if (!row) {
      return c.redirect('/espace-client?error=' + encodeURIComponent('Lien de vérification invalide ou expiré.'))
    }

    // Mark as verified
    await db.prepare('UPDATE email_verifications SET verified = 1 WHERE id = ?').bind(row.id).run()

    // Update client's email_verified flag
    try {
      await db.prepare('ALTER TABLE clients ADD COLUMN email_verified INTEGER DEFAULT 0').run()
    } catch(_) { /* column may already exist */ }
    await db.prepare('UPDATE clients SET email_verified = 1 WHERE id = ?').bind(row.client_id).run()

    await logActivity(db, {
      clientId: row.client_id,
      action: 'Email vérifié: ' + row.email,
      category: 'auth'
    })

    return c.redirect('/espace-client?success=' + encodeURIComponent('Email vérifié avec succès ! Vous pouvez vous connecter.'))
  } catch (e) {
    console.error('[EMAIL] Verify error:', e)
    return c.redirect('/espace-client?error=' + encodeURIComponent('Erreur lors de la vérification.'))
  }
})

// Route: Resend verification email
app.post('/api/resend-verification', async (c) => {
  const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown'
  const rl = rateLimit(`resend-email:${ip}`, 3, 15 * 60 * 1000)
  if (!rl.allowed) {
    return c.json({ error: 'Trop de tentatives. Réessayez dans 15 minutes.' }, 429)
  }

  const sessionToken = getCookie(c, 'maasga_session') || ''
  const db = c.env.DB
  if (!db) return c.json({ error: 'Service indisponible' }, 503)

  const session = sessionToken ? await getSession(db, sessionToken) : null
  if (!session) return c.json({ error: 'Non connecté' }, 401)

  const client = await db.prepare('SELECT id, name, email FROM clients WHERE id = ?').bind(session.clientId).first() as any
  if (!client?.email) return c.json({ error: 'Aucun email associé à votre compte' }, 400)

  await ensureEmailVerificationTable(db)
  const emailToken = generateEmailToken()
  const now = Date.now()

  await db.prepare(
    'INSERT INTO email_verifications (client_id, email, token, created_at, expires_at) VALUES (?, ?, ?, ?, ?)'
  ).bind(client.id, client.email, emailToken, now, now + EMAIL_VERIFY_TTL).run()

  const baseUrl = new URL(c.req.url).origin
  const verifyUrl = `${baseUrl}/api/verify-email?token=${emailToken}`
  const sent = await sendVerificationEmail(c.env, client.email, client.name || '', verifyUrl)

  return c.json({ success: true, sent, message: sent ? 'Email de vérification envoyé.' : 'Email de vérification enregistré (envoi email non configuré).' })
})

// API Login
app.post('/api/login', async (c) => {
  // Rate limiting: 10 attempts per IP per 15 minutes + 20 per identifier
  const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown'
  const rl = rateLimit(`login:${ip}`, 10, 15 * 60 * 1000)
  if (!rl.allowed) {
    logSecurityEvent(c.env?.DB, { event: 'login_rate_limit_ip', severity: 'warn', ip, details: `Login rate limited for IP ${ip}` })
    return c.redirect('/espace-client?error=' + encodeURIComponent('Trop de tentatives. Réessayez dans 15 minutes.'))
  }

  const body = await c.req.parseBody()
  const identifier = (body['identifier'] as string || '').trim()

  // Rate limit per identifier (prevents distributed brute force)
  if (identifier) {
    const idRl = rateLimit(`login-id:${identifier.toLowerCase()}`, 20, 15 * 60 * 1000)
    if (!idRl.allowed) {
      logSecurityEvent(c.env?.DB, { event: 'login_rate_limit_id', severity: 'warn', ip, details: `Login rate limited for identifier ${identifier}` })
      return c.redirect('/espace-client?error=' + encodeURIComponent('Trop de tentatives sur ce compte. Réessayez dans 15 minutes.'))
    }
  }
  const password = (body['password'] as string || '').trim()
  const redirectParam = (body['redirect'] as string || '').trim()
  // Valider le redirect: doit commencer par / et ne contenir que des caractères sûrs
  const safeRedirect = (redirectParam && /^\/[a-z0-9\-\/]+$/i.test(redirectParam)) ? '/' + redirectParam.replace(/^\/+/, '') : ''

  if (!identifier || !password) {
    return c.redirect('/espace-client?error=' + encodeURIComponent('Identifiants manquants.') + (safeRedirect ? '&redirect=' + encodeURIComponent(redirectParam) : ''))
  }

  const db = c.env.DB

  // ── Vérification admin ──────────────────────────────────────────
  {
    let validAdminUsername = DEFAULT_ADMIN_USERNAME
    let validAdminHash = ''
    if (db) {
      try {
        await db.prepare('CREATE TABLE IF NOT EXISTS admin_settings (key TEXT PRIMARY KEY, value TEXT, updated_at TEXT)').run()
        const hashRow = await db.prepare('SELECT value FROM admin_settings WHERE key = ?').bind('admin_password_hash').first() as any
        if (hashRow?.value) validAdminHash = hashRow.value
        const userRow = await db.prepare('SELECT value FROM admin_settings WHERE key = ?').bind('admin_username').first() as any
        if (userRow?.value) validAdminUsername = userRow.value
      } catch(e) { /* table may not exist */ }
    }
    if (!validAdminHash) {
      const initPwd = c.env.ADMIN_INITIAL_PASSWORD
      if (!initPwd) return c.redirect('/espace-client?error=' + encodeURIComponent('Configuration admin incomplète. Définissez ADMIN_INITIAL_PASSWORD.'))
      validAdminHash = await hashPassword(initPwd)
    }
    const isAdminValid = await verifyPassword(password, validAdminHash)
    if (identifier === validAdminUsername && isAdminValid) {
      // Migration auto vers PBKDF2 si ancien hash
      if (!validAdminHash.startsWith('pbkdf2:') && db) {
        const newHash = await hashPassword(password)
        try { await db.prepare('INSERT OR REPLACE INTO admin_settings (key, value, updated_at) VALUES (?, ?, ?)').bind('admin_password_hash', newHash, new Date().toISOString()).run() } catch(_) {}
      }
      const secret = getAdminSecret(c.env)
      const token = await signToken(`admin_${Date.now()}`, secret)
      return new Response(null, {
        status: 302,
        headers: {
          'Location': '/admin',
          'Set-Cookie': `maasga_admin=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=86400`
        }
      })
    }
  }
  // ───────────────────────────────────────────────────────────────

  if (db) {
    try {
      // Normalise le numéro : essaie tel quel, avec +226, et sans espaces
      const cleanId = identifier.replace(/\s/g, '')
      const withPrefix = cleanId.startsWith('+226') ? cleanId : ('+226' + cleanId)
      const withoutPrefix = cleanId.startsWith('+226') ? cleanId.slice(4) : cleanId
      const client = await db.prepare(
        'SELECT id, name, password_hash FROM clients WHERE phone = ? OR phone = ? OR phone = ? OR email = ?'
      ).bind(cleanId, withPrefix, withoutPrefix, identifier).first() as any

      if (client && client.password_hash && client.password_hash !== 'pending') {
        // Client existant avec mot de passe
        const valid = await verifyPassword(password, client.password_hash)
        if (valid) {
          // Migration automatique vers PBKDF2 si ancien hash
          if (!client.password_hash.startsWith('pbkdf2:')) {
            const newHash = await hashPassword(password)
            await db.prepare('UPDATE clients SET password_hash = ?, updated_at = ? WHERE id = ?')
              .bind(newHash, new Date().toISOString(), client.id).run()
          }
          // Créer une session sécurisée server-side (D1-backed)
          const sessionToken = generateSessionToken()
          await setSession(db, sessionToken, client.id)
          await logActivity(db, { clientId: client.id, clientPhone: client.phone, action: 'Connexion réussie', category: 'auth', ip: c.req.header('cf-connecting-ip') || '' })
          const cookieHeader = `maasga_session=${sessionToken}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=86400`
          // PRG: toujours rediriger vers GET /espace-client pour que le cookie soit établi avant le rendu
          const loginRedirect = safeRedirect || '/espace-client'
          return new Response(null, { status: 302, headers: { 'Location': loginRedirect, 'Set-Cookie': cookieHeader } })
        }
        return c.redirect('/espace-client?error=' + encodeURIComponent('Mot de passe incorrect.'))
      }

      if (client && (!client.password_hash || client.password_hash === 'pending')) {
        // Client existant sans mot de passe: activer son compte
        const newHash = await hashPassword(password)
        await db.prepare('UPDATE clients SET password_hash = ?, updated_at = ? WHERE id = ?')
          .bind(newHash, new Date().toISOString(), client.id).run()
        const sessionToken = generateSessionToken()
        await setSession(db, sessionToken, client.id)
        await logActivity(db, { clientId: client.id, clientPhone: client.phone, action: 'Première connexion (activation compte)', category: 'auth', ip: c.req.header('cf-connecting-ip') || '' })
        const cookieHeader2 = `maasga_session=${sessionToken}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=86400`
        // PRG: rediriger pour que le cookie soit établi
        const activationRedirect = safeRedirect || '/espace-client'
        return new Response(null, { status: 302, headers: { 'Location': activationRedirect, 'Set-Cookie': cookieHeader2 } })
      }

      // Client introuvable: PAS d'auto-inscription, rediriger vers le formulaire d'inscription
      return c.redirect('/espace-client?tab=signup&error=' + encodeURIComponent('Aucun compte trouvé avec cet identifiant. Inscrivez-vous.'))
    } catch (e) {
      console.error('Login D1 error:', e)
    }
  }

  return c.redirect('/espace-client?error=' + encodeURIComponent('Identifiants incorrects. Veuillez reessayer.'))
})

// ============================================================
// CLIENT PASSWORD RESET — via Email (primary) + WhatsApp/SMS (fallback)
// ============================================================
const clientResetCodes = new Map<string, { code: string; phone: string; email: string; createdAt: number; used: boolean }>()
const CLIENT_RESET_CODE_MAX_AGE = 15 * 60 * 1000 // 15 minutes

// Ensure password_reset_codes table has email column
async function ensureResetCodesTable(db: any) {
  try {
    await db.prepare('CREATE TABLE IF NOT EXISTS password_reset_codes (token TEXT PRIMARY KEY, code TEXT NOT NULL, phone TEXT NOT NULL DEFAULT \'\', email TEXT NOT NULL DEFAULT \'\', created_at INTEGER NOT NULL, used INTEGER NOT NULL DEFAULT 0)').run()
    // Add email column if missing (migration-safe)
    try { await db.prepare('ALTER TABLE password_reset_codes ADD COLUMN email TEXT NOT NULL DEFAULT \'\'').run() } catch (_) { /* already exists */ }
  } catch(_) {}
}

// Page: Demander un reset
app.get('/espace-client/reset-password', (c) => {
  const error = c.req.query('error') || ''
  const success = c.req.query('success') || ''
  const step = c.req.query('step') || ''
  const token = c.req.query('token') || ''
  const method = c.req.query('method') || ''
  const sentTo = c.req.query('sent_to') || ''
  const resetPhone = c.req.query('phone') || ''

  return c.html(
    <html lang="fr">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="robots" content="noindex,nofollow" />
        <title>Réinitialisation mot de passe — MAASGA</title>
        <link rel="stylesheet" href="/static/tailwind.css" />
        <link rel="stylesheet" href="/static/style.css" />
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet" />
      </head>
      <body style="background:#f8fbff; min-height:100vh; display:flex; align-items:center; justify-content:center; padding:1rem;">
        <div class="w-full max-w-md">
          <div class="bg-white rounded-3xl shadow-xl p-8" style="border:1px solid rgba(0,119,182,0.1);">
            <div class="text-center mb-6">
              <a href="/" class="inline-block mb-3">
                <img src="/logo-site.png" alt="MAASGA" class="h-12 w-auto rounded-lg mx-auto" />
              </a>
              <h1 class="text-xl font-bold" style="color:#03045e;">
                {step === 'code' ? 'Entrez le code reçu' : step === 'newpwd' ? 'Nouveau mot de passe' : 'Mot de passe oublié'}
              </h1>
              <p class="text-xs mt-1" style="color:#64748b;">
                {step === 'code' && method === 'phone' ? 'Un agent MAASGA vous enverra le code par WhatsApp' :
                 step === 'code' ? `Un code de vérification a été envoyé à ${decodeURIComponent(sentTo || 'votre email')}` :
                 step === 'newpwd' ? 'Choisissez votre nouveau mot de passe' :
                 'Recevez un code de réinitialisation'}
              </p>
            </div>

            {error && <div class="mb-4 rounded-xl p-3 text-sm" style="background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.2); color:#ef4444;"><i class="fas fa-exclamation-circle mr-1"></i>{decodeURIComponent(error)}</div>}
            {success && <div class="mb-4 rounded-xl p-3 text-sm" style="background:rgba(16,185,129,0.08); border:1px solid rgba(16,185,129,0.2); color:#10b981;"><i class="fas fa-check-circle mr-1"></i>{decodeURIComponent(success)}</div>}

            {/* Step 1: Email */}
            {!step && !method && (
              <form method="post" action="/api/client/request-reset-email" class="space-y-4">
                <div>
                  <label class="block text-sm font-semibold mb-2" style="color:#03045e;">
                    <i class="fas fa-envelope mr-1" style="color:#0077b6;"></i>Adresse email
                  </label>
                  <input type="email" name="email" required placeholder="votre@email.com"
                    class="w-full rounded-xl px-4 py-3 text-sm outline-none" style="border:1.5px solid rgba(0,119,182,0.2); background:#f8fbff; color:#03045e;" />
                </div>
                <p class="text-xs" style="color:#94a3b8;"><i class="fas fa-info-circle mr-1"></i>Un code à 6 chiffres sera envoyé à votre adresse email.</p>
                <button type="submit" class="w-full font-bold py-3.5 rounded-2xl transition-all hover:-translate-y-0.5" style="background:linear-gradient(135deg,#03045e,#0077b6); box-shadow:0 8px 24px rgba(0,119,182,0.35); color:#ffffff;">
                  <i class="fas fa-paper-plane mr-2"></i>Recevoir le code par email
                </button>
              </form>
            )}

            {/* Step 2: Enter code */}
            {step === 'code' && (
              <form method="post" action="/api/client/verify-reset-code" class="space-y-4">
                <input type="hidden" name="token" value={token} />
                <div>
                  <label class="block text-sm font-semibold mb-2" style="color:#03045e;">Code de vérification (6 chiffres)</label>
                  <input type="text" name="code" required maxlength={6} pattern="[0-9]{6}" placeholder="000000" inputmode="numeric" autocomplete="one-time-code"
                    class="w-full rounded-xl px-4 py-3 text-center text-2xl font-bold tracking-widest outline-none" style="border:1.5px solid rgba(0,119,182,0.2); background:#f8fbff; color:#03045e; letter-spacing:0.5em;" />
                </div>
                <p class="text-xs text-center" style="color:#94a3b8;">
                  <i class="fas fa-clock mr-1"></i>Ce code expire dans 15 minutes
                </p>

                <button type="submit" class="w-full text-white font-bold py-3.5 rounded-2xl transition-all hover:-translate-y-0.5" style="background:linear-gradient(135deg,#03045e,#0077b6);">
                  <i class="fas fa-check mr-2"></i>Vérifier le code
                </button>
              </form>
            )}

            {/* Step 3: New password */}
            {step === 'newpwd' && (
              <form method="post" action="/api/client/reset-password" class="space-y-4">
                <input type="hidden" name="token" value={token} />
                <div>
                  <label class="block text-sm font-semibold mb-2" style="color:#03045e;">Nouveau mot de passe</label>
                  <input type="password" name="new_password" required minlength={8} placeholder="Min. 8 caractères (lettres + chiffres)"
                    class="w-full rounded-xl px-4 py-3 text-sm outline-none" style="border:1.5px solid rgba(0,119,182,0.2); background:#f8fbff; color:#03045e;" />
                </div>
                <div>
                  <label class="block text-sm font-semibold mb-2" style="color:#03045e;">Confirmer</label>
                  <input type="password" name="confirm_password" required minlength={8} placeholder="Retapez le mot de passe"
                    class="w-full rounded-xl px-4 py-3 text-sm outline-none" style="border:1.5px solid rgba(0,119,182,0.2); background:#f8fbff; color:#03045e;" />
                </div>
                <button type="submit" class="w-full text-white font-bold py-3.5 rounded-2xl transition-all hover:-translate-y-0.5" style="background:linear-gradient(135deg,#059669,#10b981);">
                  <i class="fas fa-key mr-2"></i>Réinitialiser mon mot de passe
                </button>
              </form>
            )}

            <div class="text-center mt-5">
              <a href="/espace-client" class="text-xs font-medium hover:underline" style="color:#0077b6;">
                <i class="fas fa-arrow-left mr-1"></i>Retour à la connexion
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
})

// Step 1a backend: EMAIL — Generate 6-digit code and send via Brevo email
app.post('/api/client/request-reset-email', async (c) => {
  const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown'
  const rl = rateLimit(`client-reset-email:${ip}`, 3, 15 * 60 * 1000)
  if (!rl.allowed) {
    return c.redirect('/espace-client/reset-password?error=' + encodeURIComponent('Trop de tentatives. Réessayez dans 15 min.'))
  }

  const body = await c.req.parseBody()
  const email = ((body['email'] as string) || '').trim().toLowerCase()

  if (!email || !isValidEmail(email)) {
    return c.redirect('/espace-client/reset-password?error=' + encodeURIComponent('Adresse email invalide.'))
  }

  const db = c.env.DB
  if (!db) return c.redirect('/espace-client/reset-password?error=' + encodeURIComponent('Service indisponible.'))

  // Check client exists with this email
  const client = await db.prepare(
    'SELECT id, name, phone, email FROM clients WHERE email = ?'
  ).bind(email).first() as any

  if (!client) {
    return c.redirect('/espace-client/reset-password?error=' + encodeURIComponent('Aucun compte trouvé avec cette adresse email.'))
  }

  // Generate cryptographically secure 8-digit code (crypto.getRandomValues, not Math.random)
  const codeBytes = new Uint32Array(1)
  crypto.getRandomValues(codeBytes)
  const code = String(10000000 + (codeBytes[0] % 90000000))
  const tokenBytes = new Uint8Array(16)
  crypto.getRandomValues(tokenBytes)
  const token = Array.from(tokenBytes).map(b => b.toString(16).padStart(2, '0')).join('')

  // Store in D1 (persistent) + fallback Map
  try {
    await ensureResetCodesTable(db)
    await db.prepare('DELETE FROM password_reset_codes WHERE created_at < ?').bind(Date.now() - CLIENT_RESET_CODE_MAX_AGE).run()
    await db.prepare('INSERT OR REPLACE INTO password_reset_codes (token, code, phone, email, created_at, used) VALUES (?, ?, ?, ?, ?, 0)')
      .bind(token, code, client.phone || '', email, Date.now()).run()
  } catch (e) {
    console.error('D1 reset code storage failed, using memory fallback:', e)
  }
  clientResetCodes.set(token, { code, phone: client.phone || '', email, createdAt: Date.now(), used: false })

  // Cleanup old codes from memory
  for (const [k, v] of clientResetCodes) {
    if (Date.now() - v.createdAt > CLIENT_RESET_CODE_MAX_AGE) clientResetCodes.delete(k)
  }

  // Send code via email (Brevo)
  const emailSent = await sendPasswordResetEmail(c.env, email, client.name || '', code)
  if (!emailSent) {
    return c.redirect('/espace-client/reset-password?error=' + encodeURIComponent('Erreur lors de l\'envoi de l\'email. Essayez avec votre numéro de téléphone.'))
  }

  // Mask email for display: s***@g***.com
  const [localPart, domain] = email.split('@')
  const maskedEmail = localPart.charAt(0) + '***@' + domain.charAt(0) + '***' + domain.slice(domain.lastIndexOf('.'))

  return c.redirect('/espace-client/reset-password?step=code&token=' + token + '&method=email&sent_to=' + encodeURIComponent(maskedEmail))
})

// Step 1b backend: PHONE (WhatsApp) — Generate 6-digit code and send via SMS/WhatsApp
app.post('/api/client/request-reset', async (c) => {
  const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown'
  const rl = rateLimit(`client-reset:${ip}`, 3, 15 * 60 * 1000)
  if (!rl.allowed) {
    return c.redirect('/espace-client/reset-password?error=' + encodeURIComponent('Trop de tentatives. Réessayez dans 15 min.'))
  }

  const body = await c.req.parseBody()
  const phone = normalizePhone(((body['phone'] as string) || '').trim())

  if (!phone || !isValidPhone(phone)) {
    return c.redirect('/espace-client/reset-password?error=' + encodeURIComponent('Numéro de téléphone invalide.'))
  }

  const db = c.env.DB
  if (!db) return c.redirect('/espace-client/reset-password?error=' + encodeURIComponent('Service indisponible.'))

  // Check client exists
  const fullPhone = '+226' + phone
  const client = await db.prepare(
    'SELECT id FROM clients WHERE phone = ? OR phone = ?'
  ).bind(phone, fullPhone).first() as any

  if (!client) {
    return c.redirect('/espace-client/reset-password?error=' + encodeURIComponent('Aucun compte trouvé avec ce numéro.'))
  }

  // Generate cryptographically secure 8-digit code (crypto.getRandomValues, not Math.random)
  const codeBytes2 = new Uint32Array(1)
  crypto.getRandomValues(codeBytes2)
  const code = String(10000000 + (codeBytes2[0] % 90000000))
  const tokenBytes = new Uint8Array(16)
  crypto.getRandomValues(tokenBytes)
  const token = Array.from(tokenBytes).map(b => b.toString(16).padStart(2, '0')).join('')
  const normalizedPhone = fullPhone.startsWith('+') ? fullPhone : '+226' + phone

  // Store in D1 (persistent) + fallback Map
  try {
    await ensureResetCodesTable(db)
    await db.prepare('DELETE FROM password_reset_codes WHERE created_at < ?').bind(Date.now() - CLIENT_RESET_CODE_MAX_AGE).run()
    await db.prepare('INSERT OR REPLACE INTO password_reset_codes (token, code, phone, email, created_at, used) VALUES (?, ?, ?, ?, ?, 0)')
      .bind(token, code, normalizedPhone, '', Date.now()).run()
  } catch (e) {
    console.error('D1 reset code storage failed, using memory fallback:', e)
  }
  clientResetCodes.set(token, { code, phone: normalizedPhone, email: '', createdAt: Date.now(), used: false })

  // Cleanup old codes from memory
  for (const [k, v] of clientResetCodes) {
    if (Date.now() - v.createdAt > CLIENT_RESET_CODE_MAX_AGE) clientResetCodes.delete(k)
  }

  // Notify admin via Telegram so they can send the code to the user via WhatsApp
  const waLink = 'https://wa.me/' + normalizedPhone.replace(/[^0-9]/g, '') + '?text=' + encodeURIComponent(`Bonjour! Voici votre code de réinitialisation MAASGA: ${code}\nCe code expire dans 15 minutes.`)
  if (c.env.TELEGRAM_BOT_TOKEN && c.env.TELEGRAM_CHAT_ID) {
    try {
      await fetch(`https://api.telegram.org/bot${c.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: c.env.TELEGRAM_CHAT_ID,
          text: `🔐 *Demande de réinitialisation*\nTéléphone: ${normalizedPhone}\nCode: \`${code}\`\n\n[Envoyer via WhatsApp](${waLink})`,
          parse_mode: 'Markdown'
        })
      })
    } catch (_) {}
  }
  // Also log the SMS/WhatsApp attempt
  await sendSmsWithLog(c.env, db, normalizedPhone, `MAASGA - Code: ${code} (expire dans 15 min)`)

  return c.redirect('/espace-client/reset-password?step=code&token=' + token + '&method=phone&phone=' + encodeURIComponent(normalizedPhone))
})

// Step 2 backend: Verify the code (works for both email and phone methods)
app.post('/api/client/verify-reset-code', async (c) => {
  const body = await c.req.parseBody()
  const token = ((body['token'] as string) || '').trim()
  const code = ((body['code'] as string) || '').trim()

  const db = c.env.DB
  
  // Try D1 first, then fallback to memory Map
  let entry: { code: string; phone: string; email: string; createdAt: number; used: boolean } | undefined
  if (db) {
    try {
      const row = await db.prepare('SELECT code, phone, email, created_at, used FROM password_reset_codes WHERE token = ?').bind(token).first() as any
      if (row) {
        entry = { code: row.code, phone: row.phone || '', email: row.email || '', createdAt: row.created_at, used: row.used === 1 }
      }
    } catch (_) {}
  }
  if (!entry) {
    entry = clientResetCodes.get(token)
  }
  
  if (!entry || entry.used || Date.now() - entry.createdAt > CLIENT_RESET_CODE_MAX_AGE) {
    return c.redirect('/espace-client/reset-password?error=' + encodeURIComponent('Code expiré ou invalide. Recommencez.'))
  }

  if (entry.code !== code) {
    return c.redirect('/espace-client/reset-password?step=code&token=' + token + '&error=' + encodeURIComponent('Code incorrect.'))
  }

  // Code valid — proceed to new password step
  return c.redirect('/espace-client/reset-password?step=newpwd&token=' + token)
})

// Step 3 backend: Set new password (works for both email and phone methods)
app.post('/api/client/reset-password', async (c) => {
  const body = await c.req.parseBody()
  const token = ((body['token'] as string) || '').trim()
  const newPwd = ((body['new_password'] as string) || '').trim()
  const confirmPwd = ((body['confirm_password'] as string) || '').trim()

  const db = c.env.DB
  if (!db) return c.redirect('/espace-client/reset-password?error=' + encodeURIComponent('Service indisponible.'))

  // Try D1 first, then fallback to memory Map
  let entry: { code: string; phone: string; email: string; createdAt: number; used: boolean } | undefined
  let entryFromD1 = false
  try {
    const row = await db.prepare('SELECT code, phone, email, created_at, used FROM password_reset_codes WHERE token = ?').bind(token).first() as any
    if (row) {
      entry = { code: row.code, phone: row.phone || '', email: row.email || '', createdAt: row.created_at, used: row.used === 1 }
      entryFromD1 = true
    }
  } catch (_) {}
  if (!entry) {
    entry = clientResetCodes.get(token)
  }

  if (!entry || entry.used || Date.now() - entry.createdAt > CLIENT_RESET_CODE_MAX_AGE) {
    return c.redirect('/espace-client/reset-password?error=' + encodeURIComponent('Session expirée. Recommencez.'))
  }

  if (!newPwd || newPwd.length < 8 || !/[a-zA-Z]/.test(newPwd) || !/[0-9]/.test(newPwd)) {
    return c.redirect('/espace-client/reset-password?step=newpwd&token=' + token + '&error=' + encodeURIComponent('Le mot de passe doit faire 8+ caractères avec lettres et chiffres.'))
  }
  if (newPwd !== confirmPwd) {
    return c.redirect('/espace-client/reset-password?step=newpwd&token=' + token + '&error=' + encodeURIComponent('Les mots de passe ne correspondent pas.'))
  }

  try {
    const newHash = await hashPassword(newPwd)
    // Update password by email or phone depending on which method was used
    if (entry.email) {
      await db.prepare('UPDATE clients SET password_hash = ?, updated_at = ? WHERE email = ?')
        .bind(newHash, new Date().toISOString(), entry.email).run()
    } else if (entry.phone) {
      await db.prepare('UPDATE clients SET password_hash = ?, updated_at = ? WHERE phone = ?')
        .bind(newHash, new Date().toISOString(), entry.phone).run()
    }

    // Mark token as used in D1 and memory
    if (entryFromD1) {
      await db.prepare('UPDATE password_reset_codes SET used = 1 WHERE token = ?').bind(token).run()
    }
    entry.used = true
    const memEntry = clientResetCodes.get(token)
    if (memEntry) memEntry.used = true

    return c.redirect('/espace-client?success=' + encodeURIComponent('Mot de passe réinitialisé avec succès ! Connectez-vous.'))
  } catch(e) {
    return c.redirect('/espace-client/reset-password?error=' + encodeURIComponent('Erreur lors de la réinitialisation.'))
  }
})

// API Inscription (après commande)
app.post('/api/register', async (c) => {
  // Rate limiting: 5 registrations per IP per 30 minutes
  const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown'
  const rl = rateLimit(`register:${ip}`, 5, 30 * 60 * 1000)
  if (!rl.allowed) {
    return c.redirect('/espace-client?tab=signup&error=' + encodeURIComponent('Trop de tentatives. Réessayez dans 30 minutes.'))
  }

  // Support both form-encoded and JSON body (client pages send JSON via fetch)
  const contentType = c.req.header('content-type') || ''
  let body: Record<string, any>
  const isJson = contentType.includes('application/json')
  if (isJson) {
    try {
      body = await c.req.json()
    } catch {
      return c.json({ success: false, error: 'Corps JSON invalide.' }, 400)
    }
  } else {
    body = await c.req.parseBody()
  }
  const name = ((body['name'] as string) || '').trim()
  const phone = ((body['phone'] as string) || '').trim()
  const email = ((body['email'] as string) || '').trim()
  const quartier = ((body['quartier'] as string) || '').trim()
  const password = ((body['password'] as string) || '').trim()
  const redirectParam = ((body['redirect'] as string) || '').trim()
  const safeRedirect = (redirectParam && /^\/[a-z0-9\-\/]+$/i.test(redirectParam)) ? '/' + redirectParam.replace(/^\/+/, '') : ''

  const errRedirect = (msg: string) => {
    if (isJson) return c.json({ success: false, error: msg }, 400)
    return c.redirect('/espace-client?tab=signup&error=' + encodeURIComponent(msg) + (safeRedirect ? '&redirect=' + encodeURIComponent(redirectParam) : ''))
  }

  if (!name || !phone) return errRedirect('Nom et téléphone sont obligatoires.')
  if (!isValidPhone(phone)) return errRedirect('Numéro de téléphone invalide (8 chiffres requis).')
  if (email && !isValidEmail(email)) return errRedirect('Adresse email invalide.')
  if (password.length < 8) return errRedirect('Le mot de passe doit faire au moins 8 caractères.')
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return errRedirect('Le mot de passe doit contenir des lettres et des chiffres.')
  }

  const db = c.env.DB
  if (!db) return errRedirect('Service temporairement indisponible.')

  try {
    const fullPhone = '+226' + normalizePhone(phone)
    const existing = await db.prepare(
      'SELECT id, password_hash FROM clients WHERE phone = ? OR phone = ?'
    ).bind(phone, fullPhone).first() as any

    if (existing && existing.password_hash && existing.password_hash !== 'pending') {
      return errRedirect('Un compte existe déjà avec ce numéro. Connectez-vous.')
    }

    const password_hash = await hashPassword(password)
    const now = new Date().toISOString()
    let clientId: number

    if (existing) {
      await db.prepare('UPDATE clients SET password_hash = ?, name = ?, email = ?, quartier = ?, updated_at = ? WHERE id = ?')
        .bind(password_hash, name, email || null, quartier || null, now, existing.id).run()
      clientId = existing.id
    } else {
      await db.prepare(
        'INSERT INTO clients (name, phone, email, quartier, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).bind(name, fullPhone, email || null, quartier || null, password_hash, now, now).run()
      const inserted = await db.prepare('SELECT id FROM clients WHERE phone = ?').bind(fullPhone).first() as any
      clientId = inserted?.id
    }
    if (!clientId) return errRedirect('Erreur lors de la création du compte.')

    // Créer une session sécurisée server-side (D1-backed)
    const sessionToken = generateSessionToken()
    await setSession(db, sessionToken, clientId)
    await logActivity(db, { clientId, clientPhone: fullPhone, action: 'Inscription nouveau compte', category: 'auth', ip: c.req.header('cf-connecting-ip') || '' })
    if (!existing) {
      await notifyAdmin(c.env, 'client', `${name} — Nouvelle inscription. Tél: ${fullPhone}${email ? ' | ' + email : ''}${quartier ? ' | ' + quartier : ''}`)
    }

    // Envoyer un email de vérification si un email est fourni
    if (email && db) {
      try {
        await ensureEmailVerificationTable(db)
        const emailToken = generateEmailToken()
        const emailNow = Date.now()
        await db.prepare(
          'INSERT INTO email_verifications (client_id, email, token, created_at, expires_at) VALUES (?, ?, ?, ?, ?)'
        ).bind(clientId, email, emailToken, emailNow, emailNow + EMAIL_VERIFY_TTL).run()
        const baseUrl = new URL(c.req.url).origin
        const verifyUrl = `${baseUrl}/api/verify-email?token=${emailToken}`
        await sendVerificationEmail(c.env, email, name, verifyUrl)
      } catch (emailErr) {
        console.error('Email verification send error (non-blocking):', emailErr)
      }
    }

    const cookieHeader3 = `maasga_session=${sessionToken}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=86400`
    if (isJson) {
      return new Response(JSON.stringify({ success: true, redirect: safeRedirect || '/espace-client' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Set-Cookie': cookieHeader3 }
      })
    }
    // PRG: rediriger pour que le cookie soit établi
    const registerRedirect = safeRedirect || '/espace-client'
    return new Response(null, { status: 302, headers: { 'Location': registerRedirect, 'Set-Cookie': cookieHeader3 } })
  } catch (e) {
    console.error('Register error:', e)
    return errRedirect('Erreur lors de la création du compte.')
  }
})

// ============================================================
// GOOGLE OAUTH
// ============================================================

app.get('/api/auth/google', (c) => {
  const clientId = c.env.GOOGLE_CLIENT_ID
  if (!clientId) return c.redirect('/espace-client?error=' + encodeURIComponent('Connexion Google non configurée.'))
  const redirectUri = new URL('/api/auth/google/callback', c.req.url).toString()
  const state = generateSessionToken().slice(0, 32)
  const redirectParam = c.req.query('redirect') || ''
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    state,
    prompt: 'select_account'
  })
  // Build response manually to guarantee Set-Cookie headers are sent with the redirect
  const googleUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  const headers = new Headers({ 'Location': googleUrl })
  headers.append('Set-Cookie', `oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`)
  if (redirectParam) {
    headers.append('Set-Cookie', `oauth_redirect=${encodeURIComponent(redirectParam)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`)
  }
  return new Response(null, { status: 302, headers })
})

app.get('/api/auth/google/callback', async (c) => {
  const db = c.env.DB
  const code = c.req.query('code')
  const state = c.req.query('state')
  const googleError = c.req.query('error')
  const savedState = getCookie(c, 'oauth_state')
  const oauthRedirect = getCookie(c, 'oauth_redirect') || ''
  // NOTE: Do NOT use deleteCookie(c, ...) here — it modifies Hono's internal response headers
  // which can overwrite Set-Cookie on the raw Response we return later. We manually clear them below.
  const clearOAuthCookies = 'oauth_state=; Path=/; Max-Age=0; SameSite=Lax; Secure'
  const clearOAuthRedirect = 'oauth_redirect=; Path=/; Max-Age=0; SameSite=Lax; Secure'
  const safeOAuthRedirect = (oauthRedirect && /^\/[a-z0-9\-\/]+$/i.test('/' + oauthRedirect.replace(/^\/+/, ''))) ? '/' + oauthRedirect.replace(/^\/+/, '') : ''

  // Helper: build redirect response with proper cookie cleanup
  const errorRedirect = (msg: string) => {
    const h = new Headers()
    h.set('Location', '/espace-client?error=' + encodeURIComponent(msg))
    h.append('Set-Cookie', clearOAuthCookies)
    h.append('Set-Cookie', clearOAuthRedirect)
    return new Response(null, { status: 302, headers: h })
  }

  // Handle Google-side errors (access_denied, consent refused, etc.)
  if (googleError) {
    const msg = googleError === 'access_denied' ? 'Accès refusé. Vous avez annulé la connexion Google.' : `Erreur Google: ${googleError}`
    return errorRedirect(msg)
  }

  if (!code) {
    return errorRedirect('Aucun code d\'autorisation reçu de Google.')
  }

  // State validation — require both state and cookie to be present and matching (CSRF protection)
  if (!savedState || !state || state !== savedState) {
    return errorRedirect('Erreur de sécurité (state invalide). Réessayez.')
  }

  const clientId = c.env.GOOGLE_CLIENT_ID
  const clientSecret = c.env.GOOGLE_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    return errorRedirect('Connexion Google non configurée.')
  }

  const redirectUri = new URL('/api/auth/google/callback', c.req.url).toString()

  try {
    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      }).toString()
    })
    const tokenData = await tokenRes.json() as any
    if (!tokenData.access_token) {
      console.error('Google token exchange failed:', JSON.stringify(tokenData))
      const detail = tokenData.error === 'redirect_uri_mismatch'
        ? 'URI de redirection non autorisée dans Google Console. Ajoutez: ' + redirectUri
        : tokenData.error === 'invalid_grant'
        ? 'Code expiré. Réessayez.'
        : tokenData.error_description || tokenData.error || 'Token invalide'
      return errorRedirect('Erreur Google: ' + detail)
    }

    // Get user info
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    })
    const user = await userRes.json() as any
    const googleEmail = (user.email || '').trim().toLowerCase()
    const googleName = user.name || user.given_name || googleEmail.split('@')[0]
    const googlePicture = user.picture || ''

    if (!googleEmail || !db) {
      return errorRedirect('Impossible de récupérer votre email Google.')
    }

    // Find or create client
    let client = await db.prepare(
      'SELECT id, name, phone, email FROM clients WHERE email = ?'
    ).bind(googleEmail).first() as any

    const now = new Date().toISOString()
    let clientIdNum: number

    if (client) {
      clientIdNum = client.id
      // Update google info if needed
      if (!client.name || client.name === googleEmail) {
        await db.prepare('UPDATE clients SET name = ?, updated_at = ? WHERE id = ?')
          .bind(googleName, now, client.id).run()
      }
    } else {
      // Create new client with Google info (no password — OAuth only)
      const googleHash = 'google_oauth:' + googleEmail
      await db.prepare(
        'INSERT INTO clients (name, phone, email, quartier, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).bind(googleName, '', googleEmail, '', googleHash, now, now).run()
      const inserted = await db.prepare('SELECT id FROM clients WHERE email = ?').bind(googleEmail).first() as any
      clientIdNum = inserted?.id
    }

    if (!clientIdNum) {
      return errorRedirect('Erreur lors de la connexion Google.')
    }

    // Create session (D1-backed)
    const sessionToken = generateSessionToken()
    await setSession(db, sessionToken, clientIdNum)
    await logActivity(db, { clientId: clientIdNum, clientPhone: '', action: `Connexion via Google (${googleEmail})`, category: 'auth', ip: c.req.header('cf-connecting-ip') || '' })

    // Build response with ALL Set-Cookie headers using Headers.append() to avoid overwrites
    const oauthTarget = safeOAuthRedirect || '/espace-client'
    const successHeaders = new Headers()
    successHeaders.set('Location', oauthTarget)
    successHeaders.append('Set-Cookie', `maasga_session=${sessionToken}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=86400`)
    successHeaders.append('Set-Cookie', clearOAuthCookies)
    successHeaders.append('Set-Cookie', clearOAuthRedirect)
    return new Response(null, { status: 302, headers: successHeaders })
  } catch (e) {
    console.error('Google OAuth error:', e)
    return errorRedirect('Erreur de connexion Google. Réessayez.')
  }
})

// ============================================================
// SESSION CHECK (for JS login gates)
// ============================================================

app.get('/api/session-check', async (c) => {
  const sessionToken = getCookie(c, 'maasga_session') || ''
  const db = c.env.DB
  const session = sessionToken ? await getSession(db, sessionToken) : null
  if (session && db) {
    try {
      const client = await db.prepare('SELECT id, name, phone, email, quartier FROM clients WHERE id = ?').bind(session.clientId).first() as any
      if (client) {
        return c.json({ loggedIn: true, clientId: session.clientId, name: client.name || '', phone: client.phone || '', email: client.email || '', quartier: client.quartier || '' })
      }
    } catch(_) {}
    return c.json({ loggedIn: true, clientId: session.clientId })
  }
  if (session) {
    return c.json({ loggedIn: true, clientId: session.clientId })
  }
  return c.json({ loggedIn: false })
})

// ============================================================
// CLIENT PROFILE UPDATE (for Google OAuth profile completion)
// ============================================================

app.post('/api/client/update-profile', async (c) => {
  const db = c.env.DB
  if (!db) return c.json({ error: 'Service indisponible' }, 503)

  const sessionToken = getCookie(c, 'maasga_session') || ''
  const session = sessionToken ? await getSession(db, sessionToken) : null
  if (!session) return c.json({ error: 'Non connecté' }, 401)

  const body = await c.req.json().catch(() => null) || await c.req.parseBody()
  const phone = normalizePhone(((body as any)?.phone || '').toString().trim())
  const quartier = ((body as any)?.quartier || '').toString().trim()
  const name = ((body as any)?.name || '').toString().trim()

  if (!phone && !quartier && !name) return c.json({ error: 'Aucune donnée à mettre à jour' }, 400)

  // Validate phone if provided
  if (phone) {
    if (!/^\d{8}$/.test(phone)) return c.json({ error: 'Numéro invalide (8 chiffres requis)' }, 400)
  }

  try {
    const updates: string[] = []
    const values: any[] = []
    if (phone) { updates.push('phone = ?'); values.push(phone) }
    if (quartier) { updates.push('quartier = ?'); values.push(quartier) }
    if (name) { updates.push('name = ?'); values.push(name) }
    updates.push('updated_at = ?'); values.push(new Date().toISOString())
    values.push(session.clientId)

    await db.prepare(`UPDATE clients SET ${updates.join(', ')} WHERE id = ?`).bind(...values).run()
    await logActivity(db, { clientId: session.clientId, clientPhone: phone || '', action: 'Profil mis à jour', category: 'profile', ip: c.req.header('cf-connecting-ip') || '' })

    // Return updated client data
    const client = await db.prepare('SELECT id, name, phone, email, quartier FROM clients WHERE id = ?').bind(session.clientId).first() as any
    return c.json({ success: true, name: client?.name || '', phone: client?.phone || '', email: client?.email || '', quartier: client?.quartier || '' })
  } catch (e) {
    return c.json({ error: 'Erreur lors de la mise à jour' }, 500)
  }
})

// ============================================================
// PAYMENT API (LigdiCash)
// ============================================================

app.post('/api/payment/initiate', async (c) => {
  const db = c.env.DB
  if (!db) return c.json({ error: 'Service indisponible' }, 503)

  // Require login
  const sessionToken = getCookie(c, 'maasga_session') || ''
  const session = sessionToken ? await getSession(c.env.DB, sessionToken) : null
  if (!session) {
    return c.json({ error: 'Veuillez vous connecter avant de payer.', redirect: '/espace-client' }, 401)
  }

  const body = await c.req.json().catch(() => null) || await c.req.parseBody()
  const paymentType = (body as any)?.payment_type || 'order'
  const amount = parseInt((body as any)?.amount || '0')
  const orderId = parseInt((body as any)?.order_id || '0') || null
  const maintenanceRequestId = parseInt((body as any)?.maintenance_request_id || '0') || null
  const method = (body as any)?.method || 'ligdicash'

  if (!amount || amount < 100) {
    return c.json({ error: 'Montant invalide' }, 400)
  }

  const client = await db.prepare('SELECT id, name, phone, email FROM clients WHERE id = ?').bind(session.clientId).first() as any
  if (!client) return c.json({ error: 'Client introuvable' }, 404)

  await ensurePaymentTables(db)

  // Create payment record
  await db.prepare(
    `INSERT INTO payments (client_id, client_name, client_phone, order_id, maintenance_request_id, payment_type, amount, method, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`
  ).bind(session.clientId, client.name, client.phone, orderId, maintenanceRequestId, paymentType, amount, method).run()

  const payment = await db.prepare('SELECT id FROM payments WHERE client_id = ? ORDER BY id DESC LIMIT 1').bind(session.clientId).first() as any

  // Log activity
  await logActivity(db, {
    clientId: session.clientId,
    clientPhone: client.phone,
    action: `Paiement initié — ${amount.toLocaleString()} FCFA (${paymentType})`,
    category: 'payment',
    details: JSON.stringify({ paymentId: payment?.id, method, orderId, maintenanceRequestId }),
    ip: c.req.header('cf-connecting-ip') || ''
  })

  // Paiement réel LigdiCash uniquement si PAYMENT_LIVE=true est explicitement défini en prod
  // Par défaut (tests), tout paiement est simulé instantanément
  const isLivePayment = c.env.PAYMENT_LIVE === 'true'
  const apiKey = c.env.LIGDICASH_API_KEY
  const authToken = c.env.LIGDICASH_AUTH_TOKEN

  if (isLivePayment && apiKey && authToken && !apiKey.startsWith('VOTRE')) {
    try {
      // LigdiCash API call
      const callbackUrl = new URL('/api/payment/callback', c.req.url).toString()
      const returnUrl = new URL('/espace-client', c.req.url).toString()
      const lgdRes = await fetch('https://app.ligdicash.com/pay/v01/redirect/checkout-invoice/create', {
        method: 'POST',
        headers: {
          'Apikey': apiKey,
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          commande: {
            invoice: { items: [{ name: `Paiement MAASGA #${payment?.id || 0}`, description: paymentType === 'order' ? 'Commande climatiseur' : 'Contrat maintenance', quantity: 1, unit_price: amount }], total_amount: amount, devise: 'XOF', description: `Paiement MAASGA - ${paymentType}` },
            store: { name: 'MAASGA', website_url: new URL('/', c.req.url).toString() },
            actions: { cancel_url: returnUrl, return_url: returnUrl, callback_url: callbackUrl },
            custom_data: { payment_id: String(payment?.id || 0), client_id: String(session.clientId) }
          }
        })
      })
      const lgdData = await lgdRes.json() as any
      if (lgdData.response_code === '00' && lgdData.response_text) {
        await db.prepare('UPDATE payments SET provider_ref = ?, provider_status = ?, status = ?, updated_at = ? WHERE id = ?')
          .bind(lgdData.token || '', 'initiated', 'processing', new Date().toISOString(), payment?.id).run()
        return c.json({ success: true, redirect_url: lgdData.response_text, payment_id: payment?.id })
      }
    } catch (e) {
      console.error('LigdiCash API error:', e)
    }
  }

  // Simulation automatique : paiement validé instantanément (mode test ou LigdiCash non activé)
  const now = new Date().toISOString()
  try {
    await db.prepare('UPDATE payments SET status = ?, provider_status = ?, updated_at = ? WHERE id = ?')
      .bind('completed', 'simulated', now, payment?.id).run()
  } catch(e) { console.error('Erreur simulation payment update:', e) }

  // Mark the linked order as paid
  if (orderId) {
    try {
      await db.prepare('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?').bind('paid', now, orderId).run()
      const memOrder = orders.find((o: any) => o.id === orderId)
      if (memOrder) memOrder.status = 'paid' as any
    } catch(e) { console.error('Erreur mise à jour statut commande après paiement simulé:', e) }
  }

  await logActivity(db, {
    clientId: session.clientId,
    clientPhone: client.phone,
    action: `Paiement validé (simulé) — ${amount.toLocaleString()} FCFA`,
    category: 'payment',
    details: JSON.stringify({ paymentId: payment?.id, method, orderId, simulated: true }),
    ip: c.req.header('cf-connecting-ip') || ''
  })
  await notifyAdmin(c.env, 'payment', `${client.phone} — ${amount.toLocaleString()} FCFA (${paymentType}) ✅ [simulé]`)

  return c.json({
    success: true,
    payment_id: payment?.id,
    redirect_url: '/espace-client?payment=success',
    simulated: true
  })
})

app.post('/api/payment/callback', async (c) => {
  const db = c.env.DB
  if (!db) return c.json({ ok: false }, 503)

  // Rate limit: 10 callbacks per IP per minute
  const cbIp = c.req.header('cf-connecting-ip') || 'unknown'
  const cbRl = rateLimit(`payment-callback:${cbIp}`, 10, 60 * 1000)
  if (!cbRl.allowed) {
    logSecurityEvent(db, { event: 'payment_rate_limit', severity: 'warn', ip: cbIp, details: 'Payment callback rate limited' })
    return c.json({ ok: false, error: 'rate limited' }, 429)
  }

  try {
    // Fail-closed: reject if LIGDICASH_AUTH_TOKEN is not configured
    const authToken = c.env.LIGDICASH_AUTH_TOKEN
    if (!authToken) {
      console.error('[PAYMENT] LIGDICASH_AUTH_TOKEN not configured — rejecting callback')
      logSecurityEvent(db, { event: 'payment_no_token', severity: 'critical', ip: cbIp, details: 'LIGDICASH_AUTH_TOKEN not configured' })
      return c.json({ ok: false, error: 'payment webhook not configured' }, 503)
    }
    const webhookToken = c.req.header('Authorization') || c.req.header('X-Webhook-Token') || ''
    const expectedBearer = `Bearer ${authToken}`
    if (webhookToken !== expectedBearer) {
      console.warn('[PAYMENT] Webhook rejected — invalid token from IP:', cbIp)
      logSecurityEvent(db, { event: 'payment_invalid_token', severity: 'critical', ip: cbIp, details: `Invalid webhook token from ${cbIp}` })
      return c.json({ ok: false, error: 'unauthorized' }, 401)
    }

    const body = await c.req.json() as any
    const paymentId = parseInt(body?.custom_data?.payment_id || '0')
    const status = body?.status || body?.response_code

    if (!paymentId) return c.json({ ok: false }, 400)

    await ensurePaymentTables(db)
    const providerStatus = String(status)
    const newStatus = (providerStatus === 'completed' || providerStatus === '00') ? 'completed' : (providerStatus === 'failed' ? 'failed' : 'processing')

    await db.prepare(
      'UPDATE payments SET provider_status = ?, status = ?, updated_at = ? WHERE id = ?'
    ).bind(providerStatus, newStatus, new Date().toISOString(), paymentId).run()

    if (newStatus === 'completed') {
      const payment = await db.prepare('SELECT client_id, client_phone, amount, payment_type, order_id FROM payments WHERE id = ?').bind(paymentId).first() as any
      if (payment) {
        // Mettre à jour le statut de la commande liée → 'paid'
        if (payment.order_id) {
          try {
            await db.prepare('UPDATE orders SET status = ? WHERE id = ?').bind('paid', payment.order_id).run()
            // Mettre à jour aussi en mémoire
            const memOrder = orders.find((o: any) => o.id === payment.order_id)
            if (memOrder) memOrder.status = 'paid' as any
          } catch(e) { console.error('Erreur mise à jour statut commande après paiement:', e) }
        }
        await logActivity(db, {
          clientId: payment.client_id,
          clientPhone: payment.client_phone,
          action: `Paiement confirmé — ${payment.amount?.toLocaleString()} FCFA (${payment.payment_type})`,
          category: 'payment',
          details: JSON.stringify({ paymentId, status: newStatus, orderId: payment.order_id })
        })
        await notifyAdmin(c.env, 'payment', `${payment.client_phone} — ${payment.amount?.toLocaleString()} FCFA (${payment.payment_type}) ✅`)
      }
    }
    return c.json({ ok: true })
  } catch (e) {
    console.error('Payment callback error:', e)
    return c.json({ ok: false }, 500)
  }
})

app.get('/espace-client', async (c) => {
  const error = c.req.query('error')
  const redirect = c.req.query('redirect') || ''
  const db = c.env.DB

  // Session sécurisée côté serveur (HttpOnly cookie → lookup dans D1)
  const sessionToken = getCookie(c, 'maasga_session') || ''
  let session = sessionToken ? await getSession(db, sessionToken) : null

  // Rétrocompatibilité : ancien format cookie (clientId_timestamp) → migrer vers nouvelle session
  if (!session && sessionToken && /^\d+_\d+$/.test(sessionToken) && db) {
    const legacyClientId = parseInt(sessionToken.split('_')[0])
    if (legacyClientId && !isNaN(legacyClientId)) {
      try {
        const legacyClient = await db.prepare('SELECT id FROM clients WHERE id = ?').bind(legacyClientId).first() as any
        if (legacyClient) {
          // Migrer : créer une nouvelle session sécurisée et remplacer le cookie
          const newToken = generateSessionToken()
          await setSession(db, newToken, legacyClientId)
          const migrateCookie = `maasga_session=${newToken}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=86400`
          return new Response(null, { status: 302, headers: { 'Location': '/espace-client', 'Set-Cookie': migrateCookie } })
        }
      } catch(_) {}
    }
  }

  if (db && session) {
    // Si l'utilisateur est déjà connecté et qu'il y a un redirect, aller directement à la page demandée
    if (redirect && /^\/[a-z0-9\-\/]+$/i.test(redirect)) {
      return c.redirect('/' + redirect.replace(/^\/+/, ''))
    }
    try {
      return await renderDashboard(c, session.clientId)
    } catch(e) {
      console.error('Session dashboard error:', e)
      // Clear broken session to prevent redirect loop
      await deleteSession(db, sessionToken)
    }
  }

  const tab = c.req.query('tab')
  const successMsg = c.req.query('success') || ''
  return c.html(<EspaceClientPage error={error} success={successMsg} tab={tab} redirect={redirect} />)
})

app.get('/api/logout', async (c) => {
  // Invalidate server-side session before clearing cookie
  const cookie = c.req.header('Cookie') || ''
  const match = cookie.match(/maasga_session=([^;]+)/)
  if (match) {
    const token = decodeURIComponent(match[1])
    if (token) await deleteSession(c.env.DB, token)
  }
  return new Response(null, {
    status: 302,
    headers: { 'Location': '/espace-client', 'Set-Cookie': 'maasga_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0' }
  })
})

// ============================================================
// API RENDEZ-VOUS
// ============================================================

app.post('/api/rdv', async (c) => {
  // Rate limiting: 10 RDV per IP per hour
  const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown'
  const rl = rateLimit(`rdv:${ip}`, 10, 60 * 60 * 1000)
  if (!rl.allowed) {
    return c.redirect('/rendez-vous?error=' + encodeURIComponent('Trop de demandes. Réessayez plus tard.'))
  }

  const body = await c.req.parseBody()
  // Honeypot anti-spam check
  if (body['website']) return c.redirect('/rendez-vous?success=1')
  const name = (body['name'] as string || '').trim()
  const phone = (body['phone'] as string || '').trim()
  const quartier = (body['quartier'] as string || '').trim()
  const date = (body['date'] as string || '').trim()
  const heure_debut = (body['heure_debut'] as string || '08:00').trim()
  const heure_fin = (body['heure_fin'] as string || '18:00').trim()
  const email = (body['email'] as string || '').trim()
  const typeRaw = (body['type'] as string || 'devis').toLowerCase()
  const validRdvTypes = ['devis', 'installation', 'entretien', 'depannage'] as const
  const type = (validRdvTypes.includes(typeRaw as any) ? typeRaw : 'devis') as 'devis' | 'installation' | 'entretien' | 'depannage'
  const notes = (body['notes'] as string || '').trim()
  const latitude = parseFloat(body['latitude'] as string) || null
  const longitude = parseFloat(body['longitude'] as string) || null
  const adresse_precise = (body['adresse_precise'] as string || '').trim()
  const productId = body['product_id'] as string

  // Construire les notes avec les hints BTU/surface du simulateur
  const surfaceHint = (body['surface_hint'] as string || '').trim()
  const btuHint = (body['btu_hint'] as string || '').trim()
  let notesWithHints = notes
  if (surfaceHint || btuHint) {
    const hints = [surfaceHint ? `Surface: ${surfaceHint} m2` : '', btuHint ? `BTU: ${btuHint}` : ''].filter(Boolean).join(' | ')
    notesWithHints = notesWithHints ? `${notesWithHints} [${hints}]` : `[${hints}]`
  }

  if (!name || !phone || !quartier || !date) {
    return c.redirect('/rendez-vous?error=' + encodeURIComponent('Tous les champs obligatoires doivent être remplis.'))
  }

  // Validate phone format
  if (!isValidPhone(phone)) {
    return c.redirect('/rendez-vous?error=' + encodeURIComponent('Numéro de téléphone invalide (8 chiffres requis).'))
  }

  // Validate email format if provided
  if (email && !isValidEmail(email)) {
    return c.redirect('/rendez-vous?error=' + encodeURIComponent('Adresse email invalide.'))
  }

  const newRdv = {
    id: appointments.length + 1,
    name: name,
    phone: phone,
    quartier: quartier,
    date,
    heure_debut,
    heure_fin,
    type,
    notes: notesWithHints + (productId ? ` [Produit #${productId}]` : ''),
    latitude,
    longitude,
    adresse_precise,
    status: 'pending' as 'pending',
    created_at: new Date().toISOString().split('T')[0]
  }
  appointments.push(newRdv)

  // Écrire en base de données D1 si disponible
  const db = c.env.DB
  if (db) {
    // 1. Enregistrer/mettre à jour le client (indépendant du RDV)
    try {
      await createClient(db, {
        name: name,
        phone: phone,
        email: email || null,
        quartier: quartier,
        adresse_precise: adresse_precise || null,
        latitude: latitude || null,
        longitude: longitude || null,
        type_demande: type,
        notes,
        product_id: productId ? parseInt(productId) : null
      })
    } catch (error) {
      console.error('Erreur createClient depuis RDV (non bloquant):', error)
    }
    // 2. Créer le rendez-vous (séparé pour ne pas être bloqué par createClient)
    try {
      await createAppointment(db, {
        name: name,
        phone: phone,
        quartier: quartier,
        date,
        heure_debut,
        heure_fin,
        type,
        notes: notesWithHints + (productId ? ` [Produit #${productId}]` : ''),
        latitude: latitude || null,
        longitude: longitude || null,
        adresse_precise: adresse_precise || null
      })
    } catch (error) {
      console.error('Erreur createAppointment en D1:', error)
    }
  }

  // Envoyer SMS de confirmation (avec log + fallback WhatsApp)
  const typeLabel: Record<string, string> = { devis: 'Devis', installation: 'Installation', entretien: 'Entretien', depannage: 'Dépannage' }
  const smsMessage = `Bonjour ${name}! Votre ${typeLabel[type] || type} MAASGA est confirmée pour le ${date} de ${heure_debut} à ${heure_fin}. Réf: #${newRdv.id}. Questions? +226 55 99 64 18`
  await sendSmsWithLog(c.env, db, phone, smsMessage)

  // Log activity for connected users
  if (db) {
    try {
      const sessionToken = getCookie(c, 'maasga_session') || ''
      const session = sessionToken ? await getSession(c.env.DB, sessionToken) : null
      if (session) {
        await logActivity(db, {
          clientId: session.clientId,
          clientPhone: phone,
          action: 'Rendez-vous pris',
          category: 'rdv',
          details: `RDV ${type} le ${date} à ${quartier}`,
          ip: c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || ''
        })
      }
    } catch(e) { /* ignore */ }
  }

  // Notifier l'admin du nouveau RDV
  await notifyAdmin(c.env, 'rdv', `${name} — ${typeLabel[type] || type} le ${date} (${heure_debut}-${heure_fin}) à ${quartier}. Tél: ${phone}`)

  return c.redirect('/rendez-vous?success=1&name=' + encodeURIComponent(name) + '&phone=' + encodeURIComponent(phone))
})

// ============================================================
// API AVIS
// ============================================================

app.post('/api/avis', async (c) => {
  // Rate limiting: 5 reviews per IP per hour
  const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown'
  const rl = rateLimit(`avis:${ip}`, 5, 60 * 60 * 1000)
  if (!rl.allowed) {
    return c.redirect('/avis?error=' + encodeURIComponent('Trop de soumissions. Réessayez plus tard.'))
  }

  const body = await c.req.parseBody()
  const name = (body['name'] as string || '').trim()
  const note = parseInt(body['note'] as string || '5')
  const comment = (body['comment'] as string || '').trim()
  const service = (body['service'] as string || '').trim()

  if (!name || !comment || comment.length < 10) {
    return c.redirect('/avis?error=' + encodeURIComponent('Veuillez remplir tous les champs correctement.'))
  }

  const safeNote = Math.min(5, Math.max(1, isNaN(note) ? 5 : note))
  const reviewDate = new Date().toISOString().split('T')[0]
  const reviewService = service || 'Service MAASGA'

  // Écrire en base de données D1 en priorité
  const db = c.env.DB
  if (db) {
    try {
      await db.prepare(
        'INSERT INTO reviews (name, note, comment, date, service, approved) VALUES (?, ?, ?, ?, ?, 0)'
      ).bind(name, safeNote, comment, reviewDate, reviewService).run()
    } catch (error) {
      console.error('Erreur D1 avis:', error)
      return c.redirect('/avis?error=' + encodeURIComponent('Erreur lors de la sauvegarde. Réessayez.'))
    }
  } else {
    // No D1, use in-memory only
    reviews.push({ id: reviews.length + 1, name, note: safeNote, comment, date: reviewDate, service: reviewService, approved: false })
  }

  return c.redirect('/avis?success=1')
})

// ============================================================
// API CONTACT
// ============================================================

app.post('/api/contact', async (c) => {
  // Rate limiting: 5 contact messages per IP per hour
  const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown'
  const rl = rateLimit(`contact:${ip}`, 5, 60 * 60 * 1000)
  if (!rl.allowed) {
    return c.redirect('/contact?error=' + encodeURIComponent('Trop de messages envoyés. Réessayez plus tard.'))
  }

  const body = await c.req.parseBody()
  // Honeypot anti-spam check
  if (body['website']) return c.redirect('/contact?success=1')
  const name = (body['name'] as string || '').trim()
  const email = (body['email'] as string || '').trim()
  const phone = (body['phone'] as string || '').trim()
  const message = (body['message'] as string || '').trim()

  if (!name || !message) {
    return c.redirect('/contact?error=' + encodeURIComponent('Nom et message sont obligatoires.'))
  }

  // Validate email if provided
  if (email && !isValidEmail(email)) {
    return c.redirect('/contact?error=' + encodeURIComponent('Adresse email invalide.'))
  }

  // Validate phone if provided
  if (phone && !isValidPhone(phone)) {
    return c.redirect('/contact?error=' + encodeURIComponent('Numéro de téléphone invalide (8 chiffres requis).'))
  }

  // Enregistrer le contact comme client potentiel
  const db = c.env.DB
  if (db && (phone || email)) {
    try {
      await createClient(db, {
        name: name,
        phone: phone || '',
        email: email || null,
        quartier: '',
        adresse_precise: null,
        latitude: null,
        longitude: null,
        type_demande: 'contact',
        notes: message.substring(0, 500),
        product_id: null
      })
    } catch (error) {
      console.error('Erreur createClient depuis contact (non bloquant):', error)
    }
  }

  // Stocker le message dans contact_messages
  if (db) {
    try {
      await ensureContactMessages(db)
      await db.prepare(
        'INSERT INTO contact_messages (name, email, phone, message) VALUES (?, ?, ?, ?)'
      ).bind(name, email || null, phone || null, message.substring(0, 2000)).run()
    } catch (err) {
      console.error('Erreur stockage contact_messages (non bloquant):', err)
    }
  }

  // Notifier l'admin du nouveau message
  await notifyAdmin(c.env, 'contact', `${name} — ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}${phone ? ' | Tél: ' + phone : ''}${email ? ' | Email: ' + email : ''}`)

  return c.redirect('/contact?success=1')
})

// ============================================================
// API STOCK ALERTS (notify me when back in stock)
// ============================================================

app.post('/api/stock-alert', async (c) => {
  const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown'
  const rl = rateLimit(`stockalert:${ip}`, 10, 60 * 60 * 1000)
  if (!rl.allowed) {
    return c.json({ ok: false, error: 'Trop de demandes. Réessayez plus tard.' }, 429)
  }

  const body = await c.req.parseBody()
  const productId = parseInt(body['product_id'] as string || '0')
  const phone = (body['phone'] as string || '').trim()

  if (!productId || !phone || !isValidPhone(phone)) {
    return c.json({ ok: false, error: 'Numéro de téléphone invalide (8 chiffres requis).' }, 400)
  }

  const db = c.env.DB
  if (!db) {
    return c.json({ ok: false, error: 'Service indisponible.' }, 500)
  }

  const safePhone = escapeHtml(phone)
  try {
    await ensureStockAlerts(db)
    // Check if already registered
    const existing = await db.prepare(
      'SELECT id FROM stock_alerts WHERE product_id = ? AND phone = ? AND notified = 0'
    ).bind(productId, safePhone).first()
    if (existing) {
      return c.json({ ok: true, message: 'Vous êtes déjà inscrit pour ce produit.' })
    }
    await db.prepare(
      'INSERT INTO stock_alerts (product_id, phone) VALUES (?, ?)'
    ).bind(productId, safePhone).run()
    return c.json({ ok: true, message: 'Vous serez notifié dès le réapprovisionnement.' })
  } catch (err) {
    console.error('Stock alert error:', err)
    return c.json({ ok: false, error: 'Erreur serveur.' }, 500)
  }
})

// ============================================================
// API MAINTENANCE REQUESTS
// ============================================================

app.post('/api/maintenance/request', async (c) => {
  // Rate limiting: 5 maintenance requests per IP per hour
  const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown'
  const rl = rateLimit(`maintenance:${ip}`, 5, 60 * 60 * 1000)
  if (!rl.allowed) {
    return c.redirect('/contrat-maintenance?error=' + encodeURIComponent('Trop de demandes. Réessayez plus tard.'))
  }

  const body = await c.req.parseBody()
  // Honeypot anti-spam check
  if (body['website']) return c.redirect('/contrat-maintenance?success=1')
  const name = (body['name'] as string || '').trim()
  const phone = (body['phone'] as string || '').trim()
  const email = (body['email'] as string || '').trim()
  const quartier = (body['quartier'] as string || '').trim()
  const requestType = (body['request_type'] as string || 'occasionnelle').trim()
  const description = (body['description'] as string || '').trim()
  const preferredDate = (body['preferred_date'] as string || '').trim()
  const equipmentType = (body['equipment_type'] as string || '').trim()
  const planType = (body['plan_type'] as string || '').trim()

  if (!name || !phone) {
    return c.redirect('/contrat-maintenance?error=' + encodeURIComponent('Nom et téléphone sont obligatoires.'))
  }
  // Validate phone format
  if (!isValidPhone(phone)) {
    return c.redirect('/contrat-maintenance?error=' + encodeURIComponent('Numéro de téléphone invalide (8 chiffres requis).'))
  }
  // Validate email format if provided
  if (email && !isValidEmail(email)) {
    return c.redirect('/contrat-maintenance?error=' + encodeURIComponent('Adresse email invalide.'))
  }
  if (!['occasionnelle', 'urgence', 'contrat'].includes(requestType)) {
    return c.redirect('/contrat-maintenance?error=' + encodeURIComponent('Type de demande invalide.'))
  }

  const db = c.env.DB
  if (db) {
    try {
      await ensureMaintenanceTables(db)
      // Find client_id if they exist
      const existingClient = await db.prepare('SELECT id FROM clients WHERE phone = ?').bind(phone).first() as any
      const clientId = existingClient?.id || null

      // Insert the maintenance request
      await db.prepare(
        `INSERT INTO maintenance_requests (client_id, name, phone, email, quartier, request_type, description, preferred_date, equipment_type, plan_type, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        clientId,
        escapeHtml(name),
        escapeHtml(phone),
        email ? escapeHtml(email) : null,
        quartier ? escapeHtml(quartier) : null,
        requestType,
        description ? escapeHtml(description) : null,
        preferredDate || null,
        equipmentType || null,
        planType || null,
        requestType === 'contrat' && planType ? 'done' : 'pending'
      ).run()

      // If this is a contract subscription, auto-create the contract + schedule visits
      if (requestType === 'contrat' && planType && ['trimestriel', 'semestriel', 'annuel'].includes(planType)) {
        const planConfig: Record<string, { months: number; visits: number; price: number }> = {
          trimestriel: { months: 12, visits: 3, price: 30000 },
          semestriel: { months: 12, visits: 2, price: 55000 },
          annuel: { months: 12, visits: 1, price: 100000 }
        }
        const cfg = planConfig[planType]
        const startDate = preferredDate || new Date().toISOString().split('T')[0]
        const endDateObj = new Date(startDate)
        endDateObj.setMonth(endDateObj.getMonth() + cfg.months)
        const endDate = endDateObj.toISOString().split('T')[0]

        // Compute visit dates evenly spaced
        const intervalMonths = Math.floor(cfg.months / cfg.visits)
        const visitDates: string[] = []
        for (let i = 1; i <= cfg.visits; i++) {
          const vd = new Date(startDate)
          vd.setMonth(vd.getMonth() + (intervalMonths * i))
          visitDates.push(vd.toISOString().split('T')[0])
        }

        // Create the maintenance contract
        await db.prepare(
          `INSERT INTO maintenance_contracts (client_id, client_name, client_phone, plan_type, plan_price, start_date, end_date, status, total_visits, completed_visits, next_visit_date)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, 0, ?)`
        ).bind(
          clientId,
          escapeHtml(name),
          escapeHtml(phone),
          planType,
          cfg.price,
          startDate,
          endDate,
          cfg.visits,
          visitDates[0] || null
        ).run()

        // Retrieve the contract ID just inserted
        const newContract = await db.prepare(
          'SELECT id FROM maintenance_contracts WHERE client_phone = ? AND plan_type = ? AND start_date = ? ORDER BY id DESC LIMIT 1'
        ).bind(escapeHtml(phone), planType, startDate).first() as any
        const contractId = newContract?.id || null

        // Pre-schedule all maintenance visits
        if (contractId) {
          // Ensure client_id is valid (table requires NOT NULL)
          const effectiveClientId = clientId || 0
          for (const vDate of visitDates) {
            await db.prepare(
              `INSERT INTO maintenance_visits (contract_id, client_id, client_name, client_phone, visit_type, visit_date, status, description)
               VALUES (?, ?, ?, ?, 'preventive', ?, 'planifiee', ?)`
            ).bind(
              contractId,
              effectiveClientId,
              escapeHtml(name),
              escapeHtml(phone),
              vDate,
              `Visite préventive — Contrat ${planType}`
            ).run()
          }
        }

        // Log activity if client exists
        if (clientId) {
          try {
            await db.prepare(
              `INSERT INTO user_activity_log (client_id, action, category, details) VALUES (?, ?, 'maintenance', ?)`
            ).bind(clientId, 'Souscription contrat maintenance', `Plan ${planType} — ${cfg.price.toLocaleString()} FCFA — ${cfg.visits} visite(s)`).run()
          } catch(_) {}
        }
      }
    } catch (error) {
      console.error('Erreur maintenance request:', error)
      return c.redirect('/contrat-maintenance?error=' + encodeURIComponent('Erreur lors de l\'envoi. Veuillez réessayer.'))
    }
  }

  // Maintenance request received — logged in D1
  return c.redirect('/contrat-maintenance?success=1')
})

// ============================================================
// ORDER INVOICE (printable HTML → PDF via browser)
// ============================================================

app.get('/api/order/invoice/:id', async (c) => {
  const orderId = parseInt(c.req.param('id'))
  if (isNaN(orderId)) return c.text('ID invalide', 400)

  const db = c.env.DB
  if (!db) return c.text('Service indisponible', 503)

  // Auth: session client OR admin
  const sessionToken = getCookie(c, 'maasga_session') || ''
  const adminCookie = getCookie(c, 'maasga_admin') || ''
  const session = sessionToken ? await getSession(db, sessionToken) : null
  let isAdmin = false
  if (!session && adminCookie) {
    try {
      const adminSecret = c.env.ADMIN_SECRET || ''
      if (adminSecret) isAdmin = await verifyToken(adminCookie, adminSecret)
    } catch {}
  }
  if (!session && !isAdmin) {
    return c.redirect('/espace-client?error=' + encodeURIComponent('Veuillez vous connecter pour accéder à la facture.'))
  }

  try {
    const order = await db.prepare('SELECT * FROM orders WHERE id = ?').bind(orderId).first() as any
    if (!order) return c.text('Commande introuvable', 404)

    // Client: verify ownership
    if (session && !isAdmin) {
      const clientCheck = await db.prepare('SELECT id, phone FROM clients WHERE id = ?').bind(session.clientId).first() as any
      if (!clientCheck || (clientCheck.phone !== order.client_phone && (!order.client_id || clientCheck.id !== order.client_id))) {
        return c.text('Accès non autorisé', 403)
      }
    }

    // Fetch related data
    const product = order.product_id
      ? await db.prepare('SELECT name, price, brand FROM products WHERE id = ?').bind(order.product_id).first() as any
      : null

    let payment: any = null
    try {
      payment = await db.prepare(
        "SELECT amount, method, status, provider_ref, created_at FROM payments WHERE payment_type = 'order' AND (order_id = ? OR (client_phone = ? AND amount = ?)) ORDER BY created_at DESC LIMIT 1"
      ).bind(orderId, order.client_phone || '', order.total_price || 0).first()
    } catch (_) {}

    let allDevis: any[] = []
    try {
      const dr = await db.prepare('SELECT * FROM order_devis WHERE order_id = ? ORDER BY id ASC').bind(orderId).all()
      allDevis = dr.results || []
    } catch (_) {}

    let companyIFU = '00127845A'
    try {
      const ifuRow = await db.prepare("SELECT value FROM site_settings WHERE key = 'ifu'").first() as any
      if (ifuRow?.value) companyIFU = ifuRow.value
    } catch (_) {}

    // Compute amounts — no installation price, no TVA
    const unitPrice: number = (product?.price) || (order.total_price ? Math.round(order.total_price / (order.quantity || 1)) : 0)
    const qty: number = order.quantity || 1
    const subtotal: number = unitPrice * qty
    // Add validated devis total if any
    const devisTotal: number = allDevis
      .filter((d: any) => d.status === 'validated')
      .reduce((sum: number, d: any) => sum + (d.total_amount || 0), 0)
    const totalFinal: number = subtotal + devisTotal

    // Format helpers
    const fmtDate = (d: string) => { try { return new Date(d).toLocaleDateString('fr-FR') } catch(_) { return d || '' } }
    const fmtDateLong = (d: string) => { try { return new Date(d).toLocaleDateString('fr-FR', {day:'numeric',month:'long',year:'numeric'}) } catch(_) { return d || '' } }
    const fmtNum = (n: number) => { try { return n.toLocaleString('fr-FR') } catch(_) { return String(n) } }

    const invoiceDate = fmtDateLong(new Date().toISOString())
    const invoiceNum = 'MAASGA-CMD-' + String(orderId).padStart(5, '0')
    const orderDate = order.created_at ? fmtDateLong(order.created_at) : invoiceDate

    const STATUS_LABEL: Record<string,string> = { pending:'En attente', paid:'Payée', livre:'Livrée', validation_terrain:'Validation terrain', devis_en_attente:'Devis envoyé', devis_valide:'Devis accepté', installed:'Installée', cancelled:'Annulée', refunded:'Remboursée' }
    const STATUS_COLOR: Record<string,string> = { pending:'background:rgba(217,119,6,0.1);color:#d97706', paid:'background:rgba(59,130,246,0.1);color:#3b82f6', livre:'background:rgba(14,165,233,0.1);color:#0ea5e9', validation_terrain:'background:rgba(168,85,247,0.1);color:#a855f7', devis_en_attente:'background:rgba(245,158,11,0.1);color:#f59e0b', devis_valide:'background:rgba(16,185,129,0.1);color:#10b981', installed:'background:rgba(22,163,74,0.1);color:#16a34a', cancelled:'background:rgba(239,68,68,0.1);color:#ef4444', refunded:'background:rgba(124,58,237,0.1);color:#7c3aed' }
    const PAY_METHOD: Record<string,string> = { orange_money:'Orange Money', moov_money:'Moov Money', wave:'Wave', carte_bancaire:'Carte bancaire', ligdicash:'LigdiCash', cash:'Espèces', a_confirmer:'À confirmer' }
    const DEVIS_STATUS: Record<string,string> = { pending:'En attente', sent:'Envoyé', validated:'Accepté', refused:'Refusé', expired:'Expiré' }
    const DEVIS_COLOR: Record<string,string> = { pending:'background:rgba(217,119,6,0.1);color:#d97706', sent:'background:rgba(59,130,246,0.1);color:#3b82f6', validated:'background:rgba(22,163,74,0.1);color:#16a34a', refused:'background:rgba(239,68,68,0.1);color:#ef4444', expired:'background:rgba(148,163,184,0.1);color:#94a3b8' }

    // Build devis section using string concatenation to avoid nested template literal issues
    let devisSection = ''
    if (allDevis.length > 0) {
      devisSection += '<div style="margin-bottom:30px;">'
      devisSection += '<div style="font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:#94a3b8;font-weight:700;margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid #e2e8f0;">Devis associés à cette commande</div>'
      for (let di = 0; di < allDevis.length; di++) {
        const d: any = allDevis[di]
        const dStatus = DEVIS_STATUS[d.status] || d.status || ''
        const dColor = DEVIS_COLOR[d.status] || DEVIS_COLOR.pending
        const dDate = d.created_at ? fmtDateLong(d.created_at) : ''
        const dRef = 'DEV-' + String(d.id).padStart(5, '0')
        devisSection += '<div style="border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin-bottom:14px;">'
        devisSection += '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;">'
        devisSection += '<div>'
        devisSection += '<div style="font-size:14px;font-weight:700;color:#03045e;">Devis #' + (di + 1) + ' — ' + escapeHtml(d.title || 'Devis installation') + '</div>'
        devisSection += '<div style="font-size:12px;color:#64748b;margin-top:2px;">Créé le ' + dDate + ' · Réf. ' + dRef + '</div>'
        if (d.description) devisSection += '<div style="font-size:12px;color:#475569;margin-top:4px;">' + escapeHtml(d.description) + '</div>'
        devisSection += '</div>'
        devisSection += '<div style="text-align:right;">'
        devisSection += '<span style="display:inline-block;padding:3px 12px;border-radius:20px;font-size:11px;font-weight:700;' + dColor + '">' + dStatus + '</span>'
        if (d.validated_at) devisSection += '<div style="font-size:11px;color:#16a34a;margin-top:4px;">Accepté le ' + fmtDate(d.validated_at) + '</div>'
        if (d.refused_at) devisSection += '<div style="font-size:11px;color:#ef4444;margin-top:4px;">Refusé le ' + fmtDate(d.refused_at) + '</div>'
        devisSection += '</div></div>'
        let devisItems: any[] = []
        try { devisItems = JSON.parse(d.items || '[]') } catch (_) {}
        if (devisItems.length > 0) {
          devisSection += '<table style="width:100%;border-collapse:collapse;font-size:12px;margin-top:8px;">'
          devisSection += '<thead><tr style="background:#f8fafc;"><th style="padding:8px 10px;text-align:left;color:#64748b;font-weight:600;border-bottom:1px solid #e2e8f0;">Prestation / Article</th><th style="padding:8px 10px;text-align:center;color:#64748b;font-weight:600;border-bottom:1px solid #e2e8f0;">Qté</th><th style="padding:8px 10px;text-align:right;color:#64748b;font-weight:600;border-bottom:1px solid #e2e8f0;">Prix unit.</th><th style="padding:8px 10px;text-align:right;color:#64748b;font-weight:600;border-bottom:1px solid #e2e8f0;">Total</th></tr></thead>'
          devisSection += '<tbody>'
          for (const it of devisItems) {
            const itQty: number = it.quantity || 1
            const itPrice: number = it.unit_price || it.price || 0
            const itTotal: number = itQty * itPrice
            devisSection += '<tr style="border-bottom:1px solid #f1f5f9;">'
            devisSection += '<td style="padding:7px 10px;color:#334155;">' + escapeHtml(it.name || '') + (it.description ? '<br><span style="color:#94a3b8;font-size:11px;">' + escapeHtml(it.description) + '</span>' : '') + '</td>'
            devisSection += '<td style="padding:7px 10px;text-align:center;color:#334155;">' + itQty + '</td>'
            devisSection += '<td style="padding:7px 10px;text-align:right;color:#334155;">' + fmtNum(itPrice) + ' FCFA</td>'
            devisSection += '<td style="padding:7px 10px;text-align:right;font-weight:600;color:#334155;">' + fmtNum(itTotal) + ' FCFA</td>'
            devisSection += '</tr>'
          }
          devisSection += '</tbody></table>'
        }
        devisSection += '<div style="display:flex;justify-content:flex-end;margin-top:10px;">'
        devisSection += '<div style="font-size:14px;font-weight:800;color:#03045e;">Total devis : ' + fmtNum(d.total_amount || 0) + ' FCFA</div>'
        devisSection += '</div>'
        if (d.client_response_notes) devisSection += '<div style="margin-top:8px;font-size:12px;color:#475569;background:#f8fafc;padding:8px 12px;border-radius:8px;"><strong>Réponse client :</strong> ' + escapeHtml(d.client_response_notes) + '</div>'
        if (d.admin_notes) devisSection += '<div style="margin-top:6px;font-size:12px;color:#64748b;background:#fffbeb;padding:8px 12px;border-radius:8px;"><strong>Notes admin :</strong> ' + escapeHtml(d.admin_notes) + '</div>'
        devisSection += '</div>'
      }
      devisSection += '</div>'
    }

    // Build product rows
    let productRows = '<tr>'
    productRows += '<td><strong>' + (product ? escapeHtml(product.name) : 'Produit / Service') + '</strong>'
    if (product?.brand) productRows += '<br><span style="color:#64748b;font-size:12px;">' + escapeHtml(product.brand) + '</span>'
    productRows += '</td>'
    productRows += '<td style="text-align:center;">' + qty + '</td>'
    productRows += '<td style="text-align:right;">' + fmtNum(unitPrice) + ' FCFA</td>'
    productRows += '<td style="text-align:right;font-weight:600;">' + fmtNum(subtotal) + ' FCFA</td>'
    productRows += '</tr>'

    // Build summary rows — product only, devis if any, no TVA
    let summaryRows = ''
    if (devisTotal > 0) {
      summaryRows += '<div class="row"><span>Climatiseur(s)</span><span>' + fmtNum(subtotal) + ' FCFA</span></div>'
      summaryRows += '<div class="row"><span>Travaux suppl. (devis accepté)</span><span>' + fmtNum(devisTotal) + ' FCFA</span></div>'
    }
    summaryRows += '<div class="row total"><span>Total</span><span>' + fmtNum(totalFinal) + ' FCFA</span></div>'

    // Build payment section
    let paymentSection = ''
    if (payment) {
      const payStatus = payment.status === 'completed' ? 'Confirmé' : payment.status === 'pending' ? 'En attente' : (payment.status || 'Inconnu')
      const payMethod = PAY_METHOD[payment.method] || payment.method || 'Non spécifié'
      const payDate = payment.created_at ? fmtDate(payment.created_at) : ''
      const payRef = payment.provider_ref ? ' · Réf: ' + payment.provider_ref : ''
      paymentSection = '<div class="payment-info" style="background:#f0fdf4;border:1px solid rgba(22,163,74,0.15);">'
      paymentSection += '<div class="pay-icon" style="background:rgba(22,163,74,0.1);color:#16a34a;">&#10003;</div>'
      paymentSection += '<div><div style="font-size:14px;font-weight:700;color:#16a34a;">Paiement ' + payStatus + '</div>'
      paymentSection += '<div style="font-size:12px;color:#64748b;">' + payMethod + (payDate ? ' · ' + payDate : '') + payRef + '</div></div>'
      paymentSection += '</div>'
    } else {
      paymentSection = '<div class="payment-info" style="background:#fffbeb;border:1px solid rgba(217,119,6,0.15);">'
      paymentSection += '<div class="pay-icon" style="background:rgba(217,119,6,0.1);color:#d97706;">&#8987;</div>'
      paymentSection += '<div><div style="font-size:14px;font-weight:700;color:#d97706;">Paiement en attente</div>'
      paymentSection += '<div style="font-size:12px;color:#64748b;">Le paiement sera confirmé après vérification par notre équipe.</div></div>'
      paymentSection += '</div>'
    }

    // Build notes section
    const notesSection = order.notes
      ? '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin-bottom:20px;"><div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;font-weight:700;margin-bottom:6px;">Notes</div><div style="font-size:13px;color:#334155;">' + escapeHtml(order.notes) + '</div></div>'
      : ''

    const statusBadge = STATUS_COLOR[order.status] || STATUS_COLOR.pending
    const statusLabel = STATUS_LABEL[order.status] || (order.status || 'Inconnu')

    const html = '<!DOCTYPE html>\n<html lang="fr">\n<head>\n' +
      '<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width,initial-scale=1">\n' +
      '<title>Facture ' + invoiceNum + ' \u2014 MAASGA</title>\n' +
      '<style>\n' +
      '@import url(\'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap\');\n' +
      '*{margin:0;padding:0;box-sizing:border-box}\n' +
      'body{font-family:\'Inter\',sans-serif;background:#f8fafc;color:#1e293b}\n' +
      '.invoice-container{max-width:800px;margin:20px auto;background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.08);overflow:hidden}\n' +
      '.header{background:linear-gradient(135deg,#03045e,#0077b6);color:#fff;padding:40px;display:flex;justify-content:space-between;align-items:flex-start}\n' +
      '.inv-num{font-size:18px;font-weight:700;margin-bottom:6px}\n' +
      '.inv-info{text-align:right;font-size:13px;opacity:0.92}\n' +
      '.body{padding:40px}\n' +
      '.parties{display:flex;gap:40px;margin-bottom:36px}\n' +
      '.party{flex:1}\n' +
      '.party h4{font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:#94a3b8;font-weight:700;margin-bottom:10px}\n' +
      '.party p{font-size:13px;line-height:1.8;color:#334155}\n' +
      '.party .pname{font-size:15px;font-weight:700;color:#03045e;margin-bottom:4px}\n' +
      'table{width:100%;border-collapse:collapse;margin-bottom:30px}\n' +
      'table th{background:#f8fafc;padding:12px 14px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#64748b;font-weight:700;border-bottom:2px solid #e2e8f0}\n' +
      'table td{padding:10px 14px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#334155}\n' +
      '.summary{margin-left:auto;width:320px;margin-bottom:30px}\n' +
      '.row{display:flex;justify-content:space-between;padding:8px 0;font-size:13px;color:#64748b;border-bottom:1px solid #f1f5f9}\n' +
      '.row.total{border-bottom:none;border-top:2px solid #03045e;padding-top:14px;margin-top:6px;font-size:18px;font-weight:800;color:#03045e}\n' +
      '.status-badge{display:inline-block;padding:4px 14px;border-radius:20px;font-size:12px;font-weight:700}\n' +
      '.payment-info{border-radius:12px;padding:16px;margin-bottom:30px;display:flex;align-items:center;gap:12px}\n' +
      '.pay-icon{width:40px;height:40px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0}\n' +
      '.footer{text-align:center;padding:30px 40px;border-top:1px solid #e2e8f0;font-size:12px;color:#94a3b8;line-height:1.6}\n' +
      '.btn-print{display:inline-flex;align-items:center;gap:8px;background:linear-gradient(135deg,#03045e,#0077b6);color:#fff;border:none;padding:12px 28px;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer;margin:20px auto;transition:all .2s}\n' +
      '.btn-print:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,119,182,0.35)}\n' +
      '.no-print{text-align:center;padding:20px}\n' +
      '@media print{body{background:#fff}.invoice-container{box-shadow:none;margin:0;border-radius:0}.no-print{display:none!important}.header{-webkit-print-color-adjust:exact;print-color-adjust:exact}}\n' +
      '</style>\n</head>\n<body>\n' +
      '<div class="no-print"><button class="btn-print" onclick="window.print()"><svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8" rx="1"/></svg>Imprimer / Enregistrer en PDF</button></div>\n' +
      '<div class="invoice-container">\n' +
      '<div class="header">\n' +
      '<div style="display:flex;align-items:center;gap:16px;">\n' +
      '<img src="/logo-site.png" alt="MAASGA" style="height:64px;width:auto;border-radius:10px;object-fit:contain;" onerror="this.style.display=\'none\'" />\n' +
      '<div>\n' +
      '<div style="font-size:26px;font-weight:800;letter-spacing:-0.5px;color:#fff;">MAASGA<span style="color:#00b4d8;"> ❄</span></div>\n' +
      '<p style="font-size:13px;margin-top:4px;opacity:0.85;">Solutions Climatisation &amp; Froid</p>\n' +
      '<p style="font-size:12px;margin-top:2px;opacity:0.7;">Ouagadougou, Burkina Faso</p>\n' +
      '</div></div>\n' +
      '<div class="inv-info">\n' +
      '<div class="inv-num">' + invoiceNum + '</div>\n' +
      '<div>Date facture : ' + invoiceDate + '</div>\n' +
      '<div>Date commande : ' + orderDate + '</div>\n' +
      '<div style="margin-top:8px;"><span class="status-badge" style="' + statusBadge + '">' + statusLabel + '</span></div>\n' +
      '</div>\n</div>\n' +
      '<div class="body">\n' +
      '<div class="parties">\n' +
      '<div class="party"><h4>Émetteur</h4>\n' +
      '<p class="pname">MAASGA SARL</p>\n' +
      '<p>Ouagadougou, Burkina Faso<br>Tél : +226 55 99 64 18<br>Email : maasgabf@gmail.com<br>IFU : ' + companyIFU + '</p></div>\n' +
      '<div class="party"><h4>Client</h4>\n' +
      '<p class="pname">' + escapeHtml(order.client_name) + '</p>\n' +
      '<p>Tél : ' + escapeHtml(order.client_phone) + '<br>' +
      (order.client_email ? 'Email : ' + escapeHtml(order.client_email) + '<br>' : '') +
      (order.quartier ? 'Quartier : ' + escapeHtml(order.quartier) + '<br>' : '') +
      (order.client_id ? 'Réf. client : CLI-' + String(order.client_id).padStart(5, '0') : '') +
      '</p></div>\n</div>\n' +
      '<table>\n<thead><tr><th>Description</th><th style="text-align:center;">Qté</th><th style="text-align:right;">Prix unit.</th><th style="text-align:right;">Total</th></tr></thead>\n' +
      '<tbody>' + productRows + '</tbody>\n</table>\n' +
      '<div class="summary">' + summaryRows + '</div>\n' +
      paymentSection + '\n' +
      devisSection + '\n' +
      notesSection +
      '</div>\n' +
      '<div class="footer">\n' +
      '<p><strong>MAASGA SARL</strong> — Solutions Climatisation &amp; Froid · Ouagadougou, Burkina Faso</p>\n' +
      '<p>Tél : +226 55 99 64 18 · Email : maasgabf@gmail.com · Web : maasga.com</p>\n' +
      '<p style="margin-top:8px;">Merci pour votre confiance. Ce document fait office de facture pour la commande référencée ci-dessus.</p>\n' +
      '</div>\n</div>\n</body>\n</html>'

    return c.html(html)

  } catch (err: any) {
    const errMsg = String(err?.message || err || 'unknown')
    console.error('[Invoice order/' + orderId + ']', errMsg)
    return c.html('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Erreur</title><style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f8fafc;margin:0}div{background:#fff;padding:40px;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,.08);text-align:center;max-width:420px}h2{color:#03045e;margin-bottom:12px}p{color:#64748b;font-size:14px;margin-bottom:20px}a{display:inline-block;padding:10px 24px;background:#0077b6;color:#fff;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px}</style></head><body><div><h2>&#9888; Erreur</h2><p>Impossible de g&#233;n&#233;rer la facture (#' + orderId + '). ' + errMsg.replace(/</g,'&lt;').substring(0,200) + '</p><a href="/espace-client">Mon espace</a></div></body></html>', 500)
  }
})


// ============================================================
// MAINTENANCE CONTRACT INVOICE (printable HTML → PDF via browser)
// ============================================================

app.get('/api/maintenance/invoice/:id', async (c) => {
  const contractId = parseInt(c.req.param('id'))
  if (isNaN(contractId)) return c.text('ID invalide', 400)

  // Verify session
  const sessionToken = getCookie(c, 'maasga_session') || ''
  const db = c.env.DB
  if (!db) return c.text('Service indisponible', 503)
  const session = await getSession(db, sessionToken)
  if (!session) {
    return c.redirect('/espace-client?error=' + encodeURIComponent('Veuillez vous connecter pour accéder à la facture.'))
  }

  // Fetch contract
  const contract = await db.prepare(
    'SELECT * FROM maintenance_contracts WHERE id = ?'
  ).bind(contractId).first() as any
  if (!contract) return c.text('Contrat introuvable', 404)

  // Verify ownership via client_phone
  const client = await db.prepare('SELECT * FROM clients WHERE id = ?').bind(session.clientId).first() as any
  if (!client || client.phone !== contract.client_phone) {
    return c.text('Accès non autorisé', 403)
  }

  // Fetch related visits
  const visits = await db.prepare(
    'SELECT visit_type, visit_date, status, technician, actions_performed FROM maintenance_visits WHERE contract_id = ? ORDER BY visit_date ASC'
  ).bind(contractId).all()
  const visitRows = visits?.results || []

  // Fetch related payment if any
  const payment = await db.prepare(
    'SELECT amount, method, status, provider_ref, created_at FROM payments WHERE maintenance_request_id = ? OR (client_phone = ? AND payment_type = \'maintenance_contract\') ORDER BY created_at DESC LIMIT 1'
  ).bind(contractId, client.phone).first() as any

  const planLabels: Record<string, string> = { trimestriel: 'Trimestriel (3 mois)', semestriel: 'Semestriel (6 mois)', annuel: 'Annuel Premium (12 mois)' }
  const statusLabels: Record<string, string> = { active: 'Actif', expired: 'Expiré', cancelled: 'Annulé' }
  const visitStatusLabels: Record<string, string> = { planifiee: 'Planifiée', confirmee: 'Confirmée', effectuee: 'Effectuée', annulee: 'Annulée' }
  const payMethodLabels: Record<string, string> = { orange_money: 'Orange Money', moov_money: 'Moov Money', wave: 'Wave', carte_bancaire: 'Carte bancaire', a_confirmer: 'À confirmer', cash: 'Espèces' }

  const invoiceDate = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  const invoiceNum = `MAASGA-MC-${String(contractId).padStart(5, '0')}`

  // Fetch company IFU from site_settings
  let companyIFU = '00127845A' // Default
  try {
    const ifuRow = await db.prepare("SELECT value FROM site_settings WHERE key = 'ifu'").first() as any
    if (ifuRow?.value) companyIFU = ifuRow.value
  } catch (_) {}

  const fmtDate = (d: string) => {
    if (!d) return '—'
    try { return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) } catch { return d }
  }

  const visitRowsHtml = visitRows.map((v: any) => `
    <tr>
      <td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#334155;">${fmtDate(v.visit_date)}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#334155;">${v.visit_type === 'preventive' ? 'Préventive' : v.visit_type}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;font-size:13px;text-align:center;">
        <span style="display:inline-block;padding:3px 12px;border-radius:20px;font-size:11px;font-weight:700;${v.status === 'effectuee' ? 'background:rgba(22,163,74,0.1);color:#16a34a;' : v.status === 'annulee' ? 'background:rgba(239,68,68,0.1);color:#ef4444;' : 'background:rgba(217,119,6,0.1);color:#d97706;'}">${visitStatusLabels[v.status] || v.status}</span>
      </td>
      <td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#64748b;">${v.technician || '—'}</td>
    </tr>
  `).join('')

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Facture ${invoiceNum} — MAASGA</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'Inter',sans-serif; background:#f8fafc; color:#1e293b; }
    .invoice-container { max-width:800px; margin:20px auto; background:#fff; border-radius:16px; box-shadow:0 4px 24px rgba(0,0,0,0.08); overflow:hidden; }
    .header { background:linear-gradient(135deg,#03045e,#0077b6); color:#fff; padding:40px; display:flex; justify-content:space-between; align-items:flex-start; }
    .header .logo { font-size:28px; font-weight:800; letter-spacing:-0.5px; }
    .header .logo span { color:#00b4d8; }
    .header .inv-info { text-align:right; font-size:13px; }
    .header .inv-info .inv-num { font-size:18px; font-weight:700; margin-bottom:6px; }
    .body { padding:40px; }
    .parties { display:flex; gap:40px; margin-bottom:36px; }
    .party { flex:1; }
    .party h4 { font-size:11px; text-transform:uppercase; letter-spacing:1.5px; color:#94a3b8; font-weight:700; margin-bottom:10px; }
    .party p { font-size:13px; line-height:1.7; color:#334155; }
    .party .name { font-size:15px; font-weight:700; color:#03045e; margin-bottom:4px; }
    .details-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:36px; }
    .detail-card { background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:16px; }
    .detail-card .label { font-size:11px; text-transform:uppercase; letter-spacing:1px; color:#94a3b8; font-weight:700; margin-bottom:4px; }
    .detail-card .value { font-size:16px; font-weight:700; color:#03045e; }
    .detail-card .value.price { color:#0077b6; font-size:20px; }
    .detail-card .value.status { display:inline-block; padding:4px 14px; border-radius:20px; font-size:12px; }
    table { width:100%; border-collapse:collapse; margin-bottom:30px; }
    table th { background:#f8fafc; padding:12px 14px; text-align:left; font-size:11px; text-transform:uppercase; letter-spacing:1px; color:#64748b; font-weight:700; border-bottom:2px solid #e2e8f0; }
    .total-section { background:linear-gradient(135deg,rgba(0,119,182,0.04),rgba(0,180,216,0.04)); border:1.5px solid rgba(0,119,182,0.15); border-radius:12px; padding:20px; display:flex; justify-content:space-between; align-items:center; margin-bottom:30px; }
    .total-section .total-label { font-size:14px; font-weight:600; color:#64748b; }
    .total-section .total-amount { font-size:28px; font-weight:800; color:#03045e; }
    .total-section .total-currency { font-size:14px; color:#0077b6; font-weight:600; }
    .payment-info { background:#f0fdf4; border:1px solid rgba(22,163,74,0.15); border-radius:12px; padding:16px; margin-bottom:30px; display:flex; align-items:center; gap:12px; }
    .payment-info .pay-icon { width:40px; height:40px; border-radius:10px; background:rgba(22,163,74,0.1); display:flex; align-items:center; justify-content:center; font-size:18px; color:#16a34a; }
    .footer { text-align:center; padding:30px 40px; border-top:1px solid #e2e8f0; font-size:12px; color:#94a3b8; line-height:1.6; }
    .btn-print { display:inline-flex; align-items:center; gap:8px; background:linear-gradient(135deg,#03045e,#0077b6); color:#fff; border:none; padding:12px 28px; border-radius:12px; font-size:14px; font-weight:700; cursor:pointer; margin:20px auto; transition:all .2s; }
    .btn-print:hover { transform:translateY(-2px); box-shadow:0 8px 24px rgba(0,119,182,0.35); }
    .no-print { text-align:center; padding:20px; }
    @media print {
      body { background:#fff; }
      .invoice-container { box-shadow:none; margin:0; border-radius:0; }
      .no-print { display:none !important; }
      .header { -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    }
  </style>
</head>
<body>
  <div class="no-print">
    <button class="btn-print" onclick="window.print()">
      <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8" rx="1"/></svg>
      Imprimer / Enregistrer en PDF
    </button>
  </div>
  <div class="invoice-container">
    <div class="header">
      <div>
        <img src="https://maasga-website.pages.dev/logo-site.png" alt="MAASGA Logo" style="height:60px;width:auto;border-radius:10px;margin-bottom:8px;display:block;" onerror="this.style.display='none';this.nextElementSibling.style.display='block';" />
        <div class="logo" style="display:none;">MAASGA<span> ❄️</span></div>
        <p style="font-size:13px;margin-top:6px;opacity:0.85;">Solutions Climatisation & Maintenance</p>
      </div>
      <div class="inv-info">
        <div class="inv-num">${invoiceNum}</div>
        <div>Date : ${invoiceDate}</div>
        <div style="margin-top:6px;">Facture de souscription</div>
      </div>
    </div>
    <div class="body">
      <div class="parties">
        <div class="party">
          <h4>Émetteur</h4>
          <p class="name">MAASGA SARL</p>
          <p>Ouagadougou, Burkina Faso<br>
          Tél : +226 55 99 64 18<br>
          Email : maasgabf@gmail.com<br>
          IFU : ${companyIFU}</p>
        </div>
        <div class="party">
          <h4>Client</h4>
          <p class="name">${escapeHtml(contract.client_name)}</p>
          <p>Tél : ${escapeHtml(contract.client_phone)}<br>
          ${client.email ? 'Email : ' + escapeHtml(client.email) + '<br>' : ''}
          ${client.quartier ? 'Quartier : ' + escapeHtml(client.quartier) + '<br>' : ''}
          ${client.id ? 'Réf. client : CLI-' + String(client.id).padStart(5, '0') : ''}</p>
        </div>
      </div>

      <div class="details-grid">
        <div class="detail-card">
          <div class="label">Formule</div>
          <div class="value">${planLabels[contract.plan_type] || contract.plan_type}</div>
        </div>
        <div class="detail-card">
          <div class="label">Statut du contrat</div>
          <div class="value status" style="${contract.status === 'active' ? 'background:rgba(22,163,74,0.1);color:#16a34a;' : 'background:rgba(148,163,184,0.1);color:#94a3b8;'}">${statusLabels[contract.status] || contract.status}</div>
        </div>
        <div class="detail-card">
          <div class="label">Période de couverture</div>
          <div class="value" style="font-size:14px;">${fmtDate(contract.start_date)} → ${fmtDate(contract.end_date)}</div>
        </div>
        <div class="detail-card">
          <div class="label">Visites incluses</div>
          <div class="value">${contract.completed_visits} / ${contract.total_visits} effectuée(s)</div>
        </div>
      </div>

      ${visitRows.length > 0 ? `
      <h3 style="font-size:15px;font-weight:700;color:#03045e;margin-bottom:14px;">📅 Planning des visites</h3>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th style="text-align:center;">Statut</th>
            <th>Technicien</th>
          </tr>
        </thead>
        <tbody>${visitRowsHtml}</tbody>
      </table>
      ` : ''}

      <div class="total-section">
        <div>
          <div class="total-label">Montant total</div>
          <div style="font-size:12px;color:#94a3b8;margin-top:2px;">Contrat de maintenance — ${planLabels[contract.plan_type] || contract.plan_type}</div>
        </div>
        <div>
          <span class="total-amount">${contract.plan_price.toLocaleString()}</span>
          <span class="total-currency"> FCFA</span>
        </div>
      </div>

      ${payment ? `
      <div class="payment-info">
        <div class="pay-icon">✓</div>
        <div>
          <div style="font-size:14px;font-weight:700;color:#16a34a;">Paiement ${payment.status === 'completed' ? 'confirmé' : payment.status === 'pending' ? 'en attente' : payment.status}</div>
          <div style="font-size:12px;color:#64748b;">${payMethodLabels[payment.method] || payment.method || 'Non spécifié'} · ${fmtDate(payment.created_at)}${payment.provider_ref ? ' · Réf: ' + payment.provider_ref : ''}</div>
        </div>
      </div>
      ` : `
      <div class="payment-info" style="background:#fffbeb;border-color:rgba(217,119,6,0.15);">
        <div class="pay-icon" style="background:rgba(217,119,6,0.1);color:#d97706;">⏳</div>
        <div>
          <div style="font-size:14px;font-weight:700;color:#d97706;">Paiement en attente de confirmation</div>
          <div style="font-size:12px;color:#64748b;">Le paiement sera confirmé après vérification par notre équipe.</div>
        </div>
      </div>
      `}
    </div>
    <div class="footer">
      <p><strong>MAASGA SARL</strong> — Solutions Climatisation & Maintenance · Ouagadougou, Burkina Faso</p>
      <p>Tél : +226 55 99 64 18 · Email : maasgabf@gmail.com · Web : maasga.com</p>
      <p style="margin-top:8px;">Ce document fait office de facture pour la souscription au contrat de maintenance référencé ci-dessus.</p>
    </div>
  </div>
</body>
</html>`

  return c.html(html)
})

// ============================================================
// ORDERS - Gestion des commandes/panier
// ============================================================

app.post('/api/order/create', async (c) => {
  // Rate limiting: 10 orders per IP per hour
  const ipAddr = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown'
  const rl = rateLimit(`order:${ipAddr}`, 10, 60 * 60 * 1000)
  if (!rl.allowed) {
    return c.json({ error: 'Trop de commandes. Réessayez plus tard.' }, 429)
  }

  try {
    const body = await c.req.json().catch(() => null) || await c.req.parseBody()
    const db = c.env.DB
    
    const str = (v: any) => (typeof v === 'string' ? v : v != null ? String(v) : '')
    const rawType = (str(body['type']) || 'vente').trim()
    const allowedTypes: Order['type'][] = ['devis', 'installation', 'vente', 'commande']
    const normalizedType: Order['type'] = allowedTypes.includes(rawType as Order['type']) ? (rawType as Order['type']) : 'vente'
    const orderData = {
      client_id: body['client_id'] ? parseInt(str(body['client_id'])) : null,
      appointment_id: body['appointment_id'] ? parseInt(str(body['appointment_id'])) : null,
      product_id: body['product_id'] ? parseInt(str(body['product_id'])) : null,
      quantity: body['quantity'] ? parseInt(str(body['quantity'])) : 1,
      client_name: escapeHtml(str(body['client_name']).trim()),
      client_phone: escapeHtml(str(body['client_phone']).trim()),
      client_email: str(body['client_email']).trim() ? escapeHtml(str(body['client_email']).trim()) : null,
      quartier: (str(body['quartier']) || str(body['client_address'])).trim() ? escapeHtml((str(body['quartier']) || str(body['client_address'])).trim()) : null,
      type: normalizedType,
      status: 'pending' as const,
      notes: str(body['notes']).trim() ? escapeHtml(str(body['notes']).trim()) : null,
      total_price: body['total_price'] ? parseFloat(str(body['total_price'])) : 0,
      installation_price: body['installation_price'] ? parseFloat(str(body['installation_price'])) : 50000
    }

    // Validation
    if (!orderData.client_name || !orderData.client_phone) {
      return c.json({ error: 'Nom et téléphone obligatoires' }, 400)
    }

    // Validate phone
    if (!isValidPhone(str(body['client_phone']).trim())) {
      return c.json({ error: 'Numéro de téléphone invalide (8 chiffres requis)' }, 400)
    }

    // Validate email if provided
    if (str(body['client_email']).trim() && !isValidEmail(str(body['client_email']).trim())) {
      return c.json({ error: 'Adresse email invalide' }, 400)
    }

    // Vérifier le stock si un produit est spécifié
    if (orderData.product_id) {
      const product = products.find((p: any) => p.id === orderData.product_id)
      if (!product) {
        return c.json({ error: 'Produit introuvable' }, 404)
      }
      if (!product.available || ((product as any).stock !== undefined && (product as any).stock < (orderData.quantity || 1))) {
        return c.json({ error: `Stock insuffisant pour ${product.name}. Disponible: ${(product as any).stock ?? 0}` }, 400)
      }
    }

    // Ajouter à mémoire locale (ID temporaire)
    let orderId = Math.max(...orders.map(o => o.id), 0) + 1
    const newOrder: Order = {
      id: orderId,
      ...orderData,
      created_at: new Date().toISOString()
    }
    orders.push(newOrder)

    // Sauvegarder en D1 si disponible — récupérer l'ID réel autoincrement
    if (db) {
      try {
        await createOrder(db, orderData)
        // Récupérer l'ID autoincrement réel pour cohérence
        const lastRow = await db.prepare('SELECT id FROM orders ORDER BY id DESC LIMIT 1').first() as any
        if (lastRow?.id) {
          newOrder.id = lastRow.id
          orderId = lastRow.id
        }
      } catch (error) {
        console.error('Erreur sauvegarde D1 order:', error)
      }
      // Enregistrer/mettre à jour le client dans D1
      try {
        await createClient(db, {
          name: orderData.client_name,
          phone: orderData.client_phone,
          email: orderData.client_email,
          quartier: orderData.quartier || '',
          adresse_precise: null,
          latitude: body['latitude'] ? parseFloat(str(body['latitude'])) : null,
          longitude: body['longitude'] ? parseFloat(str(body['longitude'])) : null,
          type_demande: 'commande',
          notes: orderData.notes,
          product_id: orderData.product_id
        })
      } catch (error) {
        console.error('Erreur createClient depuis order:', error)
      }

      // Log activity + link client_id for connected users
      try {
        const sessionToken = getCookie(c, 'maasga_session') || ''
        const session = sessionToken ? await getSession(c.env.DB, sessionToken) : null
        if (session) {
          // Patch the order with the session's client_id so it shows up in dashboard
          await db.prepare('UPDATE orders SET client_id = ? WHERE id = ? AND (client_id IS NULL OR client_id = 0)')
            .bind(session.clientId, newOrder.id).run()
          await logActivity(db, {
            clientId: session.clientId,
            clientPhone: orderData.client_phone,
            action: 'Nouvelle commande passée',
            category: 'order',
            details: `Commande #${newOrder.id}` + (orderData.product_id ? ` - Produit #${orderData.product_id}` : ''),
            ip: c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || ''
          })
        }
      } catch(e) { /* ignore */ }
    }

    // Notifier l'admin de la nouvelle commande
    const productName = orderData.product_id ? (products.find((p: any) => p.id === orderData.product_id)?.name || `#${orderData.product_id}`) : 'N/A'
    await notifyAdmin(c.env, 'order', `${orderData.client_name} — Commande #${newOrder.id}${orderData.product_id ? ' (' + productName + ')' : ''} — ${orderData.total_price ? orderData.total_price.toLocaleString() + ' FCFA' : 'Devis'}. Tél: ${orderData.client_phone}`)

    return c.json({ success: true, order: newOrder, orderId: newOrder.id }, 201)
  } catch (error) {
    console.error('Erreur /api/order/create:', error)
    return c.json({ error: 'Erreur création commande' }, 500)
  }
})

// ============================================================
// ORDER FLOW — Client actions (delivery confirmation, devis, cancel)
// ============================================================

// Client confirms delivery reception
app.post('/api/order/confirm-delivery', async (c) => {
  const db = c.env.DB
  if (!db) return c.json({ error: 'Service indisponible' }, 503)

  const sessionToken = getCookie(c, 'maasga_session') || ''
  const session = sessionToken ? await getSession(c.env.DB, sessionToken) : null
  if (!session) return c.json({ error: 'Non connecté' }, 401)

  const body = await c.req.json().catch(() => null)
  const orderId = parseInt((body as any)?.order_id || '0')
  if (!orderId) return c.json({ error: 'ID commande manquant' }, 400)

  const order = await db.prepare('SELECT * FROM orders WHERE id = ? AND client_id = ?').bind(orderId, session.clientId).first() as any
  if (!order) return c.json({ error: 'Commande introuvable' }, 404)
  if (order.status !== 'paid') return c.json({ error: 'Cette commande ne peut pas être confirmée comme livrée' }, 400)

  const now = new Date().toISOString()
  await db.prepare('UPDATE orders SET status = ?, delivered_at = ?, delivery_confirmed_by = ?, updated_at = ? WHERE id = ?')
    .bind('livre', now, 'client', now, orderId).run()

  const memOrder = orders.find(o => o.id === orderId)
  if (memOrder) memOrder.status = 'livre' as any

  await logActivity(db, {
    clientId: session.clientId,
    clientPhone: order.client_phone,
    action: `Livraison confirmée — Commande #${orderId}`,
    category: 'order',
    ip: c.req.header('cf-connecting-ip') || ''
  })
  await notifyAdmin(c.env, 'order', `Livraison confirmée par client — Commande #${orderId} — ${order.client_name}`)

  return c.json({ success: true })
})

// Client validates a devis
app.post('/api/order/devis/validate', async (c) => {
  const db = c.env.DB
  if (!db) return c.json({ error: 'Service indisponible' }, 503)

  const sessionToken = getCookie(c, 'maasga_session') || ''
  const session = sessionToken ? await getSession(c.env.DB, sessionToken) : null
  if (!session) return c.json({ error: 'Non connecté' }, 401)

  const body = await c.req.json().catch(() => null)
  const devisId = parseInt((body as any)?.devis_id || '0')
  if (!devisId) return c.json({ error: 'ID devis manquant' }, 400)

  const devis = await db.prepare('SELECT od.*, o.client_id FROM order_devis od JOIN orders o ON od.order_id = o.id WHERE od.id = ? AND o.client_id = ?').bind(devisId, session.clientId).first() as any
  if (!devis) return c.json({ error: 'Devis introuvable' }, 404)
  if (devis.status !== 'sent' && devis.status !== 'pending') return c.json({ error: 'Ce devis ne peut plus être validé' }, 400)

  const now = new Date().toISOString()
  await db.prepare('UPDATE order_devis SET status = ?, validated_at = ?, updated_at = ? WHERE id = ?')
    .bind('validated', now, now, devisId).run()
  await db.prepare('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?')
    .bind('devis_valide', now, devis.order_id).run()

  const memOrder = orders.find(o => o.id === devis.order_id)
  if (memOrder) memOrder.status = 'devis_valide' as any

  await logActivity(db, {
    clientId: session.clientId,
    clientPhone: devis.client_phone || '',
    action: `Devis validé — Commande #${devis.order_id}`,
    category: 'order',
    ip: c.req.header('cf-connecting-ip') || ''
  })
  await notifyAdmin(c.env, 'order', `Devis #${devisId} validé par client — Commande #${devis.order_id}`)

  // Email admin via Brevo
  try {
    const brevoKey = (c.env as any).BREVO_API_KEY
    if (brevoKey) {
      await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'api-key': brevoKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: { name: 'MAASGA', email: 'maasgabf@gmail.com' },
          to: [{ email: 'maasgabf@gmail.com', name: 'MAASGA Admin' }],
          subject: `\u2705 Devis accept\u00e9 \u2014 Commande #${devis.order_id} \u2014 ${devis.client_name || ''}`,
          htmlContent: `<html><body style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;">`
            + `<div style="background:linear-gradient(135deg,#059669,#10b981);padding:24px;border-radius:12px 12px 0 0;">`
            + `<h2 style="color:white;margin:0;font-size:20px;">\u2705 Devis accept\u00e9</h2></div>`
            + `<div style="background:#f9fafb;padding:24px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb;">`
            + `<p style="font-size:15px;color:#374151;">Le client <strong>${devis.client_name || 'N/A'}</strong> (${devis.client_phone || 'N/A'}) a <strong style="color:#059669;">accept\u00e9</strong> le devis pour la commande <strong>#${devis.order_id}</strong>.</p>`
            + `<div style="background:white;border:1px solid #d1fae5;border-radius:8px;padding:16px;margin:16px 0;">`
            + `<div style="display:flex;justify-content:space-between;"><span style="color:#6b7280;">Montant du devis</span><span style="font-size:18px;font-weight:700;color:#059669;">${Number(devis.total_amount || 0).toLocaleString('fr-FR')} FCFA</span></div>`
            + `</div>`
            + `<p style="font-size:14px;color:#374151;background:#ecfdf5;border-left:4px solid #10b981;padding:12px;border-radius:4px;">\ud83d\udcc5 <strong>Prochaine \u00e9tape&nbsp;: planifier l\u2019installation.</strong></p>`
            + `<a href="https://maasga.pages.dev/admin" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#059669;color:white;text-decoration:none;border-radius:8px;font-weight:700;">Voir dans l\u2019admin \u2192</a>`
            + `</div></body></html>`
        })
      })
    }
  } catch (emailErr) {
    console.error('Brevo email error (devis validate):', emailErr)
  }

  return c.json({ success: true })
})

// Client refuses a devis
app.post('/api/order/devis/refuse', async (c) => {
  const db = c.env.DB
  if (!db) return c.json({ error: 'Service indisponible' }, 503)

  const sessionToken = getCookie(c, 'maasga_session') || ''
  const session = sessionToken ? await getSession(c.env.DB, sessionToken) : null
  if (!session) return c.json({ error: 'Non connecté' }, 401)

  const body = await c.req.json().catch(() => null)
  const devisId = parseInt((body as any)?.devis_id || '0')
  const reason = escapeHtml(String((body as any)?.reason || '').trim())
  if (!devisId) return c.json({ error: 'ID devis manquant' }, 400)

  const devis = await db.prepare('SELECT od.*, o.client_id FROM order_devis od JOIN orders o ON od.order_id = o.id WHERE od.id = ? AND o.client_id = ?').bind(devisId, session.clientId).first() as any
  if (!devis) return c.json({ error: 'Devis introuvable' }, 404)
  if (devis.status !== 'sent' && devis.status !== 'pending') return c.json({ error: 'Ce devis ne peut plus être refusé' }, 400)

  const now = new Date().toISOString()
  await db.prepare('UPDATE order_devis SET status = ?, refused_at = ?, client_response_notes = ?, updated_at = ? WHERE id = ?')
    .bind('refused', now, reason, now, devisId).run()
  await db.prepare('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?')
    .bind('devis_refuse', now, devis.order_id).run()

  const memOrder = orders.find(o => o.id === devis.order_id)
  if (memOrder) memOrder.status = 'devis_refuse' as any

  await logActivity(db, {
    clientId: session.clientId,
    clientPhone: devis.client_phone || '',
    action: `Devis refusé — Commande #${devis.order_id}${reason ? ' — ' + reason : ''}`,
    category: 'order',
    ip: c.req.header('cf-connecting-ip') || ''
  })
  await notifyAdmin(c.env, 'order', `Devis #${devisId} refusé par client — Commande #${devis.order_id}${reason ? ' — Raison: ' + reason : ''}`)

  // Email admin via Brevo
  try {
    const brevoKey = (c.env as any).BREVO_API_KEY
    if (brevoKey) {
      await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'api-key': brevoKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: { name: 'MAASGA', email: 'maasgabf@gmail.com' },
          to: [{ email: 'maasgabf@gmail.com', name: 'MAASGA Admin' }],
          subject: `\u274c Devis refus\u00e9 \u2014 Commande #${devis.order_id} \u2014 ${devis.client_name || ''}`,
          htmlContent: `<html><body style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;">`
            + `<div style="background:linear-gradient(135deg,#dc2626,#ef4444);padding:24px;border-radius:12px 12px 0 0;">`
            + `<h2 style="color:white;margin:0;font-size:20px;">\u274c Devis refus\u00e9</h2></div>`
            + `<div style="background:#f9fafb;padding:24px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb;">`
            + `<p style="font-size:15px;color:#374151;">Le client <strong>${devis.client_name || 'N/A'}</strong> (${devis.client_phone || 'N/A'}) a <strong style="color:#dc2626;">refus\u00e9</strong> le devis pour la commande <strong>#${devis.order_id}</strong>.</p>`
            + (reason ? `<div style="background:white;border:1px solid #fecaca;border-radius:8px;padding:12px;margin:12px 0;"><span style="color:#6b7280;font-size:12px;">MOTIF DU REFUS</span><p style="margin:6px 0 0;color:#374151;">${reason}</p></div>` : '')
            + `<p style="font-size:14px;color:#374151;background:#fef2f2;border-left:4px solid #ef4444;padding:12px;border-radius:4px;">\u26a0\ufe0f <strong>Le processus d\u2019achat-installation est d\u00e9finitivement arr\u00eat\u00e9.</strong></p>`
            + `<a href="https://maasga.pages.dev/admin" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#374151;color:white;text-decoration:none;border-radius:8px;font-weight:700;">Voir dans l\u2019admin \u2192</a>`
            + `</div></body></html>`
        })
      })
    }
  } catch (emailErr) {
    console.error('Brevo email error (devis refuse):', emailErr)
  }

  return c.json({ success: true })
})

// Client cancels just the installation
app.post('/api/order/cancel-installation', async (c) => {
  const db = c.env.DB
  if (!db) return c.json({ error: 'Service indisponible' }, 503)

  const sessionToken = getCookie(c, 'maasga_session') || ''
  const session = sessionToken ? await getSession(c.env.DB, sessionToken) : null
  if (!session) return c.json({ error: 'Non connecté' }, 401)

  const body = await c.req.json().catch(() => null)
  const orderId = parseInt((body as any)?.order_id || '0')
  if (!orderId) return c.json({ error: 'ID commande manquant' }, 400)

  const order = await db.prepare('SELECT * FROM orders WHERE id = ? AND client_id = ?').bind(orderId, session.clientId).first() as any
  if (!order) return c.json({ error: 'Commande introuvable' }, 404)

  const cancellableStatuses = ['validation_terrain', 'devis_en_attente', 'devis_valide', 'devis_refuse']
  if (!cancellableStatuses.includes(order.status)) return c.json({ error: 'L\'installation ne peut pas être annulée à ce stade' }, 400)

  const now = new Date().toISOString()
  // Revert to 'livre' — the client keeps the product but cancels installation
  await db.prepare('UPDATE orders SET status = ?, notes = COALESCE(notes, \'\') || ? , updated_at = ? WHERE id = ?')
    .bind('livre', ' | Installation annulée par client le ' + now, now, orderId).run()

  const memOrder = orders.find(o => o.id === orderId)
  if (memOrder) memOrder.status = 'livre' as any

  await logActivity(db, {
    clientId: session.clientId,
    clientPhone: order.client_phone,
    action: `Installation annulée — Commande #${orderId}`,
    category: 'order',
    ip: c.req.header('cf-connecting-ip') || ''
  })
  await notifyAdmin(c.env, 'order', `Installation annulée par client — Commande #${orderId} — ${order.client_name}`)

  return c.json({ success: true })
})

// Client cancels the entire order (refund request)
app.post('/api/order/cancel-order', async (c) => {
  const db = c.env.DB
  if (!db) return c.json({ error: 'Service indisponible' }, 503)

  const sessionToken = getCookie(c, 'maasga_session') || ''
  const session = sessionToken ? await getSession(c.env.DB, sessionToken) : null
  if (!session) return c.json({ error: 'Non connecté' }, 401)

  const body = await c.req.json().catch(() => null)
  const orderId = parseInt((body as any)?.order_id || '0')
  const reason = escapeHtml(String((body as any)?.reason || '').trim())
  if (!orderId) return c.json({ error: 'ID commande manquant' }, 400)

  const order = await db.prepare('SELECT * FROM orders WHERE id = ? AND client_id = ?').bind(orderId, session.clientId).first() as any
  if (!order) return c.json({ error: 'Commande introuvable' }, 404)

  const cancellableStatuses = ['paid', 'livre', 'validation_terrain', 'devis_en_attente', 'devis_refuse']
  if (!cancellableStatuses.includes(order.status)) return c.json({ error: 'Cette commande ne peut plus être annulée' }, 400)

  const now = new Date().toISOString()
  await db.prepare('UPDATE orders SET status = ?, notes = COALESCE(notes, \'\') || ?, updated_at = ? WHERE id = ?')
    .bind('cancelled', ' | Annulée par client le ' + now + (reason ? ' — ' + reason : ''), now, orderId).run()

  const memOrder = orders.find(o => o.id === orderId)
  if (memOrder) memOrder.status = 'cancelled' as any

  // Mark any associated payments for refund
  try {
    await db.prepare('UPDATE payments SET status = ?, updated_at = ? WHERE order_id = ? AND status = ?')
      .bind('refunded', now, orderId, 'completed').run()
  } catch(e) { /* ignore */ }

  await logActivity(db, {
    clientId: session.clientId,
    clientPhone: order.client_phone,
    action: `Commande annulée — #${orderId}${reason ? ' — ' + reason : ''}`,
    category: 'order',
    ip: c.req.header('cf-connecting-ip') || ''
  })
  await notifyAdmin(c.env, 'order', `⚠️ Commande #${orderId} annulée par client — ${order.client_name} — Remboursement à traiter${reason ? ' — Raison: ' + reason : ''}`)

  return c.json({ success: true, message: 'Commande annulée. Le remboursement sera traité sous 48h.' })
})

// Get order devis for a client
app.get('/api/order/:orderId/devis', async (c) => {
  const db = c.env.DB
  if (!db) return c.json({ error: 'Service indisponible' }, 503)

  const sessionToken = getCookie(c, 'maasga_session') || ''
  const session = sessionToken ? await getSession(c.env.DB, sessionToken) : null
  if (!session) return c.json({ error: 'Non connecté' }, 401)

  const orderId = parseInt(c.req.param('orderId') || '0')
  if (!orderId) return c.json({ error: 'ID commande manquant' }, 400)

  // Verify client owns this order
  const order = await db.prepare('SELECT id FROM orders WHERE id = ? AND client_id = ?').bind(orderId, session.clientId).first()
  if (!order) return c.json({ error: 'Commande introuvable' }, 404)

  const devisRows = await db.prepare('SELECT * FROM order_devis WHERE order_id = ? ORDER BY id DESC').bind(orderId).all()
  if (devisRows.results && devisRows.results.length > 0) {
    return c.json({ devis: devisRows.results })
  }

  // Fallback: check standalone devis table (admin-created devis not yet synced to order_devis)
  const standaloneRows = await db.prepare('SELECT * FROM devis WHERE order_id = ? ORDER BY id DESC').bind(orderId).all()
  if (standaloneRows.results && standaloneRows.results.length > 0) {
    const normalized = standaloneRows.results.map((d: any) => {
      let accs: any[] = []
      try { accs = JSON.parse(d.accessoires || '[]') } catch(e) {}
      return {
        id: d.id,
        order_id: d.order_id,
        client_name: d.client_name,
        client_phone: d.client_phone,
        client_email: d.client_email,
        total_amount: d.total_ht,
        status: d.status === 'draft' ? 'pending' : d.status,
        climatiseur_nom: d.produit_nom || null,
        climatiseur_prix: (d.produit_prix || 0) * (d.produit_quantite || 1),
        main_oeuvre_prix: d.installation_prix || 0,
        fournitures: d.accessoires || '[]',
        motif: null,
        message_client: d.message_client || null,
        admin_notes: d.notes_internes || null,
        created_at: d.created_at
      }
    })
    return c.json({ devis: normalized })
  }

  return c.json({ devis: [] })
})

// ============================================================
// ADMIN — Order devis management
// ============================================================

// Admin creates a devis for an order
app.post('/api/admin/order/create-devis', adminAuth, async (c) => {
  const db = c.env.DB
  if (!db) return c.redirect('/admin/commandes?error=DB indisponible')

  const body = await c.req.parseBody()
  const orderId = parseInt(body['order_id'] as string || '0')
  if (!orderId) return c.redirect('/admin/commandes?error=Données manquantes')

  const order = await db.prepare('SELECT * FROM orders WHERE id = ?').bind(orderId).first() as any
  if (!order) return c.redirect('/admin/commandes?error=Commande introuvable')

  const now = new Date().toISOString()

  // Parse new structured fields
  const climatiseurNom = escapeHtml((body['climatiseur_nom'] as string || '').trim()) || null
  const climatiseurPrix = parseInt(body['climatiseur_prix'] as string || '0') || 0
  const mainOeuvrePrix = parseInt(body['main_oeuvre_prix'] as string || '50000') || 0
  const motif = escapeHtml((body['motif'] as string || '').trim()) || null
  const messageClient = escapeHtml((body['message_client'] as string || '').trim()) || null

  // Build fournitures JSON from dynamic d_acc_nom_N / d_acc_prix_N fields
  const fournitures: Array<{nom: string; prix: number}> = []
  for (let i = 1; i <= 20; i++) {
    const nom = (body[`d_acc_nom_${i}`] as string || '').trim()
    const prix = parseInt(body[`d_acc_prix_${i}`] as string || '0') || 0
    if (nom) fournitures.push({ nom: escapeHtml(nom), prix })
  }
  const accTotal = fournitures.reduce((s, a) => s + a.prix, 0)

  // Compute total
  const totalAmount = climatiseurPrix + mainOeuvrePrix + accTotal

  // Build legacy title/description for backward compat
  const title = 'Devis d\'installation'

  try {
    await db.prepare(
      `INSERT INTO order_devis (order_id, client_id, client_name, client_phone, client_email, title, description, items, total_amount, status, climatiseur_nom, climatiseur_prix, main_oeuvre_prix, fournitures, motif, message_client, admin_notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, '', '[]', ?, 'sent', ?, ?, ?, ?, ?, ?, '', ?, ?)`
    ).bind(
      orderId,
      order.client_id || null,
      order.client_name,
      order.client_phone,
      order.client_email || '',
      title,
      totalAmount,
      climatiseurNom,
      climatiseurPrix,
      mainOeuvrePrix,
      JSON.stringify(fournitures),
      motif,
      messageClient,
      now, now
    ).run()

    // Update order status to devis_en_attente
    await db.prepare('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?')
      .bind('devis_en_attente', now, orderId).run()
    const memOrder = orders.find(o => o.id === orderId)
    if (memOrder) memOrder.status = 'devis_en_attente' as any

    // Email notification if client has email
    if (order.client_email) {
      try {
        const brevoKey = c.env.BREVO_API_KEY
        if (brevoKey) {
          const climLine = climatiseurNom ? `<tr><td>Climatiseur</td><td>${escapeHtml(climatiseurNom)}</td><td style="text-align:right">${climatiseurPrix.toLocaleString()} FCFA</td></tr>` : ''
          const mdoLine = mainOeuvrePrix > 0 ? `<tr><td>Main d'œuvre / Installation</td><td></td><td style="text-align:right">${mainOeuvrePrix.toLocaleString()} FCFA</td></tr>` : ''
          const fLines = fournitures.map(f => `<tr><td>${f.nom}</td><td></td><td style="text-align:right">${f.prix.toLocaleString()} FCFA</td></tr>`).join('')
          await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: { 'api-key': brevoKey, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sender: { name: 'MAASGA', email: 'maasgabf@gmail.com' },
              to: [{ email: order.client_email, name: order.client_name }],
              subject: `Devis d'installation — Commande #${orderId} — MAASGA`,
              htmlContent: `<html><body style="font-family:Arial,sans-serif;padding:20px;max-width:600px;margin:0 auto;">
                <h2 style="color:#d97706;">❄ Devis d'installation disponible</h2>
                <p>Bonjour ${order.client_name},</p>
                <p>Un devis d'installation a été préparé pour votre commande #${orderId}.</p>
                ${motif ? `<p><strong>Motif :</strong> ${escapeHtml(motif)}</p>` : ''}
                ${messageClient ? `<p style="background:#f0f9ff;border-left:4px solid #0284c7;padding:12px;">${escapeHtml(messageClient)}</p>` : ''}
                <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;">${climLine}${mdoLine}${fLines}
                  <tr style="border-top:2px solid #e5e7eb;"><td colspan="2" style="padding-top:8px;font-weight:700;">TOTAL</td><td style="text-align:right;font-weight:800;color:#d97706;font-size:18px;">${totalAmount.toLocaleString()} FCFA</td></tr>
                </table>
                <p>Connectez-vous à votre espace client pour valider ou refuser ce devis :</p>
                <p><a href="https://maasga.com/espace-client" style="display:inline-block;background:#d97706;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:bold;">Voir et valider le devis</a></p>
                <p style="color:#6b7280;font-size:12px;">MAASGA SARL — Solutions Climatisation & Maintenance — Ouagadougou, Burkina Faso</p>
              </body></html>`
            })
          })
        }
      } catch(emailErr) { console.error('Erreur envoi email devis:', emailErr) }
    }

    await notifyAdmin(c.env, 'order', `Devis d'installation créé — Commande #${orderId} — ${order.client_name} (${order.client_phone}) — ${totalAmount.toLocaleString()} FCFA`)

    return c.redirect('/admin/commandes?success=devis_created')
  } catch(e: any) {
    console.error('Create order devis error:', e)
    const errMsg = encodeURIComponent(String(e?.message || 'Erreur lors de la création du devis').substring(0, 150))
    return c.redirect(`/admin/commandes?error=${errMsg}`)
  }
})

// Admin marks order for terrain validation
app.post('/api/admin/order/terrain-validation', adminAuth, async (c) => {
  const db = c.env.DB
  if (!db) return c.redirect('/admin/commandes?error=DB indisponible')

  const body = await c.req.parseBody()
  const orderId = parseInt(body['order_id'] as string || '0')
  if (!orderId) return c.redirect('/admin/commandes?error=ID manquant')

  const now = new Date().toISOString()
  await db.prepare('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?').bind('validation_terrain', now, orderId).run()
  const memOrder = orders.find(o => o.id === orderId)
  if (memOrder) memOrder.status = 'validation_terrain' as any

  return c.redirect('/admin/commandes?success=1')
})

// ============================================================
// ADMIN ROUTES
// ============================================================

// Recharge toutes les données depuis D1 dans les tableaux mémoire (évite reset au deploy)
const refreshAdminCache = async (c: any, next: any) => {
  const db = c.env.DB
  if (db) {
    try {
      // ---------- Appointments ----------
      appointments.length = 0
      const dbAppts = await getAppointments(db)
      dbAppts.forEach((a: any) => appointments.push({
        id: a.id,
        name: escapeHtml(a.name || ''),
        phone: escapeHtml(a.phone || ''),
        quartier: escapeHtml(a.quartier || ''),
        date: a.date,
        heure_debut: a.heure_debut || '08:00',
        heure_fin: a.heure_fin || '18:00',
        type: a.type || 'devis',
        notes: escapeHtml(a.notes || ''),
        latitude: a.latitude ?? null,
        longitude: a.longitude ?? null,
        adresse_precise: a.adresse_precise || '',
        status: a.status || 'pending',
        created_at: a.created_at
      }))

      // ---------- Clients ----------
      clients.length = 0
      const dbClients = await getClients(db)
      dbClients.forEach((cl: any) => clients.push({
        id: cl.id,
        name: cl.name,
        phone: cl.phone,
        email: cl.email || '',
        quartier: cl.quartier || '',
        password_hash: cl.password_hash || '',
        type_demande: cl.type_demande || '',
        notes: cl.notes || '',
        created_at: cl.created_at
      }))

      // ---------- Reviews ----------
      reviews.length = 0
      const dbReviews = await getReviews(db, false)
      dbReviews.forEach((r: any) => reviews.push({
        id: r.id,
        name: r.name,
        note: r.note,
        comment: r.comment,
        date: r.date,
        service: r.service,
        approved: r.approved === 1 || r.approved === true
      }))

      // ---------- Orders ----------
      orders.length = 0
      const dbOrders = await getOrders(db)
      dbOrders.forEach((o: any) => orders.push({
        id: o.id,
        appointment_id: o.appointment_id,
        client_id: o.client_id,
        product_id: o.product_id,
        quantity: o.quantity || 1,
        client_name: o.client_name,
        client_phone: o.client_phone,
        client_email: o.client_email || null,
        quartier: o.quartier || '',
        type: (o.type || 'vente') as any,
        status: (o.status || 'pending') as any,
        notes: o.notes,
        total_price: o.total_price || 0,
        installation_price: o.installation_price || 50000,
        created_at: o.created_at
      }))

      // ---------- Products ----------
      if (products.length === 0) {
        const dbProducts = await getProducts(db)
        dbProducts.forEach((p: any) => products.push(p))
      }

      // ---------- Maintenance due visits count ----------
      try {
        const today = new Date().toISOString().split('T')[0]
        const dueRes = await db.prepare(
          "SELECT COUNT(*) as cnt FROM maintenance_visits WHERE visit_date <= ? AND status = 'planifiee'"
        ).bind(today).first() as any
        setMaintenanceDueCount(dueRes?.cnt || 0)
      } catch(e) { console.error('Maintenance due count error:', e) }
    } catch (e) {
      console.error('Erreur refreshAdminCache D1:', e)
    }
  }
  await next()
}

const AdminLoginPage = ({ error }: { error?: string } = {}) => (
  <html lang="fr">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="robots" content="noindex,nofollow" />
      <title>MAASGA Admin - Connexion</title>
      <link rel="stylesheet" href="/static/tailwind.css" />
      <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet" />
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { font-family: 'Inter', sans-serif; }
        .gradient-bg { background: linear-gradient(135deg, #0f1e3c 0%, #1e3a8a 50%, #0284c7 100%); }
        .input-field { border: 1.5px solid #e5e7eb; }
        .input-field:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
      `}} />
    </head>
    <body class="gradient-bg min-h-screen flex items-center justify-center p-4">
      <div class="w-full max-w-md">
        <div class="bg-white rounded-3xl shadow-2xl p-8">
          <div class="text-center mb-8">
            <div class="w-16 h-16 bg-gradient-to-br from-blue-600 to-sky-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <i class="fas fa-snowflake text-white text-2xl"></i>
            </div>
            <h1 class="text-2xl font-bold text-gray-900">MAASGA Admin</h1>
            <p class="text-sm text-gray-500 mt-1">Accès back-office sécurisé</p>
          </div>
          {error && (
            <div class="mb-4 rounded-xl p-3 bg-red-50 border border-red-200 flex items-center space-x-2">
              <i class="fas fa-exclamation-circle text-red-500"></i>
              <span class="text-sm text-red-700 font-medium">
                {error === '1' ? 'Identifiant ou mot de passe incorrect.' :
                 error === 'logged_out' ? 'Session terminée avec succès.' :
                 error === 'no_init' ? 'Aucun mot de passe admin configuré. Contactez l\'administrateur.' :
                 'Erreur de connexion.'}
              </span>
            </div>
          )}
          <form method="post" action="/api/admin/login" class="space-y-4">
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">Identifiant admin</label>
              <input type="text" name="username" required placeholder="admin"
                class="input-field w-full rounded-xl px-4 py-3 bg-gray-50" />
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">Mot de passe</label>
              <input type="password" name="password" required placeholder="••••••••"
                class="input-field w-full rounded-xl px-4 py-3 bg-gray-50" />
            </div>
            <button type="submit"
              class="w-full bg-gradient-to-r from-blue-600 to-sky-500 text-white font-bold py-3.5 rounded-xl hover:opacity-90 transition-opacity shadow-md mt-2">
              <i class="fas fa-lock mr-2"></i>Accéder au back-office
            </button>
          </form>
          <div class="mt-4 text-center text-xs text-gray-400">
            Accès restreint - MAASGA Froid & Climatisation
          </div>
          <a href="/admin/reset-password" class="block text-center text-xs text-blue-500 mt-2 hover:underline">
            <i class="fas fa-key mr-1"></i>Mot de passe oublié ?
          </a>
        </div>
      </div>
    </body>
  </html>
)

const DEFAULT_ADMIN_USERNAME = 'admin'

// Store pour les tokens de reset de mot de passe admin (token -> { createdAt, used })
const RESET_TOKEN_MAX_AGE = 15 * 60 * 1000 // 15 minutes

// Génère un token de reset HMAC signé (stateless — pas de Map en mémoire)
async function generateAdminResetToken(secret: string): Promise<string> {
  const ts = Date.now().toString()
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode('reset:' + ts))
  const sigHex = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('')
  return ts + '.' + sigHex
}

// Vérifie un token de reset HMAC (retourne true si valide et non expiré)
async function verifyAdminResetToken(token: string, secret: string): Promise<boolean> {
  try {
    const dot = token.indexOf('.')
    if (dot === -1) return false
    const ts = token.slice(0, dot)
    const sigHex = token.slice(dot + 1)
    const tsNum = parseInt(ts, 10)
    if (isNaN(tsNum) || Date.now() - tsNum > RESET_TOKEN_MAX_AGE) return false
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
    const expected = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode('reset:' + ts))
    const expectedHex = Array.from(new Uint8Array(expected)).map(b => b.toString(16).padStart(2, '0')).join('')
    // Comparaison à durée constante
    if (sigHex.length !== expectedHex.length) return false
    let diff = 0
    for (let i = 0; i < sigHex.length; i++) diff |= sigHex.charCodeAt(i) ^ expectedHex.charCodeAt(i)
    return diff === 0
  } catch { return false }
}

app.post('/api/admin/login', async (c) => {
  // Rate limiting: 5 admin login attempts per IP per 15 minutes
  const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown'
  const rl = rateLimit(`admin-login:${ip}`, 5, 15 * 60 * 1000)
  if (!rl.allowed) {
    return c.redirect('/admin?error=ratelimit')
  }

  const body = await c.req.parseBody()
  const username = (body['username'] as string || '').trim()
  const password = (body['password'] as string || '').trim()

  if (!username || !password) return c.redirect('/admin?error=1')

  // Try D1 admin settings first
  let validHash = ''
  let validUsername = DEFAULT_ADMIN_USERNAME
  const db = c.env.DB
  if (db) {
    try {
      await db.prepare('CREATE TABLE IF NOT EXISTS admin_settings (key TEXT PRIMARY KEY, value TEXT, updated_at TEXT)').run()
      const hashRow = await db.prepare('SELECT value FROM admin_settings WHERE key = ?').bind('admin_password_hash').first() as any
      if (hashRow?.value) validHash = hashRow.value
      const userRow = await db.prepare('SELECT value FROM admin_settings WHERE key = ?').bind('admin_username').first() as any
      if (userRow?.value) validUsername = userRow.value
    } catch(e) { /* settings table may not exist yet */ }
  }
  // Si aucun hash en D1, utiliser ADMIN_INITIAL_PASSWORD ou ADMIN_SECRET comme fallback
  if (!validHash) {
    const initPwd = c.env.ADMIN_INITIAL_PASSWORD || c.env.ADMIN_SECRET
    if (!initPwd) return c.redirect('/admin?error=no_init')
    validHash = await hashPassword(initPwd)
    // Persister immédiatement pour ne plus dépendre de l'env
    if (db) {
      try { await db.prepare('INSERT OR REPLACE INTO admin_settings (key, value, updated_at) VALUES (?, ?, ?)').bind('admin_password_hash', validHash, new Date().toISOString()).run() } catch(_) {}
    }
  }

  const validLogin = await verifyPassword(password, validHash)
  if (username === validUsername && validLogin) {
    // Migration auto vers PBKDF2 si ancien hash
    if (!validHash.startsWith('pbkdf2:') && db) {
      const newHash = await hashPassword(password)
      try { await db.prepare('INSERT OR REPLACE INTO admin_settings (key, value, updated_at) VALUES (?, ?, ?)').bind('admin_password_hash', newHash, new Date().toISOString()).run() } catch(_) {}
    }
    const secret = getAdminSecret(c.env)
    const payload = `admin_${Date.now()}`
    const token = await signToken(payload, secret)
    const response = new Response(null, {
      status: 302,
      headers: {
        'Location': '/admin',
        'Set-Cookie': `maasga_admin=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=86400`
      }
    })
    return response
  }
  return c.redirect('/admin?error=1')
})

// Admin logout — clears admin cookie with Secure flag
app.get('/api/admin/logout', (c) => {
  return new Response(null, {
    status: 302,
    headers: {
      'Location': '/admin?error=logged_out',
      'Set-Cookie': 'maasga_admin=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'
    }
  })
})

// ============================================================
// ADMIN NOTIFICATIONS API
// ============================================================
app.get('/api/admin/notifications', adminAuth, async (c) => {
  const db = c.env.DB
  if (!db) return c.json({ notifications: [] })
  try {
    await ensureNotificationsTable(db)
    const result = await db.prepare(
      'SELECT * FROM admin_notifications ORDER BY created_at DESC LIMIT 50'
    ).all()
    return c.json({ notifications: result.results || [] })
  } catch(e) {
    return c.json({ notifications: [] })
  }
})

app.post('/api/admin/notifications/mark-read', adminAuth, async (c) => {
  const db = c.env.DB
  if (!db) return c.json({ ok: true })
  try {
    await db.prepare('UPDATE admin_notifications SET read = 1 WHERE read = 0').run()
    return c.json({ ok: true })
  } catch(e) {
    return c.json({ ok: false })
  }
})

app.get('/api/admin/notifications/count', adminAuth, async (c) => {
  const db = c.env.DB
  if (!db) return c.json({ count: 0 })
  try {
    await ensureNotificationsTable(db)
    const row = await db.prepare('SELECT COUNT(*) as count FROM admin_notifications WHERE read = 0').first() as any
    return c.json({ count: row?.count || 0 })
  } catch(e) {
    return c.json({ count: 0 })
  }
})

// Admin password reset — génère un token de reset à usage unique (15 min)
// Étape 1 : Demander un token de reset (accessible sans auth — page publique)
app.get('/admin/reset-password', (c) => {
  const success = c.req.query('success')
  const error = c.req.query('error')
  return c.html(
    <html lang="fr">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="robots" content="noindex,nofollow" />
        <title>Réinitialisation admin — MAASGA</title>
        <link rel="stylesheet" href="/static/tailwind.css" />
      </head>
      <body class="bg-gray-50 min-h-screen flex items-center justify-center px-4">
        <div class="w-full max-w-md">
          <div class="bg-white rounded-2xl shadow-xl p-8">
            <div class="text-center mb-6">
              <div class="text-4xl mb-2">🔐</div>
              <h1 class="text-xl font-bold text-gray-900">Réinitialisation mot de passe admin</h1>
              <p class="text-gray-500 text-sm mt-1">Entrez le secret de sécurité (ADMIN_SECRET) pour générer un lien de reset.</p>
            </div>
            {error === 'invalid' && <div class="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm">❌ Secret invalide. Vérifiez ADMIN_SECRET.</div>}
            {error === 'expired' && <div class="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm">❌ Token expiré ou déjà utilisé. Recommencez.</div>}
            {error === 'toomany' && <div class="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm">❌ Trop de tentatives. Réessayez dans 15 min.</div>}
            {success === 'reset' && <div class="mb-4 p-3 rounded-lg bg-green-50 text-green-600 text-sm">✅ Identifiant et mot de passe réinitialisés. Connectez-vous avec vos nouvelles informations.</div>}
            <form method="post" action="/api/admin/generate-reset-token" class="space-y-4">
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1">Secret de sécurité</label>
                <input type="password" name="admin_secret" required placeholder="Votre ADMIN_SECRET" class="w-full border rounded-xl px-4 py-3 text-sm" />
              </div>
              <button type="submit" class="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700">Générer le lien de reset</button>
            </form>
            <a href="/admin" class="block text-center text-sm text-blue-600 mt-4 hover:underline">← Retour à la connexion</a>
          </div>
        </div>
      </body>
    </html>
  )
})

// Étape 2 : Vérifier le secret et générer un token temporaire
app.post('/api/admin/generate-reset-token', async (c) => {
  // Rate limit: 3 attempts per 15 min per IP to prevent brute-force of ADMIN_SECRET
  const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown'
  const rl = rateLimit(`reset-token:${ip}`, 3, 15 * 60 * 1000)
  if (!rl.allowed) {
    return c.redirect('/admin/reset-password?error=toomany')
  }
  const body = await c.req.parseBody()
  const inputSecret = (body['admin_secret'] as string || '').trim()
  try {
    const realSecret = getAdminSecret(c.env)
    if (inputSecret !== realSecret) return c.redirect('/admin/reset-password?error=invalid')
  } catch {
    return c.redirect('/admin/reset-password?error=invalid')
  }
  // Générer un token HMAC signé (stateless — valide 15 min)
  const realSecret2 = getAdminSecret(c.env)
  const resetToken = await generateAdminResetToken(realSecret2)
  // Afficher le formulaire de nouveau mot de passe
  return c.html(
    <html lang="fr">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="robots" content="noindex,nofollow" />
        <title>Nouveau mot de passe — MAASGA</title>
        <link rel="stylesheet" href="/static/tailwind.css" />
      </head>
      <body class="bg-gray-50 min-h-screen flex items-center justify-center px-4">
        <div class="w-full max-w-md">
          <div class="bg-white rounded-2xl shadow-xl p-8">
            <div class="text-center mb-6">
              <div class="text-4xl mb-2">🔑</div>
              <h1 class="text-xl font-bold text-gray-900">Nouveau mot de passe</h1>
              <p class="text-gray-500 text-sm mt-1">Ce lien expire dans 15 minutes.</p>
            </div>
            <form method="post" action="/api/admin/reset-password" class="space-y-4">
              <input type="hidden" name="reset_token" value={resetToken} />
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1">Nouvel identifiant (email ou pseudo)</label>
                <input type="text" name="new_username" required minlength={3} maxlength={64} placeholder="Ex: maasgabf@gmail.com" autocomplete="username" class="w-full border rounded-xl px-4 py-3 text-sm" />
                <p class="text-xs text-gray-400 mt-1">Email, lettres, chiffres, tirets acceptés</p>
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1">Nouveau mot de passe</label>
                <input type="password" name="new_password" required minlength={8} placeholder="Min. 8 caractères" autocomplete="new-password" class="w-full border rounded-xl px-4 py-3 text-sm" />
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1">Confirmer le mot de passe</label>
                <input type="password" name="confirm_password" required minlength={8} placeholder="Retapez le mot de passe" autocomplete="new-password" class="w-full border rounded-xl px-4 py-3 text-sm" />
              </div>
              <button type="submit" class="w-full bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700">Réinitialiser identifiant &amp; mot de passe</button>
            </form>
          </div>
        </div>
      </body>
    </html>
  )
})

// Étape 3 : Appliquer le reset avec le token temporaire
app.post('/api/admin/reset-password', async (c) => {
  // Rate limit: 5 attempts per 15 min per IP
  const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown'
  const rl = rateLimit(`reset-pwd:${ip}`, 5, 15 * 60 * 1000)
  if (!rl.allowed) {
    return c.redirect('/admin/reset-password?error=toomany')
  }
  const body = await c.req.parseBody()
  const resetToken = (body['reset_token'] as string || '').trim()
  const newUsername = (body['new_username'] as string || '').trim()
  const newPwd = (body['new_password'] as string || '').trim()
  const confirmPwd = (body['confirm_password'] as string || '').trim()

  // Vérifier le token HMAC (stateless)
  let resetSecret: string
  try { resetSecret = getAdminSecret(c.env) } catch { return c.redirect('/admin/reset-password?error=expired') }
  const tokenValid = await verifyAdminResetToken(resetToken, resetSecret)
  if (!tokenValid) {
    return c.redirect('/admin/reset-password?error=expired')
  }

  // Valider l'identifiant : 3-64 caractères, email ou alphanumérique
  if (!newUsername || newUsername.length < 3 || newUsername.length > 64 || /[<>"'`\\]/.test(newUsername)) {
    return c.redirect('/admin/reset-password?error=invalid')
  }
  if (!newPwd || newPwd.length < 8 || newPwd !== confirmPwd) {
    return c.redirect('/admin/reset-password?error=invalid')
  }

  const db = c.env.DB
  const newHash = await hashPassword(newPwd)
  if (db) {
    try {
      await db.prepare('CREATE TABLE IF NOT EXISTS admin_settings (key TEXT PRIMARY KEY, value TEXT, updated_at TEXT)').run()
      await db.prepare('INSERT OR REPLACE INTO admin_settings (key, value, updated_at) VALUES (?, ?, ?)').bind('admin_password_hash', newHash, new Date().toISOString()).run()
      await db.prepare('INSERT OR REPLACE INTO admin_settings (key, value, updated_at) VALUES (?, ?, ?)').bind('admin_username', newUsername, new Date().toISOString()).run()
    } catch(e) { console.error('Reset password error:', e) }
  }
  return c.redirect('/admin/reset-password?success=reset')
})

app.get('/admin', adminAuth, refreshAdminCache, (c) => {
  return c.html(<AdminPage />)
})

app.get('/admin/produits', adminAuth, refreshAdminCache, (c) => {
  const success = c.req.query('success')
  const deleted = c.req.query('deleted')
  return c.html(<AdminProduitsPage success={success} deleted={deleted} />)
})

app.get('/admin/rdv', adminAuth, refreshAdminCache, (c) => {
  const status = c.req.query('status')
  return c.html(<AdminRDVPage filterStatus={status} />)
})

app.get('/admin/clients', adminAuth, refreshAdminCache, (c) => {
  return c.html(<AdminClientsPage />)
})

app.get('/admin/commandes', adminAuth, refreshAdminCache, async (c) => {
  const db = c.env.DB
  let payments: any[] = []
  if (db) {
    try {
      await ensurePaymentTables(db)
      const rows = await db.prepare('SELECT id, order_id, amount, method, status, provider_ref, created_at FROM payments WHERE order_id IS NOT NULL ORDER BY id DESC').all()
      payments = (rows.results || []) as any[]
    } catch(_) {}
  }
  return c.html(<AdminCommandesPage payments={payments} />)
})

// ============================================================
// ADMIN PAIEMENTS
// ============================================================

app.get('/admin/paiements', adminAuth, async (c) => {
  const db = c.env.DB
  let payments: any[] = []
  let stats = { total: 0, pending: 0, completed: 0, failed: 0, revenue: 0 }
  if (db) {
    try {
      await ensurePaymentTables(db)
      const statusFilter = c.req.query('status')
      let rows
      if (statusFilter) {
        // Parameterized query — never interpolate user input into SQL
        const allowedStatuses = ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded']
        if (!allowedStatuses.includes(statusFilter)) {
          return c.redirect('/admin/paiements')
        }
        rows = await db.prepare('SELECT * FROM payments WHERE status = ? ORDER BY id DESC LIMIT 200').bind(statusFilter).all()
      } else {
        rows = await db.prepare('SELECT * FROM payments ORDER BY id DESC LIMIT 200').all()
      }
      payments = (rows.results || []) as any[]
      const allRows = await db.prepare('SELECT status, amount FROM payments').all()
      const all = (allRows.results || []) as any[]
      stats.total = all.length
      stats.pending = all.filter((r: any) => r.status === 'pending' || r.status === 'processing').length
      stats.completed = all.filter((r: any) => r.status === 'completed').length
      stats.failed = all.filter((r: any) => r.status === 'failed' || r.status === 'cancelled').length
      stats.revenue = all.filter((r: any) => r.status === 'completed').reduce((s: number, r: any) => s + (r.amount || 0), 0)
    } catch(e) { console.error('Admin payments load error:', e) }
  }
  return c.html(<AdminPaiementsPage payments={payments} stats={stats} />)
})

app.post('/admin/paiements/update-status', adminAuth, async (c) => {
  const db = c.env.DB
  if (!db) return c.redirect('/admin/paiements')
  const body = await c.req.parseBody()
  const paymentId = parseInt(body['payment_id'] as string || '0')
  const status = (body['status'] as string || '').trim()
  // 'completed' est exclu : la validation se fait automatiquement via webhook ou simulation, jamais manuellement par l'admin
  const ALLOWED_PAYMENT_STATUSES = ['failed', 'refunded', 'cancelled']
  if (paymentId && status && ALLOWED_PAYMENT_STATUSES.includes(status)) {
    try {
      await db.prepare('UPDATE payments SET status = ?, updated_at = datetime("now") WHERE id = ?').bind(status, paymentId).run()
    } catch(e) { console.error('Payment status update error:', e) }
  }
  return c.redirect('/admin/paiements')
})

// ============================================================
// ADMIN MAINTENANCE
// ============================================================

app.get('/admin/maintenance', adminAuth, async (c) => {
  const db = c.env.DB
  let contracts: any[] = []
  let requests: any[] = []
  let visits: any[] = []
  if (db) {
    try {
      const cRows = await db.prepare('SELECT * FROM maintenance_contracts ORDER BY id DESC LIMIT 200').all()
      contracts = (cRows.results || []) as any[]
    } catch(e) { console.error('Admin contracts load:', e) }
    try {
      const rRows = await db.prepare('SELECT *, name as client_name, phone as client_phone FROM maintenance_requests ORDER BY id DESC LIMIT 200').all()
      requests = (rRows.results || []) as any[]
    } catch(e) { console.error('Admin requests load:', e) }
    try {
      const vRows = await db.prepare('SELECT * FROM maintenance_visits ORDER BY visit_date ASC LIMIT 200').all()
      visits = (vRows.results || []) as any[]
    } catch(e) { console.error('Admin visits load:', e) }
  }
  return c.html(<AdminMaintenancePage contracts={contracts} requests={requests} visits={visits} />)
})

app.post('/admin/maintenance/update-request', adminAuth, async (c) => {
  const db = c.env.DB
  if (!db) return c.redirect('/admin/maintenance')
  const body = await c.req.parseBody()
  const requestId = parseInt(body['request_id'] as string || '0')
  const status = (body['status'] as string || '').trim()
  const ALLOWED_REQUEST_STATUSES = ['pending', 'contacted', 'scheduled', 'done', 'cancelled']
  if (requestId && status && ALLOWED_REQUEST_STATUSES.includes(status)) {
    try {
      await db.prepare('UPDATE maintenance_requests SET status = ? WHERE id = ?').bind(status, requestId).run()
    } catch(e) { console.error('Request status update error:', e) }
  }
  return c.redirect('/admin/maintenance')
})

app.post('/admin/maintenance/update-visit', adminAuth, async (c) => {
  const db = c.env.DB
  if (!db) return c.redirect('/admin/maintenance')
  const body = await c.req.parseBody()
  const visitId = parseInt(body['visit_id'] as string || '0')
  const status = (body['status'] as string || '').trim()
  const ALLOWED_VISIT_STATUSES = ['planifiee', 'confirmee', 'effectuee', 'annulee']
  if (visitId && status && ALLOWED_VISIT_STATUSES.includes(status)) {
    try {
      await db.prepare('UPDATE maintenance_visits SET status = ?, updated_at = datetime(\'now\') WHERE id = ?').bind(status, visitId).run()
      // If cancelled or effectuee, update contract completed_visits count
      if (status === 'effectuee' || status === 'annulee') {
        const visit = await db.prepare('SELECT contract_id FROM maintenance_visits WHERE id = ?').bind(visitId).first() as any
        if (visit?.contract_id) {
          const countRes = await db.prepare("SELECT COUNT(*) as cnt FROM maintenance_visits WHERE contract_id = ? AND status = 'effectuee'").bind(visit.contract_id).first() as any
          await db.prepare('UPDATE maintenance_contracts SET completed_visits = ?, updated_at = datetime(\'now\') WHERE id = ?').bind(countRes?.cnt || 0, visit.contract_id).run()
        }
      }
    } catch(e) { console.error('Visit status update error:', e) }
  }
  return c.redirect('/admin/maintenance')
})

// Validate a visit with full details (technician, actions, etc.)
app.post('/admin/maintenance/validate-visit', adminAuth, async (c) => {
  const db = c.env.DB
  if (!db) return c.redirect('/admin/maintenance')
  const body = await c.req.parseBody()
  const visitId = parseInt(body['visit_id'] as string || '0')
  const technician = (body['technician'] as string || '').trim()
  const actionsPerformed = (body['actions_performed'] as string || '').trim()
  const gasRecharged = body['gas_recharged'] === '1' ? 1 : 0
  const filtersCleaned = body['filters_cleaned'] === '1' ? 1 : 0
  const notes = (body['notes'] as string || '').trim()

  if (visitId && technician) {
    try {
      await db.prepare(
        `UPDATE maintenance_visits SET status = 'effectuee', technician = ?, actions_performed = ?, gas_recharged = ?, filters_cleaned = ?, notes = ?, updated_at = datetime('now') WHERE id = ?`
      ).bind(escapeHtml(technician), escapeHtml(actionsPerformed), gasRecharged, filtersCleaned, escapeHtml(notes), visitId).run()

      // Update contract completed_visits count
      const visit = await db.prepare('SELECT contract_id FROM maintenance_visits WHERE id = ?').bind(visitId).first() as any
      if (visit?.contract_id) {
        const countRes = await db.prepare("SELECT COUNT(*) as cnt FROM maintenance_visits WHERE contract_id = ? AND status = 'effectuee'").bind(visit.contract_id).first() as any
        const completedCount = countRes?.cnt || 0
        // Update completed_visits and recalculate next_visit_date
        const nextVisit = await db.prepare("SELECT visit_date FROM maintenance_visits WHERE contract_id = ? AND status = 'planifiee' ORDER BY visit_date ASC LIMIT 1").bind(visit.contract_id).first() as any
        await db.prepare('UPDATE maintenance_contracts SET completed_visits = ?, next_visit_date = ?, updated_at = datetime(\'now\') WHERE id = ?')
          .bind(completedCount, nextVisit?.visit_date || null, visit.contract_id).run()
      }
    } catch(e) { console.error('Visit validation error:', e) }
  }
  return c.redirect('/admin/maintenance')
})

app.get('/admin/avis', adminAuth, async (c) => {
  const db = c.env.DB
  let allReviews: any[] = []
  if (db) {
    try {
      const rows = await db.prepare('SELECT * FROM reviews ORDER BY id DESC').all()
      allReviews = (rows.results as any[]).map((r: any) => ({
        ...r,
        note: typeof r.note === 'string' ? parseInt(r.note, 10) : Number(r.note),
        approved: r.approved === 1 || r.approved === true
      }))
    } catch(e) { console.error('Admin avis load error:', e) }
  } else {
    allReviews = reviews.map(r => ({ ...r }))
  }
  const success = c.req.query('success')
  const deleted = c.req.query('deleted')
  return c.html(<AdminAvisPage success={success} deleted={deleted} allReviews={allReviews} />)
})

// ============================================================
// ADMIN MESSAGES (Contact form submissions)
// ============================================================

app.get('/admin/messages', adminAuth, async (c) => {
  const db = c.env.DB
  let messages: any[] = []
  let unreadCount = 0
  if (db) {
    try {
      await ensureContactMessages(db)
      const rows = await db.prepare('SELECT * FROM contact_messages ORDER BY created_at DESC').all()
      messages = (rows.results as any[]) || []
      unreadCount = messages.filter((m: any) => !m.is_read).length
    } catch(e) { console.error('Admin messages load error:', e) }
  }
  const success = c.req.query('success')
  const deleted = c.req.query('deleted')
  return c.html(<AdminMessagesPage messages={messages} unreadCount={unreadCount} success={success} deleted={deleted} />)
})

app.post('/api/admin/messages/:id/read', adminAuth, async (c) => {
  const db = c.env.DB
  if (!db) return c.redirect('/admin/messages')
  const id = parseInt(c.req.param('id') || '0')
  if (id) {
    try {
      await ensureContactMessages(db)
      await db.prepare('UPDATE contact_messages SET is_read = 1 WHERE id = ?').bind(id).run()
    } catch(e) { console.error('Mark message read error:', e) }
  }
  return c.redirect('/admin/messages')
})

app.post('/api/admin/messages/:id/unread', adminAuth, async (c) => {
  const db = c.env.DB
  if (!db) return c.redirect('/admin/messages')
  const id = parseInt(c.req.param('id') || '0')
  if (id) {
    try {
      await ensureContactMessages(db)
      await db.prepare('UPDATE contact_messages SET is_read = 0 WHERE id = ?').bind(id).run()
    } catch(e) { console.error('Mark message unread error:', e) }
  }
  return c.redirect('/admin/messages')
})

app.post('/api/admin/messages/:id/delete', adminAuth, async (c) => {
  const db = c.env.DB
  if (!db) return c.redirect('/admin/messages')
  const id = parseInt(c.req.param('id') || '0')
  if (id) {
    try {
      await ensureContactMessages(db)
      await db.prepare('DELETE FROM contact_messages WHERE id = ?').bind(id).run()
    } catch(e) { console.error('Delete message error:', e) }
  }
  return c.redirect('/admin/messages?deleted=1')
})

// ============================================================
// ADMIN RÉALISATIONS — CRUD
// ============================================================

app.get('/admin/realisations', adminAuth, async (c) => {
  const db = c.env.DB
  let realisationsList: any[] = []
  if (db) {
    try {
      await ensureRealisationsTable(db)
      const result = await db.prepare('SELECT * FROM realisations ORDER BY is_featured DESC, created_at DESC').all()
      realisationsList = result?.results || []
    } catch(e) { console.error('Error loading realisations:', e) }
  }
  const success = c.req.query('success')
  const error = c.req.query('error')
  return c.html(<AdminRealisationsPage realisations={realisationsList} success={success} error={error} />)
})

app.post('/api/admin/realisations/add', adminAuth, async (c) => {
  const db = c.env.DB
  if (!db) return c.redirect('/admin/realisations?error=db')
  try {
    await ensureRealisationsTable(db)
    const body = await c.req.parseBody()
    const title = (body['title'] as string || '').trim()
    const description = (body['description'] as string || '').trim()
    const category = (body['category'] as string || 'climatisation').trim()
    const clientName = (body['client_name'] as string || '').trim()
    const quartier = (body['quartier'] as string || '').trim()
    const imageUrl = (body['image_url'] as string || '').trim()
    const dateReal = (body['date_realisation'] as string || '').trim()
    const isFeatured = body['is_featured'] ? 1 : 0

    if (!title) return c.redirect('/admin/realisations?error=title_required')

    await db.prepare(
      'INSERT INTO realisations (title, description, category, client_name, quartier, image_url, date_realisation, is_featured, is_visible, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, datetime(\'now\'), datetime(\'now\'))'
    ).bind(title, description || null, category, clientName || null, quartier || null, imageUrl || null, dateReal || null, isFeatured).run()
    return c.redirect('/admin/realisations?success=added')
  } catch(e) {
    console.error('Error adding realisation:', e)
    return c.redirect('/admin/realisations?error=add_failed')
  }
})

app.post('/api/admin/realisations/update', adminAuth, async (c) => {
  const db = c.env.DB
  if (!db) return c.redirect('/admin/realisations?error=db')
  try {
    const body = await c.req.parseBody()
    const id = parseInt(body['id'] as string)
    if (isNaN(id)) return c.redirect('/admin/realisations?error=invalid_id')

    const title = (body['title'] as string || '').trim()
    const description = (body['description'] as string || '').trim()
    const category = (body['category'] as string || 'climatisation').trim()
    const clientName = (body['client_name'] as string || '').trim()
    const quartier = (body['quartier'] as string || '').trim()
    const imageUrl = (body['image_url'] as string || '').trim()
    const dateReal = (body['date_realisation'] as string || '').trim()
    const isFeatured = body['is_featured'] ? 1 : 0
    const isVisible = body['is_visible'] ? 1 : 0

    if (!title) return c.redirect('/admin/realisations?error=title_required')

    await db.prepare(
      'UPDATE realisations SET title=?, description=?, category=?, client_name=?, quartier=?, image_url=?, date_realisation=?, is_featured=?, is_visible=?, updated_at=datetime(\'now\') WHERE id=?'
    ).bind(title, description || null, category, clientName || null, quartier || null, imageUrl || null, dateReal || null, isFeatured, isVisible, id).run()
    return c.redirect('/admin/realisations?success=updated')
  } catch(e) {
    console.error('Error updating realisation:', e)
    return c.redirect('/admin/realisations?error=update_failed')
  }
})

app.post('/api/admin/realisations/delete', adminAuth, async (c) => {
  const db = c.env.DB
  if (!db) return c.redirect('/admin/realisations?error=db')
  try {
    const body = await c.req.parseBody()
    const id = parseInt(body['id'] as string)
    if (isNaN(id)) return c.redirect('/admin/realisations?error=invalid_id')
    await db.prepare('DELETE FROM realisations WHERE id = ?').bind(id).run()
    return c.redirect('/admin/realisations?success=deleted')
  } catch(e) {
    console.error('Error deleting realisation:', e)
    return c.redirect('/admin/realisations?error=delete_failed')
  }
})

// Public API: réalisations list for public page
app.get('/api/realisations', async (c) => {
  const db = c.env.DB
  if (!db) return c.json([])
  try {
    await ensureRealisationsTable(db)
    const result = await db.prepare('SELECT id, title, description, category, client_name, quartier, image_url, date_realisation, is_featured FROM realisations WHERE is_visible = 1 ORDER BY is_featured DESC, date_realisation DESC').all()
    return c.json(result?.results || [])
  } catch(e) { return c.json([]) }
})

// ============================================================
// EXPORTS CSV — Admin only
// ============================================================

function csvEscape(val: any): string {
  if (val == null) return ''
  const s = String(val).replace(/"/g, '""')
  return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s}"` : s
}

// Export commandes CSV
app.get('/api/admin/export/orders', adminAuth, async (c) => {
  const db = c.env.DB
  const rows = db ? (await db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all())?.results || [] : orders
  const headers = ['ID', 'Client', 'Telephone', 'Email', 'Quartier', 'Type', 'Statut', 'Total (FCFA)', 'Produit ID', 'Quantite', 'Installation', 'Notes', 'Date']
  const csvRows = [headers.join(',')]
  ;(rows as any[]).forEach((o: any) => {
    csvRows.push([o.id, o.client_name, o.client_phone, o.client_email, o.quartier, o.type, o.status, o.total_price, o.product_id, o.quantity, o.installation_price, o.notes, o.created_at].map(csvEscape).join(','))
  })
  return new Response(csvRows.join('\n'), { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="commandes_${new Date().toISOString().split('T')[0]}.csv"` } })
})

// Export RDV CSV
app.get('/api/admin/export/rdv', adminAuth, async (c) => {
  const db = c.env.DB
  const rows = db ? (await db.prepare('SELECT * FROM appointments ORDER BY date DESC').all())?.results || [] : appointments
  const headers = ['ID', 'Client', 'Telephone', 'Quartier', 'Date', 'Heure debut', 'Heure fin', 'Type', 'Statut', 'Notes', 'Cree le']
  const csvRows = [headers.join(',')]
  ;(rows as any[]).forEach((a: any) => {
    csvRows.push([a.id, a.name, a.phone, a.quartier, a.date, a.heure_debut, a.heure_fin, a.type, a.status, a.notes, a.created_at].map(csvEscape).join(','))
  })
  return new Response(csvRows.join('\n'), { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="rdv_${new Date().toISOString().split('T')[0]}.csv"` } })
})

// Export paiements CSV
app.get('/api/admin/export/payments', adminAuth, async (c) => {
  const db = c.env.DB
  if (!db) return c.text('DB non disponible', 503)
  const rows = (await db.prepare('SELECT * FROM payments ORDER BY created_at DESC').all())?.results || []
  const headers = ['ID', 'Type', 'Order ID', 'Client tel', 'Montant', 'Methode', 'Statut', 'Ref. provider', 'Cree le']
  const csvRows = [headers.join(',')]
  ;(rows as any[]).forEach((p: any) => {
    csvRows.push([p.id, p.payment_type, p.order_id, p.client_phone, p.amount, p.method, p.status, p.provider_ref, p.created_at].map(csvEscape).join(','))
  })
  return new Response(csvRows.join('\n'), { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="paiements_${new Date().toISOString().split('T')[0]}.csv"` } })
})

// Export clients CSV (server-side, replaces client-side JS export)
app.get('/api/admin/export/clients', adminAuth, async (c) => {
  const db = c.env.DB
  if (!db) return c.text('DB non disponible', 503)
  const rows = (await db.prepare('SELECT * FROM clients ORDER BY created_at DESC').all())?.results || []
  const headers = ['ID', 'Nom', 'Telephone', 'Email', 'Quartier', 'Email verifie', 'Cree le']
  const csvRows = [headers.join(',')]
  ;(rows as any[]).forEach((cl: any) => {
    csvRows.push([cl.id, cl.name, cl.phone, cl.email, cl.quartier, cl.email_verified ? 'Oui' : 'Non', cl.created_at].map(csvEscape).join(','))
  })
  return new Response(csvRows.join('\n'), { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="clients_${new Date().toISOString().split('T')[0]}.csv"` } })
})

// ============================================================
// SAV / TICKETS SUPPORT
// ============================================================

// Admin: page SAV
app.get('/admin/sav', adminAuth, refreshAdminCache, async (c) => {
  const db = c.env.DB
  if (db) await ensureSavTables(db)
  let tickets: any[] = []
  if (db) {
    tickets = (await db.prepare('SELECT * FROM sav_tickets ORDER BY created_at DESC').all())?.results || []
  }
  const statusFilter = c.req.query('status') || ''
  return c.html(<AdminSAVPage tickets={tickets} filterStatus={statusFilter} />)
})

// Admin: détail d'un ticket
app.get('/admin/sav/:id', adminAuth, refreshAdminCache, async (c) => {
  const db = c.env.DB
  if (!db) return c.text('DB non disponible', 503)
  await ensureSavTables(db)
  const ticket = await db.prepare('SELECT * FROM sav_tickets WHERE id = ?').bind(c.req.param('id')).first()
  if (!ticket) return c.redirect('/admin/sav')
  const messages = (await db.prepare('SELECT * FROM sav_ticket_messages WHERE ticket_id = ? ORDER BY created_at ASC').bind(ticket.id).all())?.results || []
  return c.html(<AdminSAVDetailPage ticket={ticket} messages={messages} />)
})

// Admin: créer un ticket
app.post('/api/admin/sav/create', adminAuth, async (c) => {
  const db = c.env.DB
  if (!db) return c.json({ error: 'DB non disponible' }, 503)
  await ensureSavTables(db)
  const body = await c.req.parseBody()
  const client_phone = (body['client_phone'] as string || '').trim()
  const client_name = (body['client_name'] as string || '').trim()
  const category = (body['category'] as string || 'autre').trim()
  const priority = (body['priority'] as string || 'normal').trim()
  const subject = (body['subject'] as string || '').trim()
  const description = (body['description'] as string || '').trim()
  const product_info = (body['product_info'] as string || '').trim()
  if (!client_phone || !subject || !description) return c.redirect('/admin/sav?error=champs_requis')
  // Generate ticket ref
  const year = new Date().getFullYear()
  const countResult = await db.prepare('SELECT COUNT(*) as cnt FROM sav_tickets WHERE ticket_ref LIKE ?').bind(`SAV-${year}-%`).first()
  const nextNum = ((countResult as any)?.cnt || 0) + 1
  const ticket_ref = `SAV-${year}-${String(nextNum).padStart(4, '0')}`
  await db.prepare('INSERT INTO sav_tickets (ticket_ref, client_phone, client_name, category, priority, subject, description, product_info) VALUES (?,?,?,?,?,?,?,?)').bind(ticket_ref, client_phone, client_name, category, priority, subject, description, product_info).run()
  return c.redirect('/admin/sav?success=ticket_cree')
})

// Admin: mettre à jour le statut d'un ticket
app.post('/api/admin/sav/update-status', adminAuth, async (c) => {
  const db = c.env.DB
  if (!db) return c.json({ error: 'DB non disponible' }, 503)
  const body = await c.req.parseBody()
  const id = body['id'] as string
  const status = body['status'] as string
  const resolution_notes = (body['resolution_notes'] as string || '').trim()
  const resolved_at = (status === 'resolu' || status === 'ferme') ? new Date().toISOString() : null
  await db.prepare('UPDATE sav_tickets SET status = ?, resolution_notes = ?, resolved_at = COALESCE(?, resolved_at), updated_at = datetime(\'now\') WHERE id = ?').bind(status, resolution_notes, resolved_at, id).run()
  return c.redirect(`/admin/sav/${id}?success=statut_modifie`)
})

// Admin: ajouter un message à un ticket
app.post('/api/admin/sav/message', adminAuth, async (c) => {
  const db = c.env.DB
  if (!db) return c.json({ error: 'DB non disponible' }, 503)
  const body = await c.req.parseBody()
  const ticket_id = body['ticket_id'] as string
  const message = (body['message'] as string || '').trim()
  if (!message) return c.redirect(`/admin/sav/${ticket_id}?error=message_vide`)
  await db.prepare('INSERT INTO sav_ticket_messages (ticket_id, sender_type, sender_name, message) VALUES (?, \'admin\', \'Admin\', ?)').bind(ticket_id, message).run()
  await db.prepare('UPDATE sav_tickets SET updated_at = datetime(\'now\') WHERE id = ?').bind(ticket_id).run()
  return c.redirect(`/admin/sav/${ticket_id}`)
})

// Client: soumettre un ticket SAV depuis l'espace client
app.post('/api/client/sav/create', async (c) => {
  const db = c.env.DB
  if (!db) return c.json({ error: 'DB non disponible' }, 503)
  const sessionToken = getCookie(c, 'maasga_session') || ''
  const session = sessionToken ? await getSession(c.env.DB, sessionToken) : null
  if (!session) return c.json({ error: 'Non connecté' }, 401)
  // Use phone/name from DB (trusted) to prevent impersonation via body
  const clientRow = await db.prepare('SELECT phone, name FROM clients WHERE id = ?').bind(session.clientId).first() as any
  await ensureSavTables(db)
  const body = await c.req.parseBody()
  const client_phone = clientRow?.phone || (body['client_phone'] as string || '').trim()
  const client_name = clientRow?.name || (body['client_name'] as string || '').trim()
  const category = (body['category'] as string || 'autre').trim()
  const subject = (body['subject'] as string || '').trim()
  const description = (body['description'] as string || '').trim()
  if (!client_phone || !subject || !description) return c.json({ error: 'Champs requis' }, 400)
  const year = new Date().getFullYear()
  const countResult = await db.prepare('SELECT COUNT(*) as cnt FROM sav_tickets WHERE ticket_ref LIKE ?').bind(`SAV-${year}-%`).first()
  const nextNum = ((countResult as any)?.cnt || 0) + 1
  const ticket_ref = `SAV-${year}-${String(nextNum).padStart(4, '0')}`
  await db.prepare('INSERT INTO sav_tickets (ticket_ref, client_phone, client_name, category, subject, description) VALUES (?,?,?,?,?,?)').bind(ticket_ref, client_phone, client_name, category, subject, description).run()
  return c.json({ success: true, ticket_ref })
})

// Client: voir ses tickets (auth required)
app.get('/api/client/sav/list', async (c) => {
  const db = c.env.DB
  if (!db) return c.json([])
  const sessionToken = getCookie(c, 'maasga_session') || ''
  const session = sessionToken ? await getSession(c.env.DB, sessionToken) : null
  if (!session) return c.json({ error: 'Non connecté' }, 401)
  const clientRow = await db.prepare('SELECT phone FROM clients WHERE id = ?').bind(session.clientId).first() as any
  if (!clientRow?.phone) return c.json([])
  await ensureSavTables(db)
  const tickets = (await db.prepare('SELECT id, ticket_ref, subject, category, priority, status, created_at, updated_at FROM sav_tickets WHERE client_phone = ? ORDER BY created_at DESC').bind(clientRow.phone).all())?.results || []
  return c.json(tickets)
})

// Export tickets CSV
app.get('/api/admin/export/tickets', adminAuth, async (c) => {
  const db = c.env.DB
  if (!db) return c.text('DB non disponible', 503)
  await ensureSavTables(db)
  const rows = (await db.prepare('SELECT * FROM sav_tickets ORDER BY created_at DESC').all())?.results || []
  const headers = ['Ref', 'Client', 'Telephone', 'Categorie', 'Priorite', 'Sujet', 'Statut', 'Assigne a', 'Produit', 'Resolution', 'Cree le', 'Resolu le']
  const csvRows = [headers.join(',')]
  ;(rows as any[]).forEach((t: any) => {
    csvRows.push([t.ticket_ref, t.client_name, t.client_phone, t.category, t.priority, t.subject, t.status, t.assigned_to, t.product_info, t.resolution_notes, t.created_at, t.resolved_at].map(csvEscape).join(','))
  })
  return new Response(csvRows.join('\n'), { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="tickets_sav_${new Date().toISOString().split('T')[0]}.csv"` } })
})

// ============================================================
// STOCK MOVEMENTS
// ============================================================

// Admin: historique des mouvements de stock
app.get('/api/admin/stock/movements', adminAuth, async (c) => {
  const db = c.env.DB
  if (!db) return c.json([])
  await ensureStockMovements(db)
  const productId = c.req.query('product_id')
  let rows: any[]
  if (productId) {
    rows = (await db.prepare('SELECT * FROM stock_movements WHERE product_id = ? ORDER BY created_at DESC LIMIT 100').bind(parseInt(productId)).all())?.results || []
  } else {
    rows = (await db.prepare('SELECT * FROM stock_movements ORDER BY created_at DESC LIMIT 200').all())?.results || []
  }
  return c.json(rows)
})

// Admin: ajouter un mouvement de stock manuel
app.post('/api/admin/stock/movement', adminAuth, async (c) => {
  const db = c.env.DB
  if (!db) return c.json({ error: 'DB non disponible' }, 503)
  const body = await c.req.parseBody()
  const productId = parseInt(body['product_id'] as string || '0')
  const quantity = parseInt(body['quantity'] as string || '0')
  const type = (body['type'] as string || 'ajustement').trim()
  const reason = (body['reason'] as string || '').trim()
  if (!productId || !quantity) return c.redirect('/admin/produits?error=stock_invalide')
  
  // Get current stock
  const product = products.find(p => p.id === productId)
  if (!product) return c.redirect('/admin/produits?error=produit_introuvable')
  const oldStock = product.stock || 0
  const newStock = Math.max(0, oldStock + quantity)
  
  // Update in-memory
  product.stock = newStock
  product.available = newStock > 0
  
  // Log movement
  await logStockMovement(db, productId, product.name, type, quantity, oldStock, newStock, reason)
  
  // Update D1
  try {
    await db.prepare('UPDATE products SET stock = ?, available = ? WHERE id = ?').bind(newStock, newStock > 0 ? 1 : 0, productId).run()
  } catch(_) {}
  
  return c.redirect('/admin/produits?success=stock_modifie')
})

// Admin: produits en stock bas (seuil configurable)
app.get('/api/admin/stock/low', adminAuth, async (c) => {
  const threshold = parseInt(c.req.query('threshold') || '3')
  const lowStock = products.filter(p => p.stock <= threshold && p.stock >= 0)
  return c.json(lowStock.map(p => ({ id: p.id, name: p.name, stock: p.stock, price: p.price })))
})

// ============================================================
// BACKUP / EXPORT DB
// ============================================================
app.get('/api/admin/backup', adminAuth, async (c) => {
  const db = c.env.DB
  if (!db) return c.json({ error: 'DB non disponible' }, 503)
  const tables = ['products', 'clients', 'appointments', 'orders', 'reviews', 'payments', 'contact_messages', 'maintenance_contracts', 'sav_tickets', 'sav_ticket_messages', 'stock_movements', 'site_settings', 'user_activity_log', 'notifications', 'realisations']
  const backup: Record<string, any[]> = {}
  for (const table of tables) {
    try {
      const rows = (await db.prepare(`SELECT * FROM ${table}`).all())?.results || []
      backup[table] = rows as any[]
    } catch(_) {
      backup[table] = []
    }
  }
  const json = JSON.stringify({ exported_at: new Date().toISOString(), tables: backup }, null, 2)
  return new Response(json, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="maasga_backup_${new Date().toISOString().split('T')[0]}.json"`
    }
  })
})

// ============================================================
// ============================================================
// GLOBAL SEARCH — Admin
// ============================================================
app.get('/api/admin/search', adminAuth, async (c) => {
  const q = (c.req.query('q') || '').trim().toLowerCase()
  if (q.length < 2) return c.json([])
  const results: { type: string; label: string; sub: string; url: string }[] = []
  // Search products
  products.filter(p => p.name.toLowerCase().includes(q) || (p.brand || '').toLowerCase().includes(q) || (p.model || '').toLowerCase().includes(q)).slice(0, 5).forEach(p => {
    results.push({ type: 'Produit', label: p.name, sub: `${p.brand} · ${p.stock} en stock`, url: '/admin/produits' })
  })
  // Search clients
  clients.filter(cl => cl.name.toLowerCase().includes(q) || cl.phone.includes(q) || (cl.email || '').toLowerCase().includes(q)).slice(0, 5).forEach(cl => {
    results.push({ type: 'Client', label: cl.name, sub: cl.phone, url: '/admin/clients' })
  })
  // Search appointments
  appointments.filter(a => a.name.toLowerCase().includes(q) || a.phone.includes(q) || (a.quartier || '').toLowerCase().includes(q)).slice(0, 5).forEach(a => {
    results.push({ type: 'RDV', label: a.name, sub: `${a.date} · ${a.quartier}`, url: '/admin/rdv' })
  })
  // Search orders
  orders.filter(o => (o.client_name || '').toLowerCase().includes(q) || (o.client_phone || '').includes(q) || String(o.id).includes(q)).slice(0, 5).forEach(o => {
    results.push({ type: 'Commande', label: `#${o.id} ${o.client_name || ''}`, sub: `${o.total_price?.toLocaleString() || 0} F · ${o.status}`, url: '/admin/commandes' })
  })
  // Search SAV tickets in DB
  const db = c.env.DB
  if (db) {
    try {
      const tickets = (await db.prepare("SELECT id, ticket_ref, subject, client_name, status FROM sav_tickets WHERE subject LIKE ? OR client_name LIKE ? OR ticket_ref LIKE ? LIMIT 5").bind(`%${q}%`, `%${q}%`, `%${q}%`).all())?.results || []
      ;(tickets as any[]).forEach((t: any) => {
        results.push({ type: 'Ticket', label: `${t.ticket_ref} ${t.subject}`, sub: t.client_name || '', url: `/admin/sav/${t.id}` })
      })
    } catch(_) {}
  }
  return c.json(results.slice(0, 20))
})

// AUDIT LOG — Admin page
// ============================================================
app.get('/admin/audit-log', adminAuth, refreshAdminCache, async (c) => {
  const db = c.env.DB
  let logs: any[] = []
  if (db) {
    try {
      logs = (await db.prepare('SELECT * FROM user_activity_log ORDER BY created_at DESC LIMIT 500').all())?.results || []
    } catch(_) {}
  }
  return c.html(<AdminAuditLogPage logs={logs} />)
})

app.get('/api/admin/audit-log', adminAuth, async (c) => {
  const db = c.env.DB
  if (!db) return c.json([])
  try {
    const rows = (await db.prepare('SELECT * FROM user_activity_log ORDER BY created_at DESC LIMIT 500').all())?.results || []
    return c.json(rows)
  } catch(_) { return c.json([]) }
})

// NOTIFICATIONS — Admin page
// ============================================================
app.get('/admin/notifications', adminAuth, refreshAdminCache, async (c) => {
  const db = c.env.DB
  let notifications: any[] = []
  if (db) {
    try {
      await ensureNotificationsTable(db)
      notifications = (await db.prepare('SELECT * FROM admin_notifications ORDER BY created_at DESC LIMIT 200').all())?.results || []
    } catch(_) {}
  }
  return c.html(<AdminNotificationsPage notifications={notifications} />)
})

app.get('/admin/parametres', adminAuth, refreshAdminCache, async (c) => {
  const success = c.req.query('success')
  const error = c.req.query('error')
  const db = c.env.DB
  let siteSettings: Record<string, string> = {}
  if (db) siteSettings = await getSiteSettings(db)
  return c.html(<AdminParametresPage success={success} error={error} siteSettings={siteSettings} />)
})

// Save site settings
app.post('/api/admin/site-settings', adminAuth, async (c) => {
  const db = c.env.DB
  if (!db) return c.redirect('/admin/parametres?error=db')
  await ensureSiteSettings(db)
  const body = await c.req.parseBody()
  const fields = ['phone', 'email', 'address', 'hours', 'company_name', 'whatsapp', 'facebook', 'instagram', 'slogan']
  for (const key of fields) {
    const val = (body[key] as string || '').trim()
    await db.prepare('INSERT OR REPLACE INTO site_settings (key, value, updated_at) VALUES (?, ?, datetime(\'now\'))').bind(key, val).run()
  }
  return c.redirect('/admin/parametres?success=settings')
})

app.post('/api/admin/change-password', adminAuth, async (c) => {
  const ip = c.req.header('cf-connecting-ip') || 'unknown'
  // Rate limit: max 5 attempts per 15 min to prevent brute force
  const pwdRl = rateLimit(`admin-pwd-change:${ip}`, 5, 15 * 60 * 1000)
  if (!pwdRl.allowed) {
    logSecurityEvent(c.env?.DB, { event: 'admin_pwd_change_rate_limit', severity: 'warn', ip, details: 'Password change rate limited' })
    return c.redirect('/admin/parametres?error=rate_limited')
  }

  const body = await c.req.parseBody()
  const current = (body['current_password'] as string || '').trim()
  const newPwd = (body['new_password'] as string || '').trim()
  const confirm = (body['confirm_password'] as string || '').trim()
  const newUsername = (body['new_username'] as string || '').trim()
  if (!newPwd || newPwd !== confirm) return c.redirect('/admin/parametres?error=mismatch')
  if (newPwd.length < 12) return c.redirect('/admin/parametres?error=too_short')
  if (newUsername && newUsername.length < 3) return c.redirect('/admin/parametres?error=username_short')

  // Verify current password
  let storedHash = ''
  const db = c.env.DB
  if (db) {
    try {
      await db.prepare('CREATE TABLE IF NOT EXISTS admin_settings (key TEXT PRIMARY KEY, value TEXT, updated_at TEXT)').run()
      const row = await db.prepare('SELECT value FROM admin_settings WHERE key = ?').bind('admin_password_hash').first() as any
      if (row?.value) storedHash = row.value
    } catch(e) { /* table may not exist */ }
  }
  if (!storedHash) {
    const initPwd = c.env.ADMIN_INITIAL_PASSWORD || c.env.ADMIN_SECRET
    if (initPwd) storedHash = await hashPassword(initPwd)
    else return c.redirect('/admin/parametres?error=no_init')
  }
  const isCurrentValid = await verifyPassword(current, storedHash)
  if (!isCurrentValid) {
    logSecurityEvent(db, { event: 'admin_pwd_change_wrong_current', severity: 'critical', ip, details: `Failed password change attempt from ${ip}` })
    return c.redirect('/admin/parametres?error=wrong_current')
  }

  // Store new password hash (and optional username) in D1
  const newHash = await hashPassword(newPwd)
  if (db) {
    try {
      await db.prepare('INSERT OR REPLACE INTO admin_settings (key, value, updated_at) VALUES (?, ?, ?)').bind('admin_password_hash', newHash, new Date().toISOString()).run()
      if (newUsername) {
        await db.prepare('INSERT OR REPLACE INTO admin_settings (key, value, updated_at) VALUES (?, ?, ?)').bind('admin_username', newUsername, new Date().toISOString()).run()
      }
    } catch(e) { console.error('Error saving admin credentials:', e) }
  }
  // Audit log: password change successful
  logSecurityEvent(db, { event: 'admin_pwd_changed', severity: 'warn', ip, details: `Admin password changed successfully from ${ip}` })
  logActivity(db, { type: 'admin', action: 'Mot de passe admin modifié', details: `Depuis IP: ${ip}`, ip })
  return c.redirect('/admin/parametres?success=pwd')
})

// ============================================================
// DEVIS — HELPER FUNCTIONS
// ============================================================
async function ensureDevisTable(db: any) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS devis (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rdv_id INTEGER,
    order_id INTEGER,
    numero TEXT NOT NULL,
    client_name TEXT NOT NULL,
    client_phone TEXT NOT NULL,
    client_email TEXT,
    client_quartier TEXT,
    surface REAL,
    btu_recommande INTEGER,
    produit_id INTEGER,
    produit_nom TEXT,
    produit_btu INTEGER,
    produit_prix INTEGER DEFAULT 0,
    produit_quantite INTEGER DEFAULT 1,
    installation_prix INTEGER DEFAULT 50000,
    accessoires TEXT DEFAULT '[]',
    remise INTEGER DEFAULT 0,
    total_ht INTEGER DEFAULT 0,
    message_client TEXT,
    notes_internes TEXT,
    token TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'draft',
    expires_at TEXT,
    accepted_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`).run()
  // Patch columns that might not exist in tables created by older app versions
  const colPatches = [
    'ALTER TABLE devis ADD COLUMN rdv_id INTEGER',
    'ALTER TABLE devis ADD COLUMN order_id INTEGER',
    'ALTER TABLE devis ADD COLUMN client_email TEXT',
    'ALTER TABLE devis ADD COLUMN client_quartier TEXT',
    'ALTER TABLE devis ADD COLUMN surface REAL',
    'ALTER TABLE devis ADD COLUMN btu_recommande INTEGER',
    'ALTER TABLE devis ADD COLUMN produit_id INTEGER',
    'ALTER TABLE devis ADD COLUMN produit_nom TEXT',
    'ALTER TABLE devis ADD COLUMN produit_btu INTEGER',
    "ALTER TABLE devis ADD COLUMN produit_prix INTEGER DEFAULT 0",
    "ALTER TABLE devis ADD COLUMN produit_quantite INTEGER DEFAULT 1",
    "ALTER TABLE devis ADD COLUMN installation_prix INTEGER DEFAULT 50000",
    "ALTER TABLE devis ADD COLUMN accessoires TEXT DEFAULT '[]'",
    'ALTER TABLE devis ADD COLUMN remise INTEGER DEFAULT 0',
    'ALTER TABLE devis ADD COLUMN total_ht INTEGER DEFAULT 0',
    'ALTER TABLE devis ADD COLUMN message_client TEXT',
    'ALTER TABLE devis ADD COLUMN notes_internes TEXT',
    'ALTER TABLE devis ADD COLUMN expires_at TEXT',
    'ALTER TABLE devis ADD COLUMN accepted_at TEXT',
  ]
  for (const sql of colPatches) { try { await db.prepare(sql).run() } catch {} }
}

function generateDevisToken(): string {
  const arr = new Uint8Array(20)
  crypto.getRandomValues(arr)
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('')
}

async function generateDevisNumber(db: any): Promise<string> {
  const year = new Date().getFullYear()
  try {
    const row = await db.prepare('SELECT COUNT(*) as cnt FROM devis').first() as any
    const count = (Number(row?.cnt) || 0) + 1
    return `DEV-${count.toString().padStart(4, '0')}-${year}`
  } catch { return `DEV-0001-${year}` }
}

function buildClientDevisHTML(d: any): string {
  const accs: any[] = JSON.parse(d.accessoires || '[]')
  const prodTotal = (Number(d.produit_prix) || 0) * (Number(d.produit_quantite) || 1)
  const installTotal = Number(d.installation_prix) || 0
  const accTotal = accs.reduce((s: number, a: any) => s + (Number(a.prix) || 0), 0)
  const sousTotal = prodTotal + installTotal + accTotal
  const remisePct = Number(d.remise) || 0
  const remiseMt = Math.round(sousTotal * remisePct / 100)
  const total = sousTotal - remiseMt
  const daysLeft = d.expires_at ? Math.max(0, Math.floor((new Date(d.expires_at).getTime() - Date.now()) / 86400000)) : 30
  const isExpired = d.expires_at && new Date(d.expires_at) < new Date() && d.status !== 'accepted'
  const isAccepted = d.status === 'accepted'
  const expiryStr = d.expires_at ? new Date(d.expires_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : ''
  const createdStr = new Date(d.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

  // Estimated annual savings (inverter vs fixed-speed estimate)
  let savingsHtml = ''
  if (d.btu_recommande && Number(d.btu_recommande) > 0) {
    const btu = Number(d.btu_recommande)
    const kw = btu / 3412 // rough kW
    const annualKwh = Math.round(kw * 8 * 300) // 8h/day, 300 days
    const savings = Math.round(annualKwh * 0.30 * 100) // 100 FCFA/kWh, 30% inverter saving
    savingsHtml = `
    <div style="background:linear-gradient(135deg,rgba(52,211,153,0.08),rgba(16,185,129,0.05)); border:1px solid rgba(52,211,153,0.2); border-radius:16px; padding:20px; margin:24px 0;">
      <div style="display:flex; align-items:flex-start; gap:14px;">
        <div style="width:44px; height:44px; background:rgba(52,211,153,0.15); border-radius:12px; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:20px;">💡</div>
        <div style="flex:1;">
          <div style="font-weight:700; color:#34d399; margin-bottom:4px;">Économies estimées avec Inverter</div>
          <div style="font-size:13px; color:#6b7280; line-height:1.6;">Pour un climatiseur ${btu.toLocaleString('fr-FR')} BTU, la technologie Inverter réduit votre consommation d'environ <strong style="color:#34d399;">30%</strong>, soit une économie annuelle estimée à :</div>
          <div style="font-size:28px; font-weight:800; color:#34d399; margin:8px 0;">${savings.toLocaleString('fr-FR')} FCFA <span style="font-size:14px; font-weight:500; color:#6b7280;">/ an</span></div>
          <div style="font-size:11px; color:#9ca3af;">Estimation basée sur 8h/jour, 300 jours/an et un tarif de 100 FCFA/kWh</div>
        </div>
      </div>
    </div>`
  }

  const acceptFormHtml = !isAccepted && !isExpired ? `
    <div style="text-align:center; padding:32px 20px; background:linear-gradient(135deg,rgba(56,189,248,0.06),rgba(99,102,241,0.06)); border-radius:16px; border:1px solid rgba(56,189,248,0.15); margin:24px 0;">
      <div style="font-size:18px; font-weight:700; color:#e2e8f0; margin-bottom:8px;">✅ Accepter ce devis ?</div>
      <p style="color:#94a3b8; font-size:14px; margin-bottom:20px;">En acceptant, vous confirmez votre accord sur les conditions ci-dessus.<br>Notre équipe vous contactera sous 24h pour planifier l'intervention.</p>
      <form method="post" action="/api/devis/${d.token}/accept" style="display:inline;">
        <button type="submit" style="background:linear-gradient(135deg,#059669,#10b981); color:white; font-weight:700; font-size:15px; padding:14px 32px; border-radius:12px; border:none; cursor:pointer; display:inline-flex; align-items:center; gap:10px; box-shadow:0 4px 15px rgba(16,185,129,0.3);">
          J'accepte ce devis — ${total.toLocaleString('fr-FR')} FCFA
        </button>
      </form>
      <div style="margin-top:16px;">
        <a href="https://wa.me/22655996418?text=${encodeURIComponent('Bonjour, je souhaite discuter du devis ' + d.numero)}" style="display:inline-flex; align-items:center; gap:8px; background:rgba(37,211,102,0.1); color:#25D366; font-weight:600; font-size:13px; padding:10px 20px; border-radius:10px; text-decoration:none; border:1px solid rgba(37,211,102,0.25);">
          <span style="font-size:18px;">💬</span> Poser une question par WhatsApp
        </a>
      </div>
    </div>` : isAccepted ? `
    <div style="text-align:center; padding:24px; background:rgba(52,211,153,0.08); border-radius:16px; border:1px solid rgba(52,211,153,0.2); margin:24px 0;">
      <div style="font-size:24px; margin-bottom:8px;">🎉</div>
      <div style="font-size:18px; font-weight:700; color:#34d399;">Devis accepté — Merci !</div>
      <p style="color:#94a3b8; font-size:13px; margin-top:6px;">Notre équipe va vous contacter très prochainement.</p>
    </div>` : `
    <div style="text-align:center; padding:24px; background:rgba(239,68,68,0.08); border-radius:16px; border:1px solid rgba(239,68,68,0.2); margin:24px 0;">
      <div style="font-size:18px; font-weight:700; color:#f87171;">⚠️ Ce devis est expiré</div>
      <p style="color:#94a3b8; font-size:13px; margin-top:6px;">Contactez-nous pour un nouveau devis actualisé.</p>
    </div>`

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(d.numero)} · Devis MAASGA</title>
<meta name="robots" content="noindex,nofollow">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif; background: #0b1120; color: #e2e8f0; min-height: 100vh; }
  .container { max-width: 680px; margin: 0 auto; padding: 20px 16px 60px; }
  .header { background: linear-gradient(135deg, #1e3a8a 0%, #0c4a6e 50%, #0ea5e9 100%); border-radius: 20px; padding: 28px 24px; margin-bottom: 24px; position: relative; overflow: hidden; }
  .header::before { content: '❄️'; position: absolute; right: 20px; top: 50%; transform: translateY(-50%); font-size: 64px; opacity: 0.12; }
  .logo { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
  .logo-icon { width: 44px; height: 44px; background: rgba(255,255,255,0.2); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 22px; }
  .logo-text { font-weight: 800; font-size: 20px; color: white; }
  .logo-sub { font-size: 11px; color: rgba(255,255,255,0.7); }
  .devis-num { font-size: 24px; font-weight: 800; color: white; }
  .devis-date { font-size: 12px; color: rgba(255,255,255,0.7); margin-top: 4px; }
  .status-pill { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 700; margin-top: 10px; }
  .status-sent { background: rgba(251,191,36,0.2); color: #fbbf24; border: 1px solid rgba(251,191,36,0.35); }
  .status-accepted { background: rgba(52,211,153,0.2); color: #34d399; border: 1px solid rgba(52,211,153,0.35); }
  .status-expired { background: rgba(239,68,68,0.2); color: #f87171; border: 1px solid rgba(239,68,68,0.35); }
  .expiry-banner { background: rgba(251,191,36,0.08); border: 1px solid rgba(251,191,36,0.2); border-radius: 12px; padding: 12px 16px; display: flex; align-items: center; gap: 10px; font-size: 13px; color: #fbbf24; margin-bottom: 20px; }
  .section { background: #111827; border-radius: 16px; padding: 20px; margin-bottom: 16px; border: 1px solid rgba(56,189,248,0.1); }
  .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #38bdf8; margin-bottom: 14px; display: flex; align-items: center; gap: 8px; }
  .info-row { display: flex; justify-content: space-between; align-items: flex-start; padding: 8px 0; border-bottom: 1px solid rgba(148,180,220,0.06); font-size: 13px; }
  .info-row:last-child { border-bottom: none; }
  .info-label { color: #64748b; flex-shrink: 0; margin-right: 12px; }
  .info-val { color: #e2e8f0; font-weight: 500; text-align: right; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { background: rgba(56,189,248,0.06); padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #64748b; }
  td { padding: 12px; border-bottom: 1px solid rgba(148,180,220,0.06); vertical-align: top; }
  .td-right { text-align: right; white-space: nowrap; font-weight: 600; color: #e2e8f0; }
  .total-row td { border-bottom: none; padding-top: 16px; }
  .total-label { font-size: 16px; font-weight: 700; color: #e2e8f0; }
  .total-amount { font-size: 22px; font-weight: 800; color: #38bdf8; text-align: right; }
  .discount-row td { color: #34d399; font-size: 12px; }
  .footer { text-align: center; padding: 20px; color: #4b5563; font-size: 11px; line-height: 1.7; }
  @media print { body { background: white; color: #111; } .section { background: #f9fafb; border: 1px solid #e5e7eb; } }
</style>
</head>
<body>
<div class="container">

  <div class="header">
    <div class="logo">
      <div class="logo-icon">❄️</div>
      <div>
        <div class="logo-text">MAASGA</div>
        <div class="logo-sub">Froid & Climatisation · Ouagadougou</div>
      </div>
    </div>
    <div class="devis-num">${escapeHtml(d.numero)}</div>
    <div class="devis-date">Émis le ${createdStr}</div>
    <div>
      <span class="status-pill ${isAccepted ? 'status-accepted' : isExpired ? 'status-expired' : 'status-sent'}">
        ${isAccepted ? '✓ Devis accepté' : isExpired ? '⚠ Expiré' : '⏳ En attente de validation'}
      </span>
    </div>
  </div>

  ${!isAccepted && !isExpired && daysLeft <= 7 ? `
  <div class="expiry-banner">
    <span style="font-size:18px;">⏰</span>
    <span>Ce devis expire dans <strong>${daysLeft} jour${daysLeft > 1 ? 's' : ''}</strong> — ${expiryStr}. Acceptez avant cette date.</span>
  </div>` : !isAccepted && !isExpired && expiryStr ? `
  <div style="background:rgba(56,189,248,0.05); border:1px solid rgba(56,189,248,0.12); border-radius:12px; padding:10px 16px; font-size:12px; color:#38bdf8; margin-bottom:16px;">
    ✓ Devis valable jusqu'au ${expiryStr} · ${daysLeft} jours restants
  </div>` : ''}

  <div class="section">
    <div class="section-title">👤 Client</div>
    <div class="info-row"><span class="info-label">Nom</span><span class="info-val">${escapeHtml(d.client_name || '')}</span></div>
    <div class="info-row"><span class="info-label">Téléphone</span><span class="info-val">${escapeHtml(d.client_phone || '')}</span></div>
    ${d.client_email ? `<div class="info-row"><span class="info-label">Email</span><span class="info-val">${escapeHtml(d.client_email)}</span></div>` : ''}
    ${d.client_quartier ? `<div class="info-row"><span class="info-label">Adresse</span><span class="info-val">${escapeHtml(d.client_quartier)}, Ouagadougou</span></div>` : ''}
  </div>

  ${(d.surface || d.btu_recommande) ? `
  <div class="section">
    <div class="section-title">📐 Données techniques</div>
    ${d.surface ? `<div class="info-row"><span class="info-label">Surface à climatiser</span><span class="info-val">${Number(d.surface).toLocaleString('fr-FR')} m²</span></div>` : ''}
    ${d.btu_recommande ? `<div class="info-row"><span class="info-label">Puissance recommandée</span><span class="info-val">${Number(d.btu_recommande).toLocaleString('fr-FR')} BTU / ${Number(d.btu_recommande) === 9000 ? '1' : Number(d.btu_recommande) === 12000 ? '1,5' : Number(d.btu_recommande) === 18000 ? '2' : Number(d.btu_recommande) === 24000 ? '3' : '5'} CV</span></div>` : ''}
  </div>` : ''}

  <div class="section">
    <div class="section-title">📋 Détail du devis</div>
    <table>
      <thead><tr>
        <th style="width:50%">Désignation</th>
        <th style="width:15%">Qté</th>
        <th style="width:20%">P.U.</th>
        <th style="width:15%">Total</th>
      </tr></thead>
      <tbody>
        ${d.produit_nom ? `<tr>
          <td><strong style="color:#e2e8f0;">${escapeHtml(d.produit_nom)}</strong></td>
          <td class="td-right">${Number(d.produit_quantite) || 1}</td>
          <td class="td-right">${(Number(d.produit_prix) || 0).toLocaleString('fr-FR')}</td>
          <td class="td-right">${prodTotal.toLocaleString('fr-FR')}</td>
        </tr>` : ''}
        <tr>
          <td>Main d'œuvre &amp; installation</td>
          <td class="td-right">1</td>
          <td class="td-right">${installTotal.toLocaleString('fr-FR')}</td>
          <td class="td-right">${installTotal.toLocaleString('fr-FR')}</td>
        </tr>
        <tr>
          <td colspan="3" style="padding-top:4px; padding-bottom:4px; font-size:11px; color:#4b5563; font-style:italic;">Mise en service · Test complet · Vérification étanchéité · Formation utilisation</td>
          <td></td>
        </tr>
        ${accs.filter((a:any) => a.nom).map((a:any) => `<tr>
          <td style="color:#94a3b8;">${escapeHtml(a.nom)}</td>
          <td class="td-right">1</td>
          <td class="td-right">${(Number(a.prix) || 0).toLocaleString('fr-FR')}</td>
          <td class="td-right">${(Number(a.prix) || 0).toLocaleString('fr-FR')}</td>
        </tr>`).join('')}
        <tr style="border-top:1px solid rgba(148,180,220,0.15);">
          <td colspan="3" style="padding-top:12px; font-size:12px; color:#6b7280;">Sous-total</td>
          <td class="td-right" style="padding-top:12px;">${sousTotal.toLocaleString('fr-FR')}</td>
        </tr>
        ${remisePct > 0 ? `<tr class="discount-row">
          <td colspan="3" style="padding-bottom:8px; font-size:12px;">Remise accordée (${remisePct}%)</td>
          <td class="td-right" style="padding-bottom:8px;">− ${remiseMt.toLocaleString('fr-FR')}</td>
        </tr>` : ''}
        <tr class="total-row">
          <td colspan="3"><span class="total-label">TOTAL TTC</span><div style="font-size:10px; color:#6b7280; margin-top:2px;">Toutes taxes comprises</div></td>
          <td><div class="total-amount">${total.toLocaleString('fr-FR')}<br><span style="font-size:11px; font-weight:600; color:#38bdf8;">FCFA</span></div></td>
        </tr>
      </tbody>
    </table>
  </div>

  ${savingsHtml}

  ${acceptFormHtml}

  ${d.message_client ? `
  <div class="section" style="border-color:rgba(99,102,241,0.2);">
    <div class="section-title" style="color:#a78bfa;">💬 Message de l'équipe MAASGA</div>
    <p style="font-size:14px; color:#cbd5e1; line-height:1.7; white-space:pre-wrap;">${escapeHtml(d.message_client)}</p>
  </div>` : ''}

  <div class="section" style="background:rgba(56,189,248,0.03);">
    <div class="section-title">✅ Nos engagements</div>
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
      ${[
        ['🔧', 'Techniciens certifiés', 'Équipe qualifiée'],
        ['🛡️', 'Garantie installation', '12 mois pièces et main d\'œuvre'],
        ['📞', 'SAV rapide', 'Intervention sous 48h'],
        ['💯', 'Satisfaction garantie', 'Ou intervention gratuite']
      ].map(([icon, title, sub]) => `
      <div style="background:rgba(56,189,248,0.04); border:1px solid rgba(56,189,248,0.08); border-radius:10px; padding:12px;">
        <div style="font-size:20px; margin-bottom:6px;">${icon}</div>
        <div style="font-size:12px; font-weight:700; color:#e2e8f0;">${title}</div>
        <div style="font-size:11px; color:#64748b; margin-top:2px;">${sub}</div>
      </div>`).join('')}
    </div>
  </div>

  <div class="footer">
    <div style="margin-bottom:16px;">
      <a href="/devis/${escapeHtml(d.token)}/pdf" style="display:inline-flex; align-items:center; gap:8px; background:linear-gradient(135deg,#0077b6,#0ea5e9); color:white; font-weight:700; font-size:14px; padding:12px 28px; border-radius:12px; text-decoration:none; box-shadow:0 4px 15px rgba(0,119,182,0.3);">
        🖨️ Télécharger le devis en PDF
      </a>
    </div>
    <strong>MAASGA — Froid &amp; Climatisation</strong><br>
    📞 +226 55 99 64 18 &nbsp;|&nbsp; Ouagadougou, Burkina Faso<br>
    Lundi–Dimanche · 8h00–18h00<br><br>
    <em>Ce devis est valable jusqu'au ${expiryStr || '30 jours'}. Aucun paiement n'est requis avant accord et signature du client. Le montant définitif peut être ajusté après visite technique si les conditions réelles diffèrent.</em>
  </div>
</div>
</body>
</html>`
}

// ============================================================
// DEVIS ROUTES — ADMIN
// ============================================================

app.get('/admin/devis', adminAuth, refreshAdminCache, async (c) => {
  const db = c.env.DB
  let devisData: any[] = []
  if (db) {
    try {
      await ensureDevisTable(db)
      const rows = await db.prepare('SELECT * FROM devis ORDER BY created_at DESC').all()
      devisData = (rows.results as any[]) || []
    } catch(e) { console.error('Devis list error:', e) }
  }
  // RDVs de type 'devis' sans devis associé
  const devisRdvIds = new Set(devisData.filter(d => d.rdv_id).map(d => d.rdv_id))
  const rdvsPending = appointments.filter((a: any) => a.type === 'devis' && !devisRdvIds.has(a.id))
  return c.html(<AdminDevisListPage devisData={devisData} rdvsPending={rdvsPending} />)
})

app.get('/admin/devis/new', adminAuth, refreshAdminCache, async (c) => {
  const rdvId = parseInt(c.req.query('rdvId') || '0')
  const orderId = parseInt(c.req.query('order_id') || '0')
  const ticketId = parseInt(c.req.query('ticket_id') || '0')
  const contractId = parseInt(c.req.query('contract_id') || '0')
  const clientId = parseInt(c.req.query('client_id') || '0')
  const rdv = rdvId ? appointments.find((a: any) => a.id === rdvId) : null
  const order = orderId ? orders.find((o: any) => o.id === orderId) : null
  const db = c.env.DB
  let ticket: any = null, contract: any = null, clientData: any = null
  if (db) {
    const [t, con, cl] = await Promise.all([
      ticketId ? db.prepare('SELECT * FROM sav_tickets WHERE id=?').bind(ticketId).first() : Promise.resolve(null),
      contractId ? db.prepare('SELECT * FROM maintenance_contracts WHERE id=?').bind(contractId).first() : Promise.resolve(null),
      clientId ? db.prepare('SELECT * FROM clients WHERE id=?').bind(clientId).first() : Promise.resolve(null),
    ])
    ticket = t; contract = con; clientData = cl
  }
  let surface = c.req.query('surface') || ''
  let btu = c.req.query('btu') || ''
  if (rdv?.notes && (!surface || !btu)) {
    const surfMatch = rdv.notes.match(/(\d+(?:\.\d+)?)\s*m²/)
    const btuMatch = rdv.notes.match(/(\d{4,5})\s*BTU/)
    if (surfMatch && !surface) surface = surfMatch[1]
    if (btuMatch && !btu) btu = btuMatch[1]
  }
  const effectiveRdv = rdv || (order ? { id: null, name: order.client_name, phone: order.client_phone, quartier: order.quartier, notes: order.notes, type: order.type } : null)
  const errorMsg = c.req.query('error') || undefined
  return c.html(<AdminDevisNewPage rdv={effectiveRdv} productsList={products} clientsList={clients} surface={surface} btu={btu} orderId={orderId || undefined} ticket={ticket} contract={contract} clientData={clientData} error={errorMsg} />)
})

app.post('/api/admin/devis/create', adminAuth, async (c) => {
  const body = await c.req.parseBody()
  const db = c.env.DB
  if (!db) return c.redirect('/admin/devis?error=no_db')
  try {
    await ensureDevisTable(db)
    const token = generateDevisToken()
    const numero = await generateDevisNumber(db)
    const rdvId = body['rdv_id'] ? parseInt(body['rdv_id'] as string) : null
    const orderId = body['order_id'] ? parseInt(body['order_id'] as string) : null
    const action = (body['action'] as string) || 'draft'
    const isSendAction = action === 'send' || action === 'send_whatsapp' || action === 'send_email'

    // Build accessories JSON (dynamic numbering from form)
    const accs: any[] = []
    for (let i = 1; i <= 20; i++) {
      const nom = (body[`acc_nom_${i}`] as string || '').trim()
      const prix = parseInt(body[`acc_prix_${i}`] as string) || 0
      if (nom) accs.push({ nom, prix })
    }

    // Compute total
    const prodPrix = parseInt(body['produit_prix'] as string) || 0
    const prodQty = parseInt(body['produit_quantite'] as string) || 1
    const installPrix = parseInt(body['installation_prix'] as string) || 50000
    const remise = parseInt(body['remise'] as string) || 0
    const accTotal = accs.reduce((s, a) => s + a.prix, 0)
    const sousTotal = (prodPrix * prodQty) + installPrix + accTotal
    const totalHt = sousTotal - Math.round(sousTotal * remise / 100)

    const expiresAt = (body['expires_at'] as string) || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
    const now = new Date().toISOString()
    const status = isSendAction ? 'sent' : 'draft'

    // Build notes_internes: prepend origine/urgence context if provided
    let notesInternes = (body['notes_internes'] as string || '').trim()
    const origine = (body['origine'] as string || '').trim()
    const urgence = (body['urgence'] as string || '').trim()
    const origineLabels: Record<string, string> = { appel: 'Appel entrant', visite: 'Visite physique', recommandation: 'Recommandation', reseaux: 'Réseaux sociaux', publicite: 'Publicité', bouche_a_oreille: 'Bouche-à-oreille' }
    const urgenceLabels: Record<string, string> = { urgent: '⚡ Urgent', tres_urgent: '🔴 Très urgent' }
    const ctxParts: string[] = []
    if (origine && origineLabels[origine]) ctxParts.push(`Origine: ${origineLabels[origine]}`)
    if (urgence && urgenceLabels[urgence]) ctxParts.push(urgenceLabels[urgence])
    if (ctxParts.length) notesInternes = ctxParts.join(' | ') + (notesInternes ? '\n' + notesInternes : '')

    await db.prepare(`INSERT INTO devis (rdv_id,order_id,numero,client_name,client_phone,client_email,client_quartier,surface,btu_recommande,produit_nom,produit_prix,produit_quantite,installation_prix,accessoires,remise,total_ht,message_client,notes_internes,token,status,expires_at,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
      .bind(rdvId, orderId, numero, body['client_name'], body['client_phone'], body['client_email'] || null, body['client_quartier'] || null, body['surface'] ? parseFloat(body['surface'] as string) : null, body['btu_recommande'] ? parseInt(body['btu_recommande'] as string) : null, body['produit_nom'] || null, prodPrix, prodQty, installPrix, JSON.stringify(accs), remise, totalHt, body['message_client'] || null, notesInternes || null, token, status, expiresAt, now, now)
      .run()

    // If linked to an order, always sync to order_devis so client can see it in their portal
    // Draft → 'pending' status in order_devis (visible but client can act); Sent → 'sent'
    if (orderId) {
      const linkedOrder = await db.prepare('SELECT * FROM orders WHERE id = ?').bind(orderId).first() as any
      if (linkedOrder) {
        const orderDevisStatus = isSendAction ? 'sent' : 'pending'
        // Upsert: if already exists update it, otherwise insert
        const existing = await db.prepare('SELECT id FROM order_devis WHERE order_id = ? AND status NOT IN (\'validated\',\'refused\') ORDER BY id DESC').bind(orderId).first() as any
        if (existing) {
          await db.prepare(`UPDATE order_devis SET client_name=?,client_phone=?,client_email=?,total_amount=?,status=?,climatiseur_nom=?,climatiseur_prix=?,main_oeuvre_prix=?,fournitures=?,message_client=?,updated_at=? WHERE id=?`)
            .bind(
              String(body['client_name'] || linkedOrder.client_name),
              String(body['client_phone'] || linkedOrder.client_phone),
              String(body['client_email'] || linkedOrder.client_email || ''),
              totalHt,
              orderDevisStatus,
              body['produit_nom'] || null,
              prodPrix * prodQty,
              installPrix,
              JSON.stringify(accs),
              body['message_client'] || null,
              now,
              existing.id
            ).run()
        } else {
          // No existing order_devis — insert fresh
          await db.prepare(`INSERT INTO order_devis (order_id, client_id, client_name, client_phone, client_email, title, description, items, total_amount, status, climatiseur_nom, climatiseur_prix, main_oeuvre_prix, fournitures, motif, message_client, admin_notes, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, '', '[]', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
            .bind(
              orderId,
              linkedOrder.client_id || null,
              String(body['client_name'] || linkedOrder.client_name),
              String(body['client_phone'] || linkedOrder.client_phone),
              String(body['client_email'] || linkedOrder.client_email || ''),
              'Devis d\'installation',
              totalHt,
              orderDevisStatus,
              body['produit_nom'] || null,
              prodPrix * prodQty,
              installPrix,
              JSON.stringify(accs),
              null,
              body['message_client'] || null,
              notesInternes || null,
              now, now
            ).run()
        }
        // Update order status to devis_en_attente only when actually sending
        if (isSendAction) {
          await db.prepare('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?')
            .bind('devis_en_attente', now, orderId).run()
          const memOrder = orders.find(o => o.id === orderId)
          if (memOrder) memOrder.status = 'devis_en_attente' as any
          // Email client notification on send
          if (linkedOrder.client_email) {
            try {
              const brevoKey = c.env.BREVO_API_KEY
              if (brevoKey) {
                await fetch('https://api.brevo.com/v3/smtp/email', {
                  method: 'POST',
                  headers: { 'api-key': brevoKey, 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    sender: { name: 'MAASGA', email: 'maasgabf@gmail.com' },
                    to: [{ email: linkedOrder.client_email, name: linkedOrder.client_name }],
                    subject: `Devis d'installation disponible — Commande #${orderId} — MAASGA`,
                    htmlContent: `<html><body style="font-family:Arial,sans-serif;padding:20px;max-width:600px;margin:0 auto;"><h2 style="color:#d97706;">❄ Devis d'installation disponible</h2><p>Bonjour ${escapeHtml(linkedOrder.client_name)},</p><p>Un devis d'installation a été préparé pour votre commande #${orderId}. Connectez-vous à votre espace client pour le consulter et le valider :</p><p><a href="https://maasga.com/espace-client" style="display:inline-block;background:#d97706;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:bold;">Voir et valider le devis</a></p><p style="color:#6b7280;font-size:12px;">MAASGA SARL — Solutions Climatisation & Maintenance — Ouagadougou, Burkina Faso</p></body></html>`
                  })
                })
              }
            } catch(emailErr) { console.error('Email notification error:', emailErr) }
          }
          await notifyAdmin(c.env, 'order', `Devis d'installation envoyé — Commande #${orderId} — ${linkedOrder.client_name} — ${totalHt.toLocaleString()} FCFA`)
        }
      }
    }

    // Handle send_email — send via Brevo
    let emailOk = false, emailErrMsg = ''
    if (action === 'send_email') {
      const clientEmail = (body['client_email'] as string || '').trim()
      if (!clientEmail) {
        emailErrMsg = 'Email client non renseigné dans le formulaire'
      } else {
        const brevoKey = c.env.BREVO_API_KEY
        if (!brevoKey) {
          emailErrMsg = 'Service email non configuré'
        } else {
          try {
            const publicUrl = `https://maasga.com/devis/${token}`
            const prodRow = (body['produit_nom'] as string || '').trim()
              ? `<tr><td style="padding:8px 12px;">${escapeHtml(body['produit_nom'] as string)} × ${prodQty}</td><td style="padding:8px 12px;text-align:right;font-weight:600;">${(prodPrix * prodQty).toLocaleString('fr-FR')} FCFA</td></tr>` : ''
            const installRow = installPrix > 0
              ? `<tr><td style="padding:8px 12px;">Main d'œuvre / Installation</td><td style="padding:8px 12px;text-align:right;font-weight:600;">${installPrix.toLocaleString('fr-FR')} FCFA</td></tr>` : ''
            const accRows = accs.map((a: any) => `<tr><td style="padding:8px 12px;">${escapeHtml(a.nom)}</td><td style="padding:8px 12px;text-align:right;">${Number(a.prix || 0).toLocaleString('fr-FR')} FCFA</td></tr>`).join('')
            const msgBlock = (body['message_client'] as string || '').trim()
              ? `<p style="background:#f0f9ff;border-left:4px solid #0077b6;padding:14px;margin:20px 0;border-radius:0 8px 8px 0;">${escapeHtml(body['message_client'] as string)}</p>` : ''
            const emailResp = await fetch('https://api.brevo.com/v3/smtp/email', {
              method: 'POST',
              headers: { 'api-key': brevoKey, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                sender: { name: 'MAASGA', email: 'maasgabf@gmail.com' },
                to: [{ email: clientEmail, name: (body['client_name'] as string) || 'Client' }],
                subject: `Votre devis MAASGA — ${numero}`,
                htmlContent: `<html><body style="font-family:Arial,sans-serif;padding:20px;max-width:600px;margin:0 auto;color:#1a1a2e;">
                  <h2 style="color:#0077b6;border-bottom:2px solid #e2e8f0;padding-bottom:16px;">Devis ${escapeHtml(numero)}</h2>
                  <p>Bonjour <strong>${escapeHtml((body['client_name'] as string) || '')}</strong>,</p>
                  <p>MAASGA vous a préparé un devis personnalisé.</p>
                  ${msgBlock}
                  <table style="width:100%;border-collapse:collapse;font-size:14px;margin:20px 0;border:1px solid #e2e8f0;">
                    <thead><tr style="background:#0077b6;color:white;"><th style="padding:10px 12px;text-align:left;">Désignation</th><th style="padding:10px 12px;text-align:right;">Montant</th></tr></thead>
                    <tbody>${prodRow}${installRow}${accRows}
                      <tr style="border-top:2px solid #0077b6;"><td style="padding:12px;font-weight:700;font-size:15px;">Total HT</td><td style="padding:12px;text-align:right;font-weight:800;color:#0077b6;font-size:18px;">${totalHt.toLocaleString('fr-FR')} FCFA</td></tr>
                    </tbody>
                  </table>
                  <div style="text-align:center;margin:24px 0;">
                    <a href="${publicUrl}" style="display:inline-block;background:#0077b6;color:white;padding:14px 32px;text-decoration:none;border-radius:10px;font-weight:bold;font-size:15px;">Consulter et valider le devis</a>
                  </div>
                  <p style="color:#6b7280;font-size:12px;border-top:1px solid #e2e8f0;padding-top:16px;">MAASGA SARL — Froid & Climatisation — Ouagadougou, Burkina Faso — +226 55 99 64 18</p>
                </body></html>`
              })
            })
            emailOk = emailResp.ok
            if (!emailResp.ok) emailErrMsg = `Erreur envoi (${emailResp.status})`
          } catch(emailEx: any) {
            console.error('send_email devis error:', emailEx)
            emailErrMsg = 'Erreur lors de l\'envoi de l\'email'
          }
        }
      }
    }

    // Redirect based on action
    if (action === 'draft') return c.redirect('/admin/devis')
    if (action === 'send_email') {
      if (emailOk) return c.redirect(`/admin/devis/detail/${token}?email=ok`)
      if (emailErrMsg) return c.redirect(`/admin/devis/detail/${token}?email_err=${encodeURIComponent(emailErrMsg)}`)
      return c.redirect(`/admin/devis/detail/${token}`)
    }
    if (action === 'send_whatsapp') return c.redirect(`/admin/devis/detail/${token}?notify=whatsapp`)
    // generate, send (legacy), default → show detail page
    return c.redirect(`/admin/devis/detail/${token}`)
  } catch(e: any) {
    console.error('Devis create error:', e)
    const errMsg = encodeURIComponent(String(e?.message || 'Erreur lors de la création du devis').substring(0, 150))
    const oidParam = body['order_id'] ? `&order_id=${body['order_id']}` : ''
    return c.redirect(`/admin/devis/new?error=${errMsg}${oidParam}`)
  }
})

// ============================================================
// DEVIS DETAIL — Admin view of a single devis with share/send options
// ============================================================
app.get('/admin/devis/detail/:token', adminAuth, async (c) => {
  const token = c.req.param('token')
  const db = c.env.DB
  if (!db) return c.redirect('/admin/devis?error=no_db')
  try {
    await ensureDevisTable(db)
    const devis = await db.prepare('SELECT * FROM devis WHERE token = ?').bind(token).first() as any
    if (!devis) return c.redirect('/admin/devis?error=Devis+introuvable')
    const host = c.req.header('host') || 'maasga.com'
    const publicUrl = `https://${host}/devis/${token}`
    const notify = c.req.query('notify') || ''
    const emailOk = c.req.query('email') === 'ok'
    const emailErr = c.req.query('email_err') ? decodeURIComponent(c.req.query('email_err') || '') : undefined
    return c.html(<AdminDevisDetailPage devis={devis} publicUrl={publicUrl} notify={notify} emailOk={emailOk} emailErr={emailErr} />)
  } catch(e: any) {
    console.error('Devis detail error:', e)
    return c.redirect(`/admin/devis?error=${encodeURIComponent(String(e?.message || 'Erreur').substring(0, 100))}`)
  }
})

// ============================================================
// DEVIS SEND EMAIL — Sends devis email from the detail page
// ============================================================
app.post('/api/admin/devis/send-email', adminAuth, async (c) => {
  const body = await c.req.parseBody()
  const db = c.env.DB
  const token = (body['token'] as string || '').trim()
  if (!db || !token) return c.redirect('/admin/devis?error=Paramètres manquants')
  try {
    await ensureDevisTable(db)
    const devis = await db.prepare('SELECT * FROM devis WHERE token = ?').bind(token).first() as any
    if (!devis) return c.redirect(`/admin/devis?error=Devis introuvable`)
    if (!devis.client_email) return c.redirect(`/admin/devis/detail/${token}?email_err=${encodeURIComponent('Email client non renseigné')}`)
    const brevoKey = c.env.BREVO_API_KEY
    if (!brevoKey) return c.redirect(`/admin/devis/detail/${token}?email_err=${encodeURIComponent('Service email non configuré')}`)

    const host = c.req.header('host') || 'maasga.com'
    const publicUrl = `https://${host}/devis/${token}`
    const accs: any[] = JSON.parse(devis.accessoires || '[]')
    const prodTotal = Number(devis.produit_prix || 0) * Number(devis.produit_quantite || 1)
    const prodRow = devis.produit_nom ? `<tr><td style="padding:8px 12px;">${escapeHtml(devis.produit_nom)} × ${Number(devis.produit_quantite) || 1}</td><td style="padding:8px 12px;text-align:right;font-weight:600;">${prodTotal.toLocaleString('fr-FR')} FCFA</td></tr>` : ''
    const installRow = Number(devis.installation_prix) > 0 ? `<tr><td style="padding:8px 12px;">Main d'œuvre / Installation</td><td style="padding:8px 12px;text-align:right;font-weight:600;">${Number(devis.installation_prix).toLocaleString('fr-FR')} FCFA</td></tr>` : ''
    const accRows = accs.filter((a: any) => a.nom).map((a: any) => `<tr><td style="padding:8px 12px;">${escapeHtml(a.nom)}</td><td style="padding:8px 12px;text-align:right;">${Number(a.prix || 0).toLocaleString('fr-FR')} FCFA</td></tr>`).join('')
    const msgBlock = devis.message_client ? `<p style="background:#f0f9ff;border-left:4px solid #0077b6;padding:14px;margin:20px 0;border-radius:0 8px 8px 0;">${escapeHtml(devis.message_client)}</p>` : ''

    const emailResp = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': brevoKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender: { name: 'MAASGA', email: 'maasgabf@gmail.com' },
        to: [{ email: devis.client_email, name: devis.client_name }],
        subject: `Votre devis MAASGA — ${devis.numero}`,
        htmlContent: `<html><body style="font-family:Arial,sans-serif;padding:20px;max-width:600px;margin:0 auto;color:#1a1a2e;">
          <h2 style="color:#0077b6;border-bottom:2px solid #e2e8f0;padding-bottom:16px;">Devis ${escapeHtml(devis.numero)}</h2>
          <p>Bonjour <strong>${escapeHtml(devis.client_name)}</strong>,</p>
          <p>MAASGA vous a préparé un devis personnalisé.</p>
          ${msgBlock}
          <table style="width:100%;border-collapse:collapse;font-size:14px;margin:20px 0;border:1px solid #e2e8f0;">
            <thead><tr style="background:#0077b6;color:white;"><th style="padding:10px 12px;text-align:left;">Désignation</th><th style="padding:10px 12px;text-align:right;">Montant</th></tr></thead>
            <tbody>${prodRow}${installRow}${accRows}
              <tr style="border-top:2px solid #0077b6;"><td style="padding:12px;font-weight:700;font-size:15px;">Total HT</td><td style="padding:12px;text-align:right;font-weight:800;color:#0077b6;font-size:18px;">${Number(devis.total_ht || 0).toLocaleString('fr-FR')} FCFA</td></tr>
            </tbody>
          </table>
          <div style="text-align:center;margin:24px 0;">
            <a href="${publicUrl}" style="display:inline-block;background:#0077b6;color:white;padding:14px 32px;text-decoration:none;border-radius:10px;font-weight:bold;font-size:15px;">Consulter et valider le devis</a>
          </div>
          <p style="color:#6b7280;font-size:12px;border-top:1px solid #e2e8f0;padding-top:16px;">MAASGA SARL — Froid & Climatisation — Ouagadougou, Burkina Faso — +226 55 99 64 18</p>
        </body></html>`
      })
    })
    if (!emailResp.ok) {
      const errTxt = await emailResp.text().catch(() => '')
      console.error('Send devis email failed:', emailResp.status, errTxt)
      return c.redirect(`/admin/devis/detail/${token}?email_err=${encodeURIComponent('Erreur envoi (' + emailResp.status + ')')}`)
    }
    // Mark as sent if was draft
    if (devis.status === 'draft') {
      await db.prepare('UPDATE devis SET status=?, updated_at=? WHERE token=?').bind('sent', new Date().toISOString(), token).run()
    }
    return c.redirect(`/admin/devis/detail/${token}?email=ok`)
  } catch(e: any) {
    console.error('Devis send-email error:', e)
    return c.redirect(`/admin/devis/detail/${token}?email_err=${encodeURIComponent(String(e?.message || 'Erreur').substring(0, 100))}`)
  }
})

// ============================================================
// DEVIS PREVIEW — Returns PDF HTML without saving to DB
// ============================================================
app.post('/api/admin/devis/preview', adminAuth, async (c) => {
  const body = await c.req.parseBody()
  try {
    // Build accessories JSON
    const accs: any[] = []
    for (let i = 1; i <= 20; i++) {
      const nom = (body[`acc_nom_${i}`] as string || '').trim()
      const prix = parseInt(body[`acc_prix_${i}`] as string) || 0
      if (nom) accs.push({ nom, prix })
    }

    const prodPrix = parseInt(body['produit_prix'] as string) || 0
    const prodQty = parseInt(body['produit_quantite'] as string) || 1
    const installPrix = parseInt(body['installation_prix'] as string) || 0
    const remise = parseInt(body['remise'] as string) || 0
    const accTotal = accs.reduce((s: number, a: any) => s + a.prix, 0)
    const sousTotal = (prodPrix * prodQty) + installPrix + accTotal
    const totalHt = sousTotal - Math.round(sousTotal * remise / 100)
    const expiresAt = (body['expires_at'] as string) || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]

    // Build a fake devis object for the PDF builder
    const fakeDev = {
      numero: 'DEV-PREVIEW',
      client_name: body['client_name'] || 'Client',
      client_phone: body['client_phone'] || '',
      client_email: body['client_email'] || null,
      client_quartier: body['client_quartier'] || null,
      surface: body['surface'] ? parseFloat(body['surface'] as string) : null,
      btu_recommande: body['btu_recommande'] ? parseInt(body['btu_recommande'] as string) : null,
      produit_nom: body['produit_nom'] || null,
      produit_prix: prodPrix,
      produit_quantite: prodQty,
      installation_prix: installPrix,
      accessoires: JSON.stringify(accs),
      remise,
      total_ht: totalHt,
      message_client: body['message_client'] || null,
      notes_internes: null,
      token: 'preview',
      status: 'draft',
      expires_at: expiresAt,
      created_at: new Date().toISOString(),
      accepted_at: null
    }
    const html = buildDevisPDF(fakeDev)
    return c.html(html)
  } catch(e: any) {
    return c.text('Erreur preview: ' + e.message, 500)
  }
})

app.post('/api/admin/devis/accept', adminAuth, async (c) => {
  const body = await c.req.parseBody()
  const id = parseInt(body['id'] as string)
  const db = c.env.DB
  if (db) {
    try {
      await db.prepare("UPDATE devis SET status='accepted', accepted_at=?, updated_at=? WHERE id=?").bind(new Date().toISOString(), new Date().toISOString(), id).run()
    } catch(e) { console.error('Devis accept error:', e) }
  }
  return c.redirect('/admin/devis')
})

app.post('/api/admin/devis/delete', adminAuth, async (c) => {
  const body = await c.req.parseBody()
  const id = parseInt(body['id'] as string)
  const db = c.env.DB
  if (db) {
    try { await db.prepare('DELETE FROM devis WHERE id=?').bind(id).run() } catch(e) { /* ignore */ }
  }
  return c.redirect('/admin/devis')
})

// ============================================================
// DEVIS — CLIENT VIEW (public)
// ============================================================

app.get('/devis/:token', async (c) => {
  const token = c.req.param('token')
  const db = c.env.DB
  if (!db) return c.html('<h1>Erreur: base de données indisponible</h1>', 500)
  try {
    await ensureDevisTable(db)
    const devis = await db.prepare('SELECT * FROM devis WHERE token = ?').bind(token).first() as any
    if (!devis) return c.html('<html><body style="background:#0b1120;color:#fff;font-family:sans-serif;text-align:center;padding:80px 20px;"><h1>Devis introuvable</h1><p style="color:#6b7280;">Ce lien est invalide ou expiré.</p><br><a href="/" style="color:#38bdf8;">← MAASGA</a></body></html>', 404)
    return c.html(buildClientDevisHTML(devis as any))
  } catch(e) {
    console.error('Devis view error:', e)
    return c.html('<html><body style="background:#0b1120;color:#fff;font-family:sans-serif;text-align:center;padding:80px 20px;"><h1>Erreur</h1><p>Impossible de charger ce devis.</p></body></html>', 500)
  }
})

app.post('/api/devis/:token/accept', async (c) => {
  const token = c.req.param('token')
  const db = c.env.DB
  if (db) {
    try {
      await db.prepare("UPDATE devis SET status='accepted', accepted_at=?, updated_at=? WHERE token=? AND status='sent'").bind(new Date().toISOString(), new Date().toISOString(), token).run()
    } catch(e) { console.error('Devis accept error:', e) }
  }
  return c.redirect(`/devis/${token}`)
})

// ============================================================
// DEVIS PDF — Version imprimable avec logo, infos entreprise & client
// ============================================================
app.get('/devis/:token/pdf', async (c) => {
  const token = c.req.param('token')
  const db = c.env.DB
  if (!db) return c.text('Base de données indisponible', 500)
  try {
    await ensureDevisTable(db)
    const d = await db.prepare('SELECT * FROM devis WHERE token = ?').bind(token).first() as any
    if (!d) return c.text('Devis introuvable', 404)
    return c.html(buildDevisPDF(d))
  } catch(e) {
    console.error('Devis PDF error:', e)
    return c.text('Erreur lors de la génération du PDF', 500)
  }
})

function buildDevisPDF(d: any): string {
  const accs: any[] = JSON.parse(d.accessoires || '[]')
  const prodTotal = (Number(d.produit_prix) || 0) * (Number(d.produit_quantite) || 1)
  const installTotal = Number(d.installation_prix) || 0
  const accTotal = accs.reduce((s: number, a: any) => s + (Number(a.prix) || 0), 0)
  const sousTotal = prodTotal + installTotal + accTotal
  const remisePct = Number(d.remise) || 0
  const remiseMt = Math.round(sousTotal * remisePct / 100)
  const total = sousTotal - remiseMt
  const createdStr = new Date(d.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  const expiryStr = d.expires_at ? new Date(d.expires_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : ''
  const isAccepted = d.status === 'accepted'
  const acceptedStr = d.accepted_at ? new Date(d.accepted_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : ''
  const btuCvMap: Record<number,string> = { 9000: '1', 12000: '1,5', 18000: '2', 24000: '3', 36000: '5' }

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(d.numero)} — Devis PDF MAASGA</title>
<meta name="robots" content="noindex,nofollow">
<style>
  @page { margin: 15mm 12mm; size: A4; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; color: #1a1a2e; font-size: 13px; line-height: 1.5; background: #fff; }
  .page { max-width: 780px; margin: 0 auto; padding: 20px; }
  
  /* Header */
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; padding-bottom: 20px; border-bottom: 3px solid #0077b6; }
  .company { display: flex; align-items: flex-start; gap: 14px; }
  .company-logo { width: 64px; height: 64px; border-radius: 12px; object-fit: cover; border: 2px solid #e2e8f0; }
  .company-name { font-size: 24px; font-weight: 800; color: #03045e; letter-spacing: -0.5px; }
  .company-tagline { font-size: 11px; color: #0077b6; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; }
  .company-info { font-size: 11px; color: #64748b; margin-top: 6px; line-height: 1.7; }
  .devis-box { text-align: right; }
  .devis-title { font-size: 22px; font-weight: 800; color: #0077b6; text-transform: uppercase; letter-spacing: 0.05em; }
  .devis-num { font-size: 16px; font-weight: 700; color: #03045e; margin-top: 4px; }
  .devis-meta { font-size: 11px; color: #64748b; margin-top: 8px; line-height: 1.6; }
  .status-badge { display: inline-block; padding: 3px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; margin-top: 6px; }
  .status-accepted { background: #dcfce7; color: #16a34a; }
  .status-sent { background: #fef3c7; color: #d97706; }
  .status-expired { background: #fee2e2; color: #dc2626; }
  
  /* Two-column info */
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
  .info-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; }
  .info-card-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #0077b6; margin-bottom: 10px; display: flex; align-items: center; gap: 6px; }
  .info-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 12px; }
  .info-label { color: #64748b; }
  .info-val { color: #1a1a2e; font-weight: 600; }
  
  /* Table */
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  thead th { background: #03045e; color: white; padding: 10px 12px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; text-align: left; }
  thead th:last-child, thead th:nth-child(3), thead th:nth-child(2) { text-align: right; }
  tbody td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 12px; vertical-align: top; }
  tbody td.right { text-align: right; font-weight: 600; white-space: nowrap; }
  .subtotal-row td { border-top: 2px solid #e2e8f0; font-size: 12px; color: #64748b; }
  .discount-row td { color: #16a34a; font-size: 12px; }
  .total-row td { border-top: 3px solid #03045e; padding-top: 14px; }
  .total-label { font-size: 15px; font-weight: 800; color: #03045e; }
  .total-amount { font-size: 22px; font-weight: 800; color: #0077b6; text-align: right; }
  
  /* Technical */
  .tech-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 24px; }
  .tech-card { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 12px; text-align: center; }
  .tech-val { font-size: 16px; font-weight: 800; color: #0077b6; }
  .tech-label { font-size: 10px; color: #64748b; font-weight: 600; text-transform: uppercase; margin-top: 2px; }
  
  /* Engagements */
  .engagements { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 20px 0; }
  .engage-item { display: flex; align-items: center; gap: 8px; font-size: 11px; color: #334155; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 8px 10px; }
  .engage-icon { font-size: 16px; flex-shrink: 0; }
  
  /* Conditions */
  .conditions { background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; padding: 16px; margin: 20px 0; font-size: 11px; color: #92400e; line-height: 1.7; }
  .conditions-title { font-weight: 700; font-size: 12px; margin-bottom: 6px; color: #78350f; }
  
  /* Footer */
  .footer { text-align: center; padding: 20px 0; border-top: 2px solid #e2e8f0; margin-top: 24px; font-size: 11px; color: #64748b; line-height: 1.7; }
  .footer strong { color: #03045e; }
  
  /* Print toolbar */
  .print-bar { display: flex; justify-content: center; gap: 12px; padding: 16px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; position: sticky; top: 0; z-index: 10; }
  .print-btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 24px; border-radius: 10px; font-size: 13px; font-weight: 700; cursor: pointer; border: none; text-decoration: none; }
  .print-btn-primary { background: #0077b6; color: white; }
  .print-btn-secondary { background: #f1f5f9; color: #334155; border: 1px solid #e2e8f0; }
  
  @media print {
    .print-bar { display: none !important; }
    body { background: white; }
    .page { padding: 0; max-width: none; }
  }
  
  /* Screen only padding */
  @media screen {
    body { background: #f1f5f9; }
    .page { background: white; margin: 20px auto; padding: 40px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
  }
</style>
</head>
<body>
<div class="print-bar">
  <button class="print-btn print-btn-primary" onclick="window.print()">🖨️ Imprimer / Télécharger PDF</button>
  <a class="print-btn print-btn-secondary" href="/devis/${escapeHtml(d.token)}">← Retour au devis</a>
</div>

<div class="page">
  <!-- HEADER -->
  <div class="header">
    <div class="company">
      <img src="/logo-site.png" alt="MAASGA" class="company-logo" />
      <div>
        <div class="company-name">MAASGA</div>
        <div class="company-tagline">Froid & Climatisation</div>
        <div class="company-info">
          📍 Ouagadougou, Burkina Faso<br>
          📞 +226 55 99 64 18<br>
          ✉️ maasgabf@gmail.com<br>
          🕐 Lun–Dim · 8h00–18h00
        </div>
      </div>
    </div>
    <div class="devis-box">
      <div class="devis-title">Devis</div>
      <div class="devis-num">${escapeHtml(d.numero)}</div>
      <div class="devis-meta">
        Date : ${createdStr}<br>
        ${expiryStr ? `Valable jusqu'au : ${expiryStr}` : 'Validité : 30 jours'}
      </div>
      <span class="status-badge ${isAccepted ? 'status-accepted' : d.status === 'sent' ? 'status-sent' : 'status-expired'}">
        ${isAccepted ? '✓ Accepté' + (acceptedStr ? ' le ' + acceptedStr : '') : d.status === 'sent' ? '⏳ En attente' : '📋 ' + (d.status || 'Brouillon')}
      </span>
    </div>
  </div>

  <!-- CLIENT + TECHNIQUE -->
  <div class="info-grid">
    <div class="info-card">
      <div class="info-card-title">👤 Informations client</div>
      <div class="info-row"><span class="info-label">Nom</span><span class="info-val">${escapeHtml(d.client_name || '')}</span></div>
      <div class="info-row"><span class="info-label">Téléphone</span><span class="info-val">${escapeHtml(d.client_phone || '')}</span></div>
      ${d.client_email ? `<div class="info-row"><span class="info-label">Email</span><span class="info-val">${escapeHtml(d.client_email)}</span></div>` : ''}
      ${d.client_quartier ? `<div class="info-row"><span class="info-label">Adresse</span><span class="info-val">${escapeHtml(d.client_quartier)}, Ouagadougou</span></div>` : ''}
    </div>
    <div class="info-card">
      <div class="info-card-title">🏢 Émetteur</div>
      <div class="info-row"><span class="info-label">Entreprise</span><span class="info-val">MAASGA</span></div>
      <div class="info-row"><span class="info-label">Activité</span><span class="info-val">Froid & Climatisation</span></div>
      <div class="info-row"><span class="info-label">Ville</span><span class="info-val">Ouagadougou, BF</span></div>
      <div class="info-row"><span class="info-label">Tél</span><span class="info-val">+226 55 99 64 18</span></div>
      <div class="info-row"><span class="info-label">Email</span><span class="info-val">maasgabf@gmail.com</span></div>
    </div>
  </div>

  ${(d.surface || d.btu_recommande) ? `
  <!-- DONNÉES TECHNIQUES -->
  <div class="tech-grid">
    ${d.surface ? `<div class="tech-card"><div class="tech-val">${Number(d.surface).toLocaleString('fr-FR')} m²</div><div class="tech-label">Surface</div></div>` : ''}
    ${d.btu_recommande ? `<div class="tech-card"><div class="tech-val">${Number(d.btu_recommande).toLocaleString('fr-FR')} BTU</div><div class="tech-label">Puissance recommandée</div></div>` : ''}
    ${d.btu_recommande ? `<div class="tech-card"><div class="tech-val">${btuCvMap[Number(d.btu_recommande)] || '—'} CV</div><div class="tech-label">Chevaux vapeur</div></div>` : ''}
  </div>` : ''}

  <!-- TABLEAU DES PRESTATIONS -->
  <table>
    <thead><tr>
      <th style="width:45%">Désignation</th>
      <th style="width:10%">Qté</th>
      <th style="width:22%">Prix unitaire</th>
      <th style="width:23%">Total</th>
    </tr></thead>
    <tbody>
      ${d.produit_nom ? `<tr>
        <td><strong>${escapeHtml(d.produit_nom)}</strong>${d.produit_btu ? '<br><span style="font-size:11px;color:#64748b;">' + Number(d.produit_btu).toLocaleString('fr-FR') + ' BTU</span>' : ''}</td>
        <td class="right">${Number(d.produit_quantite) || 1}</td>
        <td class="right">${(Number(d.produit_prix) || 0).toLocaleString('fr-FR')} FCFA</td>
        <td class="right">${prodTotal.toLocaleString('fr-FR')} FCFA</td>
      </tr>` : ''}
      <tr>
        <td>Installation professionnelle<br><span style="font-size:10px;color:#64748b;">Mise en service · Test · Vérification étanchéité · Formation</span></td>
        <td class="right">1</td>
        <td class="right">${installTotal.toLocaleString('fr-FR')} FCFA</td>
        <td class="right">${installTotal.toLocaleString('fr-FR')} FCFA</td>
      </tr>
      ${accs.filter((a:any) => a.nom).map((a:any) => `<tr>
        <td style="color:#475569;">${escapeHtml(a.nom)}</td>
        <td class="right">1</td>
        <td class="right">${(Number(a.prix) || 0).toLocaleString('fr-FR')} FCFA</td>
        <td class="right">${(Number(a.prix) || 0).toLocaleString('fr-FR')} FCFA</td>
      </tr>`).join('')}
      <tr class="subtotal-row">
        <td colspan="3" style="text-align:right; font-weight:600;">Sous-total HT</td>
        <td class="right">${sousTotal.toLocaleString('fr-FR')} FCFA</td>
      </tr>
      ${remisePct > 0 ? `<tr class="discount-row">
        <td colspan="3" style="text-align:right;">Remise (${remisePct}%)</td>
        <td class="right">− ${remiseMt.toLocaleString('fr-FR')} FCFA</td>
      </tr>` : ''}
      <tr class="total-row">
        <td colspan="3"><span class="total-label">TOTAL TTC</span></td>
        <td><div class="total-amount">${total.toLocaleString('fr-FR')} FCFA</div></td>
      </tr>
    </tbody>
  </table>

  <!-- ENGAGEMENTS -->
  <div class="engagements">
    <div class="engage-item"><span class="engage-icon">🔧</span><span><strong>Techniciens certifiés</strong> — Équipe qualifiée et expérimentée</span></div>
    <div class="engage-item"><span class="engage-icon">🛡️</span><span><strong>Garantie 12 mois</strong> — Pièces et main d'œuvre</span></div>
    <div class="engage-item"><span class="engage-icon">📞</span><span><strong>SAV rapide</strong> — Intervention sous 48h</span></div>
    <div class="engage-item"><span class="engage-icon">💯</span><span><strong>Satisfaction garantie</strong> — Ou reprise gratuite</span></div>
  </div>

  ${d.message_client ? `
  <div style="background:#f0f9ff; border:1px solid #bae6fd; border-radius:10px; padding:16px; margin:20px 0;">
    <div style="font-size:11px; font-weight:700; color:#0077b6; text-transform:uppercase; letter-spacing:0.06em; margin-bottom:6px;">💬 Message de l'équipe</div>
    <p style="font-size:13px; color:#334155; line-height:1.7; white-space:pre-wrap;">${escapeHtml(d.message_client)}</p>
  </div>` : ''}

  <!-- CONDITIONS -->
  <div class="conditions">
    <div class="conditions-title">📋 Conditions générales</div>
    • Ce devis est valable ${expiryStr ? 'jusqu\'au ' + expiryStr : '30 jours à compter de la date d\'émission'}.<br>
    • Aucun paiement n'est requis avant accord du client et visite technique sur site.<br>
    • Le montant définitif peut être ajusté si les conditions réelles diffèrent du dimensionnement initial.<br>
    • TVA non applicable (régime simplifié).<br>
    • L'installation comprend : mise en service, test complet et formation d'utilisation.
  </div>

  <!-- FOOTER -->
  <div class="footer">
    <strong>MAASGA — Froid & Climatisation</strong><br>
    📍 Ouagadougou, Burkina Faso &nbsp;|&nbsp; 📞 +226 55 99 64 18 &nbsp;|&nbsp; ✉️ maasgabf@gmail.com<br>
    🕐 Lundi – Dimanche · 8h00 – 18h00<br><br>
    <em>Merci pour votre confiance. L'équipe MAASGA reste à votre disposition.</em>
  </div>
</div>

<script>
  // Auto-print if requested via query param
  if (new URLSearchParams(window.location.search).get('auto') === '1') {
    window.addEventListener('load', function() { setTimeout(function(){ window.print(); }, 500); });
  }
</script>
</body>
</html>`
}
app.post('/api/admin/rdv/update', adminAuth, async (c) => {
  const body = await c.req.parseBody()
  const id = parseInt(body['id'] as string)
  const status = body['status'] as string
  // Whitelist allowed RDV statuses
  const ALLOWED_RDV_STATUSES = ['pending', 'confirmed', 'done']
  if (!status || !ALLOWED_RDV_STATUSES.includes(status)) {
    return c.redirect('/admin/rdv?error=Statut invalide')
  }
  const rdv = appointments.find(a => a.id === id)
  if (rdv) rdv.status = status as 'pending' | 'confirmed' | 'done'
  
  // Modifier status en D1 aussi
  const db = c.env.DB
  if (db) {
    try {
      await db.prepare('UPDATE appointments SET status = ? WHERE id = ?').bind(status, id).run()
    } catch (error) {
      console.error('Erreur D1 rdv update:', error)
    }
  }
  
  return c.redirect('/admin/rdv?success=1')
})

// API Admin - Valider la visite (marquer RDV done SANS créer de commande)
app.post('/api/admin/rdv/validate-visit', adminAuth, async (c) => {
  const body = await c.req.json()
  const appointment_id = body.appointment_id as number
  const rdv = appointments.find(a => a.id === appointment_id)
  if (rdv) rdv.status = 'done'

  const db = c.env.DB
  if (db) {
    try {
      await db.prepare('UPDATE appointments SET status = ? WHERE id = ?').bind('done', appointment_id).run()
    } catch (error) {
      console.error('Erreur D1 validate-visit:', error)
    }
  }

  return c.json({ success: true, message: 'Visite validée avec succès' })
})

// API Admin - Approuver avis
app.post('/api/admin/avis/approve', adminAuth, async (c) => {
  const body = await c.req.parseBody()
  const id = parseInt(body['id'] as string)
  const review = reviews.find(r => r.id === id)
  if (review) review.approved = true
  
  // Approuver en D1 aussi
  const db = c.env.DB
  if (db) {
    try {
      await db.prepare('UPDATE reviews SET approved = 1 WHERE id = ?').bind(id).run()
    } catch (error) {
      console.error('Erreur D1 avis approve:', error)
    }
  }
  
  _cachedReviews = null // Invalider le cache homepage
  return c.redirect('/admin/avis?success=1')
})

// API Admin - Rejeter avis
app.post('/api/admin/avis/reject', adminAuth, async (c) => {
  const body = await c.req.parseBody()
  const id = parseInt(body['id'] as string)
  const idx = reviews.findIndex(r => r.id === id)
  if (idx !== -1) reviews.splice(idx, 1)
  
  // Rejeter (supprimer) en D1 aussi
  const db = c.env.DB
  if (db) {
    try {
      await db.prepare('DELETE FROM reviews WHERE id = ?').bind(id).run()
    } catch (error) {
      console.error('Erreur D1 avis reject:', error)
    }
  }
  
  _cachedReviews = null // Invalider le cache homepage
  return c.redirect('/admin/avis?deleted=1')
})

// API Admin - Ajouter un produit

// ==============================================================
// API Admin - Lookup client by phone (used in RDV modal)
// ==============================================================
app.get('/api/admin/clients/by-phone', adminAuth, async (c) => {
  const phone = (c.req.query('phone') || '').trim()
  const db = c.env.DB
  if (!db || !phone) return c.json({ error: 'invalid' }, 400)
  try {
    const client = await db.prepare(
      'SELECT id, name, email, phone, quartier, address, source, notes, created_at FROM clients WHERE phone = ? OR phone = ? OR phone = ?'
    ).bind(phone, phone.replace(/^0/, '+226'), phone.replace(/^\+226/, '0')).first() as any
    if (!client) return c.json({ found: false })
    const [rdvsRes, ordersRes, contractsRes] = await Promise.all([
      db.prepare('SELECT COUNT(*) as cnt FROM appointments WHERE phone = ?').bind(client.phone).first(),
      db.prepare('SELECT COUNT(*) as cnt FROM orders WHERE client_phone = ?').bind(client.phone).first(),
      db.prepare('SELECT COUNT(*) as cnt FROM maintenance_contracts WHERE client_phone = ?').bind(client.phone).first(),
    ])
    return c.json({
      found: true,
      client,
      rdvCount: (rdvsRes as any)?.cnt || 0,
      orderCount: (ordersRes as any)?.cnt || 0,
      contractCount: (contractsRes as any)?.cnt || 0,
    })
  } catch (e) {
    return c.json({ error: 'query_failed' }, 500)
  }
})

// ==============================================================
// API Admin - Détail complet d'un client (historique)
// ==============================================================
app.get('/api/admin/clients/:id/detail', adminAuth, async (c) => {
  const id = parseInt(c.req.param('id') || '0')
  const db = c.env.DB
  if (!db || !id) return c.json({ error: 'invalid' }, 400)
  try {
    const client = await db.prepare('SELECT * FROM clients WHERE id = ?').bind(id).first()
    if (!client) return c.json({ error: 'not_found' }, 404)
    const phone = (client as any).phone || ''

    const [contractsRes, visitsRes, devisRes, rdvsRes, savRes] = await Promise.all([
      db.prepare('SELECT id, plan_type, plan_price, start_date, end_date, status, total_visits, completed_visits, next_visit_date FROM maintenance_contracts WHERE client_id = ? ORDER BY id DESC').bind(id).all(),
      db.prepare('SELECT id, visit_type, visit_date, status, technician, actions_performed FROM maintenance_visits WHERE client_id = ? ORDER BY visit_date DESC LIMIT 8').bind(id).all(),
      db.prepare('SELECT id, numero, status, total_ht, produit_nom, created_at FROM devis WHERE client_phone = ? ORDER BY id DESC LIMIT 8').bind(phone).all(),
      db.prepare('SELECT id, type, status, date, heure_debut FROM appointments WHERE phone = ? ORDER BY id DESC LIMIT 8').bind(phone).all(),
      db.prepare('SELECT id, ticket_ref, subject, priority, status, created_at FROM sav_tickets WHERE client_phone = ? ORDER BY id DESC LIMIT 5').bind(phone).all(),
    ])

    return c.json({
      client,
      contracts: contractsRes.results || [],
      visits: visitsRes.results || [],
      devis: devisRes.results || [],
      rdvs: rdvsRes.results || [],
      sav: savRes.results || [],
    })
  } catch (e) {
    console.error('Client detail error:', e)
    return c.json({ error: 'query_failed' }, 500)
  }
})

// Admin: View pending password reset codes
app.get('/api/admin/reset-codes', adminAuth, async (c) => {
  const db = c.env.DB
  if (!db) return c.json({ codes: [] })
  try {
    await ensureResetCodesTable(db)
    const res = await db.prepare(
      'SELECT token, phone, email, code, created_at, used FROM password_reset_codes WHERE used = 0 AND created_at > ? ORDER BY created_at DESC LIMIT 20'
    ).bind(Date.now() - CLIENT_RESET_CODE_MAX_AGE).all()
    return c.json({ codes: res.results || [] })
  } catch (e) {
    return c.json({ codes: [] })
  }
})

// Admin: Send reset code via WhatsApp (generate wa.me link)
app.get('/api/admin/reset-codes/:token/whatsapp', adminAuth, async (c) => {
  const tkn = c.req.param('token')
  const db = c.env.DB
  if (!db || !tkn) return c.json({ error: 'invalid' }, 400)
  try {
    const row = await db.prepare('SELECT phone, code FROM password_reset_codes WHERE token = ? AND used = 0').bind(tkn).first() as any
    if (!row || !row.phone) return c.json({ error: 'not_found' }, 404)
    const waUrl = 'https://wa.me/' + row.phone.replace(/[^0-9]/g, '') + '?text=' + encodeURIComponent(`Bonjour! Voici votre code de réinitialisation MAASGA: ${row.code}\nCe code expire dans 15 minutes.`)
    return c.json({ url: waUrl })
  } catch (e) {
    return c.json({ error: 'failed' }, 500)
  }
})

app.post('/api/admin/produit/add', adminAuth, async (c) => {
  const body = await c.req.parseBody()
  const rawName = (body['name'] as string || '').trim()
  const rawBrand = (body['brand'] as string || '').trim()
  const rawModel = (body['model'] as string || '').trim()
  if (!rawName || !rawBrand) {
    return c.redirect('/admin/produits?error=' + encodeURIComponent('Nom et marque du produit sont requis.'))
  }
  const name = escapeHtml(rawName)
  const brand = escapeHtml(rawBrand)
  const model = escapeHtml(rawModel)
  const btu = parseInt(body['btu'] as string) || 12000
  const price = parseInt(body['price'] as string) || 0
  const stock = parseInt(body['stock'] as string) || 0
  const surface_min = parseInt(body['surface_min'] as string) || 10
  const surface_max = parseInt(body['surface_max'] as string) || 25
  const energy_class = (body['energy_class'] as string) || 'A++'
  const description = escapeHtml((body['description'] as string || '').trim())
  const inverter = !!body['inverter']
  const available = stock > 0
  
  // Parse features JSON
  let features: string[] = []
  try {
    const featuresJson = body['features_json'] as string
    features = featuresJson ? JSON.parse(featuresJson) : []
  } catch (e) {
    features = []
  }

  // Parse tech specs
  const techSpecsFields = ['power_source','cooling_capacity','cooling_input_power','nominal_cooling_current',
    'max_input_consumption','max_current','starting_current','compressor_type',
    'indoor_airflow','indoor_noise','refrigerant_type','design_pressure','operating_temp','ambient_temp_cooling']
  const techSpecs: Record<string, string> = {}
  techSpecsFields.forEach(f => {
    const val = (body[f] as string || '').trim()
    if (val) techSpecs[f] = val
  })
  const techSpecsJson = Object.keys(techSpecs).length > 0 ? JSON.stringify(techSpecs) : null
  let imageUrl = ''
  const file = body['image'] as File | null
  if (file && file instanceof File && file.size > 0) {
    // Limit image size to 500KB to prevent bloating D1
    const MAX_IMAGE_SIZE = 500 * 1024
    if (file.size > MAX_IMAGE_SIZE) {
      return c.redirect('/admin/produits?error=' + encodeURIComponent('Image trop grande (max 500 KB). Compressez-la avant upload.'))
    }
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return c.redirect('/admin/produits?error=' + encodeURIComponent('Type de fichier non autorisé. Utilisez JPEG, PNG ou WebP.'))
    }
    const buffer = await file.arrayBuffer()
    const bytes = new Uint8Array(buffer)
    // Validate magic bytes to prevent spoofed Content-Type
    if (!validateImageMagicBytes(bytes)) {
      return c.redirect('/admin/produits?error=' + encodeURIComponent('Le fichier ne semble pas être une image valide.'))
    }
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i])
    imageUrl = `data:${file.type || 'image/jpeg'};base64,${btoa(binary)}`
  }

  // Parse media JSON
  let media: any[] = []
  try {
    const mediaJson = body['media_json'] as string
    media = mediaJson ? JSON.parse(mediaJson) : []
  } catch (e) {
    media = []
  }

  const newProduct: any = {
    id: products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1,
    name, brand, model, btu, price, price_install: 0, stock,
    surface_min, surface_max, energy_class, description,
    inverter, available,
    image: '❄️',
    imageUrl,
    features,
    warranty: '1 an constructeur',
    techSpecs: Object.keys(techSpecs).length > 0 ? techSpecs : undefined,
    media: media.length > 0 ? media : undefined
  }
  products.push(newProduct)

  // Écrire en D1 — récupérer l'ID réel autoincrement
  const db = c.env.DB
  if (db) {
    try {
      await db.prepare(`
        INSERT INTO products (name, brand, model, btu, price, stock, surface_min, surface_max, energy_class, description, inverter, available, warranty, features, image, imageUrl, tech_specs, media_urls)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        name, brand, model, btu, price, stock, surface_min, surface_max, energy_class,
        description, inverter ? 1 : 0, available ? 1 : 0, '1 an constructeur',
        features.length > 0 ? JSON.stringify(features) : null,
        '❄️', imageUrl || null, techSpecsJson,
        media.length > 0 ? JSON.stringify(media) : null
      ).run()
      // Sync ID with D1 autoincrement
      const lastRow = await db.prepare('SELECT id FROM products ORDER BY id DESC LIMIT 1').first() as any
      if (lastRow?.id) newProduct.id = lastRow.id
    } catch (error) {
      console.error('Erreur D1 produit add:', error)
    }
  }
  await notifyAdmin((c as any).env, 'product', `${name} — ${brand}, ${btu.toLocaleString()} BTU — ${price.toLocaleString()} FCFA (stock: ${stock})`)
  return c.redirect('/admin/produits?success=1')
})

// API Admin - Modifier un produit
app.post('/api/admin/produit/update', adminAuth, async (c) => {
  const body = await c.req.parseBody()
  const id = parseInt(body['id'] as string)
  const productIndex = products.findIndex(p => p.id === id)
  
  if (productIndex === -1) {
    return c.redirect('/admin/produits?error=notfound')
  }
  
  const name = (body['name'] as string || '').trim()
  const brand = (body['brand'] as string || '').trim()
  const model = (body['model'] as string || '').trim()
  const btu = parseInt(body['btu'] as string) || 12000
  const price = parseInt(body['price'] as string) || 0
  const stock = parseInt(body['stock'] as string) || 0
  const surface_min = parseInt(body['surface_min'] as string) || 10
  const surface_max = parseInt(body['surface_max'] as string) || 25
  const energy_class = (body['energy_class'] as string) || 'A++'
  const description = (body['description'] as string || '').trim()
  const inverter = !!body['inverter']
  const available = stock > 0
  
  // Parse features JSON
  let features: string[] = []
  try {
    const featuresJson = body['features_json'] as string
    features = featuresJson ? JSON.parse(featuresJson) : []
  } catch (e) {
    features = products[productIndex].features
  }

  // Parse tech specs
  const techSpecsFields2 = ['power_source','cooling_capacity','cooling_input_power','nominal_cooling_current',
    'max_input_consumption','max_current','starting_current','compressor_type',
    'indoor_airflow','indoor_noise','refrigerant_type','design_pressure','operating_temp','ambient_temp_cooling']
  const techSpecs2: Record<string, string> = {}
  techSpecsFields2.forEach(f => {
    const val = (body[f] as string || '').trim()
    if (val) techSpecs2[f] = val
  })
  const techSpecsJson2 = Object.keys(techSpecs2).length > 0 ? JSON.stringify(techSpecs2) : null
  
  // Parse media JSON
  let media: any[] = []
  try {
    const mediaJson = body['media_json'] as string
    if (mediaJson) {
      media = JSON.parse(mediaJson)
    } else {
      // Keep existing media if not updated
      media = products[productIndex].media || []
    }
  } catch (e) {
    media = products[productIndex].media || []
  }
  
  products[productIndex] = {
    ...products[productIndex],
    name, brand, model, btu, price, stock,
    surface_min, surface_max, energy_class, description,
    inverter, available, features,
    techSpecs: Object.keys(techSpecs2).length > 0 ? techSpecs2 : undefined,
    media: media.length > 0 ? media : undefined
  }

  // Écrire en D1 aussi
  const db = c.env.DB
  if (db) {
    try {
      // Log stock movement if stock changed
      const oldStock = products[productIndex].stock || 0
      if (stock !== oldStock) {
        const diff = stock - oldStock
        const mvtType = diff > 0 ? 'entree' : (diff < 0 ? 'sortie' : 'ajustement')
        await logStockMovement(db, id, name, mvtType, diff, oldStock, stock, 'Modification manuelle admin')
      }
      await db.prepare(`
        UPDATE products
        SET name=?, brand=?, model=?, btu=?, price=?, stock=?, 
            surface_min=?, surface_max=?, energy_class=?, description=?, 
            inverter=?, available=?, features=?, tech_specs=?, media_urls=?
        WHERE id = ?
      `).bind(
        name, brand, model, btu, price, stock,
        surface_min, surface_max, energy_class, description,
        inverter ? 1 : 0, available ? 1 : 0,
        features.length > 0 ? JSON.stringify(features) : null,
        techSpecsJson2,
        media.length > 0 ? JSON.stringify(media) : null,
        id
      ).run()
    } catch (error) {
      console.error('Erreur D1 produit update:', error)
    }
  }
  
  return c.redirect('/admin/produits?success=1')
})

// API Admin - Supprimer un produit
app.post('/api/admin/produit/delete', adminAuth, async (c) => {
  const body = await c.req.parseBody()
  const id = parseInt(body['id'] as string)
  const idx = products.findIndex(p => p.id === id)
  if (idx !== -1) products.splice(idx, 1)
  
  // Supprimer en D1 aussi
  const db = c.env.DB
  if (db) {
    try {
      await db.prepare('DELETE FROM products WHERE id = ?').bind(id).run()
    } catch (error) {
      console.error('Erreur D1 produit delete:', error)
    }
  }
  
  return c.redirect('/admin/produits?deleted=1')
})

// API Admin - Uploader/changer l'image d'un produit
app.post('/api/admin/produit/image', adminAuth, async (c) => {
  const body = await c.req.parseBody()
  const id = parseInt(body['id'] as string)
  const file = body['image'] as File | null
  if (file && file instanceof File && file.size > 0) {
    // Limit image size to 500KB
    const MAX_IMAGE_SIZE = 500 * 1024
    if (file.size > MAX_IMAGE_SIZE) {
      return c.redirect('/admin/produits?error=' + encodeURIComponent('Image trop grande (max 500 KB).'))
    }
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return c.redirect('/admin/produits?error=' + encodeURIComponent('Type non autorisé. Utilisez JPEG, PNG ou WebP.'))
    }
    const buffer = await file.arrayBuffer()
    const bytes = new Uint8Array(buffer)
    // Validate magic bytes to prevent spoofed Content-Type
    if (!validateImageMagicBytes(bytes)) {
      return c.redirect('/admin/produits?error=' + encodeURIComponent('Le fichier ne semble pas être une image valide.'))
    }
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i])
    const dataUrl = `data:${file.type || 'image/jpeg'};base64,${btoa(binary)}`
    const product = products.find(p => p.id === id)
    if (product) {
      (product as any).imageUrl = dataUrl
      // Also persist to D1
      const db = c.env.DB
      if (db) {
        try {
          await db.prepare('UPDATE products SET imageUrl = ? WHERE id = ?').bind(dataUrl, id).run()
        } catch(_) {}
      }
    }
  }
  
  return c.redirect('/admin/produits?success=1')
})

// API Génération devis PDF (simulation)
app.get('/api/devis/:rdvId', adminAuth, (c) => {
  const rdvId = parseInt(c.req.param('rdvId'))
  const rdv = appointments.find(a => a.id === rdvId)
  if (!rdv) return c.json({ error: 'RDV non trouvé' }, 404)

  const html = `
    <!DOCTYPE html>
    <html><head>
      <meta charset="UTF-8"/>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; color: #1a1a1a; }
        .header { background: linear-gradient(135deg, #1e3a8a, #0284c7); color: white; padding: 30px; border-radius: 10px; margin-bottom: 30px; }
        .title { font-size: 28px; font-weight: bold; }
        .subtitle { font-size: 14px; opacity: 0.8; margin-top: 5px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th { background: #f1f5f9; padding: 12px; text-align: left; font-size: 12px; color: #64748b; text-transform: uppercase; }
        td { padding: 12px; border-bottom: 1px solid #e2e8f0; }
        .total { font-size: 20px; font-weight: bold; color: #1e3a8a; }
        .notice { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 8px; font-size: 13px; color: #92400e; margin-top: 20px; }
        .footer { margin-top: 40px; font-maasgabf@gmail.com | +226 55 99 64 18gn: center; }
      </style>
    </head><body>
      <div class="header">
        <div class="title">❄️ MAASGA - Devis Technique</div>
        <div class="subtitle">Froid & Climatisation · Ouagadougou, Burkina Faso</div>
      </div>
      <h2>Devis N° DEV-${rdvId.toString().padStart(4,'0')}-${new Date().getFullYear()}</h2>
      <p><strong>Date :</strong> ${new Date().toLocaleDateString('fr-FR')}</p>
      <p><strong>Client :</strong> ${escapeHtml(rdv.name || '')}</p>
      <p><strong>Téléphone :</strong> ${escapeHtml(rdv.phone || '')}</p>
      <p><strong>Quartier :</strong> ${escapeHtml(rdv.quartier || '')}</p>
      <p><strong>Type :</strong> ${{ devis: 'Dimensionnement / Devis', installation: 'Installation', entretien: 'Entretien / Maintenance', depannage: 'Dépannage / Réparation urgente' }[rdv.type as string] || rdv.type}</p>
      ${rdv.notes ? `<p><strong>Notes :</strong> ${escapeHtml(rdv.notes || '')}</p>` : ''}
      <table>
        <thead><tr><th>Prestation</th><th>Détails</th><th>Montant</th></tr></thead>
        <tbody>
          <tr><td>Visite technique sur site</td><td>Dimensionnement et conseil</td><td>GRATUIT</td></tr>
          <tr><td>Climatiseur recommandé</td><td>À définir après visite technique</td><td>Sur devis</td></tr>
          <tr><td>Installation professionnelle</td><td>Main d'œuvre + accessoires</td><td>Sur devis</td></tr>
          <tr><td>Mise en service + test</td><td>Vérification complète</td><td>Inclus</td></tr>
        </tbody>
      </table>
      <div class="notice">
        ⚠️ Ce devis est indicatif. Le montant définitif sera déterminé après la visite technique sur site. Aucun paiement n'est requis avant Visite technique gratuite et accord du client.
      </div>
      <div class="footer">
        MAASGA - Froid & Climatisation | maasgabf@gmail.com | +226 55 99 64 18<br/>
        Ouagadougou, Burkina Faso | Techniciens certifiés
      </div>
    </body></html>
  `
  return c.html(html)
})

// ============================================================
// API JSON (pour intégration app mobile future)
// ============================================================

app.get('/api/products', async (c) => {
  const available = c.req.query('available')
  const brand = c.req.query('brand')
  
  // Mode hybride: essayer D1 d'abord, fallback à la mémoire
  let list = [...products]
  const db = c.env.DB
  
  if (db) {
    try {
      const dbProducts = await getProducts(db)
      list = dbProducts as any[]
    } catch (error) {
      console.error('Erreur D1 produits, fallback mémoire:', error)
    }
  }
  
  if (available === 'true') list = list.filter((p: any) => p.available && p.stock > 0)
  if (brand) list = list.filter((p: any) => p.brand === brand)
  return c.json(list)
})

app.get('/api/products/:id', async (c) => {
  const id = parseInt(c.req.param('id'))
  
  // Mode hybride
  let product: any = products.find(p => p.id === id)
  const db = c.env.DB
  
  if (db && !product) {
    try {
      const dbProducts = await getProducts(db)
      product = (dbProducts as any[]).find((p: any) => p.id === id)
    } catch (error) {
      console.error('Erreur D1 produit, fallback mémoire:', error)
      product = products.find(p => p.id === id)
    }
  }
  
  if (!product) return c.json({ error: 'Produit non trouvé' }, 404)
  return c.json(product)
})

// POST /api/products — Create a product (requires Bearer token = ADMIN_SECRET)
app.post('/api/products', async (c) => {
  const env = c.env
  // Token auth via Authorization header
  const authHeader = c.req.header('Authorization') || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  let secret: string
  try { secret = getAdminSecret(env) } catch { return c.json({ error: 'Server misconfigured' }, 503) }
  if (!token || token !== secret) {
    return c.json({ error: 'Non autorisé' }, 401)
  }

  let data: any
  try { data = await c.req.json() } catch { return c.json({ error: 'JSON invalide' }, 400) }

  const { name, brand, model, btu, price, stock, energy_class, surface_min, surface_max,
          description, refrigerant, compressor, image_url, inverter, warranty, features } = data

  if (!name || !brand || !btu || !price) {
    return c.json({ error: 'Champs requis manquants: name, brand, btu, price' }, 400)
  }

  const db = env.DB as any
  if (!db) return c.json({ error: 'Base de données indisponible' }, 503)

  try {
    const result = await db.prepare(`
      INSERT INTO products (name, brand, model, btu, price, stock, energy_class,
        surface_min, surface_max, description, image_url, inverter, warranty, features, available)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `).bind(
      name,
      brand,
      model || '',
      parseInt(btu),
      parseInt(price),
      parseInt(stock ?? 1),
      energy_class || '',
      surface_min ? parseInt(surface_min) : null,
      surface_max ? parseInt(surface_max) : null,
      description || '',
      image_url || '',
      inverter ? 1 : 0,
      warranty || '1 an constructeur',
      features ? (typeof features === 'string' ? features : JSON.stringify(features)) : null
    ).run()

    // Invalidate in-memory cache so next GET fetches from D1
    _d1LoadPromise = null

    return c.json({ success: true, id: result.meta?.last_row_id }, 201)
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

app.get('/api/reviews', async (c) => {
  // Mode hybride
  let list = reviews.filter(r => r.approved)
  const db = c.env.DB
  
  if (db) {
    try {
      const dbReviews = await getReviews(db, true)
      list = dbReviews as any[]
    } catch (error) {
      console.error('Erreur D1 avis, fallback mémoire:', error)
      list = reviews.filter(r => r.approved)
    }
  }
  
  return c.json(list)
})

app.get('/api/quartiers', async (c) => {
  // Mode hybride
  let list = quartiers
  const db = c.env.DB
  
  if (db) {
    try {
      list = await getQuartiers(db) as any
    } catch (error) {
      console.error('Erreur D1 quartiers, fallback mémoire:', error)
      list = quartiers
    }
  }
  
  return c.json(list)
})

// API Admin - Créer une commande depuis un RDV
app.post('/api/admin/create-order', adminAuth, async (c) => {
  const body = await c.req.json()
  const appointment_id = body.appointment_id as number
  const client_name = (body.client_name as string || '').trim()
  const client_phone = (body.client_phone as string || '').trim()
  const quartier = (body.quartier as string || '').trim()
  const type = body.type as 'devis' | 'installation'

  // Vérifier que le RDV existe
  const appointment = appointments.find(a => a.id === appointment_id)
  if (!appointment) {
    return c.json({ success: false, error: 'Rendez-vous non trouvé' }, 404)
  }

  // Mettre à jour le statut du RDV à 'confirmed'
  appointment.status = 'confirmed'

  // Créer une nouvelle commande
  const newOrder = {
    id: orders.length > 0 ? Math.max(...orders.map(o => o.id)) + 1 : 1,
    appointment_id,
    client_name,
    client_phone,
    quartier,
    type,
    status: 'validation_terrain' as const,
    created_at: new Date().toISOString()
  }
  orders.push(newOrder)

  // Mettre à jour en base de données D1 si disponible
  const db = c.env.DB
  if (db) {
    try {
      await updateAppointmentStatus(db, appointment_id, 'confirmed')
      await createOrder(db, {
        appointment_id,
        client_name,
        client_phone,
        quartier,
        type,
        status: 'validation_terrain'
      })
    } catch (error) {
      console.error('Erreur lors de la création de la commande en D1:', error)
    }
  }

  return c.json({ 
    success: true, 
    order_id: newOrder.id,
    message: `✅ Commande #${newOrder.id} créée avec succès. Statut du RDV mis à jour.`
  })
})

// API Admin - Récupérer les commandes par RDV
app.get('/api/admin/orders-by-appointment/:id', adminAuth, async (c) => {
  const appointment_id = parseInt(c.req.param('id'))
  const appointmentOrders = orders.filter(o => o.appointment_id === appointment_id)
  return c.json(appointmentOrders)
})

app.get('/api/stats', adminAuth, (c) => {
  const totalRdv = appointments.length
  const pendingRdv = appointments.filter(a => a.status === 'pending').length
  const confirmedRdv = appointments.filter(a => a.status === 'confirmed').length
  const doneRdv = appointments.filter(a => a.status === 'done').length
  const totalProducts = products.length
  const availableProducts = products.filter(p => p.available && p.stock > 0).length
  const lowStockProducts = products.filter(p => p.stock > 0 && p.stock <= 3).length
  const outOfStockProducts = products.filter(p => p.stock === 0).length
  const totalReviews = reviews.length
  const pendingReviews = reviews.filter(r => !r.approved).length
  const avgNote = reviews.filter(r => r.approved).length > 0
    ? (reviews.filter(r => r.approved).reduce((s, r) => s + r.note, 0) / reviews.filter(r => r.approved).length).toFixed(1)
    : '5.0'

  return c.json({
    rdv: { total: totalRdv, pending: pendingRdv, confirmed: confirmedRdv, done: doneRdv },
    products: { total: totalProducts, available: availableProducts, lowStock: lowStockProducts, outOfStock: outOfStockProducts },
  })
})

// ============================================================
// API CLIENTS - CRUD COMPLET
// ============================================================

// Réinitialiser la base de données (supprimer toutes les données)
app.post('/api/admin/reset-db', adminAuth, async (c) => {
  const db = c.env.DB
  if (!db) {
    return c.json({ success: false, error: 'D1 non disponible' }, 400)
  }

  // V\u00e9rifier le token de confirmation pour \u00e9viter les suppressions accidentelles
  const body = await c.req.json().catch(() => ({}))
  if (body.confirm !== 'REINITIALISER') {
    return c.json({ success: false, error: 'Confirmation requise. Envoyez {"confirm": "REINITIALISER"} pour confirmer.' }, 400)
  }

  try {
    // Désactiver les contraintes de clés étrangères pour permettre la suppression
    await db.prepare('PRAGMA foreign_keys = OFF').run()
    
    // Vider toutes les tables (ordonnéé pour éviter les FK conflicts)
    await db.prepare('DELETE FROM orders').run()
    await db.prepare('DELETE FROM appointments').run()
    await db.prepare('DELETE FROM admin_sessions').run()
    await db.prepare('DELETE FROM reviews').run()
    await db.prepare('DELETE FROM clients').run()
    await db.prepare('DELETE FROM products').run()
    await db.prepare('DELETE FROM quartiers').run()
    
    // Réactiver les contraintes
    await db.prepare('PRAGMA foreign_keys = ON').run()
    
    // Réinitialiser les compteurs autoincrement
    await db.prepare('DELETE FROM sqlite_sequence').run()
    
    // Vider aussi les données en mémoire
    appointments.length = 0
    reviews.length = 0
    orders.length = 0
    clients.length = 0
    
    return c.json({ 
      success: true, 
      message: '✅ Base de données complètement réinitialisée (D1 + mémoire + sqlite_sequence)'
    })
  } catch (error) {
    return c.json({ 
      success: false, 
      error: `Erreur lors de la réinitialisation: ${error}`
    }, 500)
  }
})

app.post('/api/admin/client/add', adminAuth, async (c) => {
  const body = await c.req.parseBody()
  const rawName = (body['name'] as string || '').trim()
  const rawEmail = (body['email'] as string || '').trim()
  const rawPhone = (body['phone'] as string || '').trim()
  const rawQuartier = (body['quartier'] as string || '').trim()

  if (!rawName || !rawPhone) {
    return c.json({ success: false, error: 'Nom et téléphone requis' }, 400)
  }
  if (!isValidPhone(rawPhone)) {
    return c.json({ success: false, error: 'Numéro de téléphone invalide (8 chiffres requis)' }, 400)
  }
  if (rawEmail && !isValidEmail(rawEmail)) {
    return c.json({ success: false, error: 'Adresse email invalide' }, 400)
  }

  const name = escapeHtml(rawName)
  const email = escapeHtml(rawEmail)
  const phone = escapeHtml(rawPhone)
  const quartier = escapeHtml(rawQuartier)

  const newClient = {
    id: clients.length > 0 ? Math.max(...clients.map(c => c.id)) + 1 : 1,
    name, email, phone, quartier,
    password_hash: 'pending',
    type_demande: '',
    notes: '',
    created_at: new Date().toISOString().split('T')[0]
  }
  clients.push(newClient)

  // Écrire en D1 aussi
  const db = c.env.DB
  if (db) {
    try {
      await db.prepare(`
        INSERT INTO clients (name, email, phone, quartier, password_hash, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(name, email, phone, quartier, 'pending', new Date().toISOString().split('T')[0]).run()
    } catch (error) {
      console.error('Erreur D1 client add:', error)
    }
  }

  return c.redirect('/admin/clients?success=1')
})

app.post('/api/admin/client/update', adminAuth, async (c) => {
  const body = await c.req.parseBody()
  const id = parseInt(body['id'] as string)
  const clientIndex = clients.findIndex(cl => cl.id === id)

  if (clientIndex === -1) {
    return c.redirect('/admin/clients?error=notfound')
  }

  const rawName = (body['name'] as string || '').trim()
  const rawEmail = (body['email'] as string || '').trim()
  const rawPhone = (body['phone'] as string || '').trim()
  const rawQuartier = (body['quartier'] as string || '').trim()

  if (rawPhone && !isValidPhone(rawPhone)) {
    return c.redirect('/admin/clients?error=' + encodeURIComponent('Numéro de téléphone invalide'))
  }
  if (rawEmail && !isValidEmail(rawEmail)) {
    return c.redirect('/admin/clients?error=' + encodeURIComponent('Adresse email invalide'))
  }

  const name = escapeHtml(rawName)
  const email = escapeHtml(rawEmail)
  const phone = escapeHtml(rawPhone)
  const quartier = escapeHtml(rawQuartier)

  clients[clientIndex] = { ...clients[clientIndex], name, email, phone, quartier }

  // Écrire en D1 aussi
  const db = c.env.DB
  if (db) {
    try {
      await db.prepare(`
        UPDATE clients SET name = ?, email = ?, phone = ?, quartier = ? WHERE id = ?
      `).bind(name, email, phone, quartier, id).run()
    } catch (error) {
      console.error('Erreur D1 client update:', error)
    }
  }

  return c.redirect('/admin/clients?success=1')
})

app.post('/api/admin/client/delete', adminAuth, async (c) => {
  const body = await c.req.parseBody()
  const id = parseInt(body['id'] as string)
  const idx = clients.findIndex(cl => cl.id === id)
  if (idx !== -1) clients.splice(idx, 1)

  // Supprimer en D1 aussi
  const db = c.env.DB
  if (db) {
    try {
      await db.prepare('DELETE FROM clients WHERE id = ?').bind(id).run()
    } catch (error) {
      console.error('Erreur D1 client delete:', error)
    }
  }

  return c.redirect('/admin/clients?success=1')
})

// ============================================================
// API RDV - CRUD COMPLET
// ============================================================
app.post('/api/admin/rdv/add', adminAuth, async (c) => {
  const body = await c.req.parseBody()
  const rawName = (body['name'] as string || '').trim()
  const rawPhone = (body['phone'] as string || '').trim()
  const rawQuartier = (body['quartier'] as string || '').trim()
  const date = (body['date'] as string || '').trim()
  const heure_debut = (body['heure_debut'] as string || '08:00').trim()
  const heure_fin = (body['heure_fin'] as string || '18:00').trim()
  const typeAdminRaw = (body['type'] as string || 'devis').toLowerCase()
  const validAdminRdvTypes = ['devis', 'installation', 'entretien', 'depannage'] as const
  const type = (validAdminRdvTypes.includes(typeAdminRaw as any) ? typeAdminRaw : 'devis') as 'devis' | 'installation' | 'entretien' | 'depannage'
  const rawNotes = (body['notes'] as string || '').trim()
  const latitude = parseFloat(body['latitude'] as string) || null
  const longitude = parseFloat(body['longitude'] as string) || null

  if (!rawName || !rawPhone || !rawQuartier || !date) {
    return c.json({ success: false, error: 'Champs requis: nom, téléphone, quartier, date' }, 400)
  }
  if (!isValidPhone(rawPhone)) {
    return c.json({ success: false, error: 'Numéro de téléphone invalide (8 chiffres requis)' }, 400)
  }

  const name = escapeHtml(rawName)
  const phone = escapeHtml(rawPhone)
  const quartier = escapeHtml(rawQuartier)
  const notes = escapeHtml(rawNotes)

  const newRdv = {
    id: appointments.length > 0 ? Math.max(...appointments.map(a => a.id)) + 1 : 1,
    name, phone, quartier, date, heure_debut, heure_fin, type, notes,
    latitude: latitude as any, longitude: longitude as any,
    adresse_precise: '', status: 'pending' as 'pending',
    created_at: new Date().toISOString().split('T')[0]
  }
  appointments.push(newRdv)

  // Écrire en D1 aussi
  const db = c.env.DB
  if (db) {
    try {
      await createAppointment(db, {
        name, phone, quartier, date, heure_debut, heure_fin, type, notes,
        latitude, longitude, adresse_precise: ''
      })
    } catch (error) {
      console.error('Erreur D1 rdv add:', error)
    }
  }

  return c.redirect('/admin/rdv?success=1')
})

app.post('/api/admin/rdv/delete', adminAuth, async (c) => {
  const body = await c.req.parseBody()
  const id = parseInt(body['id'] as string)
  const idx = appointments.findIndex(a => a.id === id)
  if (idx !== -1) appointments.splice(idx, 1)

  // Supprimer en D1 aussi
  const db = c.env.DB
  if (db) {
    try {
      await db.prepare('DELETE FROM appointments WHERE id = ?').bind(id).run()
    } catch (error) {
      console.error('Erreur D1 rdv delete:', error)
    }
  }

  return c.redirect('/admin/rdv?success=1')
})

// ============================================================
// API COMMANDES - CRUD COMPLET
// ============================================================
app.post('/api/admin/commande/delete', adminAuth, async (c) => {
  const body = await c.req.parseBody()
  const id = parseInt(body['id'] as string)
  const idx = orders.findIndex(o => o.id === id)
  if (idx !== -1) orders.splice(idx, 1)

  // Supprimer en D1 aussi
  const db = c.env.DB
  if (db) {
    try {
      await db.prepare('DELETE FROM orders WHERE id = ?').bind(id).run()
    } catch (error) {
      console.error('Erreur D1 commande delete:', error)
    }
  }

  return c.redirect('/admin/commandes?success=1')
})

app.post('/api/admin/commande/update-statut', adminAuth, async (c) => {
  const body = await c.req.parseBody()
  const id = parseInt(body['id'] as string)
  const status = body['status'] as string
  const allowedStatuses = ['pending', 'paid', 'livre', 'validation_terrain', 'devis_en_attente', 'devis_valide', 'devis_refuse', 'installed', 'cancelled', 'refunded']
  if (!allowedStatuses.includes(status)) {
    return c.json({ error: 'Statut invalide' }, 400)
  }
  const order = orders.find(o => o.id === id)

  if (order) {
    order.status = status as any
  }

  // Mettre à jour en D1
  const db = c.env.DB
  if (db) {
    const now = new Date().toISOString()
    try {
      if (status === 'livre') {
        await db.prepare('UPDATE orders SET status = ?, delivered_at = ?, updated_at = ? WHERE id = ?').bind(status, now, now, id).run()
      } else if (status === 'installed') {
        await db.prepare('UPDATE orders SET status = ?, installed_at = ?, installation_confirmed_by = ?, updated_at = ? WHERE id = ?').bind(status, now, 'admin', now, id).run()
      } else {
        await db.prepare('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?').bind(status, now, id).run()
      }
    } catch (error) {
      console.error('Erreur D1 commande update:', error)
    }

    // Auto-create SAV gratuit when order is marked as installed
    if (status === 'installed') {
      try {
        const orderRow = await db.prepare('SELECT * FROM orders WHERE id = ?').bind(id).first() as any
        if (orderRow) {
          await ensureMaintenanceTables(db)
          const installDate = new Date(now)
          const sixMonths = new Date(installDate)
          sixMonths.setMonth(sixMonths.getMonth() + 6)
          const twelveMonths = new Date(installDate)
          twelveMonths.setMonth(twelveMonths.getMonth() + 12)
          const endDate = new Date(twelveMonths)
          endDate.setMonth(endDate.getMonth() + 1)

          await db.prepare(
            `INSERT INTO maintenance_contracts (client_id, client_name, client_phone, order_id, plan_type, plan_price, start_date, end_date, status, total_visits, completed_visits, next_visit_date, notes)
             VALUES (?, ?, ?, ?, 'sav_gratuit', 0, ?, ?, 'active', 2, 0, ?, ?)`
          ).bind(
            orderRow.client_id || null,
            orderRow.client_name,
            orderRow.client_phone,
            id,
            now,
            endDate.toISOString().split('T')[0],
            sixMonths.toISOString().split('T')[0],
            `SAV gratuit - Commande #${id} - 2 visites (6 et 12 mois après installation)`
          ).run()

          const contract = await db.prepare('SELECT id FROM maintenance_contracts WHERE order_id = ? ORDER BY id DESC LIMIT 1').bind(id).first() as any
          if (contract) {
            await db.prepare(
              `INSERT INTO maintenance_visits (contract_id, client_id, client_name, client_phone, visit_type, visit_date, status, description)
               VALUES (?, ?, ?, ?, 'preventive', ?, 'planifiee', 'Visite SAV gratuit - 6 mois après installation')`
            ).bind(contract.id, orderRow.client_id || 0, orderRow.client_name, orderRow.client_phone, sixMonths.toISOString().split('T')[0]).run()
            await db.prepare(
              `INSERT INTO maintenance_visits (contract_id, client_id, client_name, client_phone, visit_type, visit_date, status, description)
               VALUES (?, ?, ?, ?, 'preventive', ?, 'planifiee', 'Visite SAV gratuit - 12 mois après installation')`
            ).bind(contract.id, orderRow.client_id || 0, orderRow.client_name, orderRow.client_phone, twelveMonths.toISOString().split('T')[0]).run()
          }

          await notifyAdmin(c.env, 'maintenance', `SAV gratuit créé pour commande #${id} — ${orderRow.client_name} (${orderRow.client_phone}) — 2 visites planifiées`)
        }
      } catch (e) {
        console.error('Erreur création SAV gratuit:', e)
      }
    }
  }

  return c.json({ success: true })
})

// ============================================================
// CRON API : Maintenance reminder notifications
// Call daily via: GET /api/cron/maintenance-reminders?key=ADMIN_SECRET
// Use cron-job.org or GitHub Actions to call this daily at 07:00 UTC
// ============================================================

app.get('/api/cron/maintenance-reminders', async (c) => {
  const env = c.env as HonoEnv['Bindings']
  // Auth: require ADMIN_SECRET or custom cron key
  const key = c.req.query('key') || ''
  if (!env.ADMIN_SECRET) return c.json({ error: 'Cron endpoint non configuré (ADMIN_SECRET manquant)' }, 500)
  if (key !== env.ADMIN_SECRET) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    await handleScheduled(env)
    return c.json({ ok: true, message: 'Maintenance reminders processed' })
  } catch (e: any) {
    console.error('[CRON API] Error:', e)
    return c.json({ error: 'Internal error', details: e.message }, 500)
  }
})

// ============================================================
// 404
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
          <div class="text-6xl mb-6">⚠️</div>
          <h1 class="text-2xl font-bold text-gray-900 mb-3">Erreur serveur</h1>
          <p class="text-gray-500 mb-8">Une erreur inattendue s'est produite. Veuillez réessayer.</p>
          <a href="/" class="bg-blue-600 text-white font-semibold px-8 py-3 rounded-xl hover:bg-blue-700 transition-colors inline-flex items-center space-x-2">
            <span>Retour à l'accueil</span>
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
          <div class="text-6xl mb-6">❄️</div>
          <h1 class="text-2xl font-bold text-gray-900 mb-3">Page introuvable</h1>
          <p class="text-gray-500 mb-8">Cette page n'existe pas ou a été déplacée.</p>
          <a href="/" class="bg-blue-600 text-white font-semibold px-8 py-3 rounded-xl hover:bg-blue-700 transition-colors inline-flex items-center space-x-2">
            <span>Retour à l'accueil</span>
          </a>
        </div>
      </body>
    </html>,
    404
  )
})

// ============================================================
// CRON : Daily maintenance visit reminders (email + Telegram)
// Runs at 07:00 UTC (08:00 Ouagadougou) every day
// ============================================================

async function sendMaintenanceEmail(apiKey: string, toEmail: string, toName: string, subject: string, htmlContent: string): Promise<boolean> {
  if (!apiKey) return false
  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': apiKey, 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        sender: { name: 'MAASGA', email: 'maasgabf@gmail.com' },
        to: [{ email: toEmail, name: toName }],
        subject,
        htmlContent
      })
    })
    return res.ok
  } catch { return false }
}

function buildMaintenanceReminderHtml(clientName: string, visitDate: string, planType: string, isToday: boolean): string {
  const fmtD = (() => { try { return new Date(visitDate).toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric' }) } catch { return visitDate } })()
  const urgencyColor = isToday ? '#ef4444' : '#f59e0b'
  const urgencyText = isToday ? "aujourd'hui" : 'demain'
  const planLabels: Record<string,string> = { trimestriel: 'Trimestriel', semestriel: 'Semestriel', annuel: 'Annuel Premium' }
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f8fafc;">
<div style="max-width:560px;margin:40px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
  <div style="background:linear-gradient(135deg,#03045e,#0077b6);padding:32px;text-align:center;">
    <div style="font-size:28px;font-weight:800;color:white;">MAASGA &#10052;</div>
    <div style="font-size:13px;color:rgba(255,255,255,0.8);margin-top:4px;">Rappel de maintenance</div>
  </div>
  <div style="padding:32px;">
    <div style="text-align:center;margin-bottom:24px;">
      <div style="display:inline-block;background:${urgencyColor}15;border:2px solid ${urgencyColor}30;border-radius:16px;padding:16px 32px;">
        <div style="font-size:32px;font-weight:900;color:${urgencyColor};">🔔</div>
        <div style="font-size:18px;font-weight:800;color:${urgencyColor};margin-top:4px;">Maintenance ${urgencyText} !</div>
      </div>
    </div>
    <h2 style="font-size:18px;font-weight:700;color:#03045e;margin:0 0 16px;">Bonjour ${clientName},</h2>
    <p style="font-size:14px;color:#475569;line-height:1.7;margin:0 0 20px;">
      Nous vous rappelons que votre visite de maintenance préventive est prévue <strong style="color:${urgencyColor};">${urgencyText}</strong>.
    </p>
    <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:12px;padding:20px;margin-bottom:24px;">
      <table style="width:100%;font-size:14px;color:#334155;">
        <tr><td style="padding:6px 0;font-weight:600;">📅 Date</td><td style="padding:6px 0;">${fmtD}</td></tr>
        <tr><td style="padding:6px 0;font-weight:600;">📋 Contrat</td><td style="padding:6px 0;">${planLabels[planType] || planType}</td></tr>
        <tr><td style="padding:6px 0;font-weight:600;">🔧 Type</td><td style="padding:6px 0;">Visite préventive</td></tr>
      </table>
    </div>
    <p style="font-size:13px;color:#64748b;line-height:1.6;margin:0 0 20px;">
      Merci de vous assurer que l'accès à vos équipements est possible. En cas d'empêchement, contactez-nous au plus vite.
    </p>
    <div style="text-align:center;">
      <a href="https://wa.me/22655996418?text=Bonjour%20MAASGA%2C%20concernant%20ma%20maintenance%20du%20${encodeURIComponent(fmtD)}" style="display:inline-block;background:#25d366;color:white;font-weight:700;font-size:14px;padding:12px 28px;border-radius:10px;text-decoration:none;">
        <span style="margin-right:6px;">📱</span>Contacter via WhatsApp
      </a>
    </div>
    <div style="margin-top:24px;padding-top:20px;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8;text-align:center;">
      MAASGA — Froid &amp; Climatisation - Ouagadougou, Burkina Faso<br>
      Tel: +226 55 99 64 18 - maasgabf@gmail.com
    </div>
  </div>
</div>
</body></html>`
}

async function handleScheduled(env: HonoEnv['Bindings']) {
  const db = env.DB
  if (!db) return

  const now = new Date()
  const todayStr = now.toISOString().split('T')[0]
  const tomorrowObj = new Date(now)
  tomorrowObj.setDate(tomorrowObj.getDate() + 1)
  const tomorrowStr = tomorrowObj.toISOString().split('T')[0]

  // Find visits due today or tomorrow that are still scheduled
  const { results: dueVisits } = await db.prepare(
    `SELECT mv.id, mv.contract_id, mv.client_id, mv.client_name, mv.client_phone, mv.visit_date,
            mc.plan_type, mc.client_name as contract_client_name
     FROM maintenance_visits mv
     LEFT JOIN maintenance_contracts mc ON mc.id = mv.contract_id
     WHERE mv.status IN ('planifiee', 'confirmee')
       AND (mv.visit_date = ? OR mv.visit_date = ?)
     ORDER BY mv.visit_date`
  ).bind(todayStr, tomorrowStr).all()

  if (!dueVisits || dueVisits.length === 0) return

  for (const visit of dueVisits as any[]) {
    const isToday = visit.visit_date === todayStr
    const clientName = visit.client_name || visit.contract_client_name || 'Client'
    const planType = visit.plan_type || 'trimestriel'
    const label = isToday ? "AUJOURD'HUI" : 'DEMAIN'

    // 1. Send email to client (get email from clients table)
    if (env.BREVO_API_KEY && visit.client_id) {
      try {
        const client = await db.prepare('SELECT email, name FROM clients WHERE id = ?').bind(visit.client_id).first() as any
        if (client?.email) {
          await sendMaintenanceEmail(
            env.BREVO_API_KEY,
            client.email,
            client.name || clientName,
            `🔔 Rappel : Maintenance ${label} — MAASGA`,
            buildMaintenanceReminderHtml(client.name || clientName, visit.visit_date, planType, isToday)
          )
        }
      } catch (e) { console.error('[CRON] Email client error:', e) }
    }

    // 2. Send email to admin
    if (env.BREVO_API_KEY && env.ADMIN_EMAIL) {
      try {
        await sendMaintenanceEmail(
          env.BREVO_API_KEY,
          env.ADMIN_EMAIL,
          'Admin MAASGA',
          `🔧 [ADMIN] Maintenance ${label} — ${clientName}`,
          buildMaintenanceReminderHtml(clientName, visit.visit_date, planType, isToday)
        )
      } catch (e) { console.error('[CRON] Email admin error:', e) }
    }

    // 3. Telegram notification to admin
    if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
      try {
        await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: env.TELEGRAM_CHAT_ID,
            text: `🔔 *RAPPEL MAINTENANCE — ${label}*\n\n👤 Client: ${clientName}\n📱 Tél: ${visit.client_phone || '—'}\n📅 Date: ${visit.visit_date}\n📋 Contrat: ${planType}\n\n${isToday ? '⚠️ La visite est prévue AUJOURD\'HUI !' : '📌 La visite est prévue DEMAIN.'}`,
            parse_mode: 'Markdown'
          })
        })
      } catch(e) { console.error('[CRON] Telegram error:', e) }
    }

    // 4. Store notification in D1
    try {
      await ensureNotificationsTable(db)
      await db.prepare(
        'INSERT INTO admin_notifications (type, summary) VALUES (?, ?)'
      ).bind('maintenance', `🔔 Rappel maintenance ${label}: ${clientName} (${visit.visit_date}) — Contrat ${planType}`).run()
    } catch(_) {}
  }

  console.log(`[CRON] Processed ${dueVisits.length} maintenance reminder(s)`)
}

// ============================================================
// TELEGRAM BOT WEBHOOK — Admin control commands
// ============================================================

// sendTelegramMessage imported from ./utils/notifications

// Endpoint to setup/verify webhook (call once after deployment — admin only)
app.get('/api/telegram/setup', adminAuth, async (c) => {
  const env = c.env
  if (!env.TELEGRAM_BOT_TOKEN) {
    return c.json({ ok: false, error: 'TELEGRAM_BOT_TOKEN not configured' }, 500)
  }
  
  // Get the base URL from request
  const url = new URL(c.req.url)
  const webhookUrl = `${url.origin}/api/telegram/webhook`
  
  try {
    // Set the webhook URL with Telegram
    const setRes = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ['message', 'callback_query']
      })
    })
    const setData = await setRes.json() as any
    
    // Get webhook info to verify
    const infoRes = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/getWebhookInfo`)
    const infoData = await infoRes.json() as any
    
    // Also set bot commands for menu
    await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/setMyCommands`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        commands: [
          { command: 'stats', description: 'Tableau de bord complet' },
          { command: 'rdv', description: 'RDV a venir' },
          { command: 'commandes', description: 'Commandes recentes' },
          { command: 'devis', description: 'Devis en attente' },
          { command: 'paiements', description: 'Paiements recents' },
          { command: 'messages', description: 'Messages non lus' },
          { command: 'contrats', description: 'Contrats maintenance actifs' },
          { command: 'visites', description: 'Prochaines visites maintenance' },
          { command: 'sav', description: 'Tickets SAV ouverts' },
          { command: 'avis', description: 'Avis clients en attente' },
          { command: 'stock', description: 'Etat du stock produits' },
          { command: 'clients', description: 'Derniers clients inscrits' },
          { command: 'client', description: 'Rechercher un client ex: /client Jean' },
          { command: 'recherche', description: 'Chercher produit ex: /recherche LG 18000' },
          { command: 'convertir', description: 'Convertir CV en BTU ex: /convertir 2' },
          { command: 'confirmer', description: 'Confirmer un RDV ex: /confirmer 3' },
          { command: 'annuler', description: 'Annuler un RDV ex: /annuler 3' },
          { command: 'terminer', description: 'Marquer RDV termine ex: /terminer 3' },
          { command: 'valider', description: 'Valider visite maintenance ex: /valider 5' },
          { command: 'approuver', description: 'Approuver un avis ex: /approuver 7' },
          { command: 'stock_update', description: 'Modifier stock ex: /stock_update 3 10' },
          { command: 'backup', description: 'Resume base de donnees' },
          { command: 'help', description: 'Aide et menu complet' }
        ]
      })
    })
    
    return c.json({
      ok: true,
      webhook_set: setData,
      webhook_info: infoData?.result,
      message: 'Webhook configuré ! Envoyez /start à votre bot.'
    })
  } catch (err: any) {
    return c.json({ ok: false, error: err.message }, 500)
  }
})

app.post('/api/telegram/webhook', async (c) => {
  const env = c.env
  if (!env.TELEGRAM_BOT_TOKEN) {
    return c.json({ ok: false, error: 'TELEGRAM_BOT_TOKEN not configured' }, 500)
  }

  let update: any
  try { update = await c.req.json() } catch { return c.json({ ok: true }) }

  const db = env.DB as any
  const token = env.TELEGRAM_BOT_TOKEN

  // Handle callback queries (inline button clicks)
  if (update.callback_query) {
    const cbq = update.callback_query
    const chatId = String(cbq.message?.chat?.id || cbq.from?.id)
    const data = cbq.data || ''
    
    // Verify admin
    if (env.TELEGRAM_CHAT_ID && chatId !== env.TELEGRAM_CHAT_ID) {
      return c.json({ ok: true })
    }

    // Answer callback to remove loading state
    await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callback_query_id: cbq.id })
    })

    try {
      // Parse callback data: action:type:id
      const [action, type, id] = data.split(':')
      
      if (action === 'confirm' && type === 'rdv' && db) {
        await db.prepare(`UPDATE appointments SET status='confirmed' WHERE id=?`).bind(parseInt(id)).run()
        await sendTelegramMessage(token, chatId, `✅ RDV #${id} confirmé !`)
      } else if (action === 'cancel' && type === 'rdv' && db) {
        await db.prepare(`UPDATE appointments SET status='cancelled' WHERE id=?`).bind(parseInt(id)).run()
        await sendTelegramMessage(token, chatId, `❌ RDV #${id} annulé.`)
      } else if (action === 'done' && type === 'rdv' && db) {
        await db.prepare(`UPDATE appointments SET status='done' WHERE id=?`).bind(parseInt(id)).run()
        await sendTelegramMessage(token, chatId, `☑️ RDV #${id} marqué terminé.`)
      } else if (action === 'validate' && type === 'order' && db) {
        await db.prepare(`UPDATE orders SET status='livre', delivered_at=datetime('now') WHERE id=?`).bind(parseInt(id)).run()
        await sendTelegramMessage(token, chatId, `✅ Commande #${id} livrée !`)
      } else if (action === 'cancel' && type === 'order' && db) {
        await db.prepare(`UPDATE orders SET status='cancelled' WHERE id=?`).bind(parseInt(id)).run()
        await sendTelegramMessage(token, chatId, `❌ Commande #${id} annulée.`)
      } else if (action === 'installed' && type === 'order' && db) {
        await db.prepare(`UPDATE orders SET status='installed' WHERE id=?`).bind(parseInt(id)).run()
        await sendTelegramMessage(token, chatId, `📦 Commande #${id} installée !`)
      } else if (action === 'complete' && type === 'visit' && db) {
        await db.prepare(`UPDATE maintenance_visits SET status='completed', completed_at=datetime('now') WHERE id=?`).bind(parseInt(id)).run()
        await sendTelegramMessage(token, chatId, `✅ Visite #${id} complétée !`)
      } else if (action === 'read' && type === 'msg' && db) {
        await db.prepare(`UPDATE contact_messages SET is_read=1 WHERE id=?`).bind(parseInt(id)).run()
        await sendTelegramMessage(token, chatId, `📖 Message #${id} marqué lu.`)
      } else if (action === 'resolve' && type === 'sav' && db) {
        await db.prepare(`UPDATE sav_tickets SET status='resolved', updated_at=datetime('now') WHERE id=?`).bind(parseInt(id)).run()
        await sendTelegramMessage(token, chatId, `✅ Ticket SAV #${id} résolu !`)
      } else if (action === 'approve' && type === 'review' && db) {
        await db.prepare(`UPDATE reviews SET approved=1 WHERE id=?`).bind(parseInt(id)).run()
        await sendTelegramMessage(token, chatId, `✅ Avis #${id} approuvé et publié !`)
      } else if (action === 'reject' && type === 'review' && db) {
        await db.prepare(`DELETE FROM reviews WHERE id=?`).bind(parseInt(id)).run()
        await sendTelegramMessage(token, chatId, `🗑️ Avis #${id} supprimé.`)
      } else if (action === 'menu') {
        // Show main menu
        await sendTelegramMessage(token, chatId, 
          `🏠 *Menu Principal MAASGA*\n\nChoisissez une section :`,
          { inline_keyboard: [
            [{ text: '📊 Dashboard', callback_data: 'show:stats' }, { text: '📆 RDV', callback_data: 'show:rdv' }],
            [{ text: '🛒 Commandes', callback_data: 'show:orders' }, { text: '📄 Devis', callback_data: 'show:devis' }],
            [{ text: '📋 Contrats', callback_data: 'show:contracts' }, { text: '📅 Visites', callback_data: 'show:visits' }],
            [{ text: '💬 Messages', callback_data: 'show:messages' }, { text: '💳 Paiements', callback_data: 'show:payments' }],
            [{ text: '🎧 SAV', callback_data: 'show:sav' }, { text: '⭐ Avis', callback_data: 'show:avis' }],
            [{ text: '👤 Clients', callback_data: 'show:clients' }, { text: '📦 Stock', callback_data: 'show:stock' }]
          ]}
        )
      } else if (action === 'search' && db) {
        // search:BTU:brand (from /convertir button)
        const btuFilter = parseInt(type) || 0
        const brandFilter = id || ''
        let sql = `SELECT id, name, brand, btu, price, stock, energy_class, inverter FROM products WHERE available = 1`
        const bindings: any[] = []
        if (btuFilter) { sql += ` AND btu = ?`; bindings.push(btuFilter) }
        if (brandFilter) { sql += ` AND brand = ?`; bindings.push(brandFilter.toUpperCase()) }
        sql += ` ORDER BY brand ASC, btu ASC LIMIT 10`
        let stmt = db.prepare(sql)
        if (bindings.length) stmt = stmt.bind(...bindings)
        const rows = await stmt.all()
        if (!rows.results?.length) {
          await sendTelegramMessage(token, chatId, `🔍 Aucun produit disponible pour ${btuFilter ? btuFilter.toLocaleString() + ' BTU' : ''}.`)
        } else {
          let txt = `🔍 *Produits ${btuFilter ? btuFilter.toLocaleString() + ' BTU' : ''}*\n\n`
          for (const p of rows.results as any[]) {
            const stk = p.stock <= 0 ? '🔴 Rupture' : p.stock <= 2 ? `🟡 ${p.stock} rest.` : `🟢 ${p.stock} en stock`
            txt += `*${p.brand}* — ${(p.btu || 0).toLocaleString()} BTU\n   💰 ${(p.price || 0).toLocaleString()} FCFA | ${p.inverter ? '⚡ Inverter' : 'Standard'} | ${stk}\n\n`
          }
          await sendTelegramMessage(token, chatId, txt, { inline_keyboard: [[{ text: '📦 Tout le stock', callback_data: 'show:stock' }]] })
        }
        return c.json({ ok: true })
      } else if (action === 'show') {
        // Redirect to command handler
        const cmdMap: Record<string, string> = { stats: '/stats', rdv: '/rdv', orders: '/commandes', devis: '/devis', contracts: '/contrats', visits: '/visites', messages: '/messages', stock: '/stock', payments: '/paiements', sav: '/sav', avis: '/avis', clients: '/clients' }
        if (cmdMap[type]) {
          // Simulate command
          update = { message: { chat: { id: chatId }, text: cmdMap[type] } }
          // Fall through to message handler below
        }
      } else if (action === 'detail' && type === 'rdv' && db) {
        const rdv = await db.prepare(`SELECT * FROM appointments WHERE id=?`).bind(parseInt(id)).first()
        if (rdv) {
          const stMap: Record<string, string> = { pending: '⏳ En attente', confirmed: '✅ Confirmé', done: '☑️ Terminé', cancelled: '❌ Annulé' }
          await sendTelegramMessage(token, chatId,
            `📆 *RDV #${rdv.id}*\n\n` +
            `👤 *${rdv.name}*\n` +
            `📱 ${rdv.phone}\n` +
            `📅 ${rdv.date} | ${rdv.heure_debut || '—'}–${rdv.heure_fin || '—'}\n` +
            `📍 ${rdv.quartier || '—'}\n` +
            `🏷️ ${rdv.type || 'standard'}\n` +
            `📊 ${stMap[rdv.status] || rdv.status}\n` +
            (rdv.notes ? `\n📝 ${rdv.notes}` : ''),
            { inline_keyboard: [
              [
                { text: '✅ Confirmer', callback_data: `confirm:rdv:${id}` },
                { text: '☑️ Terminer', callback_data: `done:rdv:${id}` },
                { text: '❌ Annuler', callback_data: `cancel:rdv:${id}` }
              ],
              [
                { text: `📱 Appeler`, url: `tel:${rdv.phone}` },
                { text: `💬 WhatsApp`, url: `https://wa.me/${(rdv.phone || '').replace(/\D/g, '')}` }
              ],
              [{ text: '« Retour RDV', callback_data: 'show:rdv' }]
            ]}
          )
        }
        return c.json({ ok: true })
      } else if (action === 'detail' && type === 'order' && db) {
        const o = await db.prepare(`SELECT o.*, c.name as client FROM orders o LEFT JOIN clients c ON o.client_id=c.id WHERE o.id=?`).bind(parseInt(id)).first()
        if (o) {
          const stMap: Record<string, string> = { pending: '⏳ En attente', paid: '💰 Payée', livre: '🚚 Livrée', validation_terrain: '🔍 Validation', devis_en_attente: '📄 Devis envoyé', devis_valide: '✅ Devis accepté', installed: '📦 Installé', cancelled: '❌ Annulé' }
          await sendTelegramMessage(token, chatId,
            `🛒 *Commande #${o.id}*\n\n` +
            `👤 *${o.client || o.client_name || 'Anonyme'}*\n` +
            `📱 ${o.client_phone || '—'}\n` +
            `💰 ${(o.total_price || 0).toLocaleString()} FCFA\n` +
            `📦 Produit: ${o.product_name || '—'} × ${o.quantity || 1}\n` +
            `📊 ${stMap[o.status] || o.status}\n` +
            `📅 ${(o.created_at || '').slice(0, 10)}`,
            { inline_keyboard: [
              [
                { text: '🚚 Livrée', callback_data: `validate:order:${id}` },
                { text: '📦 Installé', callback_data: `installed:order:${id}` },
                { text: '❌ Annuler', callback_data: `cancel:order:${id}` }
              ],
              o.client_phone ? [{ text: `📱 Appeler`, url: `tel:${o.client_phone}` }, { text: `💬 WhatsApp`, url: `https://wa.me/${(o.client_phone || '').replace(/\D/g, '')}` }] : [],
              [{ text: '« Retour Commandes', callback_data: 'show:orders' }]
            ].filter(r => r.length > 0)}
          )
        }
        return c.json({ ok: true })
      }
    } catch (err: any) {
      console.error('[TELEGRAM CB]', err)
      await sendTelegramMessage(token, chatId, `❌ Erreur: ${err.message}`)
    }
    
    // If not a 'show:' action that needs to fall through
    if (!data.startsWith('show:')) return c.json({ ok: true })
  }

  const msg = update?.message
  if (!msg?.text) return c.json({ ok: true })

  const chatId = String(msg.chat.id)

  // If TELEGRAM_CHAT_ID is set, only allow that specific admin chat
  if (env.TELEGRAM_CHAT_ID && chatId !== env.TELEGRAM_CHAT_ID) {
    return c.json({ ok: true })
  }

  const text = msg.text.trim()
  const cmd = text.split(/\s+/)[0].toLowerCase().replace(/@\w+$/, '')
  const args = text.split(/\s+/).slice(1)

  async function reply(text: string, keyboard?: any) {
    await sendTelegramMessage(token, chatId, text, keyboard)
  }

  try {
    switch (cmd) {
      // ---- /start or /help ----
      case '/start':
      case '/help': {
        await reply(
          `🤖 *MAASGA Bot Admin*\n\n` +
          `━━━ 📊 TABLEAU DE BORD ━━━\n` +
          `/stats — Tableau de bord complet\n` +
          `/clients — Derniers clients inscrits\n\n` +
          `━━━ 📆 RDV ━━━\n` +
          `/rdv — Rendez-vous à venir\n` +
          `/confirmer <id> — Confirmer un RDV\n` +
          `/terminer <id> — Marquer terminé\n` +
          `/annuler <id> — Annuler un RDV\n\n` +
          `━━━ 🛒 COMMANDES & DEVIS ━━━\n` +
          `/commandes — Commandes récentes\n` +
          `/devis — Devis en attente\n` +
          `/paiements — Paiements récents\n\n` +
          `━━━ 🔧 MAINTENANCE ━━━\n` +
          `/contrats — Contrats actifs\n` +
          `/visites — Prochaines visites\n` +
          `/valider <id> — Valider une visite\n\n` +
          `━━━ 🎧 SAV & AVIS ━━━\n` +
          `/sav — Tickets SAV ouverts\n` +
          `/avis — Avis en attente d'approbation\n` +
          `/approuver <id> — Approuver un avis\n\n` +
          `━━━ 💬 MESSAGES ━━━\n` +
          `/messages — Messages non lus\n\n` +
          `━━━ 📦 PRODUITS ━━━\n` +
          `/stock — État du stock\n` +
          `/stock_update <id> <qté> — Modifier stock\n` +
          `/recherche [marque] [BTU] — Chercher produit\n` +
          `/convertir <cv> — CV vers BTU\n\n` +
          `━━━ 🗃️ SYSTÈME ━━━\n` +
          `/client <nom> — Rechercher client\n` +
          `/backup — Résumé base de données\n\n` +
          `💡 *Actions rapides :*`,
          { inline_keyboard: [
            [{ text: '📊 Dashboard', callback_data: 'show:stats' }, { text: '📆 RDV', callback_data: 'show:rdv' }],
            [{ text: '🛒 Commandes', callback_data: 'show:orders' }, { text: '📄 Devis', callback_data: 'show:devis' }],
            [{ text: '📋 Contrats', callback_data: 'show:contracts' }, { text: '📅 Visites', callback_data: 'show:visits' }],
            [{ text: '💬 Messages', callback_data: 'show:messages' }, { text: '💳 Paiements', callback_data: 'show:payments' }],
            [{ text: '🎧 SAV', callback_data: 'show:sav' }, { text: '⭐ Avis', callback_data: 'show:avis' }],
            [{ text: '👤 Clients', callback_data: 'show:clients' }, { text: '📦 Stock', callback_data: 'show:stock' }]
          ]}
        )
        break
      }

      // ---- /stats ----
      case '/stats': {
        if (!db) { await reply('❌ Base de données indisponible'); break }
        const [contracts, visits, rdvs, orders, devis, contacts, products] = await Promise.all([
          db.prepare(`SELECT COUNT(*) as c FROM maintenance_contracts WHERE status='active'`).first(),
          db.prepare(`SELECT COUNT(*) as c FROM maintenance_visits WHERE status='scheduled' AND visit_date >= date('now')`).first(),
          db.prepare(`SELECT COUNT(*) as c FROM appointments WHERE date >= date('now') AND status != 'cancelled'`).first(),
          db.prepare(`SELECT COUNT(*) as c FROM orders WHERE status='pending'`).first(),
          db.prepare(`SELECT COUNT(*) as c FROM devis WHERE status='sent'`).first(),
          db.prepare(`SELECT COUNT(*) as c FROM contact_messages WHERE is_read=0`).first(),
          db.prepare(`SELECT COUNT(*) as c, SUM(CASE WHEN stock <= 2 THEN 1 ELSE 0 END) as low FROM products`).first(),
        ])
        await reply(
          `📊 *Tableau de bord MAASGA*\n\n` +
          `📆 RDV à venir: *${rdvs?.c || 0}*\n` +
          `🛒 Commandes en attente: *${orders?.c || 0}*\n` +
          `📄 Devis envoyés: *${devis?.c || 0}*\n` +
          `💬 Messages non lus: *${contacts?.c || 0}*\n` +
          `🔧 Contrats actifs: *${contracts?.c || 0}*\n` +
          `📅 Visites à venir: *${visits?.c || 0}*\n` +
          `📦 Produits stock bas: *${products?.low || 0}*`,
          { inline_keyboard: [
            [{ text: '📆 Voir RDV', callback_data: 'show:rdv' }, { text: '🛒 Commandes', callback_data: 'show:orders' }],
            [{ text: '💬 Messages', callback_data: 'show:messages' }, { text: '💳 Paiements', callback_data: 'show:payments' }],
            [{ text: '🎧 SAV', callback_data: 'show:sav' }, { text: '⭐ Avis', callback_data: 'show:avis' }],
            [{ text: '👤 Clients', callback_data: 'show:clients' }, { text: '📦 Stock', callback_data: 'show:stock' }],
            [{ text: '🔄 Actualiser', callback_data: 'show:stats' }]
          ]}
        )
        break
      }

      // ---- /stock ----
      case '/stock': {
        if (!db) { await reply('❌ Base de données indisponible'); break }
        const rows = await db.prepare(
          `SELECT id, name, stock, price FROM products ORDER BY stock ASC LIMIT 15`
        ).all()
        if (!rows.results?.length) { await reply('Aucun produit.'); break }
        let txt = `📦 *État du Stock*\n\n`
        for (const p of rows.results as any[]) {
          const icon = p.stock <= 0 ? '🔴' : p.stock <= 2 ? '🟡' : '🟢'
          txt += `${icon} *${p.name}*\n   Stock: ${p.stock} | ${(p.price || 0).toLocaleString()} FCFA\n\n`
        }
        await reply(txt, { inline_keyboard: [[{ text: '🔄 Actualiser', callback_data: 'show:stock' }]] })
        break
      }

      // ---- /contrats ----
      case '/contrats': {
        if (!db) { await reply('❌ Base de données indisponible'); break }
        const rows = await db.prepare(
          `SELECT mc.id, mc.plan_type, mc.status, mc.start_date, mc.end_date, c.name as client
           FROM maintenance_contracts mc
           JOIN clients c ON mc.client_id = c.id
           WHERE mc.status = 'active'
           ORDER BY mc.start_date DESC LIMIT 10`
        ).all()
        if (!rows.results?.length) { await reply('Aucun contrat actif.'); break }
        let txt = `📋 *Contrats maintenance actifs*\n\n`
        for (const r of rows.results as any[]) {
          const plan = r.plan_type === 'trimestriel' ? '3×/an' : r.plan_type === 'semestriel' ? '2×/an' : '1×/an'
          txt += `#${r.id} — *${r.client}*\n   ${r.plan_type} (${plan}) | ${r.start_date} → ${r.end_date}\n\n`
        }
        await reply(txt, { inline_keyboard: [[{ text: '📅 Visites', callback_data: 'show:visits' }, { text: '🔄 Actualiser', callback_data: 'show:contracts' }]] })
        break
      }

      // ---- /visites ----
      case '/visites': {
        if (!db) { await reply('❌ Base de données indisponible'); break }
        const rows = await db.prepare(
          `SELECT mv.id, mv.visit_date, mv.status, c.name as client, c.phone as client_phone, mc.plan_type
           FROM maintenance_visits mv
           JOIN maintenance_contracts mc ON mv.contract_id = mc.id
           JOIN clients c ON mc.client_id = c.id
           WHERE mv.status = 'scheduled' AND mv.visit_date >= date('now')
           ORDER BY mv.visit_date ASC LIMIT 10`
        ).all()
        if (!rows.results?.length) { await reply('Aucune visite à venir.'); break }
        let txt = `📅 *Prochaines visites maintenance*\n\n`
        const buttons: any[] = []
        for (const r of rows.results as any[]) {
          txt += `🔹 #${r.id} — *${r.client}*\n   📆 ${r.visit_date} | ${r.plan_type}\n   📱 ${r.client_phone || '—'}\n\n`
          buttons.push([{ text: `✅ Valider #${r.id}`, callback_data: `complete:visit:${r.id}` }])
        }
        buttons.push([{ text: '🔄 Actualiser', callback_data: 'show:visits' }])
        await reply(txt, { inline_keyboard: buttons.slice(0, 6) })
        break
      }

      // ---- /valider <id> ----
      case '/valider': {
        if (!db) { await reply('❌ Base de données indisponible'); break }
        const visitId = parseInt(args[0])
        if (!visitId) { await reply('⚠️ Usage: /valider <id\\_visite>'); break }
        const visit = await db.prepare(
          `SELECT mv.*, c.name as client_name FROM maintenance_visits mv
           JOIN maintenance_contracts mc ON mv.contract_id = mc.id
           JOIN clients c ON mc.client_id = c.id
           WHERE mv.id = ?`
        ).bind(visitId).first() as any
        if (!visit) { await reply(`❌ Visite #${visitId} introuvable.`); break }
        if (visit.status === 'completed') { await reply(`✅ Visite #${visitId} est déjà complétée.`); break }
        await db.prepare(
          `UPDATE maintenance_visits SET status='completed', completed_at=datetime('now'), notes='Validée via Telegram Bot' WHERE id=?`
        ).bind(visitId).run()
        await reply(
          `✅ *Visite #${visitId} validée !*\n\n` +
          `👤 Client: ${visit.client_name}\n` +
          `📅 Date prévue: ${visit.visit_date}\n` +
          `🕐 Complétée: ${new Date().toISOString().replace('T', ' ').slice(0, 16)}`
        )
        break
      }

      // ---- /rdv ----
      case '/rdv': {
        if (!db) { await reply('❌ Base de données indisponible'); break }
        const today = new Date().toISOString().split('T')[0]
        const rows = await db.prepare(
          `SELECT id, name, phone, date, heure_debut, heure_fin, type, quartier, status FROM appointments
           WHERE date >= ? AND status != 'cancelled' ORDER BY date ASC, heure_debut ASC LIMIT 10`
        ).bind(today).all()
        if (!rows.results?.length) { await reply('Aucun RDV à venir.', { inline_keyboard: [[{ text: '🔄 Actualiser', callback_data: 'show:rdv' }]] }); break }
        let txt = `📆 *Prochains rendez-vous*\n\n`
        const buttons: any[] = []
        for (const r of rows.results as any[]) {
          const dateStr = r.date === today ? '📍 AUJOURD\'HUI' : `📅 ${r.date}`
          const horaire = r.heure_debut ? `${r.heure_debut}–${r.heure_fin || '18:00'}` : '—'
          const stIcon = r.status === 'confirmed' ? '✅' : r.status === 'done' ? '☑️' : '⏳'
          txt += `${stIcon} #${r.id} — *${r.name}*\n   ${dateStr} | ${horaire}\n   📱 ${r.phone} | 📍 ${r.quartier || '—'}\n\n`
          if (r.status === 'pending') {
            buttons.push([{ text: `👁️ #${r.id} ${r.name}`, callback_data: `detail:rdv:${r.id}` }])
          }
        }
        buttons.push([{ text: '🔄 Actualiser', callback_data: 'show:rdv' }])
        await reply(txt, { inline_keyboard: buttons.slice(0, 6) })
        break
      }

      // ---- /commandes ----
      case '/commandes': {
        if (!db) { await reply('❌ Base de données indisponible'); break }
        const rows = await db.prepare(
          `SELECT o.id, o.total_price, o.client_name, o.client_phone, o.status, o.created_at, c.name as client
           FROM orders o LEFT JOIN clients c ON o.client_id = c.id
           ORDER BY o.created_at DESC LIMIT 10`
        ).all()
        if (!rows.results?.length) { await reply('Aucune commande.', { inline_keyboard: [[{ text: '🔄 Actualiser', callback_data: 'show:orders' }]] }); break }
        let txt = `🛒 *Commandes récentes*\n\n`
        const buttons: any[] = []
        for (const r of rows.results as any[]) {
          const st = r.status === 'pending' ? '⏳' : r.status === 'paid' ? '💰' : r.status === 'livre' ? '🚚' : r.status === 'installed' ? '📦' : r.status === 'cancelled' ? '❌' : '🔄'
          const nom = r.client || r.client_name || 'Anonyme'
          txt += `${st} #${r.id} — *${nom}*\n   ${(r.total_price || 0).toLocaleString()} FCFA | ${r.status}\n\n`
          if (r.status === 'pending') {
            buttons.push([{ text: `👁️ #${r.id} ${nom}`, callback_data: `detail:order:${r.id}` }])
          }
        }
        buttons.push([{ text: '🔄 Actualiser', callback_data: 'show:orders' }])
        await reply(txt, { inline_keyboard: buttons.slice(0, 6) })
        break
      }

      // ---- /messages ----
      case '/messages': {
        if (!db) { await reply('❌ Base de données indisponible'); break }
        const rows = await db.prepare(
          `SELECT id, name, phone, email, message, created_at FROM contact_messages
           WHERE is_read = 0 ORDER BY created_at DESC LIMIT 10`
        ).all()
        if (!rows.results?.length) { await reply('✅ Aucun message non lu.', { inline_keyboard: [[{ text: '🔄 Actualiser', callback_data: 'show:messages' }]] }); break }
        let txt = `💬 *Messages non lus*\n\n`
        const buttons: any[] = []
        for (const r of rows.results as any[]) {
          txt += `🔹 #${r.id} — *${r.name}*\n   📱 ${r.phone || r.email || '—'}\n   💬 ${(r.message || '').slice(0, 80)}...\n\n`
          buttons.push([
            { text: `📖 Lu #${r.id}`, callback_data: `read:msg:${r.id}` },
            r.phone ? { text: `💬 WhatsApp`, url: `https://wa.me/${(r.phone || '').replace(/\D/g, '')}` } : { text: `📧 Email`, url: `mailto:${r.email || ''}` }
          ])
        }
        buttons.push([{ text: '🔄 Actualiser', callback_data: 'show:messages' }])
        await reply(txt, { inline_keyboard: buttons.slice(0, 8) })
        break
      }

      // ---- /devis ----
      case '/devis': {
        if (!db) { await reply('❌ Base de données indisponible'); break }
        const rows = await db.prepare(
          `SELECT id, numero, client_name, total_ht, status, created_at, expires_at FROM devis
           WHERE status IN ('sent','draft') ORDER BY created_at DESC LIMIT 10`
        ).all()
        if (!rows.results?.length) { await reply('Aucun devis en attente.', { inline_keyboard: [[{ text: '🔄 Actualiser', callback_data: 'show:devis' }]] }); break }
        let txt = `📄 *Devis en attente*\n\n`
        for (const r of rows.results as any[]) {
          const st = r.status === 'sent' ? '📤' : '📝'
          txt += `${st} ${r.numero} — *${r.client_name}*\n   💰 ${(r.total_ht || 0).toLocaleString()} FCFA\n   📅 Expire: ${(r.expires_at || '').slice(0, 10)}\n\n`
        }
        await reply(txt, { inline_keyboard: [[{ text: '🔄 Actualiser', callback_data: 'show:devis' }]] })
        break
      }

      // ---- /client <nom> ----
      case '/client': {
        if (!db) { await reply('❌ Base de données indisponible'); break }
        const search = args.join(' ')
        if (!search) { await reply('⚠️ Usage: /client <nom ou téléphone>'); break }
        const rows = await db.prepare(
          `SELECT id, name, phone, email, quartier FROM clients
           WHERE name LIKE ? OR phone LIKE ? LIMIT 5`
        ).bind(`%${search}%`, `%${search}%`).all()
        if (!rows.results?.length) { await reply(`🔍 Aucun client trouvé pour "${search}".`); break }
        let txt = `🔍 *Résultats pour "${search}"*\n\n`
        const buttons: any[] = []
        for (const r of rows.results as any[]) {
          txt += `👤 #${r.id} — *${r.name}*\n   📱 ${r.phone || '—'} | 📧 ${r.email || '—'}\n   📍 ${r.quartier || '—'}\n\n`
          if (r.phone) {
            buttons.push([{ text: `💬 WhatsApp ${r.name}`, url: `https://wa.me/${(r.phone || '').replace(/\D/g, '')}` }])
          }
        }
        await reply(txt, buttons.length ? { inline_keyboard: buttons.slice(0, 4) } : undefined)
        break
      }

      // ---- /confirmer <id> (RDV) ----
      case '/confirmer': {
        if (!db) { await reply('❌ Base de données indisponible'); break }
        const rdvId = parseInt(args[0])
        if (!rdvId) { await reply('⚠️ Usage: /confirmer <id\\_rdv>'); break }
        await db.prepare(`UPDATE appointments SET status='confirmed' WHERE id=?`).bind(rdvId).run()
        await reply(`✅ RDV #${rdvId} confirmé !`)
        break
      }

      // ---- /annuler <id> (RDV) ----
      case '/annuler': {
        if (!db) { await reply('❌ Base de données indisponible'); break }
        const rdvId = parseInt(args[0])
        if (!rdvId) { await reply('⚠️ Usage: /annuler <id\\_rdv>'); break }
        await db.prepare(`UPDATE appointments SET status='cancelled' WHERE id=?`).bind(rdvId).run()
        await reply(`❌ RDV #${rdvId} annulé.`)
        break
      }

      // ---- /convertir <cv> ----
      case '/convertir': {
        const CV_TO_BTU: Record<string, number> = {
          '0.75': 7000, '1': 9000, '1.5': 12000, '2': 18000,
          '2.5': 24000, '3': 24000, '3.5': 30000, '4': 36000, '5': 48000
        }
        const SURFACE: Record<number, string> = {
          7000: '≈ 7–10 m²', 9000: '≈ 9–15 m²', 12000: '≈ 15–23 m²',
          18000: '≈ 25–40 m²', 24000: '≈ 40–60 m²', 30000: '≈ 60–80 m²',
          36000: '≈ 80–100 m²', 48000: '≈ 100–130 m²'
        }
        if (!args[0]) {
          let txt = `🔄 *Conversion CV → BTU*\n\n`
          for (const [cv, btu] of Object.entries(CV_TO_BTU)) {
            txt += `*${cv} CV* = ${btu.toLocaleString()} BTU — ${SURFACE[btu] || ''}\n`
          }
          txt += `\n💡 Usage: /convertir 2`
          await reply(txt)
          break
        }
        const cv = parseFloat(args[0].replace(',', '.'))
        const key = cv.toString()
        const btu = CV_TO_BTU[key]
        if (!btu) {
          await reply(`⚠️ Valeur non reconnue: ${args[0]} CV\n\n🔢 Valeurs valides: 0.75, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5`)
          break
        }
        await reply(
          `🔄 *Conversion CV → BTU*\n\n` +
          `*${cv} CV* = *${btu.toLocaleString()} BTU*\n` +
          `📐 Surface couverte: ${SURFACE[btu] || '—'}\n\n` +
          `💡 Tapez /recherche ${btu} pour voir les produits disponibles.`,
          { inline_keyboard: [[{ text: `🔍 Voir produits ${btu} BTU`, callback_data: `search:${btu}:` }]] }
        )
        break
      }

      // ---- /recherche [marques...] [BTU...] ----
      case '/recherche': {
        if (!db) { await reply('❌ Base de données indisponible'); break }

        const KNOWN_BRANDS = ['LG', 'SAMSUNG', 'GREE', 'MIDEA', 'HAIER', 'DAIKIN', 'CARRIER', 'TOSHIBA', 'FUJITSU', 'PANASONIC', 'HISENSE']
        const CV_TO_BTU_MAP: Record<number, number> = { 1: 9000, 2: 18000, 3: 24000, 4: 36000, 5: 48000 }
        const CV_FLOAT: Record<string, number> = { '0.75': 7000, '1': 9000, '1.5': 12000, '2': 18000, '2.5': 24000, '3': 24000, '3.5': 30000, '4': 36000, '5': 48000 }

        const brands: string[] = []
        const btuValues: number[] = []

        for (const arg of args) {
          const upper = arg.toUpperCase()
          if (KNOWN_BRANDS.includes(upper)) {
            brands.push(upper)
          } else {
            const num = parseFloat(arg.replace(',', '.'))
            if (!isNaN(num)) {
              if (num >= 1000) {
                // Direct BTU value
                btuValues.push(num)
              } else {
                // CV value — convert to BTU
                const btu = CV_FLOAT[num.toString()] || Math.round(num) in CV_TO_BTU_MAP ? CV_TO_BTU_MAP[Math.round(num)] : null
                const resolved = CV_FLOAT[num.toString()] || btu
                if (resolved) btuValues.push(resolved)
              }
            }
          }
        }

        // Build SQL query dynamically
        let sql = `SELECT id, name, brand, btu, price, stock, energy_class, inverter FROM products WHERE available = 1`
        const bindings: any[] = []

        if (brands.length > 0) {
          sql += ` AND brand IN (${brands.map(() => '?').join(',')})`
          bindings.push(...brands)
        }
        if (btuValues.length > 0) {
          sql += ` AND btu IN (${btuValues.map(() => '?').join(',')})`
          bindings.push(...btuValues)
        }
        sql += ` ORDER BY brand ASC, btu ASC LIMIT 20`

        let stmt = db.prepare(sql)
        if (bindings.length > 0) stmt = stmt.bind(...bindings)
        const rows = await stmt.all()

        if (!rows.results?.length) {
          const what = [...brands, ...btuValues.map(b => `${b} BTU`)].join(', ') || 'tous produits'
          await reply(`🔍 Aucun produit disponible pour: *${what}*\n\nEssayez /stock pour voir tout le catalogue.`)
          break
        }

        const filterDesc = [
          brands.length ? `Marques: *${brands.join(', ')}*` : '',
          btuValues.length ? `BTU: *${btuValues.map(b => b.toLocaleString()).join(', ')}*` : ''
        ].filter(Boolean).join(' · ') || '*Tout le catalogue*'

        let txt = `🔍 *Recherche produits* — ${filterDesc}\n📦 ${rows.results.length} résultat(s)\n\n`
        for (const p of rows.results as any[]) {
          const stockIcon = p.stock <= 0 ? '🔴 Rupture' : p.stock <= 2 ? `🟡 ${p.stock} restant(s)` : `🟢 En stock (${p.stock})`
          const inv = p.inverter ? '⚡ Inverter' : 'Standard'
          txt += `*${p.brand}* — ${(p.btu || 0).toLocaleString()} BTU\n`
          txt += `   💰 ${(p.price || 0).toLocaleString()} FCFA | ${inv} | ${p.energy_class || '—'}\n`
          txt += `   ${stockIcon}\n\n`
        }
        await reply(txt, { inline_keyboard: [[{ text: '🔄 Tout le catalogue', callback_data: 'show:stock' }]] })
        break
      }

      // ---- /paiements ----
      case '/paiements': {
        if (!db) { await reply('❌ Base de données indisponible'); break }
        const rows = await db.prepare(
          `SELECT id, client_name, client_phone, amount, method, status, payment_type, created_at
           FROM payments ORDER BY created_at DESC LIMIT 12`
        ).all()
        if (!rows.results?.length) { await reply('Aucun paiement enregistré.'); break }
        const total = (rows.results as any[]).filter((r:any)=>r.status==='completed').reduce((s:number,r:any)=>s+(r.amount||0),0)
        let txt = `💳 *Paiements récents*
📊 Total confirmé: *${total.toLocaleString()} FCFA*

`
        for (const r of rows.results as any[]) {
          const icon = r.status==='completed'?'✅':r.status==='pending'?'⏳':r.status==='failed'?'❌':'🔄'
          txt += `${icon} #${r.id} — *${r.client_name||'?'}*\n   ${(r.amount||0).toLocaleString()} FCFA | ${r.method||'—'} | ${r.payment_type||'—'}\n\n`
        }
        await reply(txt, { inline_keyboard: [[{ text: '🔄 Actualiser', callback_data: 'show:payments' }]] })
        break
      }

      // ---- /sav ----
      case '/sav': {
        if (!db) { await reply('❌ Base de données indisponible'); break }
        const rows = await db.prepare(
          `SELECT id, ticket_ref, subject, priority, status, client_name, client_phone, created_at
           FROM sav_tickets WHERE status NOT IN ('resolved','closed') ORDER BY created_at DESC LIMIT 10`
        ).all()
        if (!rows.results?.length) { await reply('✅ Aucun ticket SAV ouvert.'); break }
        let txt = `🎧 *Tickets SAV ouverts*\n\n`
        const buttons: any[] = []
        for (const r of rows.results as any[]) {
          const pIcon = r.priority==='urgent'?'🔴':r.priority==='high'?'🟠':r.priority==='normal'?'🟡':'⚪'
          const stIcon = r.status==='open'?'📬':r.status==='in_progress'?'🔧':'📋'
          txt += `${stIcon} ${r.ticket_ref} — *${r.client_name||'?'}*\n   ${pIcon} ${r.priority||'normal'} | ${r.subject||'—'}\n   📱 ${r.client_phone||'—'}\n\n`
          buttons.push([{ text: `✅ Résoudre ${r.ticket_ref}`, callback_data: `resolve:sav:${r.id}` }])
        }
        buttons.push([{ text: '🔄 Actualiser', callback_data: 'show:sav' }])
        await reply(txt, { inline_keyboard: buttons.slice(0,6) })
        break
      }

      // ---- /avis ----
      case '/avis': {
        if (!db) { await reply('❌ Base de données indisponible'); break }
        const rows = await db.prepare(
          `SELECT id, client_name, rating, comment, service, created_at FROM reviews WHERE approved=0 ORDER BY created_at DESC LIMIT 10`
        ).all()
        if (!rows.results?.length) { await reply('✅ Aucun avis en attente d\'approbation.'); break }
        let txt = `⭐ *Avis en attente*\n\n`
        const buttons: any[] = []
        for (const r of rows.results as any[]) {
          const stars = '⭐'.repeat(Math.min(r.rating||5,5))
          txt += `#${r.id} ${stars} — *${r.client_name||'?'}*\n   💬 ${(r.comment||'').slice(0,80)}${r.comment?.length>80?'…':''}\n\n`
          buttons.push([
            { text: `✅ Approuver #${r.id}`, callback_data: `approve:review:${r.id}` },
            { text: `❌ Rejeter #${r.id}`, callback_data: `reject:review:${r.id}` }
          ])
        }
        buttons.push([{ text: '🔄 Actualiser', callback_data: 'show:avis' }])
        await reply(txt, { inline_keyboard: buttons.slice(0,6) })
        break
      }

      // ---- /approuver <id> (avis) ----
      case '/approuver': {
        if (!db) { await reply('❌ Base de données indisponible'); break }
        const reviewId = parseInt(args[0])
        if (!reviewId) { await reply('⚠️ Usage: /approuver <id\_avis>'); break }
        await db.prepare(`UPDATE reviews SET approved=1 WHERE id=?`).bind(reviewId).run()
        await reply(`✅ Avis #${reviewId} approuvé et publié !`)
        break
      }

      // ---- /terminer <id> (RDV → done) ----
      case '/terminer': {
        if (!db) { await reply('❌ Base de données indisponible'); break }
        const rdvId = parseInt(args[0])
        if (!rdvId) { await reply('⚠️ Usage: /terminer <id\_rdv>'); break }
        const rdv = await db.prepare(`SELECT name FROM appointments WHERE id=?`).bind(rdvId).first() as any
        if (!rdv) { await reply(`❌ RDV #${rdvId} introuvable.`); break }
        await db.prepare(`UPDATE appointments SET status='done' WHERE id=?`).bind(rdvId).run()
        await reply(`☑️ RDV #${rdvId} (${rdv.name}) marqué comme *terminé* !`)
        break
      }

      // ---- /stock_update <id> <quantite> ----
      case '/stock_update': {
        if (!db) { await reply('❌ Base de données indisponible'); break }
        const prodId = parseInt(args[0])
        const qty = parseInt(args[1])
        if (!prodId || isNaN(qty)) { await reply('⚠️ Usage: /stock\_update <id\_produit> <nouvelle\_quantité>\nEx: /stock\_update 3 10'); break }
        const prod = await db.prepare(`SELECT id, name, stock FROM products WHERE id=?`).bind(prodId).first() as any
        if (!prod) { await reply(`❌ Produit #${prodId} introuvable. Tapez /stock pour voir les IDs.`); break }
        await db.prepare(`UPDATE products SET stock=?, updated_at=datetime('now') WHERE id=?`).bind(qty, prodId).run()
        await reply(`📦 Stock mis à jour !\n\n*${prod.name}*\n   Ancien stock: ${prod.stock} → Nouveau: *${qty}*`)
        break
      }

      // ---- /clients (derniers inscrits) ----
      case '/clients': {
        if (!db) { await reply('❌ Base de données indisponible'); break }
        const rows = await db.prepare(
          `SELECT id, name, phone, email, quartier, created_at FROM clients ORDER BY created_at DESC LIMIT 10`
        ).all()
        if (!rows.results?.length) { await reply('Aucun client.'); break }
        let txt = `👤 *Derniers clients inscrits*\n\n`
        for (const r of rows.results as any[]) {
          txt += `#${r.id} — *${r.name}*\n   📱 ${r.phone||'—'} | 📍 ${r.quartier||'—'}\n   📅 ${(r.created_at||'').slice(0,10)}\n\n`
        }
        const totalRes = await db.prepare(`SELECT COUNT(*) as c FROM clients`).first() as any
        txt += `📊 Total: *${totalRes?.c||0}* clients`
        await reply(txt, { inline_keyboard: [[{ text: '🔄 Actualiser', callback_data: 'show:clients' }]] })
        break
      }

      // ---- /backup ----
      case '/backup': {
        if (!db) { await reply('❌ Base de données indisponible'); break }
        const backupTables = ['products', 'clients', 'appointments', 'orders', 'reviews', 'payments', 'contact_messages', 'maintenance_contracts', 'sav_tickets', 'site_settings']
        const counts: string[] = []
        let totalRows = 0
        for (const table of backupTables) {
          try {
            const r = await db.prepare(`SELECT COUNT(*) as c FROM ${table}`).first() as { c: number } | null
            const count = r?.c || 0
            totalRows += count
            counts.push(`  ${table}: *${count}* lignes`)
          } catch (_) {
            counts.push(`  ${table}: ⚠️ erreur`)
          }
        }
        await reply(
          `💾 *Backup D1 — Résumé*\n\n` +
          `📊 Total: *${totalRows.toLocaleString()}* lignes\n` +
          `📋 Tables:\n${counts.join('\n')}\n\n` +
          `🔗 *Pour télécharger le backup JSON complet:*\n` +
          `Allez sur /admin → Paramètres → Backup\n` +
          `ou: \`/api/admin/backup\` (authentifié)`,
          { inline_keyboard: [[{ text: '📊 Dashboard', callback_data: 'show:stats' }]] }
        )
        break
      }

      default: {
        if (cmd.startsWith('/')) {
          await reply(`❓ Commande inconnue: ${cmd}\n\nTapez /help pour voir les commandes disponibles.`)
        }
      }
    }
  } catch (err: any) {
    console.error('[TELEGRAM BOT]', err)
    await reply(`❌ Erreur: ${err.message || 'interne'}`)
  }

  return c.json({ ok: true })
})

// ============================================================
// API MOBILE — JSON + Bearer tokens (Expo/React Native)
// ============================================================

const DEFAULT_MOBILE_ADMIN_HASH_INPUT = 'maasga2025'

// Simple one-way SHA-256 hash (no salt, same as mobile webapp)
async function simpleSHA256(password: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

// Generate mobile Bearer token
function generateMobileToken(payload: { id: number; name: string; role: string; phone?: string; email?: string }): string {
  const data = btoa(JSON.stringify(payload))
  const rand = Array.from(crypto.getRandomValues(new Uint8Array(16))).map(b => b.toString(16).padStart(2, '0')).join('')
  return `${data}.${rand}`
}

// Mobile auth middleware (Bearer token)
const mobileAuth = async (c: any, next: any) => {
  const auth = c.req.header('Authorization') || ''
  const token = auth.replace('Bearer ', '')
  if (!token) return c.json({ error: 'Token manquant' }, 401)
  try {
    const payload = JSON.parse(atob(token.split('.')[0] || '{}'))
    if (!payload.id && !payload.role) return c.json({ error: 'Token invalide' }, 401)
    c.set('mobileUser', payload)
    return next()
  } catch {
    return c.json({ error: 'Token invalide' }, 401)
  }
}

// Mobile admin auth middleware
const mobileAdminAuth = async (c: any, next: any) => {
  const auth = c.req.header('Authorization') || ''
  const token = auth.replace('Bearer ', '')
  if (!token) return c.json({ error: 'Token manquant' }, 401)
  try {
    const payload = JSON.parse(atob(token.split('.')[0] || '{}'))
    if (payload.role !== 'admin') return c.json({ error: 'Accès admin requis' }, 403)
    c.set('mobileUser', payload)
    return next()
  } catch {
    return c.json({ error: 'Token invalide' }, 401)
  }
}

// ── POST /api/mobile/login ────────────────────────────────────
app.post('/api/mobile/login', async (c) => {
  const body = await c.req.json()
  const identifier = (body.identifier || '').trim()
  const password = (body.password || '').trim()
  if (!identifier || !password) return c.json({ error: 'Identifiants manquants' }, 400)

  const db = c.env.DB
  let validAdminUsername = DEFAULT_ADMIN_USERNAME
  let validAdminHash = ''

  if (db) {
    try {
      const hashRow = await db.prepare('SELECT value FROM admin_settings WHERE key = ?').bind('admin_password_hash').first() as any
      if (hashRow?.value && !hashRow.value.startsWith('pbkdf2:')) validAdminHash = hashRow.value
      const userRow = await db.prepare('SELECT value FROM admin_settings WHERE key = ?').bind('admin_username').first() as any
      if (userRow?.value) validAdminUsername = userRow.value
    } catch (_) {}
  }
  if (!validAdminHash) validAdminHash = await simpleSHA256(DEFAULT_MOBILE_ADMIN_HASH_INPUT)

  const submittedHash = await simpleSHA256(password)
  if (identifier === validAdminUsername && submittedHash === validAdminHash) {
    const token = generateMobileToken({ id: 0, name: 'Admin', role: 'admin' })
    return c.json({ token, role: 'admin', user: { id: 0, name: 'Admin', role: 'admin' } })
  }

  if (db) {
    try {
      const cleanId = identifier.replace(/\s/g, '')
      const withPrefix = cleanId.startsWith('+226') ? cleanId : ('+226' + cleanId)
      const withoutPrefix = cleanId.startsWith('+226') ? cleanId.slice(4) : cleanId
      const client = await db.prepare(
        'SELECT id, name, phone, email, quartier, password_hash FROM clients WHERE phone = ? OR phone = ? OR phone = ? OR email = ?'
      ).bind(cleanId, withPrefix, withoutPrefix, identifier).first() as any

      if (client && client.password_hash && client.password_hash !== 'pending') {
        if (submittedHash === client.password_hash) {
          const token = generateMobileToken({ id: client.id, name: client.name, role: 'client', phone: client.phone, email: client.email })
          return c.json({ token, role: 'client', user: { id: client.id, name: client.name, phone: client.phone, email: client.email, quartier: client.quartier, role: 'client' } })
        }
        return c.json({ error: 'Mot de passe incorrect' }, 401)
      }

      if (client && (!client.password_hash || client.password_hash === 'pending')) {
        await db.prepare('UPDATE clients SET password_hash = ?, updated_at = ? WHERE id = ?')
          .bind(submittedHash, new Date().toISOString(), client.id).run()
        const token = generateMobileToken({ id: client.id, name: client.name, role: 'client', phone: client.phone, email: client.email })
        return c.json({ token, role: 'client', user: { id: client.id, name: client.name, phone: client.phone, email: client.email, quartier: client.quartier, role: 'client' } })
      }
    } catch (e) { console.error('Mobile login D1 error:', e) }
  }

  return c.json({ error: 'Identifiants incorrects' }, 401)
})

// ── POST /api/mobile/register ─────────────────────────────────
app.post('/api/mobile/register', async (c) => {
  const body = await c.req.json()
  const name = (body.name || '').trim()
  const phone = (body.phone || '').trim()
  const email = (body.email || '').trim()
  const quartier = (body.quartier || '').trim()
  const password = (body.password || '').trim()

  if (!name || !phone) return c.json({ error: 'Nom et téléphone obligatoires' }, 400)
  if (password.length < 6) return c.json({ error: 'Le mot de passe doit faire au moins 6 caractères' }, 400)

  const db = c.env.DB
  if (!db) return c.json({ error: 'Service indisponible' }, 503)

  try {
    const fullPhone = phone.startsWith('+226') ? phone.replace(/\s/g, '') : '+226' + phone.replace(/\s/g, '')
    const existing = await db.prepare(
      'SELECT id, password_hash FROM clients WHERE phone = ? OR phone = ?'
    ).bind(phone, fullPhone).first() as any

    if (existing && existing.password_hash && existing.password_hash !== 'pending') {
      return c.json({ error: 'Un compte existe déjà avec ce numéro. Connectez-vous.' }, 409)
    }

    const password_hash = await simpleSHA256(password)
    const now = new Date().toISOString()
    let clientId: number

    if (existing) {
      await db.prepare('UPDATE clients SET password_hash = ?, name = ?, email = ?, quartier = ?, updated_at = ? WHERE id = ?')
        .bind(password_hash, name, email || null, quartier || null, now, existing.id).run()
      clientId = existing.id
    } else {
      await db.prepare(
        'INSERT INTO clients (name, phone, email, quartier, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).bind(name, fullPhone, email || null, quartier || null, password_hash, now, now).run()
      const inserted = await db.prepare('SELECT id FROM clients WHERE phone = ?').bind(fullPhone).first() as any
      clientId = inserted?.id
    }

    if (!clientId) return c.json({ error: 'Erreur création compte' }, 500)

    const token = generateMobileToken({ id: clientId, name, role: 'client', phone: fullPhone, email })
    return c.json({ token, role: 'client', user: { id: clientId, name, phone: fullPhone, email, quartier, role: 'client' } })
  } catch (e) {
    console.error('Mobile register error:', e)
    return c.json({ error: 'Erreur inscription' }, 500)
  }
})

// ── GET /api/mobile/profile ───────────────────────────────────
app.get('/api/mobile/profile', mobileAuth, async (c) => {
  const user = c.get('mobileUser')
  if (user.role === 'admin') return c.json({ id: 0, name: 'Admin', role: 'admin' })
  const db = c.env.DB
  if (!db) return c.json({ error: 'DB indisponible' }, 503)
  const client = await db.prepare('SELECT id, name, phone, email, quartier, created_at FROM clients WHERE id = ?').bind(user.id).first()
  if (!client) return c.json({ error: 'Client introuvable' }, 404)
  return c.json({ ...client, role: 'client' })
})

// ── GET /api/mobile/products ──────────────────────────────────
app.get('/api/mobile/products', async (c) => {
  const db = c.env.DB
  let list: any[] = [...products]
  if (db) {
    try {
      const dbProducts = await getProducts(db)
      if (dbProducts.length > 0) list = dbProducts as any[]
    } catch (_) {}
  }
  list = list.filter((p: any) => p.available || p.stock > 0)
  return c.json(list)
})

// ── GET /api/mobile/products/:id ──────────────────────────────
app.get('/api/mobile/products/:id', async (c) => {
  const id = parseInt(c.req.param('id'))
  const db = c.env.DB
  let product: any = products.find((p: any) => p.id === id)
  if (db) {
    try {
      const p = await getProductById(db, id)
      if (p) product = p
    } catch (_) {}
  }
  if (!product) return c.json({ error: 'Produit non trouvé' }, 404)
  return c.json(product)
})

// ── GET /api/mobile/reviews ───────────────────────────────────
app.get('/api/mobile/reviews', async (c) => {
  const db = c.env.DB
  let list = reviews.filter((r: any) => r.approved)
  if (db) {
    try {
      const dbReviews = await getReviews(db, true)
      if (dbReviews.length > 0) list = dbReviews as any[]
    } catch (_) {}
  }
  return c.json(list)
})

// ── GET /api/mobile/quartiers ─────────────────────────────────
app.get('/api/mobile/quartiers', async (c) => {
  const db = c.env.DB
  let list = quartiers
  if (db) {
    try { list = await getQuartiers(db) as any } catch (_) {}
  }
  return c.json(list)
})

// ── POST /api/mobile/rdv ─────────────────────────────────────
app.post('/api/mobile/rdv', mobileAuth, async (c) => {
  const body = await c.req.json()
  const name = (body.name || '').trim()
  const phone = (body.phone || '').trim()
  const quartier = (body.quartier || '').trim()
  const date = (body.date || '').trim()
  const type = (body.type || 'devis').toLowerCase()
  const notes = (body.notes || '').trim()

  if (!name || !phone || !quartier || !date) return c.json({ error: 'Champs obligatoires manquants' }, 400)

  const db = c.env.DB
  if (db) {
    try {
      await createAppointment(db, {
        name, phone, quartier, date,
        heure_debut: body.heure_debut || '08:00',
        heure_fin: body.heure_fin || '18:00',
        type, notes,
        latitude: body.latitude || null,
        longitude: body.longitude || null,
        adresse_precise: body.adresse_precise || null,
      })
      try {
        await createClient(db, { name, phone, email: body.email || null, quartier, adresse_precise: null, latitude: null, longitude: null, type_demande: type, notes, product_id: null })
      } catch (_) {}
      return c.json({ success: true, id: Date.now() })
    } catch (e) { console.error('Mobile rdv error:', e) }
  }
  const newRdv = { id: appointments.length + 1, name, phone, quartier, date, heure_debut: '08:00', heure_fin: '18:00', type, notes, latitude: null, longitude: null, adresse_precise: '', status: 'pending' as const, created_at: new Date().toISOString() }
  appointments.push(newRdv)
  return c.json({ success: true, id: newRdv.id })
})

// ── GET /api/mobile/my-rdvs ──────────────────────────────────
app.get('/api/mobile/my-rdvs', mobileAuth, async (c) => {
  const user = c.get('mobileUser')
  const db = c.env.DB
  if (!db) return c.json([])
  try {
    const client = await db.prepare('SELECT phone FROM clients WHERE id = ?').bind(user.id).first() as any
    if (!client) return c.json([])
    const rdvs = await db.prepare('SELECT * FROM appointments WHERE phone = ? ORDER BY date DESC').bind(client.phone).all()
    return c.json(rdvs.results || [])
  } catch (e) { console.error('Mobile my-rdvs error:', e); return c.json([]) }
})

// ── GET /api/mobile/my-orders ─────────────────────────────────
app.get('/api/mobile/my-orders', mobileAuth, async (c) => {
  const user = c.get('mobileUser')
  const db = c.env.DB
  if (!db) return c.json([])
  try {
    const client = await db.prepare('SELECT phone FROM clients WHERE id = ?').bind(user.id).first() as any
    if (!client) return c.json([])
    const ordersResult = await db.prepare(
      'SELECT o.*, p.name as product_name, p.btu, p.brand FROM orders o LEFT JOIN products p ON o.product_id = p.id WHERE o.client_phone = ? ORDER BY o.created_at DESC'
    ).bind(client.phone).all()
    return c.json(ordersResult.results || [])
  } catch (e) { console.error('Mobile my-orders error:', e); return c.json([]) }
})

// ── POST /api/mobile/commandes ────────────────────────────────
app.post('/api/mobile/commandes', mobileAuth, async (c) => {
  const body = await c.req.json()
  const user = c.get('mobileUser')
  const db = c.env.DB

  const clientName = (body.client_name || user.name || '').trim()
  const clientPhone = (body.client_phone || user.phone || '').trim()
  const quartier = (body.quartier || '').trim()
  const productId = body.product_id ? parseInt(body.product_id) : null
  const quantity = body.quantity || 1
  const paymentMethod = body.payment_method || 'Téléphone'
  const notes = body.notes || ''
  const totalPrice = body.total_price || 0

  if (!clientName || !clientPhone) return c.json({ error: 'Nom et téléphone requis' }, 400)

  if (db) {
    try {
      await db.prepare(
        'INSERT INTO orders (client_name, client_phone, quartier, product_id, quantity, notes, total_price, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).bind(clientName, clientPhone, quartier, productId, quantity, `[${paymentMethod}] ${notes}`.trim(), totalPrice, 'pending', new Date().toISOString()).run()
      return c.json({ success: true })
    } catch (e) { console.error('Mobile commande create error:', e) }
  }
  return c.json({ success: true })
})

// ── POST /api/mobile/maintenance ─────────────────────────────
app.post('/api/mobile/maintenance', mobileAuth, async (c) => {
  const body = await c.req.json()
  const user = c.get('mobileUser')
  const db = c.env.DB

  const name = (body.name || user.name || '').trim()
  const phone = (body.phone || user.phone || '').trim()
  const description = (body.description || '').trim()
  const planType = body.plan_type || 'semestriel'
  const equipmentType = body.equipment_type || 'Split mural'
  const preferredDate = body.preferred_date || ''
  const requestType = body.request_type || 'contrat'

  if (!name || !phone || !description) return c.json({ error: 'Champs requis manquants' }, 400)

  const notes = [
    `Formule: ${planType}`,
    `Type: ${requestType}`,
    `Équipement: ${equipmentType}`,
    preferredDate ? `Date souhaitée: ${preferredDate}` : '',
    description,
  ].filter(Boolean).join(' | ')

  if (db) {
    try {
      await db.prepare(
        'INSERT INTO appointments (name, phone, quartier, date, heure_debut, heure_fin, type, notes, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).bind(name, phone, body.quartier || '', preferredDate || new Date().toISOString().split('T')[0], '08:00', '18:00', 'maintenance', notes, 'pending', new Date().toISOString()).run()
      return c.json({ success: true })
    } catch (e) { console.error('Mobile maintenance error:', e) }
  }
  return c.json({ success: true })
})

// ── GET /api/mobile/activity ─────────────────────────────────
app.get('/api/mobile/activity', mobileAuth, async (c) => {
  const user = c.get('mobileUser')
  const db = c.env.DB
  if (!db) return c.json([])
  try {
    const client = await db.prepare('SELECT phone FROM clients WHERE id = ?').bind(user.id).first() as any
    if (!client) return c.json([])
    const phone = client.phone

    const [rdvs, orders] = await Promise.all([
      db.prepare('SELECT id, type, status, date, notes, created_at FROM appointments WHERE phone = ? ORDER BY created_at DESC LIMIT 20').bind(phone).all(),
      db.prepare('SELECT id, status, total_price, payment_method, notes, created_at FROM orders WHERE client_phone = ? ORDER BY created_at DESC LIMIT 20').bind(phone).all(),
    ])

    const activity: any[] = [
      ...(rdvs.results || []).map((r: any) => ({ ...r, _type: 'rdv' })),
      ...(orders.results || []).map((o: any) => ({ ...o, _type: 'order' })),
    ]
    activity.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    return c.json(activity.slice(0, 30))
  } catch (e) { console.error('Mobile activity error:', e); return c.json([]) }
})

// ============================================================
// EXPORT : Hono app (Pages-compatible)
// For Workers with cron, use: export default { fetch: app.fetch, scheduled(...) { ... } }
// ============================================================

export default app
