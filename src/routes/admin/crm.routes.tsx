// CRM : clients, rendez-vous, commandes, exports, statistiques
// (module généré par découpage de l'ancien src/routes/admin/index.tsx, 5 600 lignes)
import { Hono } from 'hono'
import type { HonoEnv } from '../../types'
import {
  appointments,
  reviews,
  orders,
  clients
} from '../../data/store'
import { products } from '../../data/products'
import {
  createAppointment,
  updateAppointmentStatus,
  createOrder,
  getAppointmentById
} from '../../db'
import {
  sanitizeText,
  isValidEmail,
  isValidPhone
} from '../../utils/helpers'
import {
  sendSmsWithLog,
  notifyAdmin,
  logSecurityEvent
} from '../../utils/notifications'
import { hashPassword, verifyPassword } from '../../services/session.service'
import {
  rateLimitD1,
  logAdminAudit
} from '../../utils/security'
import { adminAuth, csvEscape, createFirebaseJWT } from './shared'

export const adminCrmRouter = new Hono<HonoEnv>()

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
      return c.json({ error: 'Mise à jour impossible (base de données)' }, 500)
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

          // Vérifier si un SAV gratuit existe déjà pour cette commande
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
      contacte:     `Bonjour, c'est l'équipe MAASGA ! Nous avons bien reçu votre commande #${id} et nous vous contactons pour finaliser les détails. Répondez à ce message ou appelez le +226 55 99 64 18.`,
      confirme:     `Votre commande MAASGA #${id} est confirmée ! Nous préparons votre livraison et installation. Nous vous tiendrons informé(e).`,
      en_livraison: `Bonne nouvelle ! Votre commande MAASGA #${id} est en cours de livraison. Notre équipe vous contactera pour convenir de l'heure d'installation.`,
      livre:        `🎉 Votre climatiseur (commande #${id}) a été livré et installé avec succès. Merci de votre confiance chez MAASGA ! Votre SAV gratuit est activé.`,
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
    // Pas de D1 (dev sans binding) : on ne met à jour que le cache mémoire
    order.status = status as any
  }

  return c.json({ success: true })
}

async function ensureMaintenanceTables(db: any) {
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

// Export commandes CSV
adminCrmRouter.get('/api/admin/export/orders', adminAuth, async (c) => {
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
adminCrmRouter.get('/api/admin/export/rdv', adminAuth, async (c) => {
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
adminCrmRouter.get('/api/admin/export/clients', adminAuth, async (c) => {
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
// BACKUP / EXPORT DB
// ============================================================
adminCrmRouter.get('/api/admin/backup', adminAuth, async (c) => {
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
adminCrmRouter.get('/api/admin/search', adminAuth, async (c) => {
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

adminCrmRouter.post('/api/admin/rdv/update', adminAuth, async (c) => {
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
      return c.redirect('/admin/rdv?error=' + encodeURIComponent('Mise à jour impossible (base de données)'))
    }
  } else if (!rdv) {
    return c.redirect('/admin/rdv?error=' + encodeURIComponent('Rendez-vous introuvable'))
  }
  if (rdv) rdv.status = status as 'pending' | 'confirmed' | 'done'

  return c.redirect('/admin/rdv?success=1')
})

// API Admin - Valider la visite (marquer RDV done SANS créer de commande)
adminCrmRouter.post('/api/admin/rdv/validate-visit', adminAuth, async (c) => {
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
      // Ne plus avaler l'erreur : l'admin voyait « Visite validée » alors que le
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

// API Admin - Ajouter un produit

// ==============================================================
// API Admin - Lookup client by phone (used in RDV modal)
// ==============================================================
adminCrmRouter.get('/api/admin/clients/by-phone', adminAuth, async (c) => {
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
adminCrmRouter.get('/api/admin/clients/:id/detail', adminAuth, async (c) => {
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

// API Admin - Créer une commande depuis un RDV
adminCrmRouter.post('/api/admin/create-order', adminAuth, async (c) => {
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

  // Mettre à jour le statut du RDV en mémoire (si présent dans cet isolate)
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
    message: `✅ Commande #${newOrder.id} créée avec succès. Statut du RDV mis à jour.`
  })
})

// API Admin - Récupérer les commandes par RDV
adminCrmRouter.get('/api/admin/orders-by-appointment/:id', adminAuth, async (c) => {
  const appointment_id = parseInt(c.req.param('id'))
  const appointmentOrders = orders.filter(o => o.appointment_id === appointment_id)
  return c.json(appointmentOrders)
})

adminCrmRouter.get('/api/stats', adminAuth, (c) => {
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
adminCrmRouter.post('/api/admin/reset-db', adminAuth, async (c) => {
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
  // commandes. Un cookie admin volé ne doit pas suffire à détruire la base.
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
      message: '✅ Base de données complètement réinitialisée (D1 + mémoire + sqlite_sequence)'
    })
  } catch (error) {
    return c.json({ 
      success: false, 
      error: `Erreur lors de la réinitialisation: ${error}`
    }, 500)
  }
})

adminCrmRouter.post('/api/admin/client/add', adminAuth, async (c) => {
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
  // mémoire : ce cache est partiel et par isolate, donc il produisait des id déjà
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
      // Ne plus avaler l'erreur : l'admin voyait « succès » et le client
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

adminCrmRouter.post('/api/admin/client/update', adminAuth, async (c) => {
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
  // des clients selon l'isolate, donc un findIndex à -1 refusait des modifications
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

adminCrmRouter.post('/api/admin/client/delete', adminAuth, async (c) => {
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
        // Pas de table payments à anonymiser
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

// ============================================================
// API RDV - CRUD COMPLET
// ============================================================
adminCrmRouter.post('/api/admin/rdv/add', adminAuth, async (c) => {
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

adminCrmRouter.post('/api/admin/rdv/delete', adminAuth, async (c) => {
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
adminCrmRouter.post('/api/admin/commande/delete', adminAuth, async (c) => {
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

// Register under the route name the frontend uses (/status)
// and keep the old name (/update-statut) as a backward-compatible alias
adminCrmRouter.post('/api/admin/commande/status', adminAuth, handleCommandeStatus)

adminCrmRouter.post('/api/admin/commande/update-statut', adminAuth, handleCommandeStatus)
