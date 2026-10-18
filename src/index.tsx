// Mobile API endpoints updated 2026-09-12
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import { setCookie, getCookie, deleteCookie } from 'hono/cookie'
import type { D1Database } from '@cloudflare/workers-types'
import { EspaceClientPage } from './pages/espace-client'
import { AdminPage, AdminProduitsPage, AdminRDVPage, AdminClientsPage, AdminCommandesPage, AdminPaiementsPage, AdminAvisPage, AdminParametresPage, AdminDevisListPage, AdminDevisNewPage, AdminDevisDetailPage, AdminMaintenancePage, AdminMessagesPage, AdminRealisationsPage, AdminSAVPage, AdminSAVDetailPage, AdminAuditLogPage, AdminNotificationsPage } from './pages/admin'
import { AdminBannersPage } from './pages/banners'
import { appointments, reviews, orders, clients, notifications, setMaintenanceDueCount, setPendingMaintenanceContractsCount, setPendingMaintenanceRequestsCount, pendingMaintenanceContracts } from './data/store'
import type { Order } from './data/store'
import { products } from './data/products'
import { quartiers } from './data/quartiers'
import { createAppointment, updateAppointmentStatus, createOrder, createReview, getProducts, getReviews, getQuartiers, createClient, getClients, getAppointments, getAppointmentById, getOrders, deleteProduct, deleteClient, deleteOrder, getClientById, getProductById } from './db'
import type { HonoEnv } from './types'
import { SITE_URL } from './types'
import { escapeHtml, sanitizeText, isValidEmail, isValidPhone, normalizePhone, validateImageMagicBytes } from './utils/helpers'
import { sendSmsWithLog, notifyAdmin, logActivity, logSecurityEvent, sendTelegramMessage, ensureActivityLog, ensureNotificationsTable } from './utils/notifications'
import { analyserClasseur, cleProduit, MAX_LIGNES_PAR_LOT } from './utils/importProduits'
import type { ChampCible, ChampsProduit, ProduitDerive } from './utils/importProduits'
import { webRouter } from './routes/web'
import { mobileRouter } from './routes/api-mobile'
import { clientRouter } from './routes/client'
import { adminRouter } from './routes/admin'

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

// Rate limit persistant, partagé par tous les isolates (table rate_limits,
// migration 0038). Le compteur mémoire ci-dessus vit dans un seul isolate
// Cloudflare : un attaquant qui retente sa chance tombe sur un autre isolate et
// repart d'un compteur Ã  zéro, donc les 5 tentatives de login admin ne
// plafonnaient rien. À réserver aux endpoints sensibles (une écriture D1 par
// tentative) ; le reste du site garde le compteur mémoire.
// En cas d'échec D1, on retombe sur le compteur mémoire plutôt que d'ouvrir grand.
async function rateLimitD1(db: any, key: string, maxRequests: number, windowMs: number): Promise<{ allowed: boolean; remaining: number }> {
  if (!db) return rateLimit(key, maxRequests, windowMs)
  const now = Date.now()
  const nowIso = new Date(now).toISOString()
  try {
    await db.prepare(`CREATE TABLE IF NOT EXISTS rate_limits (
      key TEXT PRIMARY KEY,
      count INTEGER NOT NULL DEFAULT 0,
      window_start INTEGER NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`).run()
    const row = await db.prepare('SELECT count, window_start FROM rate_limits WHERE key = ?').bind(key).first() as any
    const windowStart = Number(row?.window_start ?? 0)
    const count = Number(row?.count ?? 0)
    if (!row || !isFinite(windowStart) || now - windowStart > windowMs) {
      await db.prepare('INSERT OR REPLACE INTO rate_limits (key, count, window_start, updated_at) VALUES (?, 1, ?, ?)').bind(key, now, nowIso).run()
      // Purge des fenêtres d'il y a plus de 24 h, tant qu'on écrit déjÃ 
      try { await db.prepare('DELETE FROM rate_limits WHERE window_start < ?').bind(now - 86400000).run() } catch(_) {}
      return { allowed: true, remaining: maxRequests - 1 }
    }
    if (count >= maxRequests) return { allowed: false, remaining: 0 }
    await db.prepare('UPDATE rate_limits SET count = count + 1, updated_at = ? WHERE key = ?').bind(nowIso, key).run()
    return { allowed: true, remaining: Math.max(0, maxRequests - count - 1) }
  } catch (e) {
    console.error('[SECURITY] rateLimitD1 indisponible, repli mémoire:', e)
    return rateLimit(key, maxRequests, windowMs)
  }
}

// Remet Ã  zéro un compteur persistant (appelé après une authentification réussie
// pour ne pas pénaliser un admin qui s'est trompé une fois).
async function rateLimitD1Reset(db: any, key: string): Promise<void> {
  if (!db) return
  try { await db.prepare('DELETE FROM rate_limits WHERE key = ?').bind(key).run() } catch(_) {}
}

// Journal des actions admin sensibles (export de sauvegarde, réinitialisation de
// la base, changement d'identifiants). security_log ne conserve pas le
// user-agent, utile pour reconstituer une compromission.
async function logAdminAudit(db: any, data: { action: string; detail?: string; ip?: string; userAgent?: string }): Promise<void> {
  if (!db) return
  try {
    await db.prepare(`CREATE TABLE IF NOT EXISTS admin_audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      detail TEXT,
      ip TEXT,
      user_agent TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`).run()
    await db.prepare('INSERT INTO admin_audit_log (action, detail, ip, user_agent) VALUES (?, ?, ?, ?)')
      .bind(data.action, data.detail || null, data.ip || null, (data.userAgent || '').slice(0, 300) || null).run()
  } catch(_) {}
}

// Vérifie le mot de passe admin courant (D1, sinon amorçage ADMIN_INITIAL_PASSWORD).
// Sert Ã  redemander le mot de passe pour les actions destructrices : le cookie de
// session seul ne doit pas suffire.
async function verifyAdminPassword(env: any, password: string): Promise<boolean> {
  if (!password || typeof password !== 'string') return false
  let hash = ''
  const db = env?.DB
  if (db) {
    try {
      const row = await db.prepare('SELECT value FROM admin_settings WHERE key = ?').bind('admin_password_hash').first() as any
      if (row?.value) hash = row.value
    } catch(_) { /* table absente */ }
  }
  if (!hash && env?.ADMIN_INITIAL_PASSWORD) hash = await hashPassword(env.ADMIN_INITIAL_PASSWORD)
  if (!hash) return false
  return await verifyPassword(password, hash)
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

// Comparaison de chaînes Ã  durée constante (contre les timing attacks sur un secret).
// La longueur reste observable, mais le contenu ne fuit pas octet par octet.
function timingSafeEqualStr(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

// â”€â”€â”€ Révocation des sessions admin â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Le cookie admin est stateless (HMAC seul), donc ni la déconnexion ni un
// changement de mot de passe n'invalidaient les cookies déjÃ  émis : un cookie
// volé restait valable 24 h. On versionne les sessions avec une Â« epoch Â»
// stockée en D1 (admin_settings.admin_token_epoch, créée par la migration 0038).
// Le payload du cookie devient admin_<epoch>_<timestamp> et adminAuth rejette
// tout cookie dont l'epoch ne correspond plus. Incrémenter l'epoch déconnecte
// donc toutes les sessions d'un coup.
const ADMIN_EPOCH_KEY = 'admin_token_epoch'

async function getAdminTokenEpoch(db: any): Promise<string> {
  if (!db) return '1'
  try {
    const row = await db.prepare('SELECT value FROM admin_settings WHERE key = ?').bind(ADMIN_EPOCH_KEY).first() as any
    const v = parseInt(row?.value ?? '', 10)
    return isNaN(v) ? '1' : String(v)
  } catch { return '1' }
}

async function bumpAdminTokenEpoch(db: any): Promise<void> {
  if (!db) return
  try {
    await db.prepare('CREATE TABLE IF NOT EXISTS admin_settings (key TEXT PRIMARY KEY, value TEXT, updated_at TEXT)').run()
    const current = parseInt(await getAdminTokenEpoch(db), 10)
    await db.prepare('INSERT OR REPLACE INTO admin_settings (key, value, updated_at) VALUES (?, ?, ?)')
      .bind(ADMIN_EPOCH_KEY, String(current + 1), new Date().toISOString()).run()
  } catch (e) { console.error('[SECURITY] bumpAdminTokenEpoch a échoué:', e) }
}

// Extrait l'epoch d'un token dont le payload vaut admin_<epoch>_<timestamp>.
// Retourne null pour l'ancien format admin_<timestamp> : ces sessions sont
// rejetées, l'admin se reconnecte une fois.
function adminPayloadEpoch(token: string): string | null {
  const parts = token.split('.')
  if (parts.length < 2) return null
  const payload = parts.slice(0, -1).join('.')
  const m = payload.match(/^admin_(\d+)_(\d+)$/)
  return m ? m[1] : null
}

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
        <div style="font-size:32px;font-weight:900;color:${urgencyColor};">ðŸ””</div>
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
        <tr><td style="padding:6px 0;font-weight:600;">ðŸ“‹ Contrat</td><td style="padding:6px 0;">${planLabels[planType] || planType}</td></tr>
        <tr><td style="padding:6px 0;font-weight:600;">🔧 Type</td><td style="padding:6px 0;">Visite préventive</td></tr>
      </table>
    </div>
    <p style="font-size:13px;color:#64748b;line-height:1.6;margin:0 0 20px;">
      Merci de vous assurer que l'accès Ã  vos équipements est possible. En cas d'empêchement, contactez-nous au plus vite.
    </p>
    <div style="text-align:center;">
      <a href="https://wa.me/22655996418?text=Bonjour%20MAASGA%2C%20concernant%20ma%20maintenance%20du%20${encodeURIComponent(fmtD)}" style="display:inline-block;background:#25d366;color:white;font-weight:700;font-size:14px;padding:12px 28px;border-radius:10px;text-decoration:none;">
        <span style="margin-right:6px;">ðŸ“±</span>Contacter via WhatsApp
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
            `ðŸ”” Rappel : Maintenance ${label} — MAASGA`,
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
            text: `ðŸ”” *RAPPEL MAINTENANCE — ${label}*\n\nðŸ‘¤ Client: ${clientName}\nðŸ“± Tél: ${visit.client_phone || '—'}\n📅 Date: ${visit.visit_date}\nðŸ“‹ Contrat: ${planType}\n\n${isToday ? "âš ï¸ La visite est prévue AUJOURD\'HUI !" : 'ðŸ“Œ La visite est prévue DEMAIN.'}`,
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
      ).bind('maintenance', `ðŸ”” Rappel maintenance ${label}: ${clientName} (${visit.visit_date}) — Contrat ${planType}`).run()
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
      message: 'Webhook configuré ! Envoyez /start Ã  votre bot.'
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
        await sendTelegramMessage(token, chatId, `âœ… RDV #${id} confirmé !`)
      } else if (action === 'cancel' && type === 'rdv' && db) {
        await db.prepare(`UPDATE appointments SET status='cancelled' WHERE id=?`).bind(parseInt(id)).run()
        await sendTelegramMessage(token, chatId, `âŒ RDV #${id} annulé.`)
      } else if (action === 'done' && type === 'rdv' && db) {
        await db.prepare(`UPDATE appointments SET status='done' WHERE id=?`).bind(parseInt(id)).run()
        await sendTelegramMessage(token, chatId, `â˜‘ï¸ RDV #${id} marqué terminé.`)
      } else if (action === 'validate' && type === 'order' && db) {
        await db.prepare(`UPDATE orders SET status='livre', delivered_at=datetime('now') WHERE id=?`).bind(parseInt(id)).run()
        await sendTelegramMessage(token, chatId, `âœ… Commande #${id} livrée !`)
      } else if (action === 'cancel' && type === 'order' && db) {
        await db.prepare(`UPDATE orders SET status='annule' WHERE id=?`).bind(parseInt(id)).run()
        await sendTelegramMessage(token, chatId, `âŒ Commande #${id} annulée.`)
      } else if (action === 'installed' && type === 'order' && db) {
        await db.prepare(`UPDATE orders SET status='livre', installed_at=datetime('now') WHERE id=?`).bind(parseInt(id)).run()
        await sendTelegramMessage(token, chatId, `📦 Commande #${id} installée !`)
      } else if (action === 'complete' && type === 'visit' && db) {
        await db.prepare(`UPDATE maintenance_visits SET status='effectuee', updated_at=datetime('now') WHERE id=?`).bind(parseInt(id)).run()
        await sendTelegramMessage(token, chatId, `âœ… Visite #${id} complétée !`)
      } else if (action === 'read' && type === 'msg' && db) {
        await db.prepare(`UPDATE contact_messages SET is_read=1 WHERE id=?`).bind(parseInt(id)).run()
        await sendTelegramMessage(token, chatId, `ðŸ“– Message #${id} marqué lu.`)
      } else if (action === 'resolve' && type === 'sav' && db) {
        await db.prepare(`UPDATE sav_tickets SET status='resolved', updated_at=datetime('now') WHERE id=?`).bind(parseInt(id)).run()
        await sendTelegramMessage(token, chatId, `âœ… Ticket SAV #${id} résolu !`)
      } else if (action === 'approve' && type === 'review' && db) {
        await db.prepare(`UPDATE reviews SET approved=1 WHERE id=?`).bind(parseInt(id)).run()
        await sendTelegramMessage(token, chatId, `âœ… Avis #${id} approuvé et publié !`)
      } else if (action === 'reject' && type === 'review' && db) {
        await db.prepare(`DELETE FROM reviews WHERE id=?`).bind(parseInt(id)).run()
        await sendTelegramMessage(token, chatId, `ðŸ—‘ï¸ Avis #${id} supprimé.`)
      } else if (action === 'menu') {
        // Show main menu
        await sendTelegramMessage(token, chatId, 
          `ðŸ  *Menu Principal MAASGA*\n\nChoisissez une section :`,
          { inline_keyboard: [
            [{ text: 'ðŸ“Š Dashboard', callback_data: 'show:stats' }, { text: 'ðŸ“† RDV', callback_data: 'show:rdv' }],
            [{ text: 'ðŸ›’ Commandes', callback_data: 'show:orders' }, { text: 'ðŸ“„ Devis', callback_data: 'show:devis' }],
            [{ text: 'ðŸ“‹ Contrats', callback_data: 'show:contracts' }, { text: '📅 Visites', callback_data: 'show:visits' }],
            [{ text: 'ðŸ’¬ Messages', callback_data: 'show:messages' }, { text: 'ðŸ’³ Paiements', callback_data: 'show:payments' }],
            [{ text: 'ðŸŽ§ SAV', callback_data: 'show:sav' }, { text: 'â­ Avis', callback_data: 'show:avis' }],
            [{ text: 'ðŸ‘¤ Clients', callback_data: 'show:clients' }, { text: '📦 Stock', callback_data: 'show:stock' }]
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
          await sendTelegramMessage(token, chatId, `ðŸ” Aucun produit disponible pour ${btuFilter ? btuFilter.toLocaleString() + ' BTU' : ''}.`)
        } else {
          let txt = `ðŸ” *Produits ${btuFilter ? btuFilter.toLocaleString() + ' BTU' : ''}*\n\n`
          for (const p of rows.results as any[]) {
            const stk = p.stock <= 0 ? 'ðŸ”´ Rupture' : p.stock <= 2 ? `ðŸŸ¡ ${p.stock} rest.` : `🟢 ${p.stock} en stock`
            txt += `*${p.brand}* — ${(p.btu || 0).toLocaleString()} BTU\n   💰 ${(p.price || 0).toLocaleString()} FCFA | ${p.inverter ? 'âš¡ Inverter' : 'Standard'} | ${stk}\n\n`
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
          const stMap: Record<string, string> = { pending: 'â³ En attente', confirmed: 'âœ… Confirmé', done: 'â˜‘ï¸ Terminé', cancelled: 'âŒ Annulé' }
          await sendTelegramMessage(token, chatId,
            `ðŸ“† *RDV #${rdv.id}*\n\n` +
            `ðŸ‘¤ *${rdv.name}*\n` +
            `ðŸ“± ${rdv.phone}\n` +
            `📅 ${rdv.date} | ${rdv.heure_debut || '—'}–${rdv.heure_fin || '—'}\n` +
            `ðŸ“ ${rdv.quartier || '—'}\n` +
            `ðŸ·ï¸ ${rdv.type || 'standard'}\n` +
            `ðŸ“Š ${stMap[rdv.status] || rdv.status}\n` +
            (rdv.notes ? `\nðŸ“ ${rdv.notes}` : ''),
            { inline_keyboard: [
              [
                { text: 'âœ… Confirmer', callback_data: `confirm:rdv:${id}` },
                { text: 'â˜‘ï¸ Terminer', callback_data: `done:rdv:${id}` },
                { text: 'âŒ Annuler', callback_data: `cancel:rdv:${id}` }
              ],
              [
                { text: `ðŸ“± Appeler`, url: `tel:${rdv.phone}` },
                { text: `ðŸ’¬ WhatsApp`, url: `https://wa.me/${(rdv.phone || '').replace(/\D/g, '')}` }
              ],
              [{ text: 'Â« Retour RDV', callback_data: 'show:rdv' }]
            ]}
          )
        }
        return c.json({ ok: true })
      } else if (action === 'detail' && type === 'order' && db) {
        const o = await db.prepare(`SELECT o.*, c.name as client FROM orders o LEFT JOIN clients c ON o.client_id=c.id WHERE o.id=?`).bind(parseInt(id)).first()
        if (o) {
          const stMap: Record<string, string> = { pending: 'â³ En attente', paid: '💰 Payée', livre: 'ðŸšš Livrée', validation_terrain: 'ðŸ” Validation', devis_en_attente: 'ðŸ“„ Devis envoyé', devis_valide: 'âœ… Devis accepté', installed: '📦 Installé', cancelled: 'âŒ Annulé' }
          await sendTelegramMessage(token, chatId,
            `ðŸ›’ *Commande #${o.id}*\n\n` +
            `ðŸ‘¤ *${o.client || o.client_name || 'Anonyme'}*\n` +
            `ðŸ“± ${o.client_phone || '—'}\n` +
            `💰 ${(o.total_price || 0).toLocaleString()} FCFA\n` +
            `📦 Produit: ${o.product_name || '—'} Ã— ${o.quantity || 1}\n` +
            `ðŸ“Š ${stMap[o.status] || o.status}\n` +
            `📅 ${(o.created_at || '').slice(0, 10)}`,
            { inline_keyboard: [
              [
                { text: 'ðŸšš Livrée', callback_data: `validate:order:${id}` },
                { text: '📦 Installé', callback_data: `installed:order:${id}` },
                { text: 'âŒ Annuler', callback_data: `cancel:order:${id}` }
              ],
              o.client_phone ? [{ text: `ðŸ“± Appeler`, url: `tel:${o.client_phone}` }, { text: `ðŸ’¬ WhatsApp`, url: `https://wa.me/${(o.client_phone || '').replace(/\D/g, '')}` }] : [],
              [{ text: 'Â« Retour Commandes', callback_data: 'show:orders' }]
            ].filter(r => r.length > 0)}
          )
        }
        return c.json({ ok: true })
      }
    } catch (err: any) {
      console.error('[TELEGRAM CB]', err)
      await sendTelegramMessage(token, chatId, `âŒ Erreur: ${err.message}`)
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
          `ðŸ¤– *MAASGA Bot Admin*\n\n` +
          `â”â”â” ðŸ“Š TABLEAU DE BORD â”â”â”\n` +
          `/stats — Tableau de bord complet\n` +
          `/clients — Derniers clients inscrits\n\n` +
          `â”â”â” ðŸ“† RDV â”â”â”\n` +
          `/rdv — Rendez-vous Ã  venir\n` +
          `/confirmer <id> — Confirmer un RDV\n` +
          `/terminer <id> — Marquer terminé\n` +
          `/annuler <id> — Annuler un RDV\n\n` +
          `â”â”â” ðŸ›’ COMMANDES & DEVIS â”â”â”\n` +
          `/commandes — Commandes récentes\n` +
          `/devis — Devis en attente\n` +
          `/paiements — Paiements récents\n\n` +
          `â”â”â” 🔧 MAINTENANCE â”â”â”\n` +
          `/contrats — Contrats actifs\n` +
          `/visites — Prochaines visites\n` +
          `/valider <id> — Valider une visite\n\n` +
          `â”â”â” ðŸŽ§ SAV & AVIS â”â”â”\n` +
          `/sav — Tickets SAV ouverts\n` +
          `/avis — Avis en attente d'approbation\n` +
          `/approuver <id> — Approuver un avis\n\n` +
          `â”â”â” ðŸ’¬ MESSAGES â”â”â”\n` +
          `/messages — Messages non lus\n\n` +
          `â”â”â” 📦 PRODUITS â”â”â”\n` +
          `/stock — État du stock\n` +
          `/stock_update <id> <qté> — Modifier stock\n` +
          `/recherche [marque] [BTU] — Chercher produit\n` +
          `/convertir <cv> — CV vers BTU\n\n` +
          `â”â”â” ðŸ—ƒï¸ SYSTÈME â”â”â”\n` +
          `/client <nom> — Rechercher client\n` +
          `/backup — Résumé base de données\n\n` +
          `ðŸ’¡ *Actions rapides :*`,
          { inline_keyboard: [
            [{ text: 'ðŸ“Š Dashboard', callback_data: 'show:stats' }, { text: 'ðŸ“† RDV', callback_data: 'show:rdv' }],
            [{ text: 'ðŸ›’ Commandes', callback_data: 'show:orders' }, { text: 'ðŸ“„ Devis', callback_data: 'show:devis' }],
            [{ text: 'ðŸ“‹ Contrats', callback_data: 'show:contracts' }, { text: '📅 Visites', callback_data: 'show:visits' }],
            [{ text: 'ðŸ’¬ Messages', callback_data: 'show:messages' }, { text: 'ðŸ’³ Paiements', callback_data: 'show:payments' }],
            [{ text: 'ðŸŽ§ SAV', callback_data: 'show:sav' }, { text: 'â­ Avis', callback_data: 'show:avis' }],
            [{ text: 'ðŸ‘¤ Clients', callback_data: 'show:clients' }, { text: '📦 Stock', callback_data: 'show:stock' }]
          ]}
        )
        break
      }

      // ---- /stats ----
      case '/stats': {
        if (!db) { await reply('âŒ Base de données indisponible'); break }
        const [contracts, visits, rdvs, orders, devis, contacts, products] = await Promise.all([
          db.prepare(`SELECT COUNT(*) as c FROM maintenance_contracts WHERE status='actif'`).first(),
          db.prepare(`SELECT COUNT(*) as c FROM maintenance_visits WHERE status='planifiee' AND visit_date >= date('now')`).first(),
          db.prepare(`SELECT COUNT(*) as c FROM appointments WHERE date >= date('now') AND status != 'cancelled'`).first(),
          db.prepare(`SELECT COUNT(*) as c FROM orders WHERE status='en_attente'`).first(),
          db.prepare(`SELECT COUNT(*) as c FROM devis WHERE status='sent'`).first(),
          db.prepare(`SELECT COUNT(*) as c FROM contact_messages WHERE is_read=0`).first(),
          db.prepare(`SELECT COUNT(*) as c, SUM(CASE WHEN stock <= 2 THEN 1 ELSE 0 END) as low FROM products`).first(),
        ])
        await reply(
          `ðŸ“Š *Tableau de bord MAASGA*\n\n` +
          `ðŸ“† RDV Ã  venir: *${rdvs?.c || 0}*\n` +
          `ðŸ›’ Commandes en attente: *${orders?.c || 0}*\n` +
          `ðŸ“„ Devis envoyés: *${devis?.c || 0}*\n` +
          `ðŸ’¬ Messages non lus: *${contacts?.c || 0}*\n` +
          `🔧 Contrats actifs: *${contracts?.c || 0}*\n` +
          `📅 Visites Ã  venir: *${visits?.c || 0}*\n` +
          `📦 Produits stock bas: *${products?.low || 0}*`,
          { inline_keyboard: [
            [{ text: 'ðŸ“† Voir RDV', callback_data: 'show:rdv' }, { text: 'ðŸ›’ Commandes', callback_data: 'show:orders' }],
            [{ text: 'ðŸ’¬ Messages', callback_data: 'show:messages' }, { text: 'ðŸ’³ Paiements', callback_data: 'show:payments' }],
            [{ text: 'ðŸŽ§ SAV', callback_data: 'show:sav' }, { text: 'â­ Avis', callback_data: 'show:avis' }],
            [{ text: 'ðŸ‘¤ Clients', callback_data: 'show:clients' }, { text: '📦 Stock', callback_data: 'show:stock' }],
            [{ text: 'ðŸ”„ Actualiser', callback_data: 'show:stats' }]
          ]}
        )
        break
      }

      // ---- /stock ----
      case '/stock': {
        if (!db) { await reply('âŒ Base de données indisponible'); break }
        const rows = await db.prepare(
          `SELECT id, name, stock, price FROM products ORDER BY stock ASC LIMIT 15`
        ).all()
        if (!rows.results?.length) { await reply('Aucun produit.'); break }
        let txt = `📦 *État du Stock*\n\n`
        for (const p of rows.results as any[]) {
          const icon = p.stock <= 0 ? 'ðŸ”´' : p.stock <= 2 ? 'ðŸŸ¡' : '🟢'
          txt += `${icon} *${p.name}*\n   Stock: ${p.stock} | ${(p.price || 0).toLocaleString()} FCFA\n\n`
        }
        await reply(txt, { inline_keyboard: [[{ text: 'ðŸ”„ Actualiser', callback_data: 'show:stock' }]] })
        break
      }

      // ---- /contrats ----
      case '/contrats': {
        if (!db) { await reply('âŒ Base de données indisponible'); break }
        const rows = await db.prepare(
          `SELECT mc.id, mc.plan_type, mc.status, mc.start_date, mc.end_date, c.name as client
           FROM maintenance_contracts mc
           JOIN clients c ON mc.client_id = c.id
           WHERE mc.status = 'actif'
           ORDER BY mc.start_date DESC LIMIT 10`
        ).all()
        if (!rows.results?.length) { await reply('Aucun contrat actif.'); break }
        let txt = `ðŸ“‹ *Contrats maintenance actifs*\n\n`
        for (const r of rows.results as any[]) {
          const plan = r.plan_type === 'trimestriel' ? '3Ã—/an' : r.plan_type === 'semestriel' ? '2Ã—/an' : '1Ã—/an'
          txt += `#${r.id} — *${r.client}*\n   ${r.plan_type} (${plan}) | ${r.start_date} â†’ ${r.end_date}\n\n`
        }
        await reply(txt, { inline_keyboard: [[{ text: '📅 Visites', callback_data: 'show:visits' }, { text: 'ðŸ”„ Actualiser', callback_data: 'show:contracts' }]] })
        break
      }

      // ---- /visites ----
      case '/visites': {
        if (!db) { await reply('âŒ Base de données indisponible'); break }
        const rows = await db.prepare(
          `SELECT mv.id, mv.visit_date, mv.status, c.name as client, c.phone as client_phone, mc.plan_type
           FROM maintenance_visits mv
           JOIN maintenance_contracts mc ON mv.contract_id = mc.id
           JOIN clients c ON mc.client_id = c.id
           WHERE mv.status IN ('planifiee','confirmee') AND mv.visit_date >= date('now')
           ORDER BY mv.visit_date ASC LIMIT 10`
        ).all()
        if (!rows.results?.length) { await reply('Aucune visite Ã  venir.'); break }
        let txt = `📅 *Prochaines visites maintenance*\n\n`
        const buttons: any[] = []
        for (const r of rows.results as any[]) {
          txt += `ðŸ”¹ #${r.id} — *${r.client}*\n   ðŸ“† ${r.visit_date} | ${r.plan_type}\n   ðŸ“± ${r.client_phone || '—'}\n\n`
          buttons.push([{ text: `âœ… Valider #${r.id}`, callback_data: `complete:visit:${r.id}` }])
        }
        buttons.push([{ text: 'ðŸ”„ Actualiser', callback_data: 'show:visits' }])
        await reply(txt, { inline_keyboard: buttons.slice(0, 6) })
        break
      }

      // ---- /valider <id> ----
      case '/valider': {
        if (!db) { await reply('âŒ Base de données indisponible'); break }
        const visitId = parseInt(args[0])
        if (!visitId) { await reply('âš ï¸ Usage: /valider <id\\_visite>'); break }
        const visit = await db.prepare(
          `SELECT mv.*, c.name as client_name FROM maintenance_visits mv
           JOIN maintenance_contracts mc ON mv.contract_id = mc.id
           JOIN clients c ON mc.client_id = c.id
           WHERE mv.id = ?`
        ).bind(visitId).first() as any
        if (!visit) { await reply(`âŒ Visite #${visitId} introuvable.`); break }
        if (visit.status === 'effectuee') { await reply(`âœ… Visite #${visitId} est déjÃ  complétée.`); break }
        await db.prepare(
          `UPDATE maintenance_visits SET status='effectuee', updated_at=datetime('now'), notes='Validée via Telegram Bot' WHERE id=?`
        ).bind(visitId).run()
        await reply(
          `âœ… *Visite #${visitId} validée !*\n\n` +
          `ðŸ‘¤ Client: ${visit.client_name}\n` +
          `📅 Date prévue: ${visit.visit_date}\n` +
          `ðŸ• Complétée: ${new Date().toISOString().replace('T', ' ').slice(0, 16)}`
        )
        break
      }

      // ---- /rdv ----
      case '/rdv': {
        if (!db) { await reply('âŒ Base de données indisponible'); break }
        const today = new Date().toISOString().split('T')[0]
        const rows = await db.prepare(
          `SELECT id, name, phone, date, heure_debut, heure_fin, type, quartier, status FROM appointments
           WHERE date >= ? AND status != 'cancelled' ORDER BY date ASC, heure_debut ASC LIMIT 10`
        ).bind(today).all()
        if (!rows.results?.length) { await reply('Aucun RDV Ã  venir.', { inline_keyboard: [[{ text: 'ðŸ”„ Actualiser', callback_data: 'show:rdv' }]] }); break }
        let txt = `ðŸ“† *Prochains rendez-vous*\n\n`
        const buttons: any[] = []
        for (const r of rows.results as any[]) {
          const dateStr = r.date === today ? "ðŸ“ AUJOURD'HUI" : `📅 ${r.date}`
          const horaire = r.heure_debut ? `${r.heure_debut}–${r.heure_fin || '18:00'}` : '—'
          const stIcon = r.status === 'confirmed' ? 'âœ…' : r.status === 'done' ? 'â˜‘ï¸' : 'â³'
          txt += `${stIcon} #${r.id} — *${r.name}*\n   ${dateStr} | ${horaire}\n   ðŸ“± ${r.phone} | ðŸ“ ${r.quartier || '—'}\n\n`
          if (r.status === 'pending') {
            buttons.push([{ text: `ðŸ‘ï¸ #${r.id} ${r.name}`, callback_data: `detail:rdv:${r.id}` }])
          }
        }
        buttons.push([{ text: 'ðŸ”„ Actualiser', callback_data: 'show:rdv' }])
        await reply(txt, { inline_keyboard: buttons.slice(0, 6) })
        break
      }

      // ---- /commandes ----
      case '/commandes': {
        if (!db) { await reply('âŒ Base de données indisponible'); break }
        const rows = await db.prepare(
          `SELECT o.id, o.total_price, o.client_name, o.client_phone, o.status, o.created_at, c.name as client
           FROM orders o LEFT JOIN clients c ON o.client_id = c.id
           ORDER BY o.created_at DESC LIMIT 10`
        ).all()
        if (!rows.results?.length) { await reply('Aucune commande.', { inline_keyboard: [[{ text: 'ðŸ”„ Actualiser', callback_data: 'show:orders' }]] }); break }
        let txt = `ðŸ›’ *Commandes récentes*\n\n`
        const buttons: any[] = []
        for (const r of rows.results as any[]) {
          const st = r.status === 'en_attente' ? 'â³' : r.status === 'contacte' ? 'ðŸ“ž' : r.status === 'confirme' ? 'âœ…' : r.status === 'en_livraison' ? 'ðŸšš' : r.status === 'livre' ? '📦' : r.status === 'annule' ? 'âŒ' : 'ðŸ”„'
          const nom = r.client || r.client_name || 'Anonyme'
          txt += `${st} #${r.id} — *${nom}*\n   ${(r.total_price || 0).toLocaleString()} FCFA | ${r.status}\n\n`
          if (r.status === 'pending') {
            buttons.push([{ text: `ðŸ‘ï¸ #${r.id} ${nom}`, callback_data: `detail:order:${r.id}` }])
          }
        }
        buttons.push([{ text: 'ðŸ”„ Actualiser', callback_data: 'show:orders' }])
        await reply(txt, { inline_keyboard: buttons.slice(0, 6) })
        break
      }

      // ---- /messages ----
      case '/messages': {
        if (!db) { await reply('âŒ Base de données indisponible'); break }
        const rows = await db.prepare(
          `SELECT id, name, phone, email, message, created_at FROM contact_messages
           WHERE is_read = 0 ORDER BY created_at DESC LIMIT 10`
        ).all()
        if (!rows.results?.length) { await reply('âœ… Aucun message non lu.', { inline_keyboard: [[{ text: 'ðŸ”„ Actualiser', callback_data: 'show:messages' }]] }); break }
        let txt = `ðŸ’¬ *Messages non lus*\n\n`
        const buttons: any[] = []
        for (const r of rows.results as any[]) {
          txt += `ðŸ”¹ #${r.id} — *${r.name}*\n   ðŸ“± ${r.phone || r.email || '—'}\n   ðŸ’¬ ${(r.message || '').slice(0, 80)}...\n\n`
          buttons.push([
            { text: `ðŸ“– Lu #${r.id}`, callback_data: `read:msg:${r.id}` },
            r.phone ? { text: `ðŸ’¬ WhatsApp`, url: `https://wa.me/${(r.phone || '').replace(/\D/g, '')}` } : { text: `ðŸ“§ Email`, url: `mailto:${r.email || ''}` }
          ])
        }
        buttons.push([{ text: 'ðŸ”„ Actualiser', callback_data: 'show:messages' }])
        await reply(txt, { inline_keyboard: buttons.slice(0, 8) })
        break
      }

      // ---- /devis ----
      case '/devis': {
        if (!db) { await reply('âŒ Base de données indisponible'); break }
        const rows = await db.prepare(
          `SELECT id, numero, client_name, total_ht, status, created_at, expires_at FROM devis
           WHERE status IN ('sent','draft') ORDER BY created_at DESC LIMIT 10`
        ).all()
        if (!rows.results?.length) { await reply('Aucun devis en attente.', { inline_keyboard: [[{ text: 'ðŸ”„ Actualiser', callback_data: 'show:devis' }]] }); break }
        let txt = `ðŸ“„ *Devis en attente*\n\n`
        for (const r of rows.results as any[]) {
          const st = r.status === 'sent' ? 'ðŸ“¤' : 'ðŸ“'
          txt += `${st} ${r.numero} — *${r.client_name}*\n   💰 ${(r.total_ht || 0).toLocaleString()} FCFA\n   📅 Expire: ${(r.expires_at || '').slice(0, 10)}\n\n`
        }
        await reply(txt, { inline_keyboard: [[{ text: 'ðŸ”„ Actualiser', callback_data: 'show:devis' }]] })
        break
      }

      // ---- /client <nom> ----
      case '/client': {
        if (!db) { await reply('âŒ Base de données indisponible'); break }
        const search = args.join(' ')
        if (!search) { await reply('âš ï¸ Usage: /client <nom ou téléphone>'); break }
        const rows = await db.prepare(
          `SELECT id, name, phone, email, quartier FROM clients
           WHERE name LIKE ? OR phone LIKE ? LIMIT 5`
        ).bind(`%${search}%`, `%${search}%`).all()
        if (!rows.results?.length) { await reply(`ðŸ” Aucun client trouvé pour "${search}".`); break }
        let txt = `ðŸ” *Résultats pour "${search}"*\n\n`
        const buttons: any[] = []
        for (const r of rows.results as any[]) {
          txt += `ðŸ‘¤ #${r.id} — *${r.name}*\n   ðŸ“± ${r.phone || '—'} | ðŸ“§ ${r.email || '—'}\n   ðŸ“ ${r.quartier || '—'}\n\n`
          if (r.phone) {
            buttons.push([{ text: `ðŸ’¬ WhatsApp ${r.name}`, url: `https://wa.me/${(r.phone || '').replace(/\D/g, '')}` }])
          }
        }
        await reply(txt, buttons.length ? { inline_keyboard: buttons.slice(0, 4) } : undefined)
        break
      }

      // ---- /confirmer <id> (RDV) ----
      case '/confirmer': {
        if (!db) { await reply('âŒ Base de données indisponible'); break }
        const rdvId = parseInt(args[0])
        if (!rdvId) { await reply('âš ï¸ Usage: /confirmer <id\\_rdv>'); break }
        await db.prepare(`UPDATE appointments SET status='confirmed' WHERE id=?`).bind(rdvId).run()
        await reply(`âœ… RDV #${rdvId} confirmé !`)
        break
      }

      // ---- /annuler <id> (RDV) ----
      case '/annuler': {
        if (!db) { await reply('âŒ Base de données indisponible'); break }
        const rdvId = parseInt(args[0])
        if (!rdvId) { await reply('âš ï¸ Usage: /annuler <id\\_rdv>'); break }
        await db.prepare(`UPDATE appointments SET status='cancelled' WHERE id=?`).bind(rdvId).run()
        await reply(`âŒ RDV #${rdvId} annulé.`)
        break
      }

      // ---- /convertir <cv> ----
      case '/convertir': {
        const CV_TO_BTU: Record<string, number> = {
          '0.75': 7000, '1': 9000, '1.5': 12000, '2': 18000,
          '2.5': 24000, '3': 24000, '3.5': 30000, '4': 36000, '5': 48000
        }
        const SURFACE: Record<number, string> = {
          7000: 'â‰ˆ 7–10 mÂ²', 9000: 'â‰ˆ 9–15 mÂ²', 12000: 'â‰ˆ 15–23 mÂ²',
          18000: 'â‰ˆ 25–40 mÂ²', 24000: 'â‰ˆ 40–60 mÂ²', 30000: 'â‰ˆ 60–80 mÂ²',
          36000: 'â‰ˆ 80–100 mÂ²', 48000: 'â‰ˆ 100–130 mÂ²'
        }
        if (!args[0]) {
          let txt = `ðŸ”„ *Conversion CV â†’ BTU*\n\n`
          for (const [cv, btu] of Object.entries(CV_TO_BTU)) {
            txt += `*${cv} CV* = ${btu.toLocaleString()} BTU — ${SURFACE[btu] || ''}\n`
          }
          txt += `\nðŸ’¡ Usage: /convertir 2`
          await reply(txt)
          break
        }
        const cv = parseFloat(args[0].replace(',', '.'))
        const key = cv.toString()
        const btu = CV_TO_BTU[key]
        if (!btu) {
          await reply(`âš ï¸ Valeur non reconnue: ${args[0]} CV\n\nðŸ”¢ Valeurs valides: 0.75, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5`)
          break
        }
        await reply(
          `ðŸ”„ *Conversion CV â†’ BTU*\n\n` +
          `*${cv} CV* = *${btu.toLocaleString()} BTU*\n` +
          `ðŸ“ Surface couverte: ${SURFACE[btu] || '—'}\n\n` +
          `ðŸ’¡ Tapez /recherche ${btu} pour voir les produits disponibles.`,
          { inline_keyboard: [[{ text: `ðŸ” Voir produits ${btu} BTU`, callback_data: `search:${btu}:` }]] }
        )
        break
      }

      // ---- /recherche [marques...] [BTU...] ----
      case '/recherche': {
        if (!db) { await reply('âŒ Base de données indisponible'); break }

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
          await reply(`ðŸ” Aucun produit disponible pour: *${what}*\n\nEssayez /stock pour voir tout le catalogue.`)
          break
        }

        const filterDesc = [
          brands.length ? `Marques: *${brands.join(', ')}*` : '',
          btuValues.length ? `BTU: *${btuValues.map(b => b.toLocaleString()).join(', ')}*` : ''
        ].filter(Boolean).join(' · ') || '*Tout le catalogue*'

        let txt = `ðŸ” *Recherche produits* — ${filterDesc}\n📦 ${rows.results.length} résultat(s)\n\n`
        for (const p of rows.results as any[]) {
          const stockIcon = p.stock <= 0 ? 'ðŸ”´ Rupture' : p.stock <= 2 ? `ðŸŸ¡ ${p.stock} restant(s)` : `🟢 En stock (${p.stock})`
          const inv = p.inverter ? 'âš¡ Inverter' : 'Standard'
          txt += `*${p.brand}* — ${(p.btu || 0).toLocaleString()} BTU\n`
          txt += `   💰 ${(p.price || 0).toLocaleString()} FCFA | ${inv} | ${p.energy_class || '—'}\n`
          txt += `   ${stockIcon}\n\n`
        }
        await reply(txt, { inline_keyboard: [[{ text: 'ðŸ”„ Tout le catalogue', callback_data: 'show:stock' }]] })
        break
      }

      // ---- /paiements â†’ redirigé vers commandes ----
      case '/paiements': {
        await reply('ðŸ’¡ Le système de paiement en ligne a été remplacé par un flux contact direct.\nConsultez les commandes avec /commandes.')
        break
      }

      // ---- /sav ----
      case '/sav': {
        if (!db) { await reply('âŒ Base de données indisponible'); break }
        const rows = await db.prepare(
          `SELECT id, ticket_ref, subject, priority, status, client_name, client_phone, created_at
           FROM sav_tickets WHERE status NOT IN ('resolved','closed') ORDER BY created_at DESC LIMIT 10`
        ).all()
        if (!rows.results?.length) { await reply('âœ… Aucun ticket SAV ouvert.'); break }
        let txt = `ðŸŽ§ *Tickets SAV ouverts*\n\n`
        const buttons: any[] = []
        for (const r of rows.results as any[]) {
          const pIcon = r.priority==='urgent'?'ðŸ”´':r.priority==='high'?'ðŸŸ ':r.priority==='normal'?'ðŸŸ¡':'âšª'
          const stIcon = r.status==='open'?'ðŸ“¬':r.status==='in_progress'?'🔧':'ðŸ“‹'
          txt += `${stIcon} ${r.ticket_ref} — *${r.client_name||'?'}*\n   ${pIcon} ${r.priority||'normal'} | ${r.subject||'—'}\n   ðŸ“± ${r.client_phone||'—'}\n\n`
          buttons.push([{ text: `âœ… Résoudre ${r.ticket_ref}`, callback_data: `resolve:sav:${r.id}` }])
        }
        buttons.push([{ text: 'ðŸ”„ Actualiser', callback_data: 'show:sav' }])
        await reply(txt, { inline_keyboard: buttons.slice(0,6) })
        break
      }

      // ---- /avis ----
      case '/avis': {
        if (!db) { await reply('âŒ Base de données indisponible'); break }
        const rows = await db.prepare(
          `SELECT id, client_name, note, comment, service, created_at FROM reviews WHERE approved=0 ORDER BY created_at DESC LIMIT 10`
        ).all()
        if (!rows.results?.length) { await reply("âœ… Aucun avis en attente d'approbation."); break }
        let txt = `â­ *Avis en attente*\n\n`
        const buttons: any[] = []
        for (const r of rows.results as any[]) {
          const stars = 'â­'.repeat(Math.min(r.rating||5,5))
          txt += `#${r.id} ${stars} — *${r.client_name||'?'}*\n   ðŸ’¬ ${(r.comment||'').slice(0,80)}${r.comment?.length>80?'â€¦':''}\n\n`
          buttons.push([
            { text: `âœ… Approuver #${r.id}`, callback_data: `approve:review:${r.id}` },
            { text: `âŒ Rejeter #${r.id}`, callback_data: `reject:review:${r.id}` }
          ])
        }
        buttons.push([{ text: 'ðŸ”„ Actualiser', callback_data: 'show:avis' }])
        await reply(txt, { inline_keyboard: buttons.slice(0,6) })
        break
      }

      // ---- /approuver <id> (avis) ----
      case '/approuver': {
        if (!db) { await reply('âŒ Base de données indisponible'); break }
        const reviewId = parseInt(args[0])
        if (!reviewId) { await reply('âš ï¸ Usage: /approuver <id\_avis>'); break }
        await db.prepare(`UPDATE reviews SET approved=1 WHERE id=?`).bind(reviewId).run()
        await reply(`âœ… Avis #${reviewId} approuvé et publié !`)
        break
      }

      // ---- /terminer <id> (RDV â†’ done) ----
      case '/terminer': {
        if (!db) { await reply('âŒ Base de données indisponible'); break }
        const rdvId = parseInt(args[0])
        if (!rdvId) { await reply('âš ï¸ Usage: /terminer <id\_rdv>'); break }
        const rdv = await db.prepare(`SELECT name FROM appointments WHERE id=?`).bind(rdvId).first() as any
        if (!rdv) { await reply(`âŒ RDV #${rdvId} introuvable.`); break }
        await db.prepare(`UPDATE appointments SET status='done' WHERE id=?`).bind(rdvId).run()
        await reply(`â˜‘ï¸ RDV #${rdvId} (${rdv.name}) marqué comme *terminé* !`)
        break
      }

      // ---- /stock_update <id> <quantite> ----
      case '/stock_update': {
        if (!db) { await reply('âŒ Base de données indisponible'); break }
        const prodId = parseInt(args[0])
        const qty = parseInt(args[1])
        if (!prodId || isNaN(qty)) { await reply('âš ï¸ Usage: /stock\_update <id\_produit> <nouvelle\_quantité>\nEx: /stock\_update 3 10'); break }
        const prod = await db.prepare(`SELECT id, name, stock FROM products WHERE id=?`).bind(prodId).first() as any
        if (!prod) { await reply(`âŒ Produit #${prodId} introuvable. Tapez /stock pour voir les IDs.`); break }
        await db.prepare(`UPDATE products SET stock=?, updated_at=datetime('now') WHERE id=?`).bind(qty, prodId).run()
        await reply(`📦 Stock mis Ã  jour !\n\n*${prod.name}*\n   Ancien stock: ${prod.stock} â†’ Nouveau: *${qty}*`)
        break
      }

      // ---- /clients (derniers inscrits) ----
      case '/clients': {
        if (!db) { await reply('âŒ Base de données indisponible'); break }
        const rows = await db.prepare(
          `SELECT id, name, phone, email, quartier, created_at FROM clients ORDER BY created_at DESC LIMIT 10`
        ).all()
        if (!rows.results?.length) { await reply('Aucun client.'); break }
        let txt = `ðŸ‘¤ *Derniers clients inscrits*\n\n`
        for (const r of rows.results as any[]) {
          txt += `#${r.id} — *${r.name}*\n   ðŸ“± ${r.phone||'—'} | ðŸ“ ${r.quartier||'—'}\n   📅 ${(r.created_at||'').slice(0,10)}\n\n`
        }
        const totalRes = await db.prepare(`SELECT COUNT(*) as c FROM clients`).first() as any
        txt += `ðŸ“Š Total: *${totalRes?.c||0}* clients`
        await reply(txt, { inline_keyboard: [[{ text: 'ðŸ”„ Actualiser', callback_data: 'show:clients' }]] })
        break
      }

      // ---- /backup ----
      case '/backup': {
        if (!db) { await reply('âŒ Base de données indisponible'); break }
        const backupTables = ['products', 'clients', 'appointments', 'orders', 'reviews', 'contact_messages', 'maintenance_contracts', 'sav_tickets', 'site_settings']
        const counts: string[] = []
        let totalRows = 0
        for (const table of backupTables) {
          try {
            const r = await db.prepare(`SELECT COUNT(*) as c FROM ${table}`).first() as { c: number } | null
            const count = r?.c || 0
            totalRows += count
            counts.push(`  ${table}: *${count}* lignes`)
          } catch (_) {
            counts.push(`  ${table}: âš ï¸ erreur`)
          }
        }
        await reply(
          `ðŸ’¾ *Backup D1 — Résumé*\n\n` +
          `ðŸ“Š Total: *${totalRows.toLocaleString()}* lignes\n` +
          `ðŸ“‹ Tables:\n${counts.join('\n')}\n\n` +
          `ðŸ”— *Pour télécharger le backup JSON complet:*\n` +
          `Allez sur /admin â†’ Paramètres â†’ Backup\n` +
          `ou: \`/api/admin/backup\` (authentifié)`,
          { inline_keyboard: [[{ text: 'ðŸ“Š Dashboard', callback_data: 'show:stats' }]] }
        )
        break
      }

      default: {
        if (cmd.startsWith('/')) {
          await reply(`â“ Commande inconnue: ${cmd}\n\nTapez /help pour voir les commandes disponibles.`)
        }
      }
    }
  } catch (err: any) {
    console.error('[TELEGRAM BOT]', err)
    await reply(`âŒ Erreur: ${err.message || 'interne'}`)
  }

  return c.json({ ok: true })
})

// ============================================================
// API MOBILE & CLIENT — Sous-application modulaire (src/routes/api-mobile)
// ============================================================
app.route('', mobileRouter)
app.route('', clientRouter)
app.route('', adminRouter)

// ============================================================
// EXPORT : Hono app (Pages-compatible)
// For Workers with cron, use: export default { fetch: app.fetch, scheduled(...) { ... } }
// ============================================================


export default app
