// Client Space & Web Authentication Routes (/espace-client, /api/login, /api/register, invoices, devis, SAV)
import { Hono } from 'hono'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import type { HonoEnv } from '../../types'
import { EspaceClientPage } from '../../pages/espace-client'
import { products } from '../../data/products'
import { orders, appointments } from '../../data/store'
import type { Order } from '../../data/store'
import { escapeHtml, sanitizeText, isValidEmail, isValidPhone, normalizePhone } from '../../utils/helpers'
import { notifyAdmin, logActivity, logSecurityEvent, ensureActivityLog } from '../../utils/notifications'
import {
  hashPassword,
  verifyPassword,
  generateSessionToken,
  setSession,
  getSession,
  deleteSession,
  ensureEmailVerificationTable,
  generateEmailToken,
  sendVerificationEmail,
  sendPasswordResetEmail,
  ensureResetCodesTable,
  clientResetCodes,
  CLIENT_RESET_CODE_MAX_AGE,
  EMAIL_VERIFY_TTL
} from '../../services/session.service'
import {
  rateLimit,
  getAdminSecret,
  signToken,
  verifyToken,
  DEFAULT_ADMIN_USERNAME
} from '../../utils/security'

export const clientRouter = new Hono<HonoEnv>()

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
  } catch(_) {}
}

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
  } catch(_) {}
}

async function renderDashboard(c: any, clientId: number) {
  const db = c.env.DB
  if (!_tablesChecked) {
    await ensureMaintenanceTables(db)
    await ensureActivityLog(db)
    _tablesChecked = true
  }
  const client = await db.prepare(
    'SELECT id, name, phone, email, quartier, created_at FROM clients WHERE id = ?'
  ).bind(clientId).first() as any
  if (!client) {
    return new Response(null, {
      status: 302,
      headers: {
        'Location': '/espace-client?error=' + encodeURIComponent('Session invalide.'),
        'Set-Cookie': 'maasga_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'
      }
    })
  }
  // Rétroactivement lier les commandes créées avec ce téléphone mais sans client_id
  if (client.phone) {
    try {
      const rawPhone = client.phone.replace(/\D/g, '')
      const last8 = rawPhone.slice(-8)
      await db.prepare("UPDATE orders SET client_id = ? WHERE (client_phone = ? OR client_phone LIKE ?) AND (client_id IS NULL OR client_id = 0)").bind(clientId, client.phone, `%${last8}`).run()
      await db.prepare("UPDATE maintenance_contracts SET client_id = ? WHERE (client_phone = ? OR client_phone LIKE ?) AND (client_id IS NULL OR client_id = 0)").bind(clientId, client.phone, `%${last8}`).run()
      await db.prepare("UPDATE maintenance_requests SET client_id = ? WHERE (phone = ? OR phone LIKE ?) AND (client_id IS NULL OR client_id = 0)").bind(clientId, client.phone, `%${last8}`).run()
    } catch(_) {}
  }
  let orders: any[] = [], rdvs: any[] = [], maintenanceContracts: any[] = []
  let maintenanceVisits: any[] = [], maintenanceRequests: any[] = []
  let activityLog: any[] = []
  try {
    const [ordersRes, rdvsRes, contractsRes, visitsRes, requestsRes, activityRes] = await db.batch([
      db.prepare('SELECT o.id, o.type, o.status, o.notes, o.total_price, o.admin_notes, o.created_at, p.name as product_name, p.btu, p.brand, p.image FROM orders o LEFT JOIN products p ON o.product_id = p.id WHERE (o.client_phone = ? OR o.client_id = ?) GROUP BY o.id ORDER BY o.created_at DESC').bind(client.phone, clientId),
      db.prepare('SELECT id, date, heure_debut, heure_fin, type, status, quartier, notes, created_at FROM appointments WHERE (phone = ? OR phone LIKE ?) ORDER BY date DESC').bind(client.phone, `%${(client.phone||'').replace(/\D/g,'').slice(-8)}`),
      db.prepare('SELECT id, plan_type, plan_price, start_date, end_date, status, total_visits, completed_visits, next_visit_date, notes, order_id FROM maintenance_contracts WHERE (client_phone = ? OR client_phone LIKE ? OR (client_id IS NOT NULL AND client_id = ?)) GROUP BY id ORDER BY created_at DESC').bind(client.phone, `%${(client.phone||'').replace(/\D/g,'').slice(-8)}`, clientId),
      db.prepare('SELECT id, contract_id, visit_type, visit_date, status, technician, description, actions_performed, notes FROM maintenance_visits WHERE (client_phone = ? OR (client_id IS NOT NULL AND client_id = ?)) GROUP BY id ORDER BY visit_date DESC').bind(client.phone, clientId),
      db.prepare('SELECT id, request_type, description, preferred_date, equipment_type, plan_type, status, created_at FROM maintenance_requests WHERE (phone = ? OR phone LIKE ? OR (client_id IS NOT NULL AND client_id = ?)) ORDER BY created_at DESC').bind(client.phone, `%${(client.phone||'').replace(/\D/g,'').slice(-8)}`, clientId),
      db.prepare('SELECT id, action, category, details, created_at FROM user_activity_log WHERE client_id = ? ORDER BY created_at DESC LIMIT 50').bind(clientId)
    ])
    orders = ordersRes.results || []
    rdvs = rdvsRes.results || []
    maintenanceContracts = contractsRes.results || []
    maintenanceVisits = visitsRes.results || []
    maintenanceRequests = requestsRes.results || []
    activityLog = activityRes.results || []
  } catch (batchErr) {
    console.error('Dashboard batch query error:', batchErr)
    try { orders = (await db.prepare('SELECT o.id, o.type, o.status, o.notes, o.total_price, o.admin_notes, o.created_at, p.name as product_name, p.btu, p.brand, p.image FROM orders o LEFT JOIN products p ON o.product_id = p.id WHERE (o.client_phone = ? OR o.client_id = ?) GROUP BY o.id ORDER BY o.created_at DESC').bind(client.phone, clientId).all()).results || [] } catch(_) {}
    try { rdvs = (await db.prepare('SELECT id, date, heure_debut, heure_fin, type, status, quartier, notes, created_at FROM appointments WHERE (phone = ? OR phone LIKE ?) ORDER BY date DESC').bind(client.phone, `%${(client.phone||'').replace(/\D/g,'').slice(-8)}`).all()).results || [] } catch(_) {}
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
    clientActivityLog={activityLog as any[]}
  />)
}


// Route: Verify email via link
clientRouter.get('/api/verify-email', async (c) => {
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
clientRouter.post('/api/resend-verification', async (c) => {
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
  if (!client?.email) return c.json({ error: 'Aucun email associé Ã  votre compte' }, 400)

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
clientRouter.post('/api/login', async (c) => {
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
  // Valider le redirect: doit commencer par / et ne contenir que des caractères sÃ»rs
  const safeRedirect = (redirectParam && /^\/[a-z0-9\-\/]+$/i.test(redirectParam)) ? '/' + redirectParam.replace(/^\/+/, '') : ''

  if (!identifier || !password) {
    return c.redirect('/espace-client?error=' + encodeURIComponent('Identifiants manquants.') + (safeRedirect ? '&redirect=' + encodeURIComponent(redirectParam) : ''))
  }

  const db = c.env.DB

  // â”€â”€ Vérification admin â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
    const isAdminUserMatch = identifier.toLowerCase() === validAdminUsername.toLowerCase() ||
      identifier.toLowerCase() === 'admin' ||
      identifier.toLowerCase() === 'maasgabf' ||
      identifier.toLowerCase() === 'maasgabf@gmail.com'
    const isAdminValid = await verifyPassword(password, validAdminHash)
    if (isAdminUserMatch && isAdminValid) {
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
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
    await db.prepare(`CREATE TABLE IF NOT EXISTS password_reset_codes (token TEXT PRIMARY KEY, code TEXT NOT NULL, phone TEXT NOT NULL DEFAULT '', email TEXT NOT NULL DEFAULT '', created_at INTEGER NOT NULL, used INTEGER NOT NULL DEFAULT 0)`).run()
    // Add email column if missing (migration-safe)
    try { await db.prepare(`ALTER TABLE password_reset_codes ADD COLUMN email TEXT NOT NULL DEFAULT ''`).run() } catch (_) { /* already exists */ }
  } catch(_) {}
}

// Page: Demander un reset
clientRouter.get('/espace-client/reset-password', (c) => {
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
                 step === 'code' ? `Un code de vérification a été envoyé Ã  ${decodeURIComponent(sentTo || 'votre email')}` :
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
                <p class="text-xs" style="color:#94a3b8;"><i class="fas fa-info-circle mr-1"></i>Un code Ã  6 chiffres sera envoyé Ã  votre adresse email.</p>
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
                <i class="fas fa-arrow-left mr-1"></i>Retour Ã  la connexion
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
})

// Step 1a backend: EMAIL — Generate 6-digit code and send via Brevo email
clientRouter.post('/api/client/request-reset-email', async (c) => {
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
    return c.redirect('/espace-client/reset-password?error=' + encodeURIComponent("Erreur lors de l\'envoi de l'email. Essayez avec votre numéro de téléphone."))
  }

  // Mask email for display: s***@g***.com
  const [localPart, domain] = email.split('@')
  const maskedEmail = localPart.charAt(0) + '***@' + domain.charAt(0) + '***' + domain.slice(domain.lastIndexOf('.'))

  return c.redirect('/espace-client/reset-password?step=code&token=' + token + '&method=email&sent_to=' + encodeURIComponent(maskedEmail))
})

// Step 1b backend: PHONE (WhatsApp) — Generate 6-digit code and send via SMS/WhatsApp
clientRouter.post('/api/client/request-reset', async (c) => {
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
          text: `ðŸ” *Demande de réinitialisation*\nTéléphone: ${normalizedPhone}\nCode: \`${code}\`\n\n[Envoyer via WhatsApp](${waLink})`,
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
clientRouter.post('/api/client/verify-reset-code', async (c) => {
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
clientRouter.post('/api/client/reset-password', async (c) => {
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
clientRouter.post('/api/register', async (c) => {
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
      return errRedirect('Un compte existe déjÃ  avec ce numéro. Connectez-vous.')
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

clientRouter.get('/api/auth/google', (c) => {
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

clientRouter.get('/api/auth/google/callback', async (c) => {
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
    return errorRedirect("Aucun code d'autorisation reçu de Google.")
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

clientRouter.get('/api/session-check', async (c) => {
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

clientRouter.post('/api/client/update-profile', async (c) => {
  const db = c.env.DB
  if (!db) return c.json({ error: 'Service indisponible' }, 503)

  const sessionToken = getCookie(c, 'maasga_session') || ''
  const session = sessionToken ? await getSession(db, sessionToken) : null
  if (!session) return c.json({ error: 'Non connecté' }, 401)

  const body = await c.req.json().catch(() => null) || await c.req.parseBody()
  const phone = normalizePhone(((body as any)?.phone || '').toString().trim())
  const quartier = ((body as any)?.quartier || '').toString().trim()
  const name = ((body as any)?.name || '').toString().trim()

  if (!phone && !quartier && !name) return c.json({ error: 'Aucune donnée Ã  mettre Ã  jour' }, 400)

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
    await logActivity(db, { clientId: session.clientId, clientPhone: phone || '', action: 'Profil mis Ã  jour', category: 'profile', ip: c.req.header('cf-connecting-ip') || '' })

    // Return updated client data
    const client = await db.prepare('SELECT id, name, phone, email, quartier FROM clients WHERE id = ?').bind(session.clientId).first() as any
    return c.json({ success: true, name: client?.name || '', phone: client?.phone || '', email: client?.email || '', quartier: client?.quartier || '' })
  } catch (e) {
    return c.json({ error: 'Erreur lors de la mise Ã  jour' }, 500)
  }
})

// ============================================================
// CONFIRMATION COMMANDE — Nouveau flux contact commercial
// Le client confirme sa commande â†’ MAASGA le contacte par email/WhatsApp
// Pas de paiement en ligne : tout se fait directement avec l'équipe
// ============================================================

clientRouter.post('/api/order/confirm', async (c) => {
  const db = c.env.DB
  if (!db) return c.json({ error: 'Service indisponible' }, 503)

  const sessionToken = getCookie(c, 'maasga_session') || ''
  const session = sessionToken ? await getSession(db, sessionToken) : null

  const body = await c.req.json().catch(() => null) || await c.req.parseBody()
  const orderId = parseInt((body as any)?.order_id || '0')
  if (!orderId) return c.json({ error: 'ID commande manquant' }, 400)

  // Vérifier que la commande appartient au client connecté (ou pas de session = accès public)
  const order = session
    ? await db.prepare('SELECT * FROM orders WHERE id = ? AND (client_id = ? OR client_phone = (SELECT phone FROM clients WHERE id = ?))').bind(orderId, session.clientId, session.clientId).first() as any
    : await db.prepare('SELECT * FROM orders WHERE id = ?').bind(orderId).first() as any

  if (!order) return c.json({ error: 'Commande introuvable' }, 404)
  if (order.status !== 'en_attente') return c.json({ error: 'Cette commande a déjÃ  été traitée' }, 400)

  const now = new Date().toISOString()
  await db.prepare('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?').bind('en_attente', now, orderId).run()

  // Notifier l'admin immédiatement
  await notifyAdmin(c.env, 'order',
    `ðŸ›’ Nouvelle commande confirmée #${orderId} — ${order.client_name} (${order.client_phone})${order.total_price ? ` — ${Number(order.total_price).toLocaleString()} FCFA` : ''} — À contacter !`
  )

  if (session) {
    await logActivity(db, {
      clientId: session.clientId,
      clientPhone: order.client_phone,
      action: `Commande #${orderId} confirmée — en attente de contact MAASGA`,
      category: 'order',
      ip: c.req.header('cf-connecting-ip') || ''
    })
  }

  return c.json({ success: true, message: "Commande confirmée ! L'équipe MAASGA vous contactera par email ou WhatsApp sous 24h." })
})

clientRouter.get('/espace-client', async (c) => {
  const error = c.req.query('error')
  const redirect = c.req.query('redirect') || ''
  const db = c.env.DB

  // Session sécurisée côté serveur (HttpOnly cookie â†’ lookup dans D1)
  const sessionToken = getCookie(c, 'maasga_session') || ''
  let session = sessionToken ? await getSession(db, sessionToken) : null

  // Rétrocompatibilité : ancien format cookie (clientId_timestamp) â†’ migrer vers nouvelle session
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
    // Si l'utilisateur est déjÃ  connecté et qu'il y a un redirect, aller directement Ã  la page demandée
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

clientRouter.get('/api/logout', async (c) => {
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

// ORDER INVOICE (printable HTML â†’ PDF via browser)
// ============================================================

clientRouter.get('/api/order/invoice/:id', async (c) => {
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
    return c.redirect('/espace-client?error=' + encodeURIComponent('Veuillez vous connecter pour accéder Ã  la facture.'))
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
    // Pas de paiement en ligne — le paiement se fait directement avec l'équipe MAASGA

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

    const STATUS_LABEL: Record<string,string> = { en_attente:'En attente', contacte:'Contacté', confirme:'Confirmée', en_livraison:'En livraison', livre:'Livrée & installée', annule:'Annulée' }
    const STATUS_COLOR: Record<string,string> = { en_attente:'background:rgba(217,119,6,0.1);color:#d97706', contacte:'background:rgba(59,130,246,0.1);color:#3b82f6', confirme:'background:rgba(16,185,129,0.1);color:#10b981', en_livraison:'background:rgba(14,165,233,0.1);color:#0ea5e9', livre:'background:rgba(22,163,74,0.1);color:#16a34a', annule:'background:rgba(239,68,68,0.1);color:#ef4444' }
    const DEVIS_STATUS: Record<string,string> = { pending:'En attente', sent:'Envoyé', validated:'Accepté', refused:'Refusé', expired:'Expiré' }
    const DEVIS_COLOR: Record<string,string> = { pending:'background:rgba(217,119,6,0.1);color:#d97706', sent:'background:rgba(59,130,246,0.1);color:#3b82f6', validated:'background:rgba(22,163,74,0.1);color:#16a34a', refused:'background:rgba(239,68,68,0.1);color:#ef4444', expired:'background:rgba(148,163,184,0.1);color:#94a3b8' }

    // Build devis section using string concatenation to avoid nested template literal issues
    let devisSection = ''
    if (allDevis.length > 0) {
      devisSection += '<div style="margin-bottom:30px;">'
      devisSection += '<div style="font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:#94a3b8;font-weight:700;margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid #e2e8f0;">Devis associés Ã  cette commande</div>'
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

    // Modalité de paiement — flux contact commercial (pas de paiement en ligne)
    const paymentSection = '<div class="payment-info" style="background:#f0f9ff;border:1px solid rgba(0,119,182,0.2);">' +
      '<div class="pay-icon" style="background:rgba(0,119,182,0.1);color:#0077b6;">ðŸ“ž</div>' +
      '<div><div style="font-size:14px;font-weight:700;color:#0077b6;">Paiement Ã  l\'installation</div>' +
      '<div style="font-size:12px;color:#64748b;">Le paiement et les modalités sont arrangés directement avec l\'équipe MAASGA par email ou WhatsApp.</div></div>' +
      '</div>'

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
      "@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');\n" +
      '*{margin:0;padding:0;box-sizing:border-box}\n' +
      "body{font-family:'Inter',sans-serif;background:#f8fafc;color:#1e293b}\n" +
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
      '<div style="font-size:26px;font-weight:800;letter-spacing:-0.5px;color:#fff;">MAASGA<span style="color:#00b4d8;"> â„</span></div>\n' +
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
// MAINTENANCE CONTRACT INVOICE (printable HTML â†’ PDF via browser)
// ============================================================

clientRouter.get('/api/maintenance/invoice/:id', async (c) => {
  const contractId = parseInt(c.req.param('id'))
  if (isNaN(contractId)) return c.text('ID invalide', 400)

  // Verify session
  const sessionToken = getCookie(c, 'maasga_session') || ''
  const db = c.env.DB
  if (!db) return c.text('Service indisponible', 503)
  const session = await getSession(db, sessionToken)
  if (!session) {
    return c.redirect('/espace-client?error=' + encodeURIComponent('Veuillez vous connecter pour accéder Ã  la facture.'))
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

  // Pas de paiement en ligne — le paiement se fait directement avec l'équipe MAASGA
  const payment: any = null
  const payMethodLabels: Record<string, string> = {}

  const planLabels: Record<string, string> = { trimestriel: 'Trimestriel (3 mois)', semestriel: 'Semestriel (6 mois)', annuel: 'Annuel Premium (12 mois)', sav_gratuit: 'SAV Gratuit' }
  const statusLabels: Record<string, string> = { en_attente: 'En attente', contacte: 'Contacté', actif: 'Actif', expire: 'Expiré', annule: 'Annulé' }
  const visitStatusLabels: Record<string, string> = { planifiee: 'Planifiée', confirmee: 'Confirmée', effectuee: 'Effectuée', annulee: 'Annulée' }

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
        <img src="${SITE_URL}/logo-site.png" alt="MAASGA Logo" style="height:60px;width:auto;border-radius:10px;margin-bottom:8px;display:block;" onerror="this.style.display='none';this.nextElementSibling.style.display='block';" />
        <div class="logo" style="display:none;">MAASGA<span> â„ï¸</span></div>
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
          <div class="value status" style="${contract.status === 'actif' ? 'background:rgba(22,163,74,0.1);color:#16a34a;' : 'background:rgba(148,163,184,0.1);color:#94a3b8;'}">${statusLabels[contract.status] || contract.status}</div>
        </div>
        <div class="detail-card">
          <div class="label">Période de couverture</div>
          <div class="value" style="font-size:14px;">${fmtDate(contract.start_date)} â†’ ${fmtDate(contract.end_date)}</div>
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
        <div class="pay-icon">âœ“</div>
        <div>
          <div style="font-size:14px;font-weight:700;color:#16a34a;">Paiement ${payment.status === 'completed' ? 'confirmé' : payment.status === 'pending' ? 'en attente' : payment.status}</div>
          <div style="font-size:12px;color:#64748b;">${payMethodLabels[payment.method] || payment.method || 'Non spécifié'} · ${fmtDate(payment.created_at)}${payment.provider_ref ? ' · Réf: ' + payment.provider_ref : ''}</div>
        </div>
      </div>
      ` : `
      <div class="payment-info" style="background:#fffbeb;border-color:rgba(217,119,6,0.15);">
        <div class="pay-icon" style="background:rgba(217,119,6,0.1);color:#d97706;">â³</div>
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

clientRouter.post('/api/order/create', async (c) => {
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
      client_name: sanitizeText(str(body['client_name']).trim(), 120),
      client_phone: sanitizeText(str(body['client_phone']).trim(), 20),
      client_email: str(body['client_email']).trim() ? sanitizeText(str(body['client_email']).trim(), 160) : null,
      quartier: (str(body['quartier']) || str(body['client_address'])).trim() ? sanitizeText((str(body['quartier']) || str(body['client_address'])).trim(), 200) : null,
      type: normalizedType,
      status: 'en_attente' as const,
      notes: str(body['notes']).trim() ? sanitizeText(str(body['notes']).trim(), 2000) : null,
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

    // Écrire d'abord en D1 pour obtenir l'identifiant AUTOINCREMENT réel : le
    // Math.max sur le cache mémoire produisait des id déjÃ  pris en base (cache
    // partiel, un par isolate), donc deux commandes pouvaient partager un numéro.
    let orderId = 0
    if (db) {
      try {
        const res: any = await createOrder(db, orderData)
        orderId = Number(res?.meta?.last_row_id || 0)
      } catch (error) {
        console.error('Erreur sauvegarde D1 order:', error)
        return c.json({ error: 'Enregistrement de la commande impossible. Réessayez.' }, 500)
      }
    }
    if (!orderId) orderId = Math.max(...orders.map(o => o.id), 0) + 1

    const newOrder: Order = {
      id: orderId,
      ...orderData,
      created_at: new Date().toISOString()
    }
    orders.push(newOrder)

    if (db) {
      // Enregistrer/mettre Ã  jour le client dans D1
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
clientRouter.post('/api/order/confirm-delivery', async (c) => {
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
  if (order.status !== 'en_livraison') return c.json({ error: 'Cette commande ne peut pas être confirmée comme livrée' }, 400)

  const now = new Date().toISOString()
  // Pas de colonne delivery_confirmed_by : la table orders reconstruite par la
  // migration 0036 ne la contient plus. L'information Â« confirmé par le client Â»
  // est tracée dans notes + le journal d'activité.
  await db.prepare("UPDATE orders SET status = ?, delivered_at = ?, notes = COALESCE(notes, '') || ?, updated_at = ? WHERE id = ?")
    .bind('livre', now, ' | Réception confirmée par le client le ' + now, now, orderId).run()

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
clientRouter.post('/api/order/devis/validate', async (c) => {
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
  // Devis accepté = transaction confirmée avec le client (statut 0036)
  await db.prepare('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?')
    .bind('confirme', now, devis.order_id).run()

  const memOrder = orders.find(o => o.id === devis.order_id)
  if (memOrder) memOrder.status = 'confirme' as any

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
clientRouter.post('/api/order/devis/refuse', async (c) => {
  const db = c.env.DB
  if (!db) return c.json({ error: 'Service indisponible' }, 503)

  const sessionToken = getCookie(c, 'maasga_session') || ''
  const session = sessionToken ? await getSession(c.env.DB, sessionToken) : null
  if (!session) return c.json({ error: 'Non connecté' }, 401)

  const body = await c.req.json().catch(() => null)
  const devisId = parseInt((body as any)?.devis_id || '0')
  const reason = sanitizeText((body as any)?.reason, 1000)
  if (!devisId) return c.json({ error: 'ID devis manquant' }, 400)

  const devis = await db.prepare('SELECT od.*, o.client_id FROM order_devis od JOIN orders o ON od.order_id = o.id WHERE od.id = ? AND o.client_id = ?').bind(devisId, session.clientId).first() as any
  if (!devis) return c.json({ error: 'Devis introuvable' }, 404)
  if (devis.status !== 'sent' && devis.status !== 'pending') return c.json({ error: 'Ce devis ne peut plus être refusé' }, 400)

  const now = new Date().toISOString()
  await db.prepare('UPDATE order_devis SET status = ?, refused_at = ?, client_response_notes = ?, updated_at = ? WHERE id = ?')
    .bind('refused', now, reason, now, devisId).run()
  // Refus de devis : le statut de la commande ne bouge pas — il n'existe plus de
  // valeur Â« devis_refuse Â» depuis la migration 0036, c'est order_devis.status qui
  // porte l'information. L'admin relance le client depuis la fiche commande.

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

// Note : l'ancien endpoint POST /api/order/cancel-installation a été retiré.
// Son garde-fou n'acceptait que validation_terrain / devis_en_attente /
// devis_valide / devis_refuse, statuts supprimés par la migration 0036 : aucune
// commande ne pouvait plus le franchir. Le flux simplifié ne distingue plus la
// livraison de l'installation (statut unique 'livre'), donc Â« annuler seulement
// l'installation Â» n'a plus de sens ; l'annulation complète passe par
// /api/order/cancel-order.

// Client cancels the entire order (refund request)
clientRouter.post('/api/order/cancel-order', async (c) => {
  const db = c.env.DB
  if (!db) return c.json({ error: 'Service indisponible' }, 503)

  const sessionToken = getCookie(c, 'maasga_session') || ''
  const session = sessionToken ? await getSession(c.env.DB, sessionToken) : null
  if (!session) return c.json({ error: 'Non connecté' }, 401)

  const body = await c.req.json().catch(() => null)
  const orderId = parseInt((body as any)?.order_id || '0')
  const reason = sanitizeText((body as any)?.reason, 1000)
  if (!orderId) return c.json({ error: 'ID commande manquant' }, 400)

  const order = await db.prepare('SELECT * FROM orders WHERE id = ? AND client_id = ?').bind(orderId, session.clientId).first() as any
  if (!order) return c.json({ error: 'Commande introuvable' }, 404)

  // Statuts annulables — alignés sur le CHECK de la migration 0036
  const cancellableStatuses = ['en_attente', 'contacte', 'confirme']
  if (!cancellableStatuses.includes(order.status)) return c.json({ error: 'Cette commande ne peut plus être annulée' }, 400)

  const now = new Date().toISOString()
  await db.prepare(`UPDATE orders SET status = ?, notes = COALESCE(notes, '') || ?, updated_at = ? WHERE id = ?`)
    .bind('annule', ' | Annulée par client le ' + now + (reason ? ' — ' + reason : ''), now, orderId).run()

  const memOrder = orders.find(o => o.id === orderId)
  if (memOrder) memOrder.status = 'annule' as any

  // Pas de paiement en ligne — rien Ã  rembourser automatiquement

  await logActivity(db, {
    clientId: session.clientId,
    clientPhone: order.client_phone,
    action: `Commande annulée — #${orderId}${reason ? ' — ' + reason : ''}`,
    category: 'order',
    ip: c.req.header('cf-connecting-ip') || ''
  })
  await notifyAdmin(c.env, 'order', `âš ï¸ Commande #${orderId} annulée par client — ${order.client_name} — Remboursement Ã  traiter${reason ? ' — Raison: ' + reason : ''}`)

  return c.json({ success: true, message: 'Commande annulée. Le remboursement sera traité sous 48h.' })
})

// Get order devis for a client
clientRouter.get('/api/order/:orderId/devis', async (c) => {
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

// Client: soumettre un ticket SAV depuis l'espace client
clientRouter.post('/api/client/sav/create', async (c) => {
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
clientRouter.get('/api/client/sav/list', async (c) => {
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
