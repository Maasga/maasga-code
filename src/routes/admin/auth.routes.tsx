// Authentification admin : connexion, mots de passe, rôles
// (module généré par découpage de l'ancien src/routes/admin/index.tsx, 5 600 lignes)
import { Hono } from 'hono'
import { asset } from '../../generated/asset-manifest'
import type { HonoEnv } from '../../types'
import {
  logActivity,
  logSecurityEvent
} from '../../utils/notifications'
import { hashPassword, verifyPassword, CLIENT_RESET_CODE_MAX_AGE } from '../../services/session.service'
import {
  rateLimitD1,
  rateLimitD1Reset,
  logAdminAudit,
  signToken,
  timingSafeEqualStr,
  getAdminSecret,
  getAdminTokenEpoch,
  bumpAdminTokenEpoch,
  DEFAULT_ADMIN_USERNAME
} from '../../utils/security'
import { adminAuth, createFirebaseJWT } from './shared'

export const adminAuthRouter = new Hono<HonoEnv>()

async function ensureResetCodesTable(db: any) {
  try {
    await db.prepare(`CREATE TABLE IF NOT EXISTS password_reset_codes (token TEXT PRIMARY KEY, code TEXT NOT NULL, phone TEXT NOT NULL DEFAULT '', email TEXT NOT NULL DEFAULT '', created_at INTEGER NOT NULL, used INTEGER NOT NULL DEFAULT 0)`).run()
    // Add email column if missing (migration-safe)
    try { await db.prepare(`ALTER TABLE password_reset_codes ADD COLUMN email TEXT NOT NULL DEFAULT ''`).run() } catch (_) { /* already exists */ }
  } catch(_) {}
}

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
    // Comparaison à durée constante
    if (sigHex.length !== expectedHex.length) return false
    let diff = 0
    for (let i = 0; i < sigHex.length; i++) diff |= sigHex.charCodeAt(i) ^ expectedHex.charCodeAt(i)
    return diff === 0
  } catch { return false }
}

const RESET_TOKEN_MAX_AGE = 15 * 60 * 1000

adminAuthRouter.post('/api/admin/login', async (c) => {
  // Rate limiting: 5 admin login attempts per IP per 15 minutes.
  // Compteur persistant en D1 : le compteur mémoire est par isolate, donc
  // contournable en retentant jusqu'à tomber sur un isolate neuf.
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
  // à la fois la session et le compte (et le même secret sert au reset).
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
// côté serveur tous les cookies déjà émis (un cookie HMAC volé restait sinon
// valable 24 h même après déconnexion).
// En POST : couvert par le middleware CSRF global, donc un site tiers ne peut
// plus déconnecter l'admin (ni révoquer sa session) via une simple <img>.
adminAuthRouter.post('/api/admin/logout', adminAuth, async (c) => {
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
adminAuthRouter.get('/api/admin/logout', (c) => {
  return new Response(null, {
    status: 302,
    headers: {
      'Location': '/admin?error=logged_out',
      'Set-Cookie': 'maasga_admin=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'
    }
  })
})

// Admin password reset — génère un token de reset à usage unique (15 min)
// Étape 1 : Demander un token de reset (accessible sans auth — page publique)
adminAuthRouter.get('/admin/reset-password', (c) => {
  const success = c.req.query('success')
  const error = c.req.query('error')
  return c.html(
    <html lang="fr">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="robots" content="noindex,nofollow" />
        <title>Réinitialisation admin — MAASGA</title>
        <link rel="stylesheet" href={asset("/static/tailwind.css")} />
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
adminAuthRouter.post('/api/admin/generate-reset-token', async (c) => {
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
    // Comparaison à durée constante : un !== simple sort au premier octet
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
        <link rel="stylesheet" href={asset("/static/tailwind.css")} />
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
adminAuthRouter.post('/api/admin/reset-password', async (c) => {
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

  // Usage unique : refuser un token déjà consommé (voir RESET_FLOOR_KEY)
  const db = c.env.DB
  const tokenTs = parseInt(resetToken.slice(0, resetToken.indexOf('.')), 10)
  if (isNaN(tokenTs)) return c.redirect('/admin/reset-password?error=expired')
  if (db) {
    try {
      await db.prepare('CREATE TABLE IF NOT EXISTS admin_settings (key TEXT PRIMARY KEY, value TEXT, updated_at TEXT)').run()
      const floorRow = await db.prepare('SELECT value FROM admin_settings WHERE key = ?').bind(RESET_FLOOR_KEY).first() as any
      const floor = parseInt(floorRow?.value ?? '0', 10) || 0
      if (tokenTs <= floor) {
        logSecurityEvent(db, { event: 'admin_reset_token_replay', severity: 'critical', ip, details: `Token de reset déjà consommé, rejeu depuis ${ip}` })
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
      // ci-dessus sont pures, donc une simple faute de frappe ne brûle pas le lien.
      await db.prepare('INSERT OR REPLACE INTO admin_settings (key, value, updated_at) VALUES (?, ?, ?)').bind(RESET_FLOOR_KEY, String(tokenTs), new Date().toISOString()).run()
      await db.prepare('INSERT OR REPLACE INTO admin_settings (key, value, updated_at) VALUES (?, ?, ?)').bind('admin_password_hash', newHash, new Date().toISOString()).run()
      await db.prepare('INSERT OR REPLACE INTO admin_settings (key, value, updated_at) VALUES (?, ?, ?)').bind('admin_username', newUsername, new Date().toISOString()).run()
      // Révoquer les sessions admin en cours : après un reset, un cookie encore
      // valide 24 h aurait laissé l'accès à qui avait provoqué le reset.
      await bumpAdminTokenEpoch(db)
      logSecurityEvent(db, { event: 'admin_password_reset', severity: 'critical', ip, details: `Identifiant et mot de passe admin réinitialisés depuis ${ip}` })
    } catch(e) {
      console.error('Reset password error:', e)
      return c.redirect('/admin/reset-password?error=invalid')
    }
  }
  return c.redirect('/admin/reset-password?success=reset')
})

adminAuthRouter.post('/api/admin/change-password', adminAuth, async (c) => {
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

// Admin: View pending password reset codes
adminAuthRouter.get('/api/admin/reset-codes', adminAuth, async (c) => {
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
adminAuthRouter.get('/api/admin/reset-codes/:token/whatsapp', adminAuth, async (c) => {
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

// ── POST /api/admin/set-role-secret ──────────────────────────────
// Endpoint alternatif protégé par ADMIN_SECRET (pour bootstrap initial)
adminAuthRouter.post('/api/admin/set-role-secret', async (c) => {
  let reqBody: any = {}
  const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown'
  const rl = await rateLimitD1(c.env?.DB, `set-role-secret:${ip}`, 5, 15 * 60 * 1000)
  if (!rl.allowed) return c.json({ error: 'Trop de tentatives' }, 429)
  try { reqBody = await c.req.json() } catch { return c.json({ error: 'JSON invalide' }, 400) }
  const { uid, role, secret } = reqBody
  const envSecret = (c.env as any).ADMIN_SECRET as string | undefined
  // SÉCURITÉ : comparaison en temps constant, aucune info de debug renvoyée
  if (typeof secret !== 'string' || !envSecret || !timingSafeEqualStr(secret, envSecret)) {
    return c.json({ error: 'Secret invalide' }, 403)
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
adminAuthRouter.post('/api/admin/set-admin-role', adminAuth, async (c) => {
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
