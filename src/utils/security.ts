// Security Utilities for MAASGA (Rate Limiting, HMAC tokens, Timing-safe comparisons, Audit logs)

export const TOKEN_MAX_AGE_MS = 24 * 60 * 60 * 1000 // 24 hours
export const ADMIN_EPOCH_KEY = 'admin_token_epoch'
export const DEFAULT_ADMIN_USERNAME = 'admin'

export function getAdminSecret(env: any): string {
  const secret = env?.ADMIN_SECRET
  if (!secret || typeof secret !== 'string' || secret.length < 16) {
    throw new Error('ADMIN_SECRET env var manquante ou trop courte (min 16 chars). Configurez-la via: wrangler secret put ADMIN_SECRET')
  }
  return secret
}

const rateLimitStore = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_MAX_ENTRIES = 10000

let _lastRateLimitCleanup = 0
export function rateLimitCleanup() {
  const now = Date.now()
  if (now - _lastRateLimitCleanup < 300000) return // max every 5 min
  _lastRateLimitCleanup = now
  for (const [key, entry] of rateLimitStore) {
    if (now > entry.resetAt) rateLimitStore.delete(key)
  }
}

export function rateLimit(key: string, maxRequests: number, windowMs: number): { allowed: boolean; remaining: number } {
  rateLimitCleanup()
  const now = Date.now()
  const entry = rateLimitStore.get(key)
  if (!entry || now > entry.resetAt) {
    if (rateLimitStore.size >= RATE_LIMIT_MAX_ENTRIES) {
      for (const [k, v] of rateLimitStore) {
        if (now > v.resetAt) rateLimitStore.delete(k)
      }
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

export async function rateLimitD1(db: any, key: string, maxRequests: number, windowMs: number): Promise<{ allowed: boolean; remaining: number }> {
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
      try { await db.prepare('DELETE FROM rate_limits WHERE window_start < ?').bind(now - 86400000).run() } catch (_) {}
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

export async function rateLimitD1Reset(db: any, key: string): Promise<void> {
  if (!db) return
  try { await db.prepare('DELETE FROM rate_limits WHERE key = ?').bind(key).run() } catch (_) {}
}

export async function logAdminAudit(db: any, data: { action: string; detail?: string; ip?: string; userAgent?: string }): Promise<void> {
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
    await db.prepare('INSERT INTO admin_audit_log (action, detail, ip, user_agent) VALUES (?, ?, ?, ?)').bind(
      data.action,
      data.detail || null,
      data.ip || null,
      data.userAgent || null
    ).run()
  } catch (e) {
    console.error('[AUDIT] Échec logAdminAudit:', e)
  }
}

export async function signToken(payload: string, secret: string): Promise<string> {
  if (!secret) throw new Error('Secret HMAC requis pour signer le token')
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload))
  return payload + '.' + Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function verifyToken(token: string, secret: string): Promise<boolean> {
  if (!secret) return false
  const parts = token.split('.')
  if (parts.length < 2) return false
  const payload = parts.slice(0, -1).join('.')
  const tsMatch = payload.match(/_(\d+)$/)
  if (tsMatch) {
    const tokenTime = parseInt(tsMatch[1], 10)
    if (Date.now() - tokenTime > TOKEN_MAX_AGE_MS) return false
  }
  const expected = await signToken(payload, secret)
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

export function timingSafeEqualStr(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

export async function getAdminTokenEpoch(db: any): Promise<string> {
  if (!db) return '1'
  try {
    const row = await db.prepare('SELECT value FROM admin_settings WHERE key = ?').bind(ADMIN_EPOCH_KEY).first() as any
    const v = parseInt(row?.value ?? '', 10)
    return isNaN(v) ? '1' : String(v)
  } catch { return '1' }
}

export async function bumpAdminTokenEpoch(db: any): Promise<void> {
  if (!db) return
  try {
    const current = await getAdminTokenEpoch(db)
    const next = String(Number(current) + 1)
    await db.prepare('INSERT OR REPLACE INTO admin_settings (key, value, updated_at) VALUES (?, ?, datetime(\'now\'))').bind(ADMIN_EPOCH_KEY, next).run()
  } catch (e) {
    console.error('[SECURITY] bumpAdminTokenEpoch échec:', e)
  }
}

export function adminPayloadEpoch(token: string): string | null {
  const parts = token.split('.')
  if (parts.length < 2) return null
  const payload = parts.slice(0, -1).join('.')
  const m = payload.match(/^admin_(\d+)_(\d+)$/)
  return m ? m[1] : null
}
