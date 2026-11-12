// Helpers partagés du back-office (auth, tables, cache, stockage)
// (module généré par découpage de l'ancien src/routes/admin/index.tsx, 5 600 lignes)
import { asset } from '../../generated/asset-manifest'
import {
  appointments,
  reviews,
  orders,
  clients,
  notifications,
  setMaintenanceDueCount,
  setPendingMaintenanceContractsCount,
  setPendingMaintenanceRequestsCount,
  pendingMaintenanceContracts
} from '../../data/store'
import { products } from '../../data/products'
import {
  getProducts,
  getReviews,
  getClients,
  getAppointments,
  getOrders
} from '../../db'
import {
  logSecurityEvent
} from '../../utils/notifications'
import {
  verifyToken,
  getAdminSecret,
  getAdminTokenEpoch,
  adminPayloadEpoch
} from '../../utils/security'

// Admin Login Component
export const AdminLoginPage = ({ error }: { error?: string } = {}) => (
  <html lang="fr">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="robots" content="noindex,nofollow" />
      <title>MAASGA Admin - Connexion</title>
      <link rel="stylesheet" href={asset("/static/tailwind.css")} />
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

// Admin Authentication Middleware
export const adminAuth = async (c: any, next: any) => {
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
      const tokenEpoch = adminPayloadEpoch(rawToken)
      const currentEpoch = await getAdminTokenEpoch(c.env?.DB)
      if (tokenEpoch !== null && tokenEpoch === currentEpoch) {
        return next()
      }
      const revokedIp = c.req.header('cf-connecting-ip') || 'unknown'
      logSecurityEvent(c.env?.DB, { event: 'admin_auth_revoked_session', severity: 'warn', ip: revokedIp, details: `Cookie epoch ${tokenEpoch ?? 'legacy'} != ${currentEpoch}` })
      return c.html(AdminLoginPage({ error: 'session_expired' }))
    }
    const adminIp = c.req.header('cf-connecting-ip') || 'unknown'
    logSecurityEvent(c.env?.DB, { event: 'admin_auth_invalid_token', severity: 'warn', ip: adminIp, details: 'Invalid admin cookie signature' })
  }
  const url = new URL(c.req.url)
  const error = url.searchParams.get('error')
  return c.html(AdminLoginPage({ error: error || undefined }))
}

// Crée les tables essentielles si elles n'existent pas (garde-fou DB vide en dev local)
// Le schéma ne change pas pendant la vie d'un isolate : une seule vérification suffit
// (avant : ~12 requêtes DDL à chaque chargement de page admin).
let coreTablesReady: Promise<void> | null = null

export function ensureCoreTables(db: any): Promise<void> {
  if (!coreTablesReady) {
    coreTablesReady = ensureCoreTablesOnce(db).catch((e) => { coreTablesReady = null; throw e })
  }
  return coreTablesReady
}

async function ensureCoreTablesOnce(db: any): Promise<void> {
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
export const refreshAdminCache = async (c: any, next: any) => {
  const db = c.env.DB
  if (db) {
    try {
      await ensureCoreTables(db);
      // Lectures indépendantes : exécutées en parallèle (avant : séquentielles)
      const [dbAppts, dbClients, dbReviews, dbOrders] = await Promise.all([
        getAppointments(db),
        getClients(db),
        getReviews(db, false),
        getOrders(db),
      ])
      // ---------- Appointments ----------
      appointments.length = 0
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

      // Produits : tenus à jour par le middleware de catalogue versionné (src/index.tsx)

      // ---------- Notifications + maintenance (en parallèle) ----------
      const today = new Date().toISOString().split('T')[0]
      await Promise.all([
        (async () => {
          try {
            const notifRows = await db.prepare('SELECT * FROM admin_notifications ORDER BY id DESC LIMIT 100').all()
            notifications.length = 0
            ;(notifRows.results || []).forEach((n: any) => notifications.push(n))
          } catch(e) { console.error('Notifications load cache error:', e) }
        })(),
        (async () => {
          try {
            const [contractsRes, requestsRes, dueRes, pConts] = await Promise.all([
              db.prepare("SELECT COUNT(*) as cnt FROM maintenance_contracts WHERE status = 'en_attente'").first() as any,
              db.prepare("SELECT COUNT(*) as cnt FROM maintenance_requests WHERE status = 'pending'").first() as any,
              db.prepare("SELECT COUNT(*) as cnt FROM maintenance_visits WHERE visit_date <= ? AND status = 'planifiee'").bind(today).first() as any,
              db.prepare("SELECT * FROM maintenance_contracts WHERE status = 'en_attente' ORDER BY id DESC LIMIT 10").all(),
            ])
            setPendingMaintenanceContractsCount(contractsRes?.cnt || 0)
            setPendingMaintenanceRequestsCount(requestsRes?.cnt || 0)
            setMaintenanceDueCount(dueRes?.cnt || 0)
            pendingMaintenanceContracts.length = 0
            ;(pConts?.results || []).forEach((c: any) => pendingMaintenanceContracts.push(c))
          } catch(e) { console.error('Maintenance cache error:', e) }
        })(),
      ])
    } catch (e) {
      console.error('Erreur refreshAdminCache D1:', e)
    }
  }
  await next()
}

// ============================================================
// EXPORTS CSV — Admin only
// ============================================================

export function csvEscape(val: any): string {
  if (val == null) return ''
  let s = String(val)
  // Injection de formule : Excel et LibreOffice évaluent une cellule qui commence
  // par = + - @ (ou tabulation / retour chariot), ce qui permet à un client
  // d'exécuter du code sur le poste de l'admin qui ouvre l'export (=cmd|...).
  // On préfixe par une apostrophe pour forcer l'interprétation en texte, sauf pour
  // les nombres (les prix négatifs restent lisibles).
  if (/^[=+\-@\t\r]/.test(s) && !/^-?\d+(?:[.,]\d+)?$/.test(s)) s = "'" + s
  s = s.replace(/"/g, '""')
  return /[",\n\r]/.test(s) ? `"${s}"` : s
}

// Helper JWT Firebase Admin
export async function createFirebaseJWT(serviceAccount: any): Promise<string> {
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
