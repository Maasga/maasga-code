// SAV : tickets support
// (module généré par découpage de l'ancien src/routes/admin/index.tsx, 5 600 lignes)
import { Hono } from 'hono'
import type { HonoEnv } from '../../types'
import {
  AdminSAVPage,
  AdminSAVDetailPage
} from '../../pages/admin'
import { adminAuth, refreshAdminCache, csvEscape } from './shared'

export const adminSavRouter = new Hono<HonoEnv>()

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

// ============================================================
// SAV / TICKETS SUPPORT
// ============================================================

// Admin: page SAV
adminSavRouter.get('/admin/sav', adminAuth, refreshAdminCache, async (c) => {
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
adminSavRouter.get('/admin/sav/:id', adminAuth, refreshAdminCache, async (c) => {
  const db = c.env.DB
  if (!db) return c.text('DB non disponible', 503)
  await ensureSavTables(db)
  const ticket = await db.prepare('SELECT * FROM sav_tickets WHERE id = ?').bind(c.req.param('id')).first()
  if (!ticket) return c.redirect('/admin/sav')
  const messages = (await db.prepare('SELECT * FROM sav_ticket_messages WHERE ticket_id = ? ORDER BY created_at ASC').bind(ticket.id).all())?.results || []
  return c.html(<AdminSAVDetailPage ticket={ticket} messages={messages} />)
})

// Admin: créer un ticket
adminSavRouter.post('/api/admin/sav/create', adminAuth, async (c) => {
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
adminSavRouter.post('/api/admin/sav/update-status', adminAuth, async (c) => {
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

// Admin: ajouter un message à un ticket
adminSavRouter.post('/api/admin/sav/message', adminAuth, async (c) => {
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
adminSavRouter.get('/api/admin/export/tickets', adminAuth, async (c) => {
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
