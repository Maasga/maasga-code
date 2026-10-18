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

const adminAuth = async (c: any, next: any) => {
  let secret: string
  try {
    secret = getAdminSecret(c.env)
  } catch (e: any) {
    console.error('[SECURITY] ' + e.message)
    return c.text("Configuration serveur incomplète. Contactez l'administrateur.", 503)
  }
  const cookie = c.req.header('Cookie') || ''
  const match = cookie.match(/maasga_admin=([^;]+)/)
  if (match) {
    const rawToken = decodeURIComponent(match[1])
    const valid = await verifyToken(rawToken, secret)
    if (valid) {
      // Signature valide : vérifier en plus que la session n'a pas été révoquée
      // (déconnexion, changement de mot de passe, reset). Voir bumpAdminTokenEpoch.
      const tokenEpoch = adminPayloadEpoch(rawToken)
      const currentEpoch = await getAdminTokenEpoch(c.env?.DB)
      if (tokenEpoch !== null && tokenEpoch === currentEpoch) {
        return next()
      }
      const revokedIp = c.req.header('cf-connecting-ip') || 'unknown'
      logSecurityEvent(c.env?.DB, { event: 'admin_auth_revoked_session', severity: 'warn', ip: revokedIp, details: `Cookie epoch ${tokenEpoch ?? 'legacy'} != ${currentEpoch}` })
      return c.html(AdminLoginPage({ error: 'session_expired' }))
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
      plan_type TEXT NOT NULL,
      plan_price INTEGER NOT NULL DEFAULT 0,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'en_attente',
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
      visit_type TEXT NOT NULL DEFAULT 'preventive',
      visit_date TEXT NOT NULL,
      status TEXT DEFAULT 'planifiee',
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
      request_type TEXT NOT NULL DEFAULT 'occasionnelle',
      description TEXT,
      preferred_date TEXT,
      equipment_type TEXT,
      plan_type TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      admin_notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`).run()
  } catch(_) { /* tables may already exist */ }
  try { await db.prepare('ALTER TABLE maintenance_requests ADD COLUMN plan_type TEXT').run() } catch(_) { /* column already exists */ }
  try { await db.prepare('ALTER TABLE maintenance_requests ADD COLUMN nb_climatiseurs INTEGER').run() } catch(_) {}
  try { await db.prepare('ALTER TABLE maintenance_requests ADD COLUMN frequence_visites TEXT').run() } catch(_) {}
  try { await db.prepare('ALTER TABLE maintenance_requests ADD COLUMN type_etablissement TEXT').run() } catch(_) {}
  try { await db.prepare('ALTER TABLE maintenance_requests ADD COLUMN exigences TEXT').run() } catch(_) {}
  try { await db.prepare('ALTER TABLE maintenance_requests ADD COLUMN plan_price REAL DEFAULT 0').run() } catch(_) {}
  try { await db.prepare('ALTER TABLE maintenance_contracts ADD COLUMN notes TEXT').run() } catch(_) {}
  try { await db.prepare('ALTER TABLE maintenance_contracts ADD COLUMN next_visit_date TEXT').run() } catch(_) {}
}

// Pricing constants for maintenance plans
const PRICING_THRESHOLDS = {
  TIER_1: 4,
  TIER_2: 8,
  TIER_3: 15
} as const

const PRICING_RATES = {
  TIER_1: 8500,
  TIER_2: 7500,
  TIER_3: 6000,
  TIER_4: 5000
} as const

// Visit frequency mapping - standardized across the codebase
const VISIT_FREQUENCY: Record<string, number> = {
  Essentiel: 1,
  Confort: 2,
  Pro: 3
} as const

// Legacy plan visit counts
const LEGACY_VISITS: Record<string, number> = {
  trimestriel: 3,
  semestriel: 2,
  annuel: 1
} as const

// Shared pricing calculation function to eliminate duplication
function calculatePlanPricing(planType: string, nbClimatiseurs: number, frequenceVisites: string) {
  const isV2 = ['residentiel', 'professionnel', 'professionnel_pme', 'industriel', 'sur_mesure'].includes(planType)
  const isLegacy = ['trimestriel', 'semestriel', 'annuel'].includes(planType)
  
  let months = 12
  let visits = 2
  let price = 0
  
  if (isV2) {
    const getUnitRate = (cnt: number) => {
      if (cnt <= PRICING_THRESHOLDS.TIER_1) return PRICING_RATES.TIER_1
      if (cnt <= PRICING_THRESHOLDS.TIER_2) return PRICING_RATES.TIER_2
      if (cnt <= PRICING_THRESHOLDS.TIER_3) return PRICING_RATES.TIER_3
      return PRICING_RATES.TIER_4
    }
    visits = VISIT_FREQUENCY[frequenceVisites] || 2
    if (planType === 'industriel' || planType === 'sur_mesure') {
      price = 0
    } else {
      price = getUnitRate(nbClimatiseurs) * nbClimatiseurs * visits
    }
  } else if (isLegacy) {
    const planConfig: Record<string, { months: number; visits: number; price: number }> = {
      trimestriel: { months: 12, visits: LEGACY_VISITS.trimestriel, price: 30000 },
      semestriel: { months: 12, visits: LEGACY_VISITS.semestriel, price: 55000 },
      annuel: { months: 12, visits: LEGACY_VISITS.annuel, price: 100000 }
    }
    const cfg = planConfig[planType]
    if (cfg) {
      months = cfg.months
      visits = cfg.visits
      price = cfg.price
    }
  }
  
  return { months, visits, price }
}

async function scheduleVisitsForContract(
  db: any,
  contractId: number,
  clientName: string,
  clientPhone: string,
  clientId: number,
  planType: string,
  visitsCount: number,
  startDateStr: string,
  months: number = 12
) {
  if (!db || !contractId) return
  const count = Math.max(1, visitsCount || 2)
  const intervalMonths = Math.max(1, Math.floor(months / count))
  let firstDate = ''

  for (let i = 1; i <= count; i++) {
    const vd = new Date(startDateStr || new Date().toISOString().split('T')[0])
    vd.setMonth(vd.getMonth() + (intervalMonths * i))
    const dateStr = vd.toISOString().split('T')[0]
    if (i === 1) firstDate = dateStr

    try {
      const existing = await db.prepare("SELECT id FROM maintenance_visits WHERE contract_id = ? AND visit_date = ?").bind(contractId, dateStr).first()
      if (!existing) {
        await db.prepare(
          `INSERT INTO maintenance_visits (contract_id, client_id, client_name, client_phone, visit_type, visit_date, status, description)
           VALUES (?, ?, ?, ?, 'preventive', ?, 'planifiee', ?)`
        ).bind(
          contractId,
          clientId || 0,
          sanitizeText(clientName, 120),
          sanitizeText(clientPhone, 20),
          dateStr,
          `Visite préventive #${i}/${count} — Formule ${planType.toUpperCase()}`
        ).run()
      }
    } catch(e) {
      console.error('scheduleVisitsForContract error:', e)
    }
  }

  if (firstDate) {
    try {
      await db.prepare("UPDATE maintenance_contracts SET next_visit_date = ? WHERE id = ?").bind(firstDate, contractId).run()
    } catch(_) {}
  }
}

async function insertContractSafe(
  db: any,
  params: {
    clientId?: number,
    clientName: string,
    clientPhone: string,
    planType: string,
    planPrice: number,
    startDate: string,
    endDate: string,
    status: string,
    totalVisits: number,
    nextVisitDate?: string,
    notes?: string
  }
): Promise<number> {
  if (!db) return 0
  let contractId = 0
  const cleanPlan = (params.planType || 'residentiel').toLowerCase()

  try {
    const res = await db.prepare(
      `INSERT INTO maintenance_contracts (client_id, client_name, client_phone, plan_type, plan_price, start_date, end_date, status, total_visits, completed_visits, next_visit_date, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`
    ).bind(
      params.clientId || null,
      sanitizeText(params.clientName, 120),
      sanitizeText(params.clientPhone, 20),
      cleanPlan,
      params.planPrice || 0,
      params.startDate,
      params.endDate,
      params.status || 'en_attente',
      params.totalVisits || 2,
      params.nextVisitDate || null,
      params.notes || null
    ).run()
    contractId = res?.meta?.last_row_id || 0
  } catch (err: any) {
    console.warn('Direct contract insert failed, falling back to legacy plan type mapping:', err)
    const fallbackPlan = params.totalVisits === 1 ? 'annuel' : (params.totalVisits === 3 ? 'trimestriel' : 'semestriel')
    const fullNotes = `[Formule: ${cleanPlan.toUpperCase()}] ${params.notes || ''}`.trim()
    try {
      const resFallback = await db.prepare(
        `INSERT INTO maintenance_contracts (client_id, client_name, client_phone, plan_type, plan_price, start_date, end_date, status, total_visits, completed_visits, next_visit_date, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`
      ).bind(
        params.clientId || null,
        sanitizeText(params.clientName, 120),
        sanitizeText(params.clientPhone, 20),
        fallbackPlan,
        params.planPrice || 0,
        params.startDate,
        params.endDate,
        params.status || 'en_attente',
        params.totalVisits || 2,
        params.nextVisitDate || null,
        fullNotes
      ).run()
      contractId = resFallback?.meta?.last_row_id || 0
    } catch(e2) {
      console.error('Fatal contract insert error:', e2)
    }
  }

  if (!contractId) {
    try {
      const last = await db.prepare("SELECT id FROM maintenance_contracts WHERE client_phone = ? ORDER BY id DESC LIMIT 1").bind(params.clientPhone).first() as any
      if (last?.id) contractId = last.id
    } catch(_) {}
  }

  return contractId
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
        ['facebook', ''], ['instagram', ''], ['slogan', 'Spécialiste climatisation & froid Ã  Ouagadougou']
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
  const climatiseurNom = sanitizeText(body['climatiseur_nom'], 200) || null
  const climatiseurPrix = parseInt(body['climatiseur_prix'] as string || '0') || 0
  const mainOeuvrePrix = parseInt(body['main_oeuvre_prix'] as string || '50000') || 0
  const motif = sanitizeText(body['motif'], 500) || null
  const messageClient = sanitizeText(body['message_client'], 2000) || null

  // Build fournitures JSON from dynamic d_acc_nom_N / d_acc_prix_N fields
  const fournitures: Array<{nom: string; prix: number}> = []
  for (let i = 1; i <= 20; i++) {
    const nom = sanitizeText(body[`d_acc_nom_${i}`], 200)
    const prix = parseInt(body[`d_acc_prix_${i}`] as string || '0') || 0
    if (nom) fournitures.push({ nom, prix })
  }
  const accTotal = fournitures.reduce((s, a) => s + a.prix, 0)

  // Compute total
  const totalAmount = climatiseurPrix + mainOeuvrePrix + accTotal

  // Build legacy title/description for backward compat
  const title = "Devis d'installation"

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

    // Devis envoyé au client : la commande passe Ã  Â« contacte Â» (le suivi fin du
    // devis vit dans order_devis.status — 'devis_en_attente' n'existe plus depuis 0036)
    await db.prepare('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?')
      .bind('contacte', now, orderId).run()
    const memOrder = orders.find(o => o.id === orderId)
    if (memOrder) memOrder.status = 'contacte' as any

    // Email notification if client has email
    if (order.client_email) {
      try {
        const brevoKey = c.env.BREVO_API_KEY
        if (brevoKey) {
          const climLine = climatiseurNom ? `<tr><td>Climatiseur</td><td>${escapeHtml(climatiseurNom)}</td><td style="text-align:right">${climatiseurPrix.toLocaleString()} FCFA</td></tr>` : ''
          const mdoLine = mainOeuvrePrix > 0 ? `<tr><td>Main d'Å“uvre / Installation</td><td></td><td style="text-align:right">${mainOeuvrePrix.toLocaleString()} FCFA</td></tr>` : ''
          const fLines = fournitures.map(f => `<tr><td>${f.nom}</td><td></td><td style="text-align:right">${f.prix.toLocaleString()} FCFA</td></tr>`).join('')
          await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: { 'api-key': brevoKey, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sender: { name: 'MAASGA', email: 'maasgabf@gmail.com' },
              to: [{ email: order.client_email, name: order.client_name }],
              subject: `Devis d'installation — Commande #${orderId} — MAASGA`,
              htmlContent: `<html><body style="font-family:Arial,sans-serif;padding:20px;max-width:600px;margin:0 auto;">
                <h2 style="color:#d97706;">â„ Devis d'installation disponible</h2>
                <p>Bonjour ${order.client_name},</p>
                <p>Un devis d'installation a été préparé pour votre commande #${orderId}.</p>
                ${motif ? `<p><strong>Motif :</strong> ${escapeHtml(motif)}</p>` : ''}
                ${messageClient ? `<p style="background:#f0f9ff;border-left:4px solid #0284c7;padding:12px;">${escapeHtml(messageClient)}</p>` : ''}
                <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;">${climLine}${mdoLine}${fLines}
                  <tr style="border-top:2px solid #e5e7eb;"><td colspan="2" style="padding-top:8px;font-weight:700;">TOTAL</td><td style="text-align:right;font-weight:800;color:#d97706;font-size:18px;">${totalAmount.toLocaleString()} FCFA</td></tr>
                </table>
                <p>Connectez-vous Ã  votre espace client pour valider ou refuser ce devis :</p>
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

// Note : l'ancien endpoint POST /api/admin/order/terrain-validation a été retiré.
// Il écrivait orders.status = 'validation_terrain', valeur supprimée par la
// migration 0036 (le CHECK n'accepte plus que en_attente/contacte/confirme/
// en_livraison/livre/annule), donc chaque appel violait la contrainte. Aucune vue
// admin ne le référençait : l'étape Â« validation terrain Â» est couverte par le
// statut 'contacte' et par les RDV.

// ============================================================
// ADMIN ROUTES
// ============================================================

// Crée les tables essentielles si elles n'existent pas (garde-fou DB vide en dev local)
async function ensureCoreTables(db: any): Promise<void> {
  try {
    await db.batch([
      db.prepare(`CREATE TABLE IF NOT EXISTS appointments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL, phone TEXT NOT NULL, quartier TEXT,
        date TEXT NOT NULL, heure_debut TEXT, heure_fin TEXT,
        type TEXT DEFAULT 'devis', notes TEXT, latitude REAL, longitude REAL,
        adresse_precise TEXT, status TEXT DEFAULT 'pending',
        created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now'))
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS clients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL, phone TEXT NOT NULL UNIQUE, email TEXT,
        quartier TEXT, password_hash TEXT, type_demande TEXT, notes TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER, appointment_id INTEGER, product_id INTEGER,
        quantity INTEGER DEFAULT 1, client_name TEXT NOT NULL,
        client_phone TEXT NOT NULL, client_email TEXT, quartier TEXT,
        status TEXT NOT NULL DEFAULT 'en_attente', type TEXT DEFAULT 'commande',
        notes TEXT, total_price REAL DEFAULT 0, installation_price REAL DEFAULT 0,
        admin_notes TEXT, created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL, note INTEGER NOT NULL, comment TEXT,
        date TEXT, service TEXT, approved INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now'))
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS maintenance_contracts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER, client_name TEXT NOT NULL, client_phone TEXT NOT NULL,
        client_email TEXT, order_id INTEGER, plan_type TEXT NOT NULL,
        plan_price INTEGER DEFAULT 0, start_date TEXT NOT NULL, end_date TEXT NOT NULL,
        status TEXT DEFAULT 'en_attente', total_visits INTEGER DEFAULT 0,
        completed_visits INTEGER DEFAULT 0, next_visit_date TEXT, notes TEXT,
        admin_notes TEXT, created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS maintenance_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER, name TEXT NOT NULL, phone TEXT NOT NULL,
        email TEXT, quartier TEXT, request_type TEXT NOT NULL,
        description TEXT, preferred_date TEXT, equipment_type TEXT,
        status TEXT DEFAULT 'pending', admin_notes TEXT,
        created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now'))
      )`),
      db.prepare(`CREATE TABLE IF NOT EXISTS admin_notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT, title TEXT, message TEXT, read INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now'))
      )`),
    ])
  } catch(e) {
    console.warn('ensureCoreTables batch warning:', (e as any)?.message)
  }
  // Corrections défensives : si maintenance_requests a client_name/client_phone au lieu de name/phone
  try { await db.prepare('ALTER TABLE maintenance_requests ADD COLUMN name TEXT NOT NULL DEFAULT ""').run() } catch(_) {}
  try { await db.prepare('ALTER TABLE maintenance_requests ADD COLUMN phone TEXT NOT NULL DEFAULT ""').run() } catch(_) {}
  // Corrections défensives : si maintenance_requests a name/phone mais pas client_name (alias pour le code)
  // La requête utilise 'name as client_name' donc name doit exister — on ne fait rien de plus
}

// Recharge toutes les données depuis D1 dans les tableaux mémoire (évite reset au deploy)
const refreshAdminCache = async (c: any, next: any) => {
  const db = c.env.DB
  if (db) {
    try {
      await ensureCoreTables(db);
      // ---------- Appointments ----------
      appointments.length = 0
      const dbAppts = await getAppointments(db)
      dbAppts.forEach((a: any) => appointments.push({
        id: a.id,
        name: a.name || '',
        phone: a.phone || '',
        quartier: a.quartier || '',
        date: a.date,
        heure_debut: a.heure_debut || '08:00',
        heure_fin: a.heure_fin || '18:00',
        type: a.type || 'devis',
        notes: a.notes || '',
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

            // ---------- Notifications ----------
      try {
        notifications.length = 0
        const notifRows = await db.prepare('SELECT * FROM admin_notifications ORDER BY id DESC LIMIT 100').all()
        const dbNotifs = notifRows.results || []
        dbNotifs.forEach((n: any) => notifications.push(n))
      } catch(e) { console.error('Notifications load cache error:', e) }

      // ---------- Maintenance counts & pending contracts ----------
      try {
        const today = new Date().toISOString().split('T')[0]
        const [contractsRes, requestsRes, dueRes] = await Promise.all([
          db.prepare("SELECT COUNT(*) as cnt FROM maintenance_contracts WHERE status = 'en_attente'").first() as any,
          db.prepare("SELECT COUNT(*) as cnt FROM maintenance_requests WHERE status = 'pending'").first() as any,
          db.prepare("SELECT COUNT(*) as cnt FROM maintenance_visits WHERE visit_date <= ? AND status = 'planifiee'").bind(today).first() as any
        ])
        setPendingMaintenanceContractsCount(contractsRes?.cnt || 0)
        setPendingMaintenanceRequestsCount(requestsRes?.cnt || 0)
        setMaintenanceDueCount(dueRes?.cnt || 0)

        // Pending contracts for dashboard alert
        pendingMaintenanceContracts.length = 0
        const pConts = await db.prepare("SELECT * FROM maintenance_contracts WHERE status = 'en_attente' ORDER BY id DESC LIMIT 10").all()
        if (pConts && pConts.results) {
          pConts.results.forEach((c: any) => pendingMaintenanceContracts.push(c))
        }
      } catch(e) { console.error('Maintenance cache error:', e) }
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
                 error === 'session_expired' ? 'Session expirée ou révoquée. Reconnectez-vous.' :
                 error === 'ratelimit' ? 'Trop de tentatives. Réessayez dans 15 minutes.' :
                 error === 'no_init' ? "Aucun mot de passe admin configuré. Contactez l'administrateur." :
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
              <input type="password" name="password" required placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
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

// Le token de reset est stateless (HMAC), donc rejouable autant de fois qu'on veut
// pendant ses 15 minutes de validité. On garde en D1 le timestamp du dernier token
// consommé : tout token dont le timestamp est <= ce plancher est refusé. Chaque
// token devient Ã  usage unique, et consommer le dernier invalide aussi les
// précédents.
const RESET_FLOOR_KEY = 'admin_reset_min_ts'

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
    // Comparaison Ã  durée constante
    if (sigHex.length !== expectedHex.length) return false
    let diff = 0
    for (let i = 0; i < sigHex.length; i++) diff |= sigHex.charCodeAt(i) ^ expectedHex.charCodeAt(i)
    return diff === 0
  } catch { return false }
}

app.post('/api/admin/login', async (c) => {
  // Rate limiting: 5 admin login attempts per IP per 15 minutes.
  // Compteur persistant en D1 : le compteur mémoire est par isolate, donc
  // contournable en retentant jusqu'Ã  tomber sur un isolate neuf.
  const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown'
  const rlKey = `admin-login:${ip}`
  const rl = await rateLimitD1(c.env?.DB, rlKey, 5, 15 * 60 * 1000)
  if (!rl.allowed) {
    logSecurityEvent(c.env?.DB, { event: 'admin_login_rate_limit', severity: 'warn', ip, details: `Login admin limité pour ${ip}` })
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
  // Si aucun hash en D1, utiliser ADMIN_INITIAL_PASSWORD comme amorçage.
  // ADMIN_SECRET n'est PLUS accepté ici : c'est la clé de signature HMAC des
  // cookies, la réutiliser comme mot de passe faisait qu'une seule fuite donnait
  // Ã  la fois la session et le compte (et le même secret sert au reset).
  if (!validHash) {
    const initPwd = c.env.ADMIN_INITIAL_PASSWORD
    if (!initPwd) return c.redirect('/admin?error=no_init')
    validHash = await hashPassword(initPwd)
    // Persister immédiatement pour ne plus dépendre de l'env
    if (db) {
      try { await db.prepare('INSERT OR REPLACE INTO admin_settings (key, value, updated_at) VALUES (?, ?, ?)').bind('admin_password_hash', validHash, new Date().toISOString()).run() } catch(_) {}
    }
  }

  const validLogin = await verifyPassword(password, validHash)
  const isUsernameMatch = username.toLowerCase() === validUsername.toLowerCase() ||
    username.toLowerCase() === 'admin' ||
    username.toLowerCase() === 'maasgabf' ||
    username.toLowerCase() === 'maasgabf@gmail.com'
  if (isUsernameMatch && validLogin) {
    // Migration auto vers PBKDF2 si ancien hash
    if (!validHash.startsWith('pbkdf2:') && db) {
      const newHash = await hashPassword(password)
      try { await db.prepare('INSERT OR REPLACE INTO admin_settings (key, value, updated_at) VALUES (?, ?, ?)').bind('admin_password_hash', newHash, new Date().toISOString()).run() } catch(_) {}
    }
    const secret = getAdminSecret(c.env)
    const epoch = await getAdminTokenEpoch(db)
    const payload = `admin_${epoch}_${Date.now()}`
    const token = await signToken(payload, secret)
    await rateLimitD1Reset(db, rlKey)
    logSecurityEvent(db, { event: 'admin_login_success', severity: 'info', ip, details: `Connexion admin depuis ${ip}` })
    const response = new Response(null, {
      status: 302,
      headers: {
        'Location': '/admin',
        'Set-Cookie': `maasga_admin=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=86400`
      }
    })
    return response
  }
  logSecurityEvent(db, { event: 'admin_login_failed', severity: 'critical', ip, details: `Échec de connexion admin pour "${username.slice(0, 64)}"` })
  return c.redirect('/admin?error=1')
})

// Déconnexion admin — efface le cookie ET incrémente l'epoch pour invalider
// côté serveur tous les cookies déjÃ  émis (un cookie HMAC volé restait sinon
// valable 24 h même après déconnexion).
// En POST : couvert par le middleware CSRF global, donc un site tiers ne peut
// plus déconnecter l'admin (ni révoquer sa session) via une simple <img>.
app.post('/api/admin/logout', adminAuth, async (c) => {
  await bumpAdminTokenEpoch(c.env?.DB)
  const ip = c.req.header('cf-connecting-ip') || 'unknown'
  logSecurityEvent(c.env?.DB, { event: 'admin_logout', severity: 'info', ip, details: 'Déconnexion admin (sessions révoquées)' })
  return new Response(null, {
    status: 302,
    headers: {
      'Location': '/admin?error=logged_out',
      'Set-Cookie': 'maasga_admin=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'
    }
  })
})

// Ancien lien GET /api/admin/logout : conservé pour les signets, mais il ne
// révoque plus rien côté serveur (un GET est déclenchable par un site tiers).
// Il efface juste le cookie local et renvoie vers la page de connexion.
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

// Admin password reset — génère un token de reset Ã  usage unique (15 min)
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
              <div class="text-4xl mb-2">ðŸ”</div>
              <h1 class="text-xl font-bold text-gray-900">Réinitialisation mot de passe admin</h1>
              <p class="text-gray-500 text-sm mt-1">Entrez le secret de sécurité (ADMIN_SECRET) pour générer un lien de reset.</p>
            </div>
            {error === 'invalid' && <div class="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm">âŒ Secret invalide. Vérifiez ADMIN_SECRET.</div>}
            {error === 'expired' && <div class="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm">âŒ Token expiré ou déjÃ  utilisé. Recommencez.</div>}
            {error === 'toomany' && <div class="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm">âŒ Trop de tentatives. Réessayez dans 15 min.</div>}
            {success === 'reset' && <div class="mb-4 p-3 rounded-lg bg-green-50 text-green-600 text-sm">âœ… Identifiant et mot de passe réinitialisés. Connectez-vous avec vos nouvelles informations.</div>}
            <form method="post" action="/api/admin/generate-reset-token" class="space-y-4">
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1">Secret de sécurité</label>
                <input type="password" name="admin_secret" required placeholder="Votre ADMIN_SECRET" class="w-full border rounded-xl px-4 py-3 text-sm" />
              </div>
              <button type="submit" class="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700">Générer le lien de reset</button>
            </form>
            <a href="/admin" class="block text-center text-sm text-blue-600 mt-4 hover:underline">â† Retour Ã  la connexion</a>
          </div>
        </div>
      </body>
    </html>
  )
})

// Étape 2 : Vérifier le secret et générer un token temporaire
app.post('/api/admin/generate-reset-token', async (c) => {
  // Rate limit: 3 attempts per 15 min per IP to prevent brute-force of ADMIN_SECRET
  // (persistant en D1 : ce formulaire est la porte de secours du compte admin)
  const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown'
  const rl = await rateLimitD1(c.env?.DB, `reset-token:${ip}`, 3, 15 * 60 * 1000)
  if (!rl.allowed) {
    return c.redirect('/admin/reset-password?error=toomany')
  }
  const body = await c.req.parseBody()
  const inputSecret = (body['admin_secret'] as string || '').trim()
  try {
    const realSecret = getAdminSecret(c.env)
    // Comparaison Ã  durée constante : un !== simple sort au premier octet
    // différent et laissait deviner ADMIN_SECRET caractère par caractère.
    if (!timingSafeEqualStr(inputSecret, realSecret)) {
      logSecurityEvent(c.env?.DB, { event: 'admin_reset_secret_invalid', severity: 'critical', ip, details: `ADMIN_SECRET incorrect depuis ${ip}` })
      return c.redirect('/admin/reset-password?error=invalid')
    }
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
              <div class="text-4xl mb-2">ðŸ”‘</div>
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
  // Rate limit: 5 attempts per 15 min per IP (persistant en D1)
  const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown'
  const rl = await rateLimitD1(c.env?.DB, `reset-pwd:${ip}`, 5, 15 * 60 * 1000)
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

  // Usage unique : refuser un token déjÃ  consommé (voir RESET_FLOOR_KEY)
  const db = c.env.DB
  const tokenTs = parseInt(resetToken.slice(0, resetToken.indexOf('.')), 10)
  if (isNaN(tokenTs)) return c.redirect('/admin/reset-password?error=expired')
  if (db) {
    try {
      await db.prepare('CREATE TABLE IF NOT EXISTS admin_settings (key TEXT PRIMARY KEY, value TEXT, updated_at TEXT)').run()
      const floorRow = await db.prepare('SELECT value FROM admin_settings WHERE key = ?').bind(RESET_FLOOR_KEY).first() as any
      const floor = parseInt(floorRow?.value ?? '0', 10) || 0
      if (tokenTs <= floor) {
        logSecurityEvent(db, { event: 'admin_reset_token_replay', severity: 'critical', ip, details: `Token de reset déjÃ  consommé, rejeu depuis ${ip}` })
        return c.redirect('/admin/reset-password?error=expired')
      }
    } catch (e) { console.error('Reset token floor check error:', e) }
  }

  // Valider l'identifiant : 3-64 caractères, email ou alphanumérique
  if (!newUsername || newUsername.length < 3 || newUsername.length > 64 || /[<>"'`\\]/.test(newUsername)) {
    return c.redirect('/admin/reset-password?error=invalid')
  }
  if (!newPwd || newPwd.length < 8 || newPwd !== confirmPwd) {
    return c.redirect('/admin/reset-password?error=invalid')
  }

  const newHash = await hashPassword(newPwd)
  if (db) {
    try {
      await db.prepare('CREATE TABLE IF NOT EXISTS admin_settings (key TEXT PRIMARY KEY, value TEXT, updated_at TEXT)').run()
      // Consommer le token AVANT d'écrire le nouveau hash : les validations
      // ci-dessus sont pures, donc une simple faute de frappe ne brÃ»le pas le lien.
      await db.prepare('INSERT OR REPLACE INTO admin_settings (key, value, updated_at) VALUES (?, ?, ?)').bind(RESET_FLOOR_KEY, String(tokenTs), new Date().toISOString()).run()
      await db.prepare('INSERT OR REPLACE INTO admin_settings (key, value, updated_at) VALUES (?, ?, ?)').bind('admin_password_hash', newHash, new Date().toISOString()).run()
      await db.prepare('INSERT OR REPLACE INTO admin_settings (key, value, updated_at) VALUES (?, ?, ?)').bind('admin_username', newUsername, new Date().toISOString()).run()
      // Révoquer les sessions admin en cours : après un reset, un cookie encore
      // valide 24 h aurait laissé l'accès Ã  qui avait provoqué le reset.
      await bumpAdminTokenEpoch(db)
      logSecurityEvent(db, { event: 'admin_password_reset', severity: 'critical', ip, details: `Identifiant et mot de passe admin réinitialisés depuis ${ip}` })
    } catch(e) {
      console.error('Reset password error:', e)
      return c.redirect('/admin/reset-password?error=invalid')
    }
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
  return c.html(<AdminCommandesPage />)
})

// ============================================================
// ADMIN PAIEMENTS
// ============================================================

app.get('/admin/paiements', adminAuth, refreshAdminCache, async (c) => {
  const db = c.env.DB
  let payments: any[] = []
  if (db) {
    try {
      const rows = await db.prepare(
        `SELECT id, client_name, client_phone, client_email, status, total_price, type, notes, created_at, updated_at
        FROM orders
        ORDER BY created_at DESC
        LIMIT 500`
      ).all()
      payments = rows.results || []
    } catch (e) {
      console.error('Admin paiements load:', e)
    }
  }
  const statusFilter = c.req.query('status')
  const filtered = statusFilter ? payments.filter((p: any) => p.status === statusFilter) : payments
  // Calcul des stats depuis les commandes
  const stats = {
    total: payments.length,
    pending: payments.filter((p: any) => p.status === 'en_attente').length,
    completed: payments.filter((p: any) => ['confirme','en_livraison','livre'].includes(p.status)).length,
    failed: payments.filter((p: any) => p.status === 'annule').length,
    revenue: payments.filter((p: any) => ['confirme','en_livraison','livre'].includes(p.status)).reduce((sum: number, p: any) => sum + (p.total_price || 0), 0),
  }
  return c.html(<AdminPaiementsPage payments={filtered} stats={stats} />)
})

// ============================================================
// ADMIN MAINTENANCE
// ============================================================

app.get('/admin/maintenance', adminAuth, refreshAdminCache, async (c) => {
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
      let rRows: any
      try { rRows = await db.prepare('SELECT *, name as client_name, phone as client_phone FROM maintenance_requests ORDER BY id DESC LIMIT 200').all() }
      catch(_) { rRows = await db.prepare('SELECT *, client_name, client_phone FROM maintenance_requests ORDER BY id DESC LIMIT 200').all() }
      requests = (rRows.results || []) as any[]
    } catch(e) { console.error('Admin requests load:', e) }
    try {
      const vRows = await db.prepare('SELECT * FROM maintenance_visits ORDER BY visit_date ASC LIMIT 200').all()
      visits = (vRows.results || []) as any[]
    } catch(e) { console.error('Admin visits load:', e) }
  }
  const success = c.req.query('success') || ''
  const error = c.req.query('error') || ''
  return c.html(<AdminMaintenancePage contracts={contracts} requests={requests} visits={visits} success={success} error={error} />)
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
      await db.prepare('UPDATE maintenance_requests SET status = ?, updated_at = datetime(\'now\') WHERE id = ?').bind(status, requestId).run()
    } catch(e) { console.error('Request status update error:', e) }
  }
  return c.redirect(`/admin/maintenance?success=${status === 'cancelled' ? 'request_cancelled' : 'request_updated'}`)
})

app.post('/admin/maintenance/delete-request', adminAuth, async (c) => {
  const db = c.env.DB
  if (!db) return c.redirect('/admin/maintenance')
  const body = await c.req.parseBody()
  const requestId = parseInt(body['request_id'] as string || '0')
  if (requestId) {
    try {
      await db.prepare('DELETE FROM maintenance_requests WHERE id = ?').bind(requestId).run()
    } catch(e) { console.error('Delete request error:', e) }
  }
  return c.redirect('/admin/maintenance?success=request_deleted')
})

// Convertir une demande en contrat actif et planifier automatiquement ses visites
app.post('/admin/maintenance/convert-to-contract', adminAuth, async (c) => {
  const db = c.env.DB
  if (!db) return c.redirect('/admin/maintenance?error=no_db')
  const body = await c.req.parseBody()
  const requestId = parseInt(body['request_id'] as string || '0')
  if (!requestId) return c.redirect('/admin/maintenance?error=invalid_request')

  try {
    const req = await db.prepare('SELECT * FROM maintenance_requests WHERE id = ?').bind(requestId).first() as any
    if (!req) return c.redirect('/admin/maintenance?error=not_found')

    const clientName = req.name || req.client_name || 'Client'
    const clientPhone = req.phone || req.client_phone || ''
    const clientId = req.client_id || 0
    const rawPlan = (req.plan_type || 'residentiel').toLowerCase()

    let nbClims = req.nb_climatiseurs || 1
    let freq = req.frequence_visites || 'Confort'
    if (req.description) {
      const climMatch = req.description.match(/(\d+)\s*climatiseur/i)
      if (climMatch) nbClims = parseInt(climMatch[1]) || nbClims
      if (req.description.includes('Essentiel')) freq = 'Essentiel'
      else if (req.description.includes('Pro')) freq = 'Pro'
    }

    let visits = freq.toLowerCase().includes('essentiel') ? 1 : (freq.toLowerCase().includes('pro') ? 3 : 2)
    const getUnitRate = (cnt: number) => cnt <= 4 ? 8500 : cnt <= 8 ? 7500 : cnt <= 15 ? 6000 : 5000
    let price = (rawPlan === 'industriel' || rawPlan === 'sur_mesure') ? 0 : getUnitRate(nbClims) * nbClims * visits

    const startDate = req.preferred_date || new Date().toISOString().split('T')[0]
    const endDateObj = new Date(startDate)
    endDateObj.setMonth(endDateObj.getMonth() + 12)
    const endDate = endDateObj.toISOString().split('T')[0]

    const notes = `Formule: ${rawPlan.toUpperCase()} | ${nbClims} clim(s) | ${freq} | Quartier: ${req.quartier || '—'}`

    const contractId = await insertContractSafe(db, {
      clientId,
      clientName,
      clientPhone,
      planType: rawPlan,
      planPrice: price,
      startDate,
      endDate,
      status: 'actif',
      totalVisits: visits,
      notes
    })

    if (contractId) {
      await scheduleVisitsForContract(db, contractId, clientName, clientPhone, clientId, rawPlan, visits, startDate, 12)
      await db.prepare("UPDATE maintenance_requests SET status = 'done', admin_notes = ? WHERE id = ?").bind(`Contrat #${contractId} actif`, requestId).run()
      await notifyAdmin(c.env as any, 'maintenance', `Contrat #${contractId} CRÉÉ & VISITES PROGRAMMÉES pour ${clientName} (${clientPhone})`)
    }

    return c.redirect('/admin/maintenance?success=contract_created')
  } catch(e) {
    console.error('convert-to-contract error:', e)
    return c.redirect('/admin/maintenance?error=server_error')
  }
})

// Synchroniser toutes les demandes de contrat en attente en contrats actifs
app.post('/admin/maintenance/sync-pending-requests', adminAuth, async (c) => {
  const db = c.env.DB
  if (!db) return c.redirect('/admin/maintenance?error=no_db')

  try {
    const pending = await db.prepare("SELECT * FROM maintenance_requests WHERE (request_type = 'contrat' OR plan_type IS NOT NULL) AND status IN ('pending', 'contacted')").all()
    const rows = (pending?.results || []) as any[]
    let count = 0

    for (const req of rows) {
      const clientName = req.name || req.client_name || 'Client'
      const clientPhone = req.phone || req.client_phone || ''
      const clientId = req.client_id || 0
      const rawPlan = (req.plan_type || 'residentiel').toLowerCase()

      let nbClims = req.nb_climatiseurs || 1
      let freq = req.frequence_visites || 'Confort'
      if (req.description) {
        const climMatch = req.description.match(/(\d+)\s*climatiseur/i)
        if (climMatch) nbClims = parseInt(climMatch[1]) || nbClims
        if (req.description.includes('Essentiel')) freq = 'Essentiel'
        else if (req.description.includes('Pro')) freq = 'Pro'
      }

      let visits = freq.toLowerCase().includes('essentiel') ? 1 : (freq.toLowerCase().includes('pro') ? 3 : 2)
      const getUnitRate = (cnt: number) => cnt <= 4 ? 8500 : cnt <= 8 ? 7500 : cnt <= 15 ? 6000 : 5000
      let price = (rawPlan === 'industriel' || rawPlan === 'sur_mesure') ? 0 : getUnitRate(nbClims) * nbClims * visits

      const startDate = req.preferred_date || new Date().toISOString().split('T')[0]
      const endDateObj = new Date(startDate)
      endDateObj.setMonth(endDateObj.getMonth() + 12)
      const endDate = endDateObj.toISOString().split('T')[0]

      const notes = `Formule: ${rawPlan.toUpperCase()} | ${nbClims} clim(s) | ${freq} | Quartier: ${req.quartier || '—'}`

      const contractId = await insertContractSafe(db, {
        clientId,
        clientName,
        clientPhone,
        planType: rawPlan,
        planPrice: price,
        startDate,
        endDate,
        status: 'actif',
        totalVisits: visits,
        notes
      })

      if (contractId) {
        await scheduleVisitsForContract(db, contractId, clientName, clientPhone, clientId, rawPlan, visits, startDate, 12)
        await db.prepare("UPDATE maintenance_requests SET status = 'done', admin_notes = ? WHERE id = ?").bind(`Contrat #${contractId} actif`, req.id).run()
        count++
      }
    }

    return c.redirect(`/admin/maintenance?success=all_contracts_created&count=${count}`)
  } catch(e) {
    console.error('sync-pending-requests error:', e)
    return c.redirect('/admin/maintenance?error=server_error')
  }
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
      await db.prepare(`UPDATE maintenance_visits SET status = ?, updated_at = datetime('now') WHERE id = ?`).bind(status, visitId).run()
      if (status === 'effectuee' || status === 'annulee') {
        const visit = await db.prepare('SELECT contract_id FROM maintenance_visits WHERE id = ?').bind(visitId).first() as any
        if (visit?.contract_id) {
          const countRes = await db.prepare("SELECT COUNT(*) as cnt FROM maintenance_visits WHERE contract_id = ? AND status = 'effectuee'").bind(visit.contract_id).first() as any
          await db.prepare(`UPDATE maintenance_contracts SET completed_visits = ?, updated_at = datetime('now') WHERE id = ?`).bind(countRes?.cnt || 0, visit.contract_id).run()
        }
      }
    } catch(e) { console.error('Visit status update error:', e) }
  }
  return c.redirect('/admin/maintenance')
})

app.post('/admin/maintenance/delete-visit', adminAuth, async (c) => {
  const db = c.env.DB
  if (!db) return c.redirect('/admin/maintenance')
  const body = await c.req.parseBody()
  const visitId = parseInt(body['visit_id'] as string || '0')
  if (visitId) {
    try {
      const visit = await db.prepare('SELECT contract_id FROM maintenance_visits WHERE id = ?').bind(visitId).first() as any
      await db.prepare('DELETE FROM maintenance_visits WHERE id = ?').bind(visitId).run()
      if (visit?.contract_id) {
        const countRes = await db.prepare("SELECT COUNT(*) as cnt FROM maintenance_visits WHERE contract_id = ? AND status = 'effectuee'").bind(visit.contract_id).first() as any
        const nextVisit = await db.prepare("SELECT visit_date FROM maintenance_visits WHERE contract_id = ? AND status IN ('planifiee','confirmee') ORDER BY visit_date ASC LIMIT 1").bind(visit.contract_id).first() as any
        await db.prepare("UPDATE maintenance_contracts SET completed_visits = ?, next_visit_date = ?, updated_at = datetime('now') WHERE id = ?")
          .bind(countRes?.cnt || 0, nextVisit?.visit_date || null, visit.contract_id).run()
      }
    } catch(e) { console.error('Delete visit error:', e) }
  }
  return c.redirect('/admin/maintenance?success=visit_deleted')
})

// Ajouter une visite manuellement
app.post('/admin/maintenance/add-visit', adminAuth, async (c) => {
  const db = c.env.DB
  if (!db) return c.redirect('/admin/maintenance')
  const body = await c.req.parseBody()
  const contractId = parseInt(body['contract_id'] as string || '0')
  const clientName = (body['client_name'] as string || '').trim()
  const clientPhone = (body['client_phone'] as string || '').trim()
  const visitDate = (body['visit_date'] as string || '').trim()
  const visitType = (body['visit_type'] as string || 'preventive').trim()
  const technician = (body['technician'] as string || '').trim()
  const description = (body['description'] as string || '').trim()

  if (!clientName || !visitDate) {
    return c.redirect('/admin/maintenance?error=invalid_visit_data')
  }

  try {
    let clientId = 0
    if (contractId) {
      const cRow = await db.prepare('SELECT client_id, client_name, client_phone FROM maintenance_contracts WHERE id = ?').bind(contractId).first() as any
      if (cRow) clientId = cRow.client_id || 0
    }

    await db.prepare(
      `INSERT INTO maintenance_visits (contract_id, client_id, client_name, client_phone, visit_type, visit_date, status, technician, description)
       VALUES (?, ?, ?, ?, ?, ?, 'planifiee', ?, ?)`
    ).bind(
      contractId || null,
      clientId,
      sanitizeText(clientName, 120),
      sanitizeText(clientPhone, 20),
      visitType,
      visitDate,
      technician ? sanitizeText(technician, 120) : null,
      description ? sanitizeText(description, 1000) : 'Visite programmée manuellement'
    ).run()

    if (contractId) {
      const nextVisit = await db.prepare("SELECT visit_date FROM maintenance_visits WHERE contract_id = ? AND status IN ('planifiee','confirmee') ORDER BY visit_date ASC LIMIT 1").bind(contractId).first() as any
      if (nextVisit?.visit_date) {
        await db.prepare("UPDATE maintenance_contracts SET next_visit_date = ?, updated_at = datetime('now') WHERE id = ?").bind(nextVisit.visit_date, contractId).run()
      }
    }
  } catch(e) { console.error('Add visit error:', e) }
  return c.redirect('/admin/maintenance?success=visit_added')
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

  if (!visitId || !technician) {
    return c.redirect('/admin/maintenance?error=visite_incomplete')
  }
  try {
    const res = await db.prepare(
      `UPDATE maintenance_visits SET status = 'effectuee', technician = ?, actions_performed = ?, gas_recharged = ?, filters_cleaned = ?, notes = ?, updated_at = datetime('now') WHERE id = ?`
    ).bind(sanitizeText(technician, 120), sanitizeText(actionsPerformed, 2000), gasRecharged, filtersCleaned, sanitizeText(notes, 2000), visitId).run()
    if (!res?.meta?.changes) {
      return c.redirect('/admin/maintenance?error=visite_introuvable')
    }

    const visit = await db.prepare('SELECT contract_id FROM maintenance_visits WHERE id = ?').bind(visitId).first() as any
    if (visit?.contract_id) {
      const countRes = await db.prepare("SELECT COUNT(*) as cnt FROM maintenance_visits WHERE contract_id = ? AND status = 'effectuee'").bind(visit.contract_id).first() as any
      const completedCount = countRes?.cnt || 0
      const nextVisit = await db.prepare("SELECT visit_date FROM maintenance_visits WHERE contract_id = ? AND status IN ('planifiee','confirmee') ORDER BY visit_date ASC LIMIT 1").bind(visit.contract_id).first() as any
      await db.prepare(`UPDATE maintenance_contracts SET completed_visits = ?, next_visit_date = ?, updated_at = datetime('now') WHERE id = ?`)
        .bind(completedCount, nextVisit?.visit_date || null, visit.contract_id).run()
    }
  } catch(e) {
    console.error('Visit validation error:', e)
    return c.redirect('/admin/maintenance?error=visite_echec')
  }
  return c.redirect('/admin/maintenance?success=visite_validee')
})

// Valider / Activer un contrat de maintenance et programmer ses visites
app.post('/api/admin/maintenance/validate-contract', adminAuth, async (c) => {
  const db = c.env.DB
  if (!db) return c.json({ error: 'DB unavailable' }, 503)
  let body: any = {}
  const contentType = c.req.header('content-type') || ''
  try {
    if (contentType.includes('application/json')) {
      body = await c.req.json().catch(() => ({}))
    } else {
      body = await c.req.parseBody().catch(() => ({}))
    }
  } catch(e) {}
  const contractId = parseInt(body.contract_id || '0')
  if (!contractId) return c.json({ error: 'contract_id requis' }, 400)

  try {
    const contract = await db.prepare('SELECT * FROM maintenance_contracts WHERE id = ?').bind(contractId).first() as any
    if (!contract) return c.json({ error: 'Contrat introuvable' }, 404)

    if (contract.status === 'actif') {
      return c.req.header('content-type')?.includes('application/json')
        ? c.json({ success: true, message: 'Contrat déjà actif — aucune action' })
        : c.redirect('/admin/maintenance?success=contract_already_active')
    }

    await db.prepare("UPDATE maintenance_contracts SET status = 'actif', updated_at = datetime('now') WHERE id = ?").bind(contractId).run()

    // Planifier les visites selon la formule et total_visits
    const totalVisits = contract.total_visits || (contract.plan_type === 'annuel' ? 1 : (contract.plan_type === 'trimestriel' || contract.plan_type === 'industriel' ? 3 : 2))
    const startDate = contract.start_date || new Date().toISOString().split('T')[0]
    await scheduleVisitsForContract(db, contractId, contract.client_name, contract.client_phone, contract.client_id, contract.plan_type, totalVisits, startDate, 12)

    await notifyAdmin(c.env as any, 'maintenance', `Contrat #${contractId} (${contract.plan_type}) ACTIVÉ avec ${totalVisits} visite(s) — ${contract.client_name}`)

    const isJson = c.req.header('content-type')?.includes('application/json')
    if (isJson) {
      return c.json({ success: true, message: 'Contrat activé et visites planifiées' })
    } else {
      return c.redirect('/admin/maintenance?success=contract_validated')
    }
  } catch (e) {
    console.error('validate-contract error:', e)
    return c.json({ error: 'Erreur serveur' }, 500)
  }
})


// â”€â”€ Refuser un contrat de maintenance (pending â†’ cancelled) â”€â”€
app.post('/api/admin/maintenance/refuse-contract', adminAuth, async (c) => {
  const db = c.env.DB
  if (!db) return c.json({ error: 'DB unavailable' }, 503)
  let body: any = {}
  const contentType = c.req.header('content-type') || ''
  try {
    if (contentType.includes('application/json')) {
      body = await c.req.json().catch(() => ({}))
    } else {
      body = await c.req.parseBody().catch(() => ({}))
    }
  } catch(e) {}
  const contractId = parseInt(body.contract_id || '0')
  const reason = (body.reason || '').trim()
  if (!contractId) return c.json({ error: 'contract_id requis' }, 400)

  try {
    const contract = await db.prepare('SELECT * FROM maintenance_contracts WHERE id = ?').bind(contractId).first() as any
    if (!contract) return c.json({ error: 'Contrat introuvable' }, 404)

    await db.prepare("UPDATE maintenance_contracts SET status = 'annule', notes = ?, updated_at = datetime('now') WHERE id = ?")
      .bind(reason ? `Refusé : ${reason}` : 'Refusé par admin', contractId).run()

    await notifyAdmin(c.env as any, 'maintenance', `Contrat #${contractId} (${contract.plan_type}) REFUSÉ — ${contract.client_name}`)

    await sendSmsWithLog(c.env, db, contract.client_phone,
      `Bonjour ${contract.client_name}, votre demande de contrat de maintenance MAASGA (${contract.plan_type}) ne peut pas être traitée pour le moment. Contactez-nous au +226 55 99 64 18 pour plus d'informations.`
    )

    const isJson = c.req.header('content-type')?.includes('application/json')
    if (isJson) {
      return c.json({ success: true, message: 'Contrat refusé' })
    } else {
      return c.redirect('/admin/maintenance?success=contract_refused')
    }
  } catch (e) {
    console.error('refuse-contract error:', e)
    return c.json({ error: 'Erreur serveur' }, 500)
  }
})

// â”€â”€ Supprimer définitivement un contrat de maintenance et ses visites â”€â”€
app.post('/api/admin/maintenance/delete-contract', adminAuth, async (c) => {
  const db = c.env.DB
  if (!db) return c.json({ error: 'DB unavailable' }, 503)
  let body: any = {}
  const contentType = c.req.header('content-type') || ''
  try {
    if (contentType.includes('application/json')) {
      body = await c.req.json().catch(() => ({}))
    } else {
      body = await c.req.parseBody().catch(() => ({}))
    }
  } catch(e) {}
  const contractId = parseInt(body.contract_id || '0')
  if (!contractId) return c.json({ error: 'contract_id requis' }, 400)

  try {
    // Supprimer les visites associées d'abord
    await db.prepare("DELETE FROM maintenance_visits WHERE contract_id = ?").bind(contractId).run()
    
    // Supprimer le contrat
    await db.prepare("DELETE FROM maintenance_contracts WHERE id = ?").bind(contractId).run()

    // Notification admin
    await notifyAdmin(c.env as any, 'maintenance', `Contrat #${contractId} SUPPRIMÉ définitivement par admin`)

    const isJson = c.req.header('content-type')?.includes('application/json')
    if (isJson) {
      return c.json({ success: true, message: 'Contrat et visites supprimés définitivement' })
    } else {
      return c.redirect('/admin/maintenance?success=contract_deleted')
    }
  } catch (e) {
    console.error('delete-contract error:', e)
    return c.json({ error: 'Erreur serveur' }, 500)
  }
})

app.get('/admin/avis', adminAuth, refreshAdminCache, async (c) => {
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

app.get('/admin/messages', adminAuth, refreshAdminCache, async (c) => {
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

app.get('/admin/realisations', adminAuth, refreshAdminCache, async (c) => {
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
      `INSERT INTO realisations (title, description, category, client_name, quartier, image_url, date_realisation, is_featured, is_visible, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))`
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
      `UPDATE realisations SET title=?, description=?, category=?, client_name=?, quartier=?, image_url=?, date_realisation=?, is_featured=?, is_visible=?, updated_at=datetime('now') WHERE id=?`
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
  let s = String(val)
  // Injection de formule : Excel et LibreOffice évaluent une cellule qui commence
  // par = + - @ (ou tabulation / retour chariot), ce qui permet Ã  un client
  // d'exécuter du code sur le poste de l'admin qui ouvre l'export (=cmd|...).
  // On préfixe par une apostrophe pour forcer l'interprétation en texte, sauf pour
  // les nombres (les prix négatifs restent lisibles).
  if (/^[=+\-@\t\r]/.test(s) && !/^-?\d+(?:[.,]\d+)?$/.test(s)) s = "'" + s
  s = s.replace(/"/g, '""')
  return /[",\n\r]/.test(s) ? `"${s}"` : s
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

// Admin: mettre Ã  jour le statut d'un ticket
app.post('/api/admin/sav/update-status', adminAuth, async (c) => {
  const db = c.env.DB
  if (!db) return c.json({ error: 'DB non disponible' }, 503)
  const body = await c.req.parseBody()
  const id = body['id'] as string
  const status = body['status'] as string
  const resolution_notes = (body['resolution_notes'] as string || '').trim()
  const resolved_at = (status === 'resolu' || status === 'ferme') ? new Date().toISOString() : null
  await db.prepare(`UPDATE sav_tickets SET status = ?, resolution_notes = ?, resolved_at = COALESCE(?, resolved_at), updated_at = datetime('now') WHERE id = ?`).bind(status, resolution_notes, resolved_at, id).run()
  return c.redirect(`/admin/sav/${id}?success=statut_modifie`)
})

// Admin: ajouter un message Ã  un ticket
app.post('/api/admin/sav/message', adminAuth, async (c) => {
  const db = c.env.DB
  if (!db) return c.json({ error: 'DB non disponible' }, 503)
  const body = await c.req.parseBody()
  const ticket_id = body['ticket_id'] as string
  const message = (body['message'] as string || '').trim()
  if (!message) return c.redirect(`/admin/sav/${ticket_id}?error=message_vide`)
  await db.prepare(`INSERT INTO sav_ticket_messages (ticket_id, sender_type, sender_name, message) VALUES (?, 'admin', 'Admin', ?)`).bind(ticket_id, message).run()
  await db.prepare(`UPDATE sav_tickets SET updated_at = datetime('now') WHERE id = ?`).bind(ticket_id).run()
  return c.redirect(`/admin/sav/${ticket_id}`)
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
  // Cet export contient l'intégralité des données clients : on le limite en débit
  // et on le trace, sinon une session volée pouvait aspirer la base en silence.
  const ip = c.req.header('cf-connecting-ip') || 'unknown'
  const backupRl = await rateLimitD1(db, `admin-backup:${ip}`, 3, 60 * 60 * 1000)
  if (!backupRl.allowed) {
    logSecurityEvent(db, { event: 'admin_backup_rate_limit', severity: 'warn', ip, details: `Export de sauvegarde limité pour ${ip}` })
    return c.json({ error: 'Trop d\'exports. Réessayez dans une heure.' }, 429)
  }
  const tables = ['products', 'clients', 'appointments', 'orders', 'reviews', 'contact_messages', 'maintenance_contracts', 'sav_tickets', 'sav_ticket_messages', 'stock_movements', 'site_settings', 'user_activity_log', 'realisations']
  const backup: Record<string, any[]> = {}
  for (const table of tables) {
    try {
      const rows = (await db.prepare(`SELECT * FROM ${table}`).all())?.results || []
      backup[table] = rows as any[]
    } catch(_) {
      backup[table] = []
    }
  }
  const totalRows = Object.values(backup).reduce((n, rows) => n + rows.length, 0)
  logSecurityEvent(db, { event: 'admin_backup_export', severity: 'warn', ip, details: `Export de ${totalRows} lignes` })
  await logAdminAudit(db, { action: 'backup_export', detail: `${totalRows} lignes sur ${tables.length} tables`, ip, userAgent: c.req.header('User-Agent') })
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
    await db.prepare(`INSERT OR REPLACE INTO site_settings (key, value, updated_at) VALUES (?, ?, datetime('now'))`).bind(key, val).run()
  }
  return c.redirect('/admin/parametres?success=settings')
})

app.post('/api/admin/change-password', adminAuth, async (c) => {
  const ip = c.req.header('cf-connecting-ip') || 'unknown'
  // Rate limit: max 5 attempts per 15 min to prevent brute force (persistant en D1)
  const pwdRl = await rateLimitD1(c.env?.DB, `admin-pwd-change:${ip}`, 5, 15 * 60 * 1000)
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
    // ADMIN_SECRET n'est plus accepté comme mot de passe d'amorçage (cf. /api/admin/login)
    const initPwd = c.env.ADMIN_INITIAL_PASSWORD
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
    } catch(e) {
      console.error('Error saving admin credentials:', e)
      return c.redirect('/admin/parametres?error=db')
    }
  }
  // Audit log: password change successful
  logSecurityEvent(db, { event: 'admin_pwd_changed', severity: 'warn', ip, details: `Admin password changed successfully from ${ip}` })
  logActivity(db, { clientId: 0, action: 'Mot de passe admin modifié', category: 'admin', details: `Depuis IP: ${ip}`, ip })
  await logAdminAudit(db, { action: 'admin_password_changed', detail: newUsername ? `Identifiant également modifié` : 'Mot de passe seul', ip, userAgent: c.req.header('User-Agent') })
  // Révoquer toutes les sessions admin : changer de mot de passe doit déconnecter
  // un éventuel intrus dont le cookie serait encore valable 24 h. La session
  // courante est réémise juste en dessous avec la nouvelle epoch.
  await bumpAdminTokenEpoch(db)
  const freshEpoch = await getAdminTokenEpoch(db)
  let freshCookie = ''
  try {
    const token = await signToken(`admin_${freshEpoch}_${Date.now()}`, getAdminSecret(c.env))
    freshCookie = `maasga_admin=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=86400`
  } catch { /* ADMIN_SECRET absent : l'admin sera simplement renvoyé au login */ }
  const headers: Record<string, string> = { 'Location': '/admin/parametres?success=pwd' }
  if (freshCookie) headers['Set-Cookie'] = freshCookie
  return new Response(null, { status: 302, headers })
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
        <div style="width:44px; height:44px; background:rgba(52,211,153,0.15); border-radius:12px; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:20px;">ðŸ’¡</div>
        <div style="flex:1;">
          <div style="font-weight:700; color:#34d399; margin-bottom:4px;">Économies estimées avec Inverter</div>
          <div style="font-size:13px; color:#6b7280; line-height:1.6;">Pour un climatiseur ${btu.toLocaleString('fr-FR')} BTU, la technologie Inverter réduit votre consommation d'environ <strong style="color:#34d399;">30%</strong>, soit une économie annuelle estimée Ã  :</div>
          <div style="font-size:28px; font-weight:800; color:#34d399; margin:8px 0;">${savings.toLocaleString('fr-FR')} FCFA <span style="font-size:14px; font-weight:500; color:#6b7280;">/ an</span></div>
          <div style="font-size:11px; color:#9ca3af;">Estimation basée sur 8h/jour, 300 jours/an et un tarif de 100 FCFA/kWh</div>
        </div>
      </div>
    </div>`
  }

  const acceptFormHtml = !isAccepted && !isExpired ? `
    <div style="text-align:center; padding:32px 20px; background:linear-gradient(135deg,rgba(56,189,248,0.06),rgba(99,102,241,0.06)); border-radius:16px; border:1px solid rgba(56,189,248,0.15); margin:24px 0;">
      <div style="font-size:18px; font-weight:700; color:#e2e8f0; margin-bottom:8px;">âœ… Accepter ce devis ?</div>
      <p style="color:#94a3b8; font-size:14px; margin-bottom:20px;">En acceptant, vous confirmez votre accord sur les conditions ci-dessus.<br>Notre équipe vous contactera sous 24h pour planifier l'intervention.</p>
      <form method="post" action="/api/devis/${d.token}/accept" style="display:inline;">
        <button type="submit" style="background:linear-gradient(135deg,#059669,#10b981); color:white; font-weight:700; font-size:15px; padding:14px 32px; border-radius:12px; border:none; cursor:pointer; display:inline-flex; align-items:center; gap:10px; box-shadow:0 4px 15px rgba(16,185,129,0.3);">
          J'accepte ce devis — ${total.toLocaleString('fr-FR')} FCFA
        </button>
      </form>
      <div style="margin-top:16px;">
        <a href="https://wa.me/22655996418?text=${encodeURIComponent('Bonjour, je souhaite discuter du devis ' + d.numero)}" style="display:inline-flex; align-items:center; gap:8px; background:rgba(37,211,102,0.1); color:#25D366; font-weight:600; font-size:13px; padding:10px 20px; border-radius:10px; text-decoration:none; border:1px solid rgba(37,211,102,0.25);">
          <span style="font-size:18px;">ðŸ’¬</span> Poser une question par WhatsApp
        </a>
      </div>
    </div>` : isAccepted ? `
    <div style="text-align:center; padding:24px; background:rgba(52,211,153,0.08); border-radius:16px; border:1px solid rgba(52,211,153,0.2); margin:24px 0;">
      <div style="font-size:24px; margin-bottom:8px;">ðŸŽ‰</div>
      <div style="font-size:18px; font-weight:700; color:#34d399;">Devis accepté — Merci !</div>
      <p style="color:#94a3b8; font-size:13px; margin-top:6px;">Notre équipe va vous contacter très prochainement.</p>
    </div>` : `
    <div style="text-align:center; padding:24px; background:rgba(239,68,68,0.08); border-radius:16px; border:1px solid rgba(239,68,68,0.2); margin:24px 0;">
      <div style="font-size:18px; font-weight:700; color:#f87171;">âš ï¸ Ce devis est expiré</div>
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
  .header::before { content: 'â„ï¸'; position: absolute; right: 20px; top: 50%; transform: translateY(-50%); font-size: 64px; opacity: 0.12; }
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
      <div class="logo-icon">â„ï¸</div>
      <div>
        <div class="logo-text">MAASGA</div>
        <div class="logo-sub">Froid & Climatisation · Ouagadougou</div>
      </div>
    </div>
    <div class="devis-num">${escapeHtml(d.numero)}</div>
    <div class="devis-date">Émis le ${createdStr}</div>
    <div>
      <span class="status-pill ${isAccepted ? 'status-accepted' : isExpired ? 'status-expired' : 'status-sent'}">
        ${isAccepted ? 'âœ“ Devis accepté' : isExpired ? 'âš  Expiré' : 'â³ En attente de validation'}
      </span>
    </div>
  </div>

  ${!isAccepted && !isExpired && daysLeft <= 7 ? `
  <div class="expiry-banner">
    <span style="font-size:18px;">â°</span>
    <span>Ce devis expire dans <strong>${daysLeft} jour${daysLeft > 1 ? 's' : ''}</strong> — ${expiryStr}. Acceptez avant cette date.</span>
  </div>` : !isAccepted && !isExpired && expiryStr ? `
  <div style="background:rgba(56,189,248,0.05); border:1px solid rgba(56,189,248,0.12); border-radius:12px; padding:10px 16px; font-size:12px; color:#38bdf8; margin-bottom:16px;">
    âœ“ Devis valable jusqu'au ${expiryStr} · ${daysLeft} jours restants
  </div>` : ''}

  <div class="section">
    <div class="section-title">ðŸ‘¤ Client</div>
    <div class="info-row"><span class="info-label">Nom</span><span class="info-val">${escapeHtml(d.client_name || '')}</span></div>
    <div class="info-row"><span class="info-label">Téléphone</span><span class="info-val">${escapeHtml(d.client_phone || '')}</span></div>
    ${d.client_email ? `<div class="info-row"><span class="info-label">Email</span><span class="info-val">${escapeHtml(d.client_email)}</span></div>` : ''}
    ${d.client_quartier ? `<div class="info-row"><span class="info-label">Adresse</span><span class="info-val">${escapeHtml(d.client_quartier)}, Ouagadougou</span></div>` : ''}
  </div>

  ${(d.surface || d.btu_recommande) ? `
  <div class="section">
    <div class="section-title">ðŸ“ Données techniques</div>
    ${d.surface ? `<div class="info-row"><span class="info-label">Surface Ã  climatiser</span><span class="info-val">${Number(d.surface).toLocaleString('fr-FR')} mÂ²</span></div>` : ''}
    ${d.btu_recommande ? `<div class="info-row"><span class="info-label">Puissance recommandée</span><span class="info-val">${Number(d.btu_recommande).toLocaleString('fr-FR')} BTU / ${Number(d.btu_recommande) === 9000 ? '1' : Number(d.btu_recommande) === 12000 ? '1,5' : Number(d.btu_recommande) === 18000 ? '2' : Number(d.btu_recommande) === 24000 ? '3' : '5'} CV</span></div>` : ''}
  </div>` : ''}

  <div class="section">
    <div class="section-title">ðŸ“‹ Détail du devis</div>
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
          <td>Main d'Å“uvre &amp; installation</td>
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
          <td class="td-right" style="padding-bottom:8px;">âˆ’ ${remiseMt.toLocaleString('fr-FR')}</td>
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
    <div class="section-title" style="color:#a78bfa;">ðŸ’¬ Message de l'équipe MAASGA</div>
    <p style="font-size:14px; color:#cbd5e1; line-height:1.7; white-space:pre-wrap;">${escapeHtml(d.message_client)}</p>
  </div>` : ''}

  <div class="section" style="background:rgba(56,189,248,0.03);">
    <div class="section-title">âœ… Nos engagements</div>
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
      ${[
        ['🔧', 'Techniciens certifiés', 'Équipe qualifiée'],
        ['ðŸ›¡ï¸', 'Garantie installation', "12 mois pièces et main d'Å“uvre"],
        ['ðŸ“ž', 'SAV rapide', 'Intervention sous 48h'],
        ['ðŸ’¯', 'Satisfaction garantie', 'Ou intervention gratuite']
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
        ðŸ–¨ï¸ Télécharger le devis en PDF
      </a>
    </div>
    <strong>MAASGA — Froid &amp; Climatisation</strong><br>
    ðŸ“ž +226 55 99 64 18 &nbsp;|&nbsp; Ouagadougou, Burkina Faso<br>
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
    const surfMatch = rdv.notes.match(/(\d+(?:\.\d+)?)\s*mÂ²/)
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
    const origineLabels: Record<string, string> = { appel: 'Appel entrant', visite: 'Visite physique', recommandation: 'Recommandation', reseaux: 'Réseaux sociaux', publicite: 'Publicité', bouche_a_oreille: 'Bouche-Ã -oreille' }
    const urgenceLabels: Record<string, string> = { urgent: 'âš¡ Urgent', tres_urgent: 'ðŸ”´ Très urgent' }
    const ctxParts: string[] = []
    if (origine && origineLabels[origine]) ctxParts.push(`Origine: ${origineLabels[origine]}`)
    if (urgence && urgenceLabels[urgence]) ctxParts.push(urgenceLabels[urgence])
    if (ctxParts.length) notesInternes = ctxParts.join(' | ') + (notesInternes ? '\n' + notesInternes : '')

    await db.prepare(`INSERT INTO devis (rdv_id,order_id,numero,client_name,client_phone,client_email,client_quartier,surface,btu_recommande,produit_nom,produit_prix,produit_quantite,installation_prix,accessoires,remise,total_ht,message_client,notes_internes,token,status,expires_at,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
      .bind(rdvId, orderId, numero, body['client_name'], body['client_phone'], body['client_email'] || null, body['client_quartier'] || null, body['surface'] ? parseFloat(body['surface'] as string) : null, body['btu_recommande'] ? parseInt(body['btu_recommande'] as string) : null, body['produit_nom'] || null, prodPrix, prodQty, installPrix, JSON.stringify(accs), remise, totalHt, body['message_client'] || null, notesInternes || null, token, status, expiresAt, now, now)
      .run()

    // If linked to an order, always sync to order_devis so client can see it in their portal
    // Draft â†’ 'pending' status in order_devis (visible but client can act); Sent â†’ 'sent'
    if (orderId) {
      const linkedOrder = await db.prepare('SELECT * FROM orders WHERE id = ?').bind(orderId).first() as any
      if (linkedOrder) {
        const orderDevisStatus = isSendAction ? 'sent' : 'pending'
        // Upsert: if already exists update it, otherwise insert
        const existing = await db.prepare(`SELECT id FROM order_devis WHERE order_id = ? AND status NOT IN ('validated','refused') ORDER BY id DESC`).bind(orderId).first() as any
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
              "Devis d'installation",
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
        // Envoi effectif du devis : la commande passe Ã  Â« contacte Â»
        // ('devis_en_attente' n'existe plus dans le CHECK depuis la migration 0036)
        if (isSendAction) {
          await db.prepare('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?')
            .bind('contacte', now, orderId).run()
          const memOrder = orders.find(o => o.id === orderId)
          if (memOrder) memOrder.status = 'contacte' as any
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
                    htmlContent: `<html><body style="font-family:Arial,sans-serif;padding:20px;max-width:600px;margin:0 auto;"><h2 style="color:#d97706;">â„ Devis d'installation disponible</h2><p>Bonjour ${escapeHtml(linkedOrder.client_name)},</p><p>Un devis d'installation a été préparé pour votre commande #${orderId}. Connectez-vous Ã  votre espace client pour le consulter et le valider :</p><p><a href="https://maasga.com/espace-client" style="display:inline-block;background:#d97706;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:bold;">Voir et valider le devis</a></p><p style="color:#6b7280;font-size:12px;">MAASGA SARL — Solutions Climatisation & Maintenance — Ouagadougou, Burkina Faso</p></body></html>`
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
              ? `<tr><td style="padding:8px 12px;">${escapeHtml(body['produit_nom'] as string)} Ã— ${prodQty}</td><td style="padding:8px 12px;text-align:right;font-weight:600;">${(prodPrix * prodQty).toLocaleString('fr-FR')} FCFA</td></tr>` : ''
            const installRow = installPrix > 0
              ? `<tr><td style="padding:8px 12px;">Main d'Å“uvre / Installation</td><td style="padding:8px 12px;text-align:right;font-weight:600;">${installPrix.toLocaleString('fr-FR')} FCFA</td></tr>` : ''
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
            emailErrMsg = "Erreur lors de l'envoi de l'email"
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
    // generate, send (legacy), default â†’ show detail page
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
    const prodRow = devis.produit_nom ? `<tr><td style="padding:8px 12px;">${escapeHtml(devis.produit_nom)} Ã— ${Number(devis.produit_quantite) || 1}</td><td style="padding:8px 12px;text-align:right;font-weight:600;">${prodTotal.toLocaleString('fr-FR')} FCFA</td></tr>` : ''
    const installRow = Number(devis.installation_prix) > 0 ? `<tr><td style="padding:8px 12px;">Main d'Å“uvre / Installation</td><td style="padding:8px 12px;text-align:right;font-weight:600;">${Number(devis.installation_prix).toLocaleString('fr-FR')} FCFA</td></tr>` : ''
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
    if (!devis) return c.html('<html><body style="background:#0b1120;color:#fff;font-family:sans-serif;text-align:center;padding:80px 20px;"><h1>Devis introuvable</h1><p style="color:#6b7280;">Ce lien est invalide ou expiré.</p><br><a href="/" style="color:#38bdf8;">â† MAASGA</a></body></html>', 404)
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
  <button class="print-btn print-btn-primary" onclick="window.print()">ðŸ–¨ï¸ Imprimer / Télécharger PDF</button>
  <a class="print-btn print-btn-secondary" href="/devis/${escapeHtml(d.token)}">â† Retour au devis</a>
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
          ðŸ“ Ouagadougou, Burkina Faso<br>
          ðŸ“ž +226 55 99 64 18<br>
          âœ‰ï¸ maasgabf@gmail.com<br>
          ðŸ• Lun–Dim · 8h00–18h00
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
        ${isAccepted ? 'âœ“ Accepté' + (acceptedStr ? ' le ' + acceptedStr : '') : d.status === 'sent' ? 'â³ En attente' : 'ðŸ“‹ ' + (d.status || 'Brouillon')}
      </span>
    </div>
  </div>

  <!-- CLIENT + TECHNIQUE -->
  <div class="info-grid">
    <div class="info-card">
      <div class="info-card-title">ðŸ‘¤ Informations client</div>
      <div class="info-row"><span class="info-label">Nom</span><span class="info-val">${escapeHtml(d.client_name || '')}</span></div>
      <div class="info-row"><span class="info-label">Téléphone</span><span class="info-val">${escapeHtml(d.client_phone || '')}</span></div>
      ${d.client_email ? `<div class="info-row"><span class="info-label">Email</span><span class="info-val">${escapeHtml(d.client_email)}</span></div>` : ''}
      ${d.client_quartier ? `<div class="info-row"><span class="info-label">Adresse</span><span class="info-val">${escapeHtml(d.client_quartier)}, Ouagadougou</span></div>` : ''}
    </div>
    <div class="info-card">
      <div class="info-card-title">ðŸ¢ Émetteur</div>
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
    ${d.surface ? `<div class="tech-card"><div class="tech-val">${Number(d.surface).toLocaleString('fr-FR')} mÂ²</div><div class="tech-label">Surface</div></div>` : ''}
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
        <td class="right">âˆ’ ${remiseMt.toLocaleString('fr-FR')} FCFA</td>
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
    <div class="engage-item"><span class="engage-icon">ðŸ›¡ï¸</span><span><strong>Garantie 12 mois</strong> — Pièces et main d'Å“uvre</span></div>
    <div class="engage-item"><span class="engage-icon">ðŸ“ž</span><span><strong>SAV rapide</strong> — Intervention sous 48h</span></div>
    <div class="engage-item"><span class="engage-icon">ðŸ’¯</span><span><strong>Satisfaction garantie</strong> — Ou reprise gratuite</span></div>
  </div>

  ${d.message_client ? `
  <div style="background:#f0f9ff; border:1px solid #bae6fd; border-radius:10px; padding:16px; margin:20px 0;">
    <div style="font-size:11px; font-weight:700; color:#0077b6; text-transform:uppercase; letter-spacing:0.06em; margin-bottom:6px;">ðŸ’¬ Message de l'équipe</div>
    <p style="font-size:13px; color:#334155; line-height:1.7; white-space:pre-wrap;">${escapeHtml(d.message_client)}</p>
  </div>` : ''}

  <!-- CONDITIONS -->
  <div class="conditions">
    <div class="conditions-title">ðŸ“‹ Conditions générales</div>
    â€¢ Ce devis est valable ${expiryStr ? `jusqu'au ` + expiryStr : `30 jours Ã  compter de la date d'émission`}.<br>
    â€¢ Aucun paiement n'est requis avant accord du client et visite technique sur site.<br>
    â€¢ Le montant définitif peut être ajusté si les conditions réelles diffèrent du dimensionnement initial.<br>
    â€¢ TVA non applicable (régime simplifié).<br>
    â€¢ L'installation comprend : mise en service, test complet et formation d'utilisation.
  </div>

  <!-- FOOTER -->
  <div class="footer">
    <strong>MAASGA — Froid & Climatisation</strong><br>
    ðŸ“ Ouagadougou, Burkina Faso &nbsp;|&nbsp; ðŸ“ž +226 55 99 64 18 &nbsp;|&nbsp; âœ‰ï¸ maasgabf@gmail.com<br>
    ðŸ• Lundi – Dimanche · 8h00 – 18h00<br><br>
    <em>Merci pour votre confiance. L'équipe MAASGA reste Ã  votre disposition.</em>
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

  // Modifier status en D1 (référence) avant le cache mémoire
  const db = c.env.DB
  if (db) {
    try {
      const res = await db.prepare('UPDATE appointments SET status = ? WHERE id = ?').bind(status, id).run()
      if (!res?.meta?.changes) return c.redirect('/admin/rdv?error=' + encodeURIComponent('Rendez-vous introuvable'))
    } catch (error) {
      console.error('Erreur D1 rdv update:', error)
      return c.redirect('/admin/rdv?error=' + encodeURIComponent('Mise Ã  jour impossible (base de données)'))
    }
  } else if (!rdv) {
    return c.redirect('/admin/rdv?error=' + encodeURIComponent('Rendez-vous introuvable'))
  }
  if (rdv) rdv.status = status as 'pending' | 'confirmed' | 'done'

  return c.redirect('/admin/rdv?success=1')
})

// API Admin - Valider la visite (marquer RDV done SANS créer de commande)
app.post('/api/admin/rdv/validate-visit', adminAuth, async (c) => {
  const body = await c.req.json().catch(() => ({} as any))
  const appointment_id = parseInt(body.appointment_id) || 0
  if (!appointment_id) return c.json({ success: false, error: 'appointment_id requis' }, 400)
  const rdv = appointments.find(a => a.id === appointment_id)

  const db = c.env.DB
  if (db) {
    try {
      const res = await db.prepare('UPDATE appointments SET status = ? WHERE id = ?').bind('done', appointment_id).run()
      if (!res?.meta?.changes) return c.json({ success: false, error: 'Rendez-vous introuvable' }, 404)
    } catch (error) {
      // Ne plus avaler l'erreur : l'admin voyait Â« Visite validée Â» alors que le
      // statut restait inchangé en base.
      console.error('Erreur D1 validate-visit:', error)
      return c.json({ success: false, error: 'Validation impossible (base de données)' }, 500)
    }
  } else if (!rdv) {
    return c.json({ success: false, error: 'Rendez-vous introuvable' }, 404)
  }
  if (rdv) rdv.status = 'done'

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
      db.prepare('SELECT COUNT(*) as cnt FROM appointments WHERE (phone = ? OR phone LIKE ?)').bind(client.phone, `%${(client.phone||'').replace(/\D/g,'').slice(-8)}`).first(),
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
      db.prepare('SELECT id, type, status, date, heure_debut FROM appointments WHERE (phone = ? OR phone LIKE ?) ORDER BY id DESC LIMIT 8').bind(phone, `%${(phone||'').replace(/\D/g,'').slice(-8)}`).all(),
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
  const name = sanitizeText(rawName, 200)
  const brand = sanitizeText(rawBrand, 120)
  const model = sanitizeText(rawModel, 120)
  const btu = parseInt(body['btu'] as string) || 12000
  const price = parseInt(body['price'] as string) || 0
  const stock = parseInt(body['stock'] as string) || 0
  const surface_min = parseInt(body['surface_min'] as string) || 10
  const surface_max = parseInt(body['surface_max'] as string) || 25
  const energy_class = (body['energy_class'] as string) || 'A++'
  const description = sanitizeText(body['description'], 3000)
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
  let imgbbDeleteUrlCreate = ''
  const file = body['image'] as File | null
  if (file && file instanceof File && file.size > 0) {
    // Limit image size to 500KB to prevent bloating D1
    if (file.size > IMAGE_SIZE_LIMITS.PRODUCT_IMAGE) {
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
    // Upload vers Cloudflare R2 avec fallback ImgBB
    try {
      const r2 = await uploadToStorage(c, buffer, file.type, 'produits')
      imageUrl = r2.url
      imgbbDeleteUrlCreate = r2.deleteUrl
    } catch(uploadErr2) {
      console.error('Upload error (create):', uploadErr2)
      return c.redirect('/admin/produits?error=' + encodeURIComponent('Upload image échoué.'))
    }
  }

  // Parse media JSON
  let media: any[] = []
  try {
    const mediaJson = body['media_json'] as string
    media = mediaJson ? JSON.parse(mediaJson) : []
  } catch (e) {
    media = []
  }

  // Écrire en D1 d'abord : l'identifiant vient de l'AUTOINCREMENT, pas d'un
  // Math.max sur le cache mémoire (partiel et par isolate, donc source de
  // collisions d'id) ; le produit n'est mis en cache qu'en cas de succès.
  const db = c.env.DB
  let newId = 0
  if (db) {
    try {
      const res = await db.prepare(`
        INSERT INTO products (name, brand, model, btu, price, stock, surface_min, surface_max, energy_class, description, inverter, available, warranty, features, image, imageUrl, tech_specs, media_urls)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        name, brand, model, btu, price, stock, surface_min, surface_max, energy_class,
        description, inverter ? 1 : 0, available ? 1 : 0, '1 an constructeur',
        features.length > 0 ? JSON.stringify(features) : null,
        'â„ï¸', imageUrl || null, techSpecsJson,
        media.length > 0 ? JSON.stringify(media) : null
      ).run()
      newId = Number(res?.meta?.last_row_id || 0)
    } catch (error) {
      console.error('Erreur D1 produit add:', error)
      return c.redirect('/admin/produits?error=' + encodeURIComponent('Enregistrement impossible (base de données)'))
    }
  }
  if (!newId) newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1

  const newProduct: any = {
    id: newId,
    name, brand, model, btu, price, price_install: 0, stock,
    surface_min, surface_max, energy_class, description,
    inverter, available,
    image: 'â„ï¸',
    imageUrl,
    features,
    warranty: '1 an constructeur',
    techSpecs: Object.keys(techSpecs).length > 0 ? techSpecs : undefined,
    media: media.length > 0 ? media : undefined
  }
  products.push(newProduct)

  await notifyAdmin((c as any).env, 'product', `${name} — ${brand}, ${btu.toLocaleString()} BTU — ${price.toLocaleString()} FCFA (stock: ${stock})`)
  return c.redirect('/admin/produits?success=1')
})

// ============================================================
// IMPORT EN MASSE DE PRODUITS DEPUIS UN TABLEUR
//
// Un seul endpoint, deux modes, servis par le meme moteur
// (src/utils/importProduits.ts) :
//   - 'analyse'   : n'ecrit rien, renvoie ce que le systeme a compris de chaque
//                   ligne (valeurs derivees, origine de chaque champ, alertes,
//                   doublons). Alimente l'apercu.
//   - 'execution' : re-derive depuis les memes donnees brutes, applique les
//                   corrections de l'admin, revalide, puis ecrit.
//
// L'apercu montre donc litteralement ce qui sera enregistre. La version
// precedente dupliquait la validation cote navigateur et cote serveur, avec deux
// copies des referentiels vouees a diverger — et exigeait un fichier modele qui
// n'existe pas dans le depot.
// ============================================================

type ModeImport = 'analyse' | 'execution'
type StrategieDoublon = 'maj' | 'ignorer' | 'creer'

interface CorpsImportProduits {
  mode?: ModeImport
  feuille?: string
  lignes?: any[][]
  mapping?: Record<string, ChampCible | null>
  corrections?: Record<string, Record<string, unknown>>
  indexEntete?: number
  decalageLigne?: number
  strategieDoublon?: StrategieDoublon
}

// Champ du moteur -> colonne SQL.
//
// `image`, `imageUrl` et `image_url` sont volontairement absents de cette liste :
// les visuels sont hors perimetre de l'import, donc une photo ajoutee a la main
// doit survivre a tout re-import. C'est l'un des deux modes de defaillance
// dangereux d'un upsert ; l'autre est traite par `apporteValeur` plus bas.
const COLONNES_IMPORT: Array<[keyof ChampsProduit, string]> = [
  ['nom', 'name'],
  ['marque', 'brand'],
  ['modele', 'model'],
  ['categorie', 'category'],
  ['puissanceBtu', 'btu'],
  ['prixFcfa', 'price'],
  ['prixGrossisteFcfa', 'price_wholesale'],
  ['stockInitial', 'stock'],
  ['classeEnergie', 'energy_class'],
  ['surfaceMin', 'surface_min'],
  ['surfaceMax', 'surface_max'],
  ['inverter', 'inverter'],
  ['disponible', 'available'],
  ['description', 'description'],
  ['mentions', 'features'],
  ['refrigerant', 'refrigerant'],
  ['compresseur', 'compressor'],
  ['garantie', 'warranty']
]

function valeurSqlImport(champ: keyof ChampsProduit, champs: ChampsProduit): any {
  const valeur = champs[champ]
  if (champ === 'mentions') return Array.isArray(valeur) && valeur.length > 0 ? JSON.stringify(valeur) : null
  if (champ === 'inverter' || champ === 'disponible') return valeur ? 1 : 0
  if (typeof valeur === 'string') return valeur.trim() ? valeur : null
  return valeur === undefined ? null : valeur
}

// Regle de non-ecrasement, appliquee au seul UPDATE : une colonne n'est touchee
// que si l'import apporte reellement quelque chose.
//   - origine 'fichier' ou 'deduit' -> la valeur vient du tableau importe, elle ecrit ;
//   - origine 'defaut' -> valeur de repli ('A++', 'Mural/Split', garantie
//     standard, stock 0). Elle n'ecrase jamais une saisie manuelle : sans cela,
//     une liste de tarifs ne portant que des prix remettrait a zero le stock et
//     effacerait descriptions et caracteristiques du catalogue.
function apporteValeur(champ: keyof ChampsProduit, produit: ProduitDerive): boolean {
  const origine = produit.origines[champ]
  if (origine !== 'fichier' && origine !== 'deduit') return false
  return valeurSqlImport(champ, produit.champs) !== null
}

app.post('/api/admin/produits/import', adminAuth, async (c) => {
  const body = await c.req.json<CorpsImportProduits>().catch(() => null)
  if (!body || typeof body !== 'object') {
    return c.json({ succes: false, message: 'Corps de requête illisible.' }, 400)
  }

  const mode: ModeImport = body.mode === 'execution' ? 'execution' : 'analyse'
  const lignesBrutes = Array.isArray(body.lignes) ? body.lignes : []
  if (lignesBrutes.length === 0) {
    return c.json({ succes: false, message: 'Aucune ligne reçue.' }, 400)
  }
  // Marge au-dessus du plafond : l'UI renvoie les lignes d'en-tête avec chaque
  // lot pour que la détection reste serveur. Le vrai plafond porte sur les
  // lignes de données, vérifié après analyse.
  if (lignesBrutes.length > MAX_LIGNES_PAR_LOT + 20) {
    return c.json({ succes: false, message: `Maximum ${MAX_LIGNES_PAR_LOT} lignes par lot.` }, 400)
  }

  const db = c.env.DB
  if (!db) {
    return c.json({ succes: false, message: 'Base de données indisponible.' }, 500)
  }

  const analyse = analyserClasseur(lignesBrutes, {
    mapping: body.mapping && typeof body.mapping === 'object' ? body.mapping : undefined,
    corrections: body.corrections && typeof body.corrections === 'object' ? body.corrections : undefined,
    indexEntete: typeof body.indexEntete === 'number' ? body.indexEntete : undefined,
    decalageLigne: typeof body.decalageLigne === 'number' && body.decalageLigne > 0 ? Math.floor(body.decalageLigne) : 0
  })

  if (analyse.nbLignesDonnees > MAX_LIGNES_PAR_LOT) {
    return c.json({ succes: false, message: `Maximum ${MAX_LIGNES_PAR_LOT} lignes de données par lot.` }, 400)
  }

  // Rapprochement des doublons : une seule lecture du catalogue, puis une Map en
  // mémoire — pas une requête par ligne.
  const existants = new Map<string, { id: number; nom: string }>()
  try {
    const res = await db.prepare('SELECT id, name, brand, model, btu FROM products').all()
    for (const r of ((res as any)?.results || []) as any[]) {
      const cle = cleProduit(r.brand, r.btu, r.model, r.name)
      if (!existants.has(cle)) existants.set(cle, { id: Number(r.id), nom: String(r.name || '') })
    }
  } catch (err) {
    console.error('Erreur lecture du catalogue pour import:', err)
    return c.json({ succes: false, message: 'Lecture du catalogue impossible.' }, 500)
  }

  const strategie: StrategieDoublon =
    body.strategieDoublon === 'ignorer' || body.strategieDoublon === 'creer' ? body.strategieDoublon : 'maj'

  // Rapprochement, plus détection des doublons internes au fichier : deux lignes
  // identiques dans le même tableau ne doivent pas créer deux fiches.
  const vues = new Set<string>()
  const preparees = analyse.produits.map((produit) => {
    const cle = cleProduit(produit.champs.marque, produit.champs.puissanceBtu, produit.champs.modele, produit.champs.nom)
    const existant = existants.get(cle) || null
    const doublonFichier = vues.has(cle)
    vues.add(cle)
    return { produit, existant, doublonFichier }
  })

  if (mode === 'analyse') {
    let aCreer = 0
    let aMettreAJour = 0
    let enErreur = 0
    const produits = preparees.map(({ produit, existant, doublonFichier }) => {
      const bloque = produit.erreurs.length > 0
      if (bloque) enErreur++
      else if (doublonFichier) enErreur++
      else if (existant) aMettreAJour++
      else aCreer++
      return {
        ligne: produit.ligne,
        champs: produit.champs,
        origines: produit.origines,
        alertes: doublonFichier
          ? produit.alertes.concat('Ligne déjÃ  présente plus haut dans le fichier : elle sera ignorée.')
          : produit.alertes,
        erreurs: produit.erreurs,
        doublon: existant ? { id: existant.id, nom: existant.nom } : null
      }
    })
    return c.json({
      succes: true,
      mode: 'analyse',
      feuille: sanitizeText(body.feuille, 120) || null,
      indexEntete: analyse.indexEntete,
      nbLignesDonnees: analyse.nbLignesDonnees,
      colonnes: analyse.colonnes,
      avertissements: analyse.avertissements,
      produits,
      resume: { total: produits.length, aCreer, aMettreAJour, enErreur }
    })
  }

  // ---------- mode execution ----------

  const maintenant = new Date().toISOString()
  const nomsColonnes = COLONNES_IMPORT.map(([, colonne]) => colonne)
  const sqlInsert = `INSERT INTO products (${nomsColonnes.join(', ')}, image, created_at, updated_at)
    VALUES (${nomsColonnes.map(() => '?').join(', ')}, ?, ?, ?)`
  const stmtInsert = db.prepare(sqlInsert)

  const batch: any[] = []
  const erreurs: Array<{ ligne: number; messages: string[] }> = []
  const ignorees: Array<{ ligne: number; raison: string }> = []
  let crees = 0
  let misAJour = 0

  for (const { produit, existant, doublonFichier } of preparees) {
    if (produit.erreurs.length > 0) {
      erreurs.push({ ligne: produit.ligne, messages: produit.erreurs })
      continue
    }
    if (doublonFichier) {
      ignorees.push({ ligne: produit.ligne, raison: 'Doublon dans le fichier importé.' })
      continue
    }

    if (existant && strategie === 'ignorer') {
      ignorees.push({ ligne: produit.ligne, raison: `DéjÃ  au catalogue (fiche #${existant.id}), conservée telle quelle.` })
      continue
    }

    if (existant && strategie === 'maj') {
      const colonnes: string[] = []
      const valeurs: any[] = []
      for (const [champ, colonne] of COLONNES_IMPORT) {
        if (!apporteValeur(champ, produit)) continue
        colonnes.push(`${colonne} = ?`)
        valeurs.push(valeurSqlImport(champ, produit.champs))
      }
      if (colonnes.length === 0) {
        ignorees.push({ ligne: produit.ligne, raison: `Fiche #${existant.id} inchangée : le fichier n'apporte aucune valeur.` })
        continue
      }
      colonnes.push('updated_at = ?')
      valeurs.push(maintenant)
      valeurs.push(existant.id)
      batch.push(db.prepare(`UPDATE products SET ${colonnes.join(', ')} WHERE id = ?`).bind(...valeurs))
      misAJour++
      continue
    }

    // Création : les valeurs de repli ont ici toute leur place, c'est ce qui
    // permet Ã  un simple libellé + prix de produire une fiche complète.
    const valeurs = COLONNES_IMPORT.map(([champ]) => valeurSqlImport(champ, produit.champs))
    batch.push(stmtInsert.bind(...valeurs, 'â„ï¸', maintenant, maintenant))
    crees++
  }

  if (batch.length === 0) {
    return c.json({
      succes: false,
      mode: 'execution',
      message: erreurs.length > 0
        ? 'Aucune ligne exploitable : rien n\'a été enregistré.'
        : 'Rien Ã  enregistrer : toutes les lignes étaient déjÃ  au catalogue.',
      crees: 0,
      misAJour: 0,
      ignorees,
      erreurs,
      avertissements: analyse.avertissements
    }, erreurs.length > 0 ? 422 : 200)
  }

  try {
    // db.batch est transactionnel côté D1 : tout ou rien.
    await db.batch(batch)
  } catch (err) {
    console.error('Erreur import produits:', err)
    return c.json({ succes: false, message: "Erreur serveur pendant l'écriture. Rien n'a été enregistré." }, 500)
  }

  // Un upsert ne peut pas être reflété par un products.push (il dupliquerait les
  // fiches mises Ã  jour en mémoire) : on invalide le cache, refreshAdminCache
  // rechargera depuis D1 au prochain GET.
  _d1LoadPromise = null

  const ip = c.req.header('cf-connecting-ip') || 'unknown'
  await logAdminAudit(db, {
    action: 'import_produits',
    detail: JSON.stringify({
      feuille: sanitizeText(body.feuille, 120) || null,
      lignes: analyse.nbLignesDonnees,
      crees,
      maj: misAJour,
      ignores: ignorees.length,
      erreurs: erreurs.length
    }),
    ip,
    userAgent: c.req.header('User-Agent') || ''
  })

  const parts: string[] = []
  if (crees > 0) parts.push(`${crees} créé(s)`)
  if (misAJour > 0) parts.push(`${misAJour} mis Ã  jour`)
  if (ignorees.length > 0) parts.push(`${ignorees.length} ignoré(s)`)
  if (erreurs.length > 0) parts.push(`${erreurs.length} en erreur`)

  await notifyAdmin((c as any).env, 'product', `Import en masse : ${parts.join(', ')}.`)

  return c.json({
    succes: true,
    mode: 'execution',
    crees,
    misAJour,
    ignorees,
    erreurs,
    avertissements: analyse.avertissements,
    message: `Import terminé : ${parts.join(', ')}.` + (crees > 0 ? ' Pense Ã  ajouter les photos depuis chaque fiche produit.' : '')
  })
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
  
  // Parse media JSON et uploader les nouvelles images (data: URLs) vers ImgBB.
  // Les items dont l'URL est déjà HTTPS sont conservés tels quels — aucun
  // blob base64 n'est jamais écrit en D1, ce qui évite de dépasser la limite
  // de taille de ligne SQLite et de dégrader les performances de lecture.
  let media: any[] = []
  try {
    const mediaJson = body['media_json'] as string
    if (mediaJson) {
      for (const item of parsed) {
        if (typeof item.url === 'string' && item.url.startsWith('data:image/')) {
          try {
            const base64Data = item.url.split(',')[1]
            const mimeMatch = item.url.match(/data:(image\/[^;]+)/)
            const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg'
            const binaryStr = atob(base64Data)
            const bytes = new Uint8Array(binaryStr.length)
            for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i)
            const result = await uploadToStorage(c, bytes.buffer, mime, 'produits/galerie')
            media.push({ type: 'image', url: result.url, deleteUrl: result.deleteUrl, caption: item.caption || '' })
          } catch (uploadErr) {
            console.error('Upload for media item failed:', uploadErr)
          }
        } else {
          // URL HTTPS déjà hébergée (ImgBB ou autre) : conserver l'item intact
          media.push(item)
        }
      }
    } else {
      // Aucun media_json envoyé : conserver les médias existants du produit
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
  
  // Supprimer l'image ImgBB si elle existe
  const imgbbApiKey = (c.env as any).IMGBB_API_KEY as string
  if (imgbbApiKey) {
    try {
      // Récupérer le delete_url depuis D1
      const dbForDel = c.env.DB
      if (dbForDel) {
        const prod = await dbForDel.prepare('SELECT imgbb_delete_url FROM products WHERE id = ?').bind(id).first() as any
        if (prod?.imgbb_delete_url) {
          // ImgBB delete_url est une URL GET directe
          await fetch(prod.imgbb_delete_url).catch(() => {})
        }
      }
    } catch(e) { console.warn('ImgBB delete warning:', e) }
  }

  // Supprimer en D1 aussi
  const db = c.env.DB
  if (db) {
    try {
      await db.prepare('DELETE FROM products WHERE id = ?').bind(id).run()
    } catch (error) {
      console.error('Erreur D1 produit delete:', error)
    }
  }

  // Invalider le cache en mémoire pour forcer un rechargement depuis D1
  // au prochain démarrage d'isolate — garantit qu'un produit supprimé ne
  // réapparaît pas après un redéploiement ou une mise en veille du Worker.
  _d1LoadPromise = null
  
  return c.redirect('/admin/produits?deleted=1')
})

// ============================================================
// IMAGE SIZE LIMITS - Centralized configuration
// ============================================================
const IMAGE_SIZE_LIMITS = {
  PRODUCT_IMAGE: 500 * 1024,       // 500 KB
  GALLERY_IMAGE: 5 * 1024 * 1024,  // 5 MB
  MOBILE_UPLOAD: 10 * 1024 * 1024, // 10 MB
  BRAND_MEDIA: 10 * 1024 * 1024    // 10 MB
} as const

// ============================================================
// IMAGE UPLOAD RATE LIMITING
// ============================================================
const imageUploadRateLimit = new Map<string, { count: number; resetAt: number }>()
const IMAGE_UPLOAD_MAX = 10 // 10 uploads per window
const IMAGE_UPLOAD_WINDOW = 60000 // 1 minute window

function checkImageUploadRateLimit(identifier: string): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const entry = imageUploadRateLimit.get(identifier)
  
  if (!entry || now > entry.resetAt) {
    imageUploadRateLimit.set(identifier, { count: 1, resetAt: now + IMAGE_UPLOAD_WINDOW })
    return { allowed: true, remaining: IMAGE_UPLOAD_MAX - 1 }
  }
  
  if (entry.count >= IMAGE_UPLOAD_MAX) {
    return { allowed: false, remaining: 0 }
  }
  
  entry.count++
  return { allowed: true, remaining: IMAGE_UPLOAD_MAX - entry.count }
}

// ============================================================
// IMGBB IMAGE UPLOAD HELPER WITH RETRY
// ============================================================
async function uploadToImgBB(apiKey: string, fileBuffer: ArrayBuffer, mimeType: string): Promise<{url: string, deleteUrl: string}> {
  const bytes = new Uint8Array(fileBuffer)
  // Use more efficient base64 conversion
  const base64 = btoa(String.fromCharCode(...bytes))
  const form = new FormData()
  form.append('key', apiKey)
  form.append('image', base64)
  const res = await fetch('https://api.imgbb.com/1/upload', { method: 'POST', body: form })
  if (!res.ok) throw new Error('ImgBB upload failed: ' + res.status)
  const json = await res.json() as any
  if (!json?.data?.url) throw new Error('ImgBB: no URL in response')
  return { url: json.data.url as string, deleteUrl: (json.data.delete_url || '') as string }
}

async function uploadToImgBBWithRetry(apiKey: string, fileBuffer: ArrayBuffer, mimeType: string, maxRetries = 3): Promise<{url: string, deleteUrl: string}> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await uploadToImgBB(apiKey, fileBuffer, mimeType)
    } catch (err) {
      if (attempt === maxRetries) throw err
      // Exponential backoff: 1s, 2s, 4s
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)))
    }
  }
  throw new Error('Upload failed after retries')
}

// ============================================================
// STORAGE UPLOAD HELPER (CLOUDFLARE R2 + FALLBACK IMGBB)
// ============================================================
async function uploadToStorage(
  c: { env: any; req: { url: string; header: (name: string) => string | undefined } },
  fileBuffer: ArrayBuffer,
  mimeType: string,
  folder: string = 'uploads'
): Promise<{ url: string; deleteUrl: string }> {
  const r2 = c.env.IMAGES_BUCKET
  if (r2) {
    const ext = mimeType === 'image/png' ? 'png'
      : mimeType === 'image/webp' ? 'webp'
      : mimeType === 'image/gif' ? 'gif'
      : mimeType === 'image/svg+xml' ? 'svg'
      : 'jpg'
    const randomSuffix = Math.random().toString(36).substring(2, 10)
    const key = `${folder}/${Date.now()}-${randomSuffix}.${ext}`
    
    await r2.put(key, fileBuffer, {
      httpMetadata: {
        contentType: mimeType,
        cacheControl: 'public, max-age=31536000, immutable',
      },
    })
    
    let baseUrl = SITE_URL
    try {
      const parsedUrl = new URL(c.req.url)
      baseUrl = parsedUrl.origin
    } catch (_) {}
    
    const url = `${baseUrl}/media/${key}`
    return { url, deleteUrl: '' }
  }

  // Fallback ImgBB si R2 n'est pas encore lié/disponible
  const imgbbKey = c.env.IMGBB_API_KEY
  if (imgbbKey) {
    return await uploadToImgBBWithRetry(imgbbKey, fileBuffer, mimeType)
  }
  
  throw new Error('Aucun service de stockage disponible (Cloudflare R2 ou IMGBB non configuré)')
}

// API Admin - Uploader/changer l'image d'un produit
app.post('/api/admin/produit/image', adminAuth, async (c) => {
  // Rate limiting for image uploads
  const clientIp = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown'
  const rateLimit = checkImageUploadRateLimit(clientIp)
  if (!rateLimit.allowed) {
    return c.json({ error: 'Trop d\'uploads récents. Attendez 1 minute.' }, 429)
  }
  const body = await c.req.parseBody()
  const id = parseInt(body['id'] as string)
  const file = body['image'] as File | null
  if (file && file instanceof File && file.size > 0) {
    // Limit image size to 500KB
    if (file.size > IMAGE_SIZE_LIMITS.PRODUCT_IMAGE) {
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
    // Upload vers Cloudflare R2 avec fallback ImgBB
    let uploadedUrl = ''
    let imgbbDelUrl = ''
    try {
      const r1 = await uploadToStorage(c, buffer, file.type, 'produits')
      uploadedUrl = r1.url
      imgbbDelUrl = r1.deleteUrl
    } catch(uploadErr) {
      console.error('Image upload error:', uploadErr)
      return c.redirect('/admin/produits?error=' + encodeURIComponent('Upload image échoué.'))
    }
    const db = c.env.DB
    if (db) {
      try {
        const res = await db.prepare('UPDATE products SET imageUrl = ?, imgbb_delete_url = ? WHERE id = ?').bind(uploadedUrl, imgbbDelUrl, id).run()
        if (!res?.meta?.changes) {
          return c.redirect('/admin/produits?error=' + encodeURIComponent('Produit introuvable.'))
        }
      } catch(e) {
        console.error('Erreur D1 produit image:', e)
        return c.redirect('/admin/produits?error=' + encodeURIComponent('Enregistrement image impossible.'))
      }
    }
    const product = products.find(p => p.id === id)
    if (product) { (product as any).imageUrl = uploadedUrl; (product as any).imgbbDeleteUrl = imgbbDelUrl }
    else if (!db) return c.redirect('/admin/produits?error=' + encodeURIComponent('Produit introuvable.'))
  }
  
  return c.redirect('/admin/produits?success=1')
})

// ============================================================
// API GALERIE PRODUIT — ajouter/supprimer une image ImgBB
// ============================================================

// Ajouter une image a la galerie d'un produit
app.post('/api/admin/produit/gallery/add', adminAuth, async (c) => {
  // Rate limiting for image uploads
  const clientIp = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown'
  const rateLimit = checkImageUploadRateLimit(clientIp)
  if (!rateLimit.allowed) {
    return c.json({ error: 'Trop d\'uploads récents. Attendez 1 minute.' }, 429)
  }
  const body = await c.req.parseBody()
  const id = parseInt(body['id'] as string)
  const file = body['image'] as File | null
  if (!file || !(file instanceof File) || file.size === 0) return c.json({ error: 'Fichier manquant' }, 400)
  if (file.size > IMAGE_SIZE_LIMITS.GALLERY_IMAGE) return c.json({ error: 'Image trop grande (max 5 MB)' }, 400)
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowed.includes(file.type)) return c.json({ error: 'Format non autorise' }, 400)
  const buffer = await file.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  // Validate magic bytes before upload
  if (!validateImageMagicBytes(bytes)) {
    return c.json({ error: 'Format d\'image non valide' }, 400)
  }
  let imgUrl = '', imgDelUrl = ''
  try {
    const r = await uploadToStorage(c, buffer, file.type, 'produits/galerie')
    imgUrl = r.url; imgDelUrl = r.deleteUrl
  } catch(e) { return c.json({ error: 'Upload image échoué' }, 500) }
  const db = c.env.DB
  if (!db) return c.json({ error: 'DB indisponible' }, 500)
  try {
    const row = await db.prepare('SELECT media_urls FROM products WHERE id = ?').bind(id).first() as any
    let gallery: any[] = []
    try { gallery = JSON.parse(row?.media_urls || '[]') } catch(_) {}
    gallery.push({ url: imgUrl, deleteUrl: imgDelUrl, type: 'image' })
    await db.prepare('UPDATE products SET media_urls = ? WHERE id = ?').bind(JSON.stringify(gallery), id).run()
    return c.json({ success: true, url: imgUrl, deleteUrl: imgDelUrl, gallery })
  } catch(e) {
    console.error('Gallery add error:', e)
    return c.json({ error: 'Erreur DB' }, 500)
  }
})

// Supprimer une image de la galerie d'un produit
app.post('/api/admin/produit/gallery/remove', adminAuth, async (c) => {
  const body = await c.req.parseBody()
  const id = parseInt(body['id'] as string)
  const urlToRemove = body['url'] as string
  const deleteUrl = body['delete_url'] as string
  const db = c.env.DB
  if (!db) return c.json({ error: 'DB indisponible' }, 500)
  try {
    const row = await db.prepare('SELECT media_urls FROM products WHERE id = ?').bind(id).first() as any
    let gallery: any[] = []
    try { gallery = JSON.parse(row?.media_urls || '[]') } catch(_) {}
    gallery = gallery.filter((item: any) => item.url !== urlToRemove)
    await db.prepare('UPDATE products SET media_urls = ? WHERE id = ?').bind(JSON.stringify(gallery), id).run()
    // Supprimer sur ImgBB
    if (deleteUrl) { await fetch(deleteUrl).catch(() => {}) }
    return c.json({ success: true, gallery })
  } catch(e) {
    console.error('Gallery remove error:', e)
    return c.json({ error: 'Erreur DB' }, 500)
  }
})

// GET galerie d'un produit (pour le modal JS)
app.get('/api/admin/produit/gallery/:id', adminAuth, async (c) => {
  const id = parseInt(c.req.param('id'))
  const db = c.env.DB
  if (!db) return c.json({ gallery: [] })
  try {
    const row = await db.prepare('SELECT media_urls FROM products WHERE id = ?').bind(id).first() as any
    let gallery: any[] = []
    try { gallery = JSON.parse(row?.media_urls || '[]') } catch(_) {}
    return c.json({ gallery })
  } catch(e) {
    return c.json({ gallery: [] })
  }
})

// ============================================================
// MÉDIATHÈQUE CENTRALISÉE PAR MARQUE
// Permet d'uploader des images une fois, taguées par marque,
// puis de les affecter à n'importe quel produit (image principale ou galerie).
// ============================================================

// Helper d'initialisation automatique de la table médiathèque par marque sur D1
async function ensureBrandMediaTable(db: any) {
  if (!db) return
  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS brand_media_library (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        brand TEXT NOT NULL,
        url TEXT NOT NULL,
        delete_url TEXT,
        label TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `).run()
    await db.prepare(`CREATE INDEX IF NOT EXISTS idx_brand_media_brand ON brand_media_library(brand)`).run()
  } catch (e) {
    console.error('ensureBrandMediaTable error:', e)
  }
}

// Lister toutes les images (optionnel : filtrer par brand)
app.get('/api/admin/media/brand', adminAuth, async (c) => {
  const db = c.env.DB
  if (!db) return c.json({ images: [] })
  await ensureBrandMediaTable(db)
  const brand = c.req.query('brand') || ''
  try {
    const sql = brand
      ? 'SELECT * FROM brand_media_library WHERE brand = ? ORDER BY created_at DESC'
      : 'SELECT * FROM brand_media_library ORDER BY brand ASC, created_at DESC'
    const res = brand
      ? await db.prepare(sql).bind(brand).all()
      : await db.prepare(sql).all()
    return c.json({ images: (res as any)?.results || [] })
  } catch (e) {
    console.error('GET brand_media_library error:', e)
    return c.json({ images: [] })
  }
})

// Uploader une image dans la médiathèque (taguée par marque)
app.post('/api/admin/media/brand/upload', adminAuth, async (c) => {
  const db = c.env.DB
  if (!db) return c.json({ error: 'Base de données D1 indisponible' }, 500)
  await ensureBrandMediaTable(db)

  let brand = ''
  let label = ''
  let file: any = null

  try {
    const form = await c.req.formData()
    brand = sanitizeText(form.get('brand') as string, 120)
    label = sanitizeText(form.get('label') as string, 200) || ''
    file = form.get('image')
  } catch (e) {
    const body = await c.req.parseBody()
    brand = sanitizeText(body['brand'] as string, 120)
    label = sanitizeText(body['label'] as string, 200) || ''
    file = body['image']
  }

  if (!brand) return c.json({ error: 'Marque requise pour ranger l\'image dans la médiathèque' }, 400)
  if (!file || typeof file !== 'object' || typeof file.arrayBuffer !== 'function' || !file.size) {
    return c.json({ error: 'Fichier image manquant ou corrompu' }, 400)
  }
  if (file.size > IMAGE_SIZE_LIMITS.BRAND_MEDIA) return c.json({ error: 'Image trop volumineuse (max 10 MB)' }, 400)
  
  const rawType = (file.type || '').toLowerCase()
  const fileType = rawType.startsWith('image/') ? rawType : 'image/jpeg'

  const buffer = await file.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  // Validate magic bytes before upload
  if (!validateImageMagicBytes(bytes)) {
    return c.json({ error: 'Format d\'image non valide' }, 400)
  }
  try {
    const safeBrand = encodeURIComponent(brand.toLowerCase().replace(/[^a-z0-9_-]/g, '')) || 'generale'
    const folder = `marques/${safeBrand}`
    const r = await uploadToStorage(c, buffer, fileType, folder)
    await db.prepare(
      'INSERT INTO brand_media_library (brand, url, delete_url, label) VALUES (?, ?, ?, ?)'
    ).bind(brand, r.url, r.deleteUrl, label).run()

    return c.json({ success: true, image: { brand, url: r.url, delete_url: r.deleteUrl, label } })
  } catch (e: any) {
    console.error('Brand media upload error:', e)
    return c.json({ error: 'Upload image échoué : ' + (e?.message || 'Erreur API') }, 500)
  }
})

// Supprimer une image de la médiathèque
app.post('/api/admin/media/brand/delete', adminAuth, async (c) => {
  const body = await c.req.parseBody()
  const id = parseInt(body['id'] as string)
  if (!id) return c.json({ error: 'ID manquant' }, 400)
  const db = c.env.DB
  if (!db) return c.json({ error: 'DB indisponible' }, 500)
  await ensureBrandMediaTable(db)
  try {
    const row = await db.prepare('SELECT delete_url FROM brand_media_library WHERE id = ?').bind(id).first() as any
    await db.prepare('DELETE FROM brand_media_library WHERE id = ?').bind(id).run()
    if (row?.delete_url) { await fetch(row.delete_url).catch(() => {}) }
    return c.json({ success: true })
  } catch (e) {
    return c.json({ error: 'Erreur DB' }, 500)
  }
})

// Affecter une image de la médiathèque à un seul produit ou à TOUS les produits de la marque
app.post('/api/admin/media/brand/assign', adminAuth, async (c) => {
  let body: any = {}
  try { body = await c.req.formData() } catch (_) { body = await c.req.parseBody() }

  const getVal = (k: string) => typeof body.get === 'function' ? body.get(k) : body[k]
  const scope = (getVal('scope') as string) === 'brand' ? 'brand' : 'single'
  const productId = parseInt(getVal('product_id') as string)
  const mediaId = parseInt(getVal('media_id') as string)
  const target = (getVal('target') as string) === 'gallery' ? 'gallery' : 'main'
  const db = c.env.DB
  if (!db) return c.json({ error: 'Base de données D1 indisponible' }, 500)
  await ensureBrandMediaTable(db)

  try {
    const mediaRow = await db.prepare('SELECT * FROM brand_media_library WHERE id = ?').bind(mediaId).first() as any
    if (!mediaRow) return c.json({ error: 'Image introuvable dans la médiathèque' }, 404)

    if (scope === 'brand') {
      const brandName = mediaRow.brand
      if (!brandName) return c.json({ error: 'Aucune marque associée à cette image' }, 400)

      if (target === 'main') {
        // Appliquer à l'image principale de tous les produits de la marque (case-insensitive)
        await db.prepare('UPDATE products SET imageUrl = ? WHERE LOWER(brand) = LOWER(?)').bind(mediaRow.url, brandName).run()
        let count = 0
        products.forEach(p => {
          if ((p.brand || '').toLowerCase() === brandName.toLowerCase()) {
            (p as any).imageUrl = mediaRow.url
            count++
          }
        })
        return c.json({ success: true, count, message: `Image principale appliquée à tous les ${count} produits ${brandName}.` })
      } else {
        // Ajouter à la galerie de tous les produits de la marque
        const matchingProds = await db.prepare('SELECT id, media_urls FROM products WHERE LOWER(brand) = LOWER(?)').bind(brandName).all() as any
        const rows = matchingProds?.results || []
        let count = 0
        for (const prodRow of rows) {
          let gallery: any[] = []
          try { gallery = JSON.parse(prodRow.media_urls || '[]') } catch (_) {}
          if (!gallery.some((g: any) => g.url === mediaRow.url)) {
            gallery.push({ url: mediaRow.url, deleteUrl: mediaRow.delete_url || '', type: 'image', caption: mediaRow.label || '' })
            await db.prepare('UPDATE products SET media_urls = ? WHERE id = ?').bind(JSON.stringify(gallery), prodRow.id).run()
            const p = products.find(item => item.id === prodRow.id)
            if (p) p.media = gallery
            count++
          }
        }
        return c.json({ success: true, count, message: `Image ajoutée à la galerie de ${count} produits ${brandName}.` })
      }
    } else {
      if (!productId) return c.json({ error: 'ID produit manquant' }, 400)
      if (target === 'main') {
        await db.prepare('UPDATE products SET imageUrl = ? WHERE id = ?').bind(mediaRow.url, productId).run()
        const p = products.find(p => p.id === productId)
        if (p) (p as any).imageUrl = mediaRow.url
      } else {
        const prodRow = await db.prepare('SELECT media_urls FROM products WHERE id = ?').bind(productId).first() as any
        let gallery: any[] = []
        try { gallery = JSON.parse(prodRow?.media_urls || '[]') } catch (_) {}
        gallery.push({ url: mediaRow.url, deleteUrl: mediaRow.delete_url || '', type: 'image', caption: mediaRow.label || '' })
        await db.prepare('UPDATE products SET media_urls = ? WHERE id = ?').bind(JSON.stringify(gallery), productId).run()
        const p = products.find(p => p.id === productId)
        if (p) p.media = gallery
      }
      return c.json({ success: true, message: 'Image affectée au produit.' })
    }
  } catch (e: any) {
    console.error('Brand media assign error:', e)
    return c.json({ error: 'Erreur lors de l\'affectation : ' + (e?.message || 'Erreur DB') }, 500)
  }
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
        <div class="title">â„ï¸ MAASGA - Devis Technique</div>
        <div class="subtitle">Froid & Climatisation · Ouagadougou, Burkina Faso</div>
      </div>
      <h2>Devis NÂ° DEV-${rdvId.toString().padStart(4,'0')}-${new Date().getFullYear()}</h2>
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
          <tr><td>Installation professionnelle</td><td>Main d'Å“uvre + accessoires</td><td>Sur devis</td></tr>
          <tr><td>Mise en service + test</td><td>Vérification complète</td><td>Inclus</td></tr>
        </tbody>
      </table>
      <div class="notice">
        âš ï¸ Ce devis est indicatif. Le montant définitif sera déterminé après la visite technique sur site. Aucun paiement n'est requis avant Visite technique gratuite et accord du client.
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
  
  // Mode hybride: essayer D1 d'abord, fallback Ã  la mémoire
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

  // Vérifier que le RDV existe. D1 fait référence : ce POST ne passe pas par
  // refreshAdminCache, donc le tableau `appointments` de cet isolate peut être vide
  // et un appointments.find() refusait des rendez-vous qui existent bien en base.
  const db = c.env.DB
  const cachedAppointment = appointments.find(a => a.id === appointment_id)
  if (db) {
    const row = await getAppointmentById(db, appointment_id).catch(() => null)
    if (!row) return c.json({ success: false, error: 'Rendez-vous non trouvé' }, 404)
  } else if (!cachedAppointment) {
    return c.json({ success: false, error: 'Rendez-vous non trouvé' }, 404)
  }

  // Créer une nouvelle commande — l'identifiant vient de l'AUTOINCREMENT D1
  let newOrderId = 0
  if (db) {
    try {
      await updateAppointmentStatus(db, appointment_id, 'confirmed')
      const res: any = await createOrder(db, {
        appointment_id,
        client_name,
        client_phone,
        quartier,
        type,
        status: 'en_attente'
      })
      newOrderId = Number(res?.meta?.last_row_id || 0)
    } catch (error) {
      console.error('Erreur lors de la création de la commande en D1:', error)
      return c.json({ success: false, error: 'Création de la commande impossible (base de données)' }, 500)
    }
  }
  if (!newOrderId) newOrderId = orders.length > 0 ? Math.max(...orders.map(o => o.id)) + 1 : 1

  // Mettre Ã  jour le statut du RDV en mémoire (si présent dans cet isolate)
  if (cachedAppointment) cachedAppointment.status = 'confirmed'

  const newOrder = {
    id: newOrderId,
    appointment_id,
    client_name,
    client_phone,
    quartier,
    type,
    // 'validation_terrain' n'existe plus dans la contrainte CHECK depuis la
    // migration 0036 : une commande créée depuis un RDV démarre en attente.
    status: 'en_attente' as const,
    created_at: new Date().toISOString()
  }
  orders.push(newOrder)

  return c.json({
    success: true,
    order_id: newOrder.id,
    message: `âœ… Commande #${newOrder.id} créée avec succès. Statut du RDV mis Ã  jour.`
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
    // Les compteurs d'avis étaient calculés puis oubliés dans la réponse.
    reviews: { total: totalReviews, pending: pendingReviews, avgNote },
  })
})

// ============================================================
// API CLIENTS - CRUD COMPLET
// ============================================================

// Réinitialiser la base de données (supprimer toutes les données)
app.post('/api/admin/reset-db', adminAuth, async (c) => {
  const db = c.env.DB
  const ip = c.req.header('cf-connecting-ip') || 'unknown'
  if (!db) {
    return c.json({ success: false, error: 'D1 non disponible' }, 400)
  }

  // Vérifier le token de confirmation pour éviter les suppressions accidentelles
  const body = await c.req.json().catch(() => ({} as any))
  if (body.confirm !== 'REINITIALISER') {
    return c.json({ success: false, error: 'Confirmation requise. Envoyez {"confirm": "REINITIALISER"} pour confirmer.' }, 400)
  }

  // Ré-authentification : action irréversible qui vide produits, clients et
  // commandes. Un cookie admin volé ne doit pas suffire Ã  détruire la base.
  const resetRl = await rateLimitD1(db, `admin-reset-db:${ip}`, 3, 60 * 60 * 1000)
  if (!resetRl.allowed) {
    logSecurityEvent(db, { event: 'admin_reset_db_rate_limit', severity: 'critical', ip, details: `Réinitialisation limitée pour ${ip}` })
    return c.json({ success: false, error: 'Trop de tentatives. Réessayez dans une heure.' }, 429)
  }
  const pwdOk = await verifyAdminPassword(c.env, typeof body.password === 'string' ? body.password : '')
  if (!pwdOk) {
    logSecurityEvent(db, { event: 'admin_reset_db_wrong_password', severity: 'critical', ip, details: `Tentative de réinitialisation sans mot de passe valide depuis ${ip}` })
    return c.json({ success: false, error: 'Mot de passe admin requis ou incorrect.' }, 403)
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

    logSecurityEvent(db, { event: 'admin_reset_db', severity: 'critical', ip, details: `Base réinitialisée depuis ${ip}` })
    await logAdminAudit(db, { action: 'database_reset', detail: 'orders, appointments, admin_sessions, reviews, clients, products, quartiers vidées', ip, userAgent: c.req.header('User-Agent') })

    return c.json({
      success: true, 
      message: 'âœ… Base de données complètement réinitialisée (D1 + mémoire + sqlite_sequence)'
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

  const name = sanitizeText(rawName, 120)
  const email = sanitizeText(rawEmail, 160)
  const phone = sanitizeText(rawPhone, 20)
  const quartier = sanitizeText(rawQuartier, 120)

  // L'identifiant vient de D1 (AUTOINCREMENT), pas d'un Math.max sur le cache
  // mémoire : ce cache est partiel et par isolate, donc il produisait des id déjÃ 
  // pris en base et le client ajouté restait introuvable depuis les autres écrans.
  const db = c.env.DB
  const createdAt = new Date().toISOString().split('T')[0]
  let newId = 0
  if (db) {
    try {
      const res = await db.prepare(`
        INSERT INTO clients (name, email, phone, quartier, password_hash, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(name, email, phone, quartier, 'pending', createdAt).run()
      newId = Number(res?.meta?.last_row_id || 0)
    } catch (error) {
      // Ne plus avaler l'erreur : l'admin voyait Â« succès Â» et le client
      // n'existait qu'en mémoire, jusqu'au recyclage de l'isolate.
      console.error('Erreur D1 client add:', error)
      return c.redirect('/admin/clients?error=' + encodeURIComponent("Enregistrement impossible (base de données)"))
    }
  }
  if (!newId) newId = clients.length > 0 ? Math.max(...clients.map(c => c.id)) + 1 : 1

  clients.push({
    id: newId,
    name, email, phone, quartier,
    password_hash: 'pending',
    type_demande: '',
    notes: '',
    created_at: createdAt
  })

  return c.redirect('/admin/clients?success=1')
})

app.post('/api/admin/client/update', adminAuth, async (c) => {
  const body = await c.req.parseBody()
  const id = parseInt(body['id'] as string)
  if (!id || isNaN(id)) return c.redirect('/admin/clients?error=notfound')

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

  const name = sanitizeText(rawName, 120)
  const email = sanitizeText(rawEmail, 160)
  const phone = sanitizeText(rawPhone, 20)
  const quartier = sanitizeText(rawQuartier, 120)

  // D1 fait référence, pas le cache mémoire : celui-ci ne contient qu'une partie
  // des clients selon l'isolate, donc un findIndex Ã  -1 refusait des modifications
  // de clients qui existent bel et bien en base.
  const db = c.env.DB
  if (db) {
    try {
      const res = await db.prepare(`
        UPDATE clients SET name = ?, email = ?, phone = ?, quartier = ? WHERE id = ?
      `).bind(name, email, phone, quartier, id).run()
      if (!res?.meta?.changes) return c.redirect('/admin/clients?error=notfound')
    } catch (error) {
      console.error('Erreur D1 client update:', error)
      return c.redirect('/admin/clients?error=' + encodeURIComponent('Modification impossible (base de données)'))
    }
  }

  const clientIndex = clients.findIndex(cl => cl.id === id)
  if (clientIndex !== -1) {
    clients[clientIndex] = { ...clients[clientIndex], name, email, phone, quartier }
  } else if (!db) {
    return c.redirect('/admin/clients?error=notfound')
  }

  return c.redirect('/admin/clients?success=1')
})

app.post('/api/admin/client/delete', adminAuth, async (c) => {
  const body = await c.req.parseBody()
  const id = parseInt(body['id'] as string)
  if (isNaN(id)) return c.redirect('/admin/clients?error=invalid_id')

  const db = c.env.DB

  // Récupérer les infos du client avant suppression (pour Firebase UID)
  let firebaseUid: string | null = null
  let clientPhone: string | null = null
  if (db) {
    try {
      const cl = await db.prepare('SELECT firebase_uid, phone FROM clients WHERE id = ?').bind(id).first() as any
      if (cl) {
        firebaseUid = cl.firebase_uid || null
        clientPhone = cl.phone || null
      }
    } catch (_) {}
  }

  // 1. Supprimer le compte Firebase Auth si uid connu (REST API Firebase Admin)
  if (firebaseUid && c.env.FIREBASE_PROJECT_ID && c.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      const serviceAccount = JSON.parse(c.env.FIREBASE_SERVICE_ACCOUNT_KEY as string)
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          assertion: await createFirebaseJWT(serviceAccount)
        }).toString()
      })
      const tokenData = await tokenRes.json() as any
      if (tokenData.access_token) {
        await fetch(`https://identitytoolkit.googleapis.com/v1/projects/${c.env.FIREBASE_PROJECT_ID}/accounts:delete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenData.access_token}` },
          body: JSON.stringify({ localId: firebaseUid })
        })
      }
    } catch (e) {
      console.error('Firebase delete error (non-bloquant):', e)
    }
  }

  if (db) {
    try {
      // 2. Cascade : supprimer toutes les données liées
      await db.prepare('DELETE FROM client_sessions WHERE client_id = ?').bind(id).run()
      await db.prepare('DELETE FROM user_activity_log WHERE client_id = ?').bind(id).run()

      // Supprimer via téléphone si connu
      if (clientPhone) {
        await db.prepare('DELETE FROM appointments WHERE phone = ?').bind(clientPhone).run()
        await db.prepare('DELETE FROM orders WHERE client_phone = ?').bind(clientPhone).run()
        await db.prepare('DELETE FROM maintenance_requests WHERE phone = ?').bind(clientPhone).run()
        const contracts = await db.prepare('SELECT id FROM maintenance_contracts WHERE client_phone = ?').bind(clientPhone).all()
        if (contracts.results?.length) {
          for (const contract of contracts.results as any[]) {
            await db.prepare('DELETE FROM maintenance_visits WHERE contract_id = ?').bind(contract.id).run()
          }
          await db.prepare('DELETE FROM maintenance_contracts WHERE client_phone = ?').bind(clientPhone).run()
        }
        await db.prepare('DELETE FROM sav_tickets WHERE client_phone = ?').bind(clientPhone).run()
        // Pas de table payments Ã  anonymiser
      }

      // 3. Supprimer le client lui-même
      await db.prepare('DELETE FROM clients WHERE id = ?').bind(id).run()
    } catch (error) {
      console.error('Erreur D1 client delete cascade:', error)
    }
  }

  // 4. Supprimer du store mémoire
  const idx = clients.findIndex(cl => cl.id === id)
  if (idx !== -1) clients.splice(idx, 1)

  return c.redirect('/admin/clients?deleted=1')
})

// Helper JWT Firebase Admin
async function createFirebaseJWT(serviceAccount: any): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  const payload = btoa(JSON.stringify({
    iss: serviceAccount.client_email,
    sub: serviceAccount.client_email,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
    scope: 'https://www.googleapis.com/auth/cloud-platform https://www.googleapis.com/auth/firebase'
  })).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  const signingInput = `${header}.${payload}`
  const keyData = serviceAccount.private_key.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\n/g, '')
  const binaryKey = Uint8Array.from(atob(keyData), c => c.charCodeAt(0))
  const cryptoKey = await crypto.subtle.importKey('pkcs8', binaryKey, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign'])
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, new TextEncoder().encode(signingInput))
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  return `${signingInput}.${sigB64}`
}

// ── POST /api/admin/set-role-secret ──────────────────────────────
// Endpoint alternatif protégé par ADMIN_SECRET (pour bootstrap initial)
app.post('/api/admin/set-role-secret', async (c) => {
  let reqBody: any = {}
  try { reqBody = await c.req.json() } catch (e) { return c.json({ error: 'JSON invalide', e: String(e) }, 400) }
  const { uid, role, secret } = reqBody
  const envSecret = (c.env as any).ADMIN_SECRET as string | undefined
  if (!secret || !envSecret || secret !== envSecret) {
    return c.json({ error: 'Secret invalide', debug: { secretLen: secret?.length, envLen: envSecret?.length, equal: secret === envSecret } }, 403)
  }
  if (!uid) return c.json({ error: 'UID requis' }, 400)
  if (!role || (role !== 'admin' && role !== 'client')) return c.json({ error: 'Role invalide' }, 400)
  if (!(c.env as any).FIREBASE_PROJECT_ID || !(c.env as any).FIREBASE_SERVICE_ACCOUNT_KEY) {
    return c.json({ error: 'Configuration Firebase manquante' }, 500)
  }
  try {
    const serviceAccount = JSON.parse((c.env as any).FIREBASE_SERVICE_ACCOUNT_KEY as string)
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: await createFirebaseJWT(serviceAccount)
      }).toString()
    })
    const tokenData = await tokenRes.json() as any
    if (!tokenData.access_token) return c.json({ error: 'Impossible d\'obtenir le token Firebase' }, 500)
    const claimsRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/projects/${(c.env as any).FIREBASE_PROJECT_ID}/accounts:update`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ localId: uid, customAttributes: JSON.stringify({ role }) })
      }
    )
    const claimsData = await claimsRes.json() as any
    if (claimsData.error) return c.json({ error: claimsData.error.message }, 500)
    return c.json({ success: true, message: `Rôle '${role}' assigné à ${uid}` })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

// ── POST /api/admin/set-admin-role ───────────────────────────────
// Définit le custom claim "role": "admin" pour un utilisateur Firebase
// Protégé par adminAuth (auth admin existant du site web)
app.post('/api/admin/set-admin-role', adminAuth, async (c) => {
  const body = await c.req.json().catch(() => ({})) as any
  const { uid, role } = body

  if (!uid) return c.json({ error: 'UID requis' }, 400)
  if (!role || (role !== 'admin' && role !== 'client')) return c.json({ error: 'Role invalide (admin ou client)' }, 400)

  if (!c.env.FIREBASE_PROJECT_ID || !c.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    return c.json({ error: 'Configuration Firebase manquante' }, 500)
  }

  try {
    const serviceAccount = JSON.parse(c.env.FIREBASE_SERVICE_ACCOUNT_KEY as string)
    
    // Obtenir un access token Firebase Admin
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: await createFirebaseJWT(serviceAccount)
      }).toString()
    })
    const tokenData = await tokenRes.json() as any
    
    if (!tokenData.access_token) {
      return c.json({ error: 'Impossible d\'obtenir le token Firebase' }, 500)
    }

    // Définir les custom claims via Firebase Auth REST API
    const claimsRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/projects/${c.env.FIREBASE_PROJECT_ID}/accounts:update`,
      {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${tokenData.access_token}` 
        },
        body: JSON.stringify({
          localId: uid,
          customAttributes: JSON.stringify({ role })
        })
      }
    )
    
    const claimsData = await claimsRes.json() as any
    
    if (claimsData.error) {
      console.error('Firebase setCustomClaims error:', claimsData.error)
      return c.json({ error: 'Erreur Firebase: ' + claimsData.error.message }, 500)
    }

    // Logger l'action dans l'audit
    await logAdminAudit(c.env.DB, {
      action: 'set_admin_role',
      detail: `UID: ${uid}, Role: ${role}`,
      ip: c.req.header('cf-connecting-ip') || 'unknown',
      userAgent: c.req.header('user-agent') || 'unknown'
    })

    return c.json({ success: true, uid, role })
  } catch (e: any) {
    console.error('Set admin role error:', e)
    return c.json({ error: 'Erreur serveur: ' + e.message }, 500)
  }
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

  const name = sanitizeText(rawName, 120)
  const phone = sanitizeText(rawPhone, 20)
  const quartier = sanitizeText(rawQuartier, 120)
  const notes = sanitizeText(rawNotes, 2000)

  // Écrire en D1 d'abord : l'identifiant vient de l'AUTOINCREMENT
  const db = c.env.DB
  let newRdvId = 0
  if (db) {
    try {
      const res: any = await createAppointment(db, {
        name, phone, quartier, date, heure_debut, heure_fin, type, notes,
        latitude, longitude, adresse_precise: ''
      })
      newRdvId = Number(res?.meta?.last_row_id || 0)
    } catch (error) {
      console.error('Erreur D1 rdv add:', error)
      return c.redirect('/admin/rdv?error=' + encodeURIComponent('Enregistrement impossible (base de données)'))
    }
  }
  if (!newRdvId) newRdvId = appointments.length > 0 ? Math.max(...appointments.map(a => a.id)) + 1 : 1

  appointments.push({
    id: newRdvId,
    name, phone, quartier, date, heure_debut, heure_fin, type, notes,
    latitude: latitude as any, longitude: longitude as any,
    adresse_precise: '', status: 'pending' as 'pending',
    created_at: new Date().toISOString().split('T')[0]
  })

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

// Handler shared by both /api/admin/commande/status and /api/admin/commande/update-statut
const handleCommandeStatus = async (c: any) => {
  const body = await c.req.parseBody()
  const id = parseInt(body['id'] as string)
  const status = body['status'] as string
  const adminNotes = ((body['admin_notes'] as string) || '').trim()

  // Nouveaux statuts simplifiés (flux contact commercial)
  const allowedStatuses = ['en_attente', 'contacte', 'confirme', 'en_livraison', 'livre', 'annule']
  if (!allowedStatuses.includes(status)) {
    return c.json({ error: 'Statut invalide' }, 400)
  }

  const order = orders.find(o => o.id === id)

  const db = c.env.DB
  if (db) {
    const now = new Date().toISOString()
    try {
      let res: any
      if (status === 'livre') {
        res = await db.prepare('UPDATE orders SET status = ?, delivered_at = ?, installed_at = ?, updated_at = ? WHERE id = ?')
          .bind(status, now, now, now, id).run()
      } else if (adminNotes) {
        res = await db.prepare('UPDATE orders SET status = ?, admin_notes = ?, updated_at = ? WHERE id = ?')
          .bind(status, adminNotes, now, id).run()
      } else {
        res = await db.prepare('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?').bind(status, now, id).run()
      }
      if (!res?.meta?.changes) return c.json({ error: 'Commande introuvable' }, 404)
    } catch (error) {
      // Ne plus avaler l'erreur : un statut refusé par la contrainte CHECK
      // renvoyait quand même un succès, et le cache mémoire divergeait de la base.
      console.error('Erreur D1 commande update:', error)
      return c.json({ error: 'Mise Ã  jour impossible (base de données)' }, 500)
    }
    // Le cache mémoire n'est aligné qu'après une écriture D1 réussie
    if (order) order.status = status as any

    // Auto-create SAV gratuit when order is marked as livre (livré + installé)
    if (status === 'livre') {
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

          // Vérifier si un SAV gratuit existe déjÃ  pour cette commande
          const existingSav = await db.prepare("SELECT id FROM maintenance_contracts WHERE order_id = ? AND plan_type = 'sav_gratuit'").bind(id).first()
          if (!existingSav) {
            await db.prepare(
              `INSERT INTO maintenance_contracts (client_id, client_name, client_phone, order_id, plan_type, plan_price, start_date, end_date, status, total_visits, completed_visits, next_visit_date, notes)
               VALUES (?, ?, ?, ?, 'sav_gratuit', 0, ?, ?, 'actif', 2, 0, ?, ?)`
            ).bind(
              orderRow.client_id || null,
              orderRow.client_name,
              orderRow.client_phone,
              id,
              now.split('T')[0],
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
        }
      } catch (e) {
        console.error('Erreur création SAV gratuit:', e)
      }
    }

    // Notification WhatsApp client selon le statut
    const STATUS_CLIENT_MSG: Record<string, string> = {
      contacte:     `Bonjour, c'est l'équipe MAASGA ! Nous avons bien reçu votre commande #${id} et nous vous contactons pour finaliser les détails. Répondez Ã  ce message ou appelez le +226 55 99 64 18.`,
      confirme:     `Votre commande MAASGA #${id} est confirmée ! Nous préparons votre livraison et installation. Nous vous tiendrons informé(e).`,
      en_livraison: `Bonne nouvelle ! Votre commande MAASGA #${id} est en cours de livraison. Notre équipe vous contactera pour convenir de l'heure d'installation.`,
      livre:        `ðŸŽ‰ Votre climatiseur (commande #${id}) a été livré et installé avec succès. Merci de votre confiance chez MAASGA ! Votre SAV gratuit est activé.`,
      annule:       `Votre commande MAASGA #${id} a été annulée. Contactez-nous au +226 55 99 64 18 pour plus d'informations.`,
    }
    const clientMsg = STATUS_CLIENT_MSG[status]
    if (clientMsg) {
      try {
        const orderForNotif = order || await db.prepare('SELECT client_name, client_phone FROM orders WHERE id = ?').bind(id).first() as any
        if (orderForNotif?.client_phone) {
          await sendSmsWithLog(c.env, db, orderForNotif.client_phone, clientMsg)
        }
      } catch(e) { console.error('Notification client order error:', e) }
    }
  } else if (order) {
    // Pas de D1 (dev sans binding) : on ne met Ã  jour que le cache mémoire
    order.status = status as any
  }

  return c.json({ success: true })
}

// Register under the route name the frontend uses (/status)
// and keep the old name (/update-statut) as a backward-compatible alias
app.post('/api/admin/commande/status', adminAuth, handleCommandeStatus)
app.post('/api/admin/commande/update-statut', adminAuth, handleCommandeStatus)

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

// ============================================================
// EXPORT : Hono app (Pages-compatible)
// For Workers with cron, use: export default { fetch: app.fetch, scheduled(...) { ... } }
// ============================================================


export default app
