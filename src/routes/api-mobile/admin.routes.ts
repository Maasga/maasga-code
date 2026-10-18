import { Hono } from 'hono'
import type { HonoEnv } from '../../types'
import { mobileAdminAuth } from '../../services/auth.service'
import {
  ProductRepository,
  OrderRepository,
  AppointmentRepository,
  ClientRepository,
  MaintenanceRepository,
  BannerRepository,
} from '../../repositories'
import { logAdminAudit } from '../../utils/notifications'

export const mobileAdminRouter = new Hono<HonoEnv>()

// Protect all mobile admin routes with mobileAdminAuth
mobileAdminRouter.use('*', mobileAdminAuth)

// ─── RDV (APPOINTMENTS) ──────────────────────────────────────────────────────

mobileAdminRouter.get('/rdv', async (c) => {
  const db = c.env.DB
  if (!db) return c.json([])
  try {
    const apptRepo = new AppointmentRepository(db)
    const list = await apptRepo.findAll()
    return c.json(list)
  } catch (e) {
    console.error('Mobile rdv error:', e)
    return c.json([])
  }
})

mobileAdminRouter.get('/admin/rdv/:id', async (c) => {
  const db = c.env.DB
  if (!db) return c.json({ error: 'Service indisponible' }, 503)
  const id = parseInt(c.req.param('id'), 10)
  if (isNaN(id)) return c.json({ error: 'ID invalide' }, 400)

  try {
    const apptRepo = new AppointmentRepository(db)
    const rdv = await apptRepo.findById(id)
    if (!rdv) return c.json({ error: 'RDV non trouvé' }, 404)
    return c.json(rdv)
  } catch (e: any) {
    return c.json({ error: 'Erreur: ' + e.message }, 500)
  }
})

mobileAdminRouter.post('/admin/rdv/:id/confirm', async (c) => {
  const db = c.env.DB
  if (!db) return c.json({ error: 'Service indisponible' }, 503)
  const id = parseInt(c.req.param('id'), 10)
  if (isNaN(id)) return c.json({ error: 'ID invalide' }, 400)

  try {
    const apptRepo = new AppointmentRepository(db)
    await apptRepo.updateStatus(id, 'confirmed')
    await logAdminAudit(db, {
      action: 'confirm_rdv',
      detail: `RDV ID: ${id}`,
      ip: c.req.header('cf-connecting-ip') || 'unknown',
      userAgent: c.req.header('user-agent') || 'unknown',
    })
    return c.json({ success: true })
  } catch (e: any) {
    return c.json({ error: 'Erreur confirmation: ' + e.message }, 500)
  }
})

mobileAdminRouter.post('/admin/rdv/:id/cancel', async (c) => {
  const db = c.env.DB
  if (!db) return c.json({ error: 'Service indisponible' }, 503)
  const id = parseInt(c.req.param('id'), 10)
  if (isNaN(id)) return c.json({ error: 'ID invalide' }, 400)

  try {
    const { reason } = await c.req.json().catch(() => ({}))
    const apptRepo = new AppointmentRepository(db)
    await apptRepo.updateStatus(id, 'cancelled')
    await logAdminAudit(db, {
      action: 'cancel_rdv',
      detail: `RDV ID: ${id}, Reason: ${reason || 'Non spécifié'}`,
      ip: c.req.header('cf-connecting-ip') || 'unknown',
      userAgent: c.req.header('user-agent') || 'unknown',
    })
    return c.json({ success: true })
  } catch (e: any) {
    return c.json({ error: 'Erreur annulation: ' + e.message }, 500)
  }
})

mobileAdminRouter.get('/admin/rdv/calendar', async (c) => {
  const db = c.env.DB
  if (!db) return c.json({ error: 'Service indisponible' }, 503)

  try {
    const { year, month } = c.req.query()
    const currentYear = year ? parseInt(year, 10) : new Date().getFullYear()
    const currentMonth = month ? parseInt(month, 10) : new Date().getMonth() + 1

    const startDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`
    const endDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-31`

    const apptRepo = new AppointmentRepository(db)
    const rdvs = await apptRepo.findByDateRange(startDate, endDate)
    return c.json(rdvs)
  } catch (e: any) {
    return c.json({ error: 'Erreur calendrier: ' + e.message }, 500)
  }
})

// ─── CLIENTS ─────────────────────────────────────────────────────────────────

mobileAdminRouter.get('/admin/clients', async (c) => {
  const db = c.env.DB
  if (!db) return c.json([])
  try {
    const clientRepo = new ClientRepository(db)
    const search = c.req.query('search')
    const list = await clientRepo.findAll(search ? { search } : undefined)
    return c.json(list)
  } catch (e) {
    console.error('Get clients error:', e)
    return c.json([])
  }
})

mobileAdminRouter.get('/admin/clients/:id', async (c) => {
  const db = c.env.DB
  if (!db) return c.json({ error: 'Service indisponible' }, 503)
  const id = parseInt(c.req.param('id'), 10)
  if (isNaN(id)) return c.json({ error: 'ID invalide' }, 400)

  try {
    const clientRepo = new ClientRepository(db)
    const client = await clientRepo.findById(id)
    if (!client) return c.json({ error: 'Client non trouvé' }, 404)
    return c.json(client)
  } catch (e: any) {
    return c.json({ error: 'Erreur: ' + e.message }, 500)
  }
})

mobileAdminRouter.post('/admin/clients', async (c) => {
  const db = c.env.DB
  if (!db) return c.json({ error: 'Service indisponible' }, 503)

  try {
    const body = await c.req.json()
    const { name, phone, email, quartier, address } = body
    if (!name || !phone) return c.json({ error: 'Nom et téléphone requis' }, 400)

    const clientRepo = new ClientRepository(db)
    const created = await clientRepo.create({
      name,
      phone,
      email: email || null,
      quartier: quartier || null,
      address: address || null,
    })

    await logAdminAudit(db, {
      action: 'create_client',
      detail: `Client: ${name} (${phone})`,
      ip: c.req.header('cf-connecting-ip') || 'unknown',
      userAgent: c.req.header('user-agent') || 'unknown',
    })

    return c.json({ success: true, client: created })
  } catch (e: any) {
    return c.json({ error: 'Erreur création client: ' + e.message }, 500)
  }
})

mobileAdminRouter.put('/admin/clients/:id', async (c) => {
  const db = c.env.DB
  if (!db) return c.json({ error: 'Service indisponible' }, 503)
  const id = parseInt(c.req.param('id'), 10)
  if (isNaN(id)) return c.json({ error: 'ID invalide' }, 400)

  try {
    const body = await c.req.json()
    const clientRepo = new ClientRepository(db)
    const updated = await clientRepo.update(id, body)
    if (!updated) return c.json({ error: 'Client introuvable ou aucune modif' }, 404)

    await logAdminAudit(db, {
      action: 'update_client',
      detail: `Client ID: ${id}`,
      ip: c.req.header('cf-connecting-ip') || 'unknown',
      userAgent: c.req.header('user-agent') || 'unknown',
    })

    return c.json({ success: true })
  } catch (e: any) {
    return c.json({ error: 'Erreur modification client: ' + e.message }, 500)
  }
})

mobileAdminRouter.get('/admin/clients/:id/orders', async (c) => {
  const db = c.env.DB
  if (!db) return c.json([])
  const id = parseInt(c.req.param('id'), 10)
  if (isNaN(id)) return c.json({ error: 'ID invalide' }, 400)

  try {
    const orderRepo = new OrderRepository(db)
    const list = await orderRepo.findByClientId(id)
    return c.json(list)
  } catch (e) {
    return c.json([])
  }
})

mobileAdminRouter.get('/admin/clients/:id/rdv', async (c) => {
  const db = c.env.DB
  if (!db) return c.json([])
  const id = parseInt(c.req.param('id'), 10)
  if (isNaN(id)) return c.json({ error: 'ID invalide' }, 400)

  try {
    const apptRepo = new AppointmentRepository(db)
    const list = await apptRepo.findByClientId(id)
    return c.json(list)
  } catch (e) {
    return c.json([])
  }
})

// ─── ORDERS ──────────────────────────────────────────────────────────────────

mobileAdminRouter.get('/orders', async (c) => {
  const db = c.env.DB
  if (!db) return c.json([])
  try {
    const orderRepo = new OrderRepository(db)
    const list = await orderRepo.findAll()
    return c.json(list)
  } catch (e) {
    console.error('Mobile orders error:', e)
    return c.json([])
  }
})

mobileAdminRouter.get('/admin/orders/:id', async (c) => {
  const db = c.env.DB
  if (!db) return c.json({ error: 'Service indisponible' }, 503)
  const id = parseInt(c.req.param('id'), 10)
  if (isNaN(id)) return c.json({ error: 'ID invalide' }, 400)

  try {
    const orderRepo = new OrderRepository(db)
    const order = await orderRepo.findById(id)
    if (!order) return c.json({ error: 'Commande non trouvée' }, 404)
    return c.json(order)
  } catch (e: any) {
    return c.json({ error: 'Erreur: ' + e.message }, 500)
  }
})

mobileAdminRouter.patch('/admin/orders/:id/status', async (c) => {
  const db = c.env.DB
  if (!db) return c.json({ error: 'Service indisponible' }, 503)
  const id = parseInt(c.req.param('id'), 10)
  if (isNaN(id)) return c.json({ error: 'ID invalide' }, 400)

  try {
    const { status, adminNotes } = await c.req.json()
    const orderRepo = new OrderRepository(db)
    const updated = await orderRepo.updateStatus(id, status, adminNotes)
    if (!updated) return c.json({ error: 'Commande introuvable' }, 404)

    await logAdminAudit(db, {
      action: 'update_order_status',
      detail: `Commande ID: ${id} → ${status}`,
      ip: c.req.header('cf-connecting-ip') || 'unknown',
      userAgent: c.req.header('user-agent') || 'unknown',
    })

    return c.json({ success: true })
  } catch (e: any) {
    return c.json({ error: 'Erreur: ' + e.message }, 500)
  }
})

mobileAdminRouter.get('/admin/orders/stats', async (c) => {
  const db = c.env.DB
  if (!db) return c.json({})
  try {
    const orderRepo = new OrderRepository(db)
    const counts = await orderRepo.countByStatus()
    return c.json(counts)
  } catch (e) {
    return c.json({})
  }
})

// ─── PRODUCTS ────────────────────────────────────────────────────────────────

mobileAdminRouter.get('/admin/products', async (c) => {
  const db = c.env.DB
  if (!db) return c.json([])
  try {
    const prodRepo = new ProductRepository(db)
    const list = await prodRepo.findAll()
    return c.json(list)
  } catch (e) {
    return c.json([])
  }
})

mobileAdminRouter.post('/admin/products', async (c) => {
  const db = c.env.DB
  if (!db) return c.json({ error: 'Service indisponible' }, 503)
  try {
    const body = await c.req.json()
    const prodRepo = new ProductRepository(db)
    const created = await prodRepo.create(body)

    await logAdminAudit(db, {
      action: 'create_product',
      detail: `Produit: ${body.name}`,
      ip: c.req.header('cf-connecting-ip') || 'unknown',
      userAgent: c.req.header('user-agent') || 'unknown',
    })

    return c.json({ success: true, product: created })
  } catch (e: any) {
    return c.json({ error: 'Erreur: ' + e.message }, 500)
  }
})

mobileAdminRouter.put('/admin/products/:id', async (c) => {
  const db = c.env.DB
  if (!db) return c.json({ error: 'Service indisponible' }, 503)
  const id = parseInt(c.req.param('id'), 10)
  if (isNaN(id)) return c.json({ error: 'ID invalide' }, 400)

  try {
    const body = await c.req.json()
    const prodRepo = new ProductRepository(db)
    const updated = await prodRepo.update(id, body)
    if (!updated) return c.json({ error: 'Produit non trouvé' }, 404)

    await logAdminAudit(db, {
      action: 'update_product',
      detail: `Produit ID: ${id}`,
      ip: c.req.header('cf-connecting-ip') || 'unknown',
      userAgent: c.req.header('user-agent') || 'unknown',
    })

    return c.json({ success: true })
  } catch (e: any) {
    return c.json({ error: 'Erreur: ' + e.message }, 500)
  }
})

mobileAdminRouter.delete('/admin/products/:id', async (c) => {
  const db = c.env.DB
  if (!db) return c.json({ error: 'Service indisponible' }, 503)
  const id = parseInt(c.req.param('id'), 10)
  if (isNaN(id)) return c.json({ error: 'ID invalide' }, 400)

  try {
    const prodRepo = new ProductRepository(db)
    await prodRepo.delete(id)

    await logAdminAudit(db, {
      action: 'delete_product',
      detail: `Produit ID: ${id}`,
      ip: c.req.header('cf-connecting-ip') || 'unknown',
      userAgent: c.req.header('user-agent') || 'unknown',
    })

    return c.json({ success: true })
  } catch (e: any) {
    return c.json({ error: 'Erreur: ' + e.message }, 500)
  }
})

// ─── DASHBOARD SUMMARY ───────────────────────────────────────────────────────

mobileAdminRouter.get('/admin-dashboard', async (c) => {
  const db = c.env.DB
  if (!db) return c.json({})

  try {
    const orderRepo = new OrderRepository(db)
    const apptRepo = new AppointmentRepository(db)
    const clientRepo = new ClientRepository(db)
    const prodRepo = new ProductRepository(db)

    const [orderStats, apptStats, totalClients, totalProducts] = await Promise.all([
      orderRepo.countByStatus(),
      apptRepo.countByStatus(),
      clientRepo.count(),
      prodRepo.count(),
    ])

    return c.json({
      orders: orderStats,
      appointments: apptStats,
      total_clients: totalClients,
      total_products: totalProducts,
    })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

// ─── BANNERS & BRANDS ────────────────────────────────────────────────────────

mobileAdminRouter.get('/admin/banners', async (c) => {
  const db = c.env.DB
  if (!db) return c.json([])
  try {
    const bannerRepo = new BannerRepository(db)
    const banners = await bannerRepo.findBanners()
    return c.json(banners)
  } catch (e) {
    return c.json([])
  }
})

mobileAdminRouter.get('/admin/brands', async (c) => {
  const db = c.env.DB
  if (!db) return c.json([])
  try {
    const bannerRepo = new BannerRepository(db)
    const brands = await bannerRepo.findBrands()
    return c.json(brands)
  } catch (e) {
    return c.json([])
  }
})

// ─── AUDIT & SETTINGS ────────────────────────────────────────────────────────

mobileAdminRouter.get('/admin/audit', async (c) => {
  const db = c.env.DB
  if (!db) return c.json([])
  try {
    const result = await db.prepare('SELECT * FROM admin_audit_log ORDER BY created_at DESC LIMIT 100').all()
    return c.json(result.results || [])
  } catch (e) {
    return c.json([])
  }
})

mobileAdminRouter.get('/admin/settings', async (c) => {
  const db = c.env.DB
  if (!db) return c.json({})
  try {
    const result = await db.prepare('SELECT key, value FROM admin_settings').all()
    const settings: Record<string, string> = {}
    for (const row of (result.results || []) as any[]) {
      settings[row.key] = row.value
    }
    return c.json(settings)
  } catch (e) {
    return c.json({})
  }
})

mobileAdminRouter.post('/admin/settings', async (c) => {
  const db = c.env.DB
  if (!db) return c.json({ error: 'Service indisponible' }, 503)
  try {
    const body = await c.req.json().catch(() => ({}))
    for (const [key, value] of Object.entries(body)) {
      await db.prepare('INSERT INTO admin_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value')
        .bind(key, String(value)).run()
    }
    return c.json({ success: true })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

// ─── BRAND MEDIA ─────────────────────────────────────────────────────────────

mobileAdminRouter.get('/admin/media/brand', async (c) => {
  const db = c.env.DB
  if (!db) return c.json([])
  try {
    const brandId = Number(c.req.query('brand_id')) || 0
    const bannerRepo = new BannerRepository(db)
    const list = await bannerRepo.findBrandMedia(brandId)
    return c.json(list)
  } catch (e) {
    return c.json([])
  }
})

mobileAdminRouter.post('/admin/media/brand', async (c) => {
  const db = c.env.DB
  if (!db) return c.json({ error: 'Service indisponible' }, 503)
  try {
    const body = await c.req.json().catch(() => ({}))
    const bannerRepo = new BannerRepository(db)
    const created = await bannerRepo.createBrandMedia(body)
    return c.json({ success: true, media: created })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

mobileAdminRouter.delete('/admin/media/brand/:id', async (c) => {
  const db = c.env.DB
  if (!db) return c.json({ error: 'Service indisponible' }, 503)
  const id = Number(c.req.param('id'))
  try {
    const bannerRepo = new BannerRepository(db)
    await bannerRepo.deleteBrandMedia(id)
    return c.json({ success: true })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

// ─── MAINTENANCE ─────────────────────────────────────────────────────────────

mobileAdminRouter.get('/admin/maintenance/summary', async (c) => {
  const db = c.env.DB
  if (!db) return c.json({})
  try {
    const contracts = await db.prepare('SELECT COUNT(*) as count FROM maintenance_contracts WHERE status = "active"').first() as any
    const requests = await db.prepare('SELECT COUNT(*) as count FROM maintenance_requests WHERE status = "pending"').first() as any
    const visits = await db.prepare('SELECT COUNT(*) as count FROM maintenance_visits WHERE status = "scheduled"').first() as any
    return c.json({
      active_contracts: contracts?.count || 0,
      pending_requests: requests?.count || 0,
      scheduled_visits: visits?.count || 0,
    })
  } catch (e) {
    return c.json({})
  }
})

mobileAdminRouter.get('/admin/maintenance/contracts', async (c) => {
  const db = c.env.DB
  if (!db) return c.json([])
  try {
    const maintRepo = new MaintenanceRepository(db)
    const list = await maintRepo.findContracts()
    return c.json(list)
  } catch (e) {
    return c.json([])
  }
})

mobileAdminRouter.get('/admin/maintenance/requests', async (c) => {
  const db = c.env.DB
  if (!db) return c.json([])
  try {
    const maintRepo = new MaintenanceRepository(db)
    const list = await maintRepo.findRequests()
    return c.json(list)
  } catch (e) {
    return c.json([])
  }
})

mobileAdminRouter.get('/admin/maintenance/visits', async (c) => {
  const db = c.env.DB
  if (!db) return c.json([])
  try {
    const maintRepo = new MaintenanceRepository(db)
    const list = await maintRepo.findVisits()
    return c.json(list)
  } catch (e) {
    return c.json([])
  }
})

// ─── PAYMENTS ────────────────────────────────────────────────────────────────

mobileAdminRouter.get('/admin/payments', async (c) => {
  const db = c.env.DB
  if (!db) return c.json([])
  try {
    const { search, status, limit = 50, offset = 0 } = c.req.query()
    let query = 'SELECT * FROM payments WHERE 1=1'
    const params: any[] = []
    if (search) {
      query += ' AND (transaction_id LIKE ? OR ligdi_status LIKE ?)'
      params.push(`%${search}%`, `%${search}%`)
    }
    if (status) {
      query += ' AND status = ?'
      params.push(status)
    }
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
    params.push(parseInt(String(limit), 10), parseInt(String(offset), 10))

    const rows = await db.prepare(query).bind(...params).all()
    return c.json(rows.results || [])
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

mobileAdminRouter.get('/admin/payments/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const db = c.env.DB
  if (!db || !id) return c.json({ error: 'ID invalide' }, 400)
  try {
    const payment = await db.prepare('SELECT * FROM payments WHERE id = ?').bind(id).first()
    if (!payment) return c.json({ error: 'Paiement introuvable' }, 404)
    return c.json(payment)
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

mobileAdminRouter.post('/admin/payments', async (c) => {
  const db = c.env.DB
  if (!db) return c.json({ error: 'Service indisponible' }, 503)
  const body = await c.req.json().catch(() => ({}))
  const { order_id, client_id, amount, currency = 'XOF', payment_method, notes } = body
  if (!amount) return c.json({ error: 'Montant requis' }, 400)

  try {
    const transactionId = `MANUAL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const result = await db.prepare(`
      INSERT INTO payments (order_id, client_id, amount, currency, status, payment_method, transaction_id, notes)
      VALUES (?, ?, ?, ?, 'completed', ?, ?, ?)
    `).bind(order_id || null, client_id || null, amount, currency, payment_method || 'manual', transactionId, notes || null).run()

    return c.json({ success: true, id: result.meta?.last_row_id, transaction_id: transactionId })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

mobileAdminRouter.patch('/admin/payments/:id/status', async (c) => {
  const id = Number(c.req.param('id'))
  const db = c.env.DB
  if (!db || !id) return c.json({ error: 'ID invalide' }, 400)
  const { status } = await c.req.json().catch(() => ({}))
  if (!status || !['pending', 'completed', 'failed', 'refunded'].includes(status)) {
    return c.json({ error: 'Statut invalide' }, 400)
  }
  try {
    await db.prepare("UPDATE payments SET status = ?, updated_at = datetime('now') WHERE id = ?")
      .bind(status, id).run()
    return c.json({ success: true, message: 'Statut mis à jour' })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

mobileAdminRouter.get('/admin/payments/stats', async (c) => {
  const db = c.env.DB
  if (!db) return c.json({})
  try {
    const total = await db.prepare('SELECT COUNT(*) as count, SUM(amount) as total FROM payments WHERE status = "completed"').first() as any
    const pending = await db.prepare('SELECT COUNT(*) as count, SUM(amount) as total FROM payments WHERE status = "pending"').first() as any
    const failed = await db.prepare('SELECT COUNT(*) as count, SUM(amount) as total FROM payments WHERE status = "failed"').first() as any
    const today = await db.prepare('SELECT COUNT(*) as count, SUM(amount) as total FROM payments WHERE status = "completed" AND date(created_at) = date("now")').first() as any
    return c.json({
      total: { count: total?.count || 0, amount: total?.total || 0 },
      pending: { count: pending?.count || 0, amount: pending?.total || 0 },
      failed: { count: failed?.count || 0, amount: failed?.total || 0 },
      today: { count: today?.count || 0, amount: today?.total || 0 },
    })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

// ─── DEVIS ───────────────────────────────────────────────────────────────────

mobileAdminRouter.get('/admin/devis', async (c) => {
  const db = c.env.DB
  if (!db) return c.json([])
  try {
    const { search, status, limit = 50, offset = 0 } = c.req.query()
    let query = 'SELECT * FROM devis WHERE 1=1'
    const params: any[] = []
    if (search) {
      query += ' AND (client_name LIKE ? OR client_phone LIKE ?)'
      params.push(`%${search}%`, `%${search}%`)
    }
    if (status) {
      query += ' AND status = ?'
      params.push(status)
    }
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
    params.push(parseInt(String(limit), 10), parseInt(String(offset), 10))

    const rows = await db.prepare(query).bind(...params).all()
    return c.json(rows.results || [])
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

mobileAdminRouter.get('/admin/devis/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const db = c.env.DB
  if (!db || !id) return c.json({ error: 'ID invalide' }, 400)
  try {
    const devis = await db.prepare('SELECT * FROM devis WHERE id = ?').bind(id).first()
    if (!devis) return c.json({ error: 'Devis introuvable' }, 404)
    return c.json(devis)
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

mobileAdminRouter.post('/admin/devis', async (c) => {
  const db = c.env.DB
  if (!db) return c.json({ error: 'Service indisponible' }, 503)
  const body = await c.req.json().catch(() => ({}))
  const { client_id, client_name, client_phone, client_email, items, subtotal, tax = 0, total, notes, valid_until } = body
  if (!client_name || !client_phone || !items || !total) {
    return c.json({ error: 'Champs requis manquants' }, 400)
  }

  try {
    const result = await db.prepare(`
      INSERT INTO devis (client_id, client_name, client_phone, client_email, items, subtotal, tax, total, notes, valid_until)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      client_id || null,
      client_name,
      client_phone,
      client_email || null,
      JSON.stringify(items),
      subtotal,
      tax,
      total,
      notes || null,
      valid_until || null
    ).run()

    return c.json({ success: true, id: result.meta?.last_row_id })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

mobileAdminRouter.patch('/admin/devis/:id/status', async (c) => {
  const id = Number(c.req.param('id'))
  const db = c.env.DB
  if (!db || !id) return c.json({ error: 'ID invalide' }, 400)
  const { status } = await c.req.json().catch(() => ({}))
  if (!status || !['draft', 'sent', 'accepted', 'rejected', 'expired'].includes(status)) {
    return c.json({ error: 'Statut invalide' }, 400)
  }
  try {
    await db.prepare("UPDATE devis SET status = ?, updated_at = datetime('now') WHERE id = ?")
      .bind(status, id).run()
    return c.json({ success: true, message: 'Statut mis à jour' })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

mobileAdminRouter.get('/admin/devis/stats', async (c) => {
  const db = c.env.DB
  if (!db) return c.json({})
  try {
    const total = await db.prepare('SELECT COUNT(*) as count, SUM(total_ht) as total FROM devis').first() as any
    const draft = await db.prepare('SELECT COUNT(*) as count, SUM(total_ht) as total FROM devis WHERE status = "draft"').first() as any
    const sent = await db.prepare('SELECT COUNT(*) as count, SUM(total_ht) as total FROM devis WHERE status = "sent"').first() as any
    const accepted = await db.prepare('SELECT COUNT(*) as count, SUM(total_ht) as total FROM devis WHERE status = "accepted"').first() as any
    return c.json({
      total: { count: total?.count || 0, amount: total?.total || 0 },
      draft: { count: draft?.count || 0, amount: draft?.total || 0 },
      sent: { count: sent?.count || 0, amount: sent?.total || 0 },
      accepted: { count: accepted?.count || 0, amount: accepted?.total || 0 },
    })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

// ─── MESSAGES ────────────────────────────────────────────────────────────────

mobileAdminRouter.get('/admin/messages', async (c) => {
  const db = c.env.DB
  if (!db) return c.json([])
  try {
    const { search, status, limit = 50, offset = 0 } = c.req.query()
    let query = 'SELECT * FROM client_messages WHERE 1=1'
    const params: any[] = []
    if (search) {
      query += ' AND (client_name LIKE ? OR client_phone LIKE ? OR subject LIKE ? OR message LIKE ?)'
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`)
    }
    if (status) {
      query += ' AND status = ?'
      params.push(status)
    }
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
    params.push(parseInt(String(limit), 10), parseInt(String(offset), 10))

    const rows = await db.prepare(query).bind(...params).all()
    return c.json(rows.results || [])
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

mobileAdminRouter.get('/admin/messages/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const db = c.env.DB
  if (!db || !id) return c.json({ error: 'ID invalide' }, 400)
  try {
    const message = await db.prepare('SELECT * FROM client_messages WHERE id = ?').bind(id).first()
    if (!message) return c.json({ error: 'Message introuvable' }, 404)
    return c.json(message)
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

mobileAdminRouter.post('/admin/messages/:id/respond', async (c) => {
  const id = Number(c.req.param('id'))
  const db = c.env.DB
  if (!db || !id) return c.json({ error: 'ID invalide' }, 400)
  const { response } = await c.req.json().catch(() => ({}))
  if (!response) return c.json({ error: 'Réponse requise' }, 400)
  try {
    await db.prepare(`
      UPDATE client_messages 
      SET admin_response = ?, status = 'responded', responded_at = datetime('now'), updated_at = datetime('now')
      WHERE id = ?
    `).bind(response, id).run()
    return c.json({ success: true, message: 'Réponse envoyée' })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

mobileAdminRouter.patch('/admin/messages/:id/status', async (c) => {
  const id = Number(c.req.param('id'))
  const db = c.env.DB
  if (!db || !id) return c.json({ error: 'ID invalide' }, 400)
  const { status } = await c.req.json().catch(() => ({}))
  if (!status || !['unread', 'read', 'responded', 'archived'].includes(status)) {
    return c.json({ error: 'Statut invalide' }, 400)
  }
  try {
    await db.prepare("UPDATE client_messages SET status = ?, updated_at = datetime('now') WHERE id = ?")
      .bind(status, id).run()
    return c.json({ success: true, message: 'Statut mis à jour' })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

mobileAdminRouter.get('/admin/messages/stats', async (c) => {
  const db = c.env.DB
  if (!db) return c.json({})
  try {
    const total = await db.prepare('SELECT COUNT(*) as count FROM client_messages').first() as any
    const unread = await db.prepare('SELECT COUNT(*) as count FROM client_messages WHERE status = "unread"').first() as any
    const responded = await db.prepare('SELECT COUNT(*) as count FROM client_messages WHERE status = "responded"').first() as any
    const today = await db.prepare('SELECT COUNT(*) as count FROM client_messages WHERE date(created_at) = date("now")').first() as any
    return c.json({
      total: total?.count || 0,
      unread: unread?.count || 0,
      responded: responded?.count || 0,
      today: today?.count || 0,
    })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

// ─── SAV ─────────────────────────────────────────────────────────────────────

mobileAdminRouter.get('/admin/sav', async (c) => {
  const db = c.env.DB
  if (!db) return c.json([])
  try {
    const { search, status, priority, limit = 50, offset = 0 } = c.req.query()
    let query = 'SELECT * FROM sav_tickets WHERE 1=1'
    const params: any[] = []
    if (search) {
      query += ' AND (client_name LIKE ? OR client_phone LIKE ? OR serial_number LIKE ? OR issue_description LIKE ?)'
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`)
    }
    if (status) {
      query += ' AND status = ?'
      params.push(status)
    }
    if (priority) {
      query += ' AND priority = ?'
      params.push(priority)
    }
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
    params.push(parseInt(String(limit), 10), parseInt(String(offset), 10))

    const rows = await db.prepare(query).bind(...params).all()
    return c.json(rows.results || [])
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

mobileAdminRouter.get('/admin/sav/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const db = c.env.DB
  if (!db || !id) return c.json({ error: 'ID invalide' }, 400)
  try {
    const ticket = await db.prepare('SELECT * FROM sav_tickets WHERE id = ?').bind(id).first()
    if (!ticket) return c.json({ error: 'Ticket introuvable' }, 404)
    return c.json(ticket)
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

mobileAdminRouter.post('/admin/sav', async (c) => {
  const db = c.env.DB
  if (!db) return c.json({ error: 'Service indisponible' }, 503)
  const body = await c.req.json().catch(() => ({}))
  const { client_id, client_name, client_phone, client_email, equipment_type, serial_number, issue_description, priority = 'normal' } = body
  if (!client_name || !client_phone || !issue_description) {
    return c.json({ error: 'Champs requis manquants' }, 400)
  }
  try {
    const result = await db.prepare(`
      INSERT INTO sav_tickets (client_id, client_name, client_phone, client_email, equipment_type, serial_number, issue_description, priority)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(client_id || null, client_name, client_phone, client_email || null, equipment_type || null, serial_number || null, issue_description, priority).run()
    return c.json({ success: true, id: result.meta?.last_row_id })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

mobileAdminRouter.patch('/admin/sav/:id/status', async (c) => {
  const id = Number(c.req.param('id'))
  const db = c.env.DB
  if (!db || !id) return c.json({ error: 'ID invalide' }, 400)
  const { status } = await c.req.json().catch(() => ({}))
  if (!status || !['open', 'in_progress', 'resolved', 'closed'].includes(status)) {
    return c.json({ error: 'Statut invalide' }, 400)
  }
  try {
    await db.prepare("UPDATE sav_tickets SET status = ?, updated_at = datetime('now') WHERE id = ?")
      .bind(status, id).run()
    return c.json({ success: true, message: 'Statut mis à jour' })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

mobileAdminRouter.patch('/admin/sav/:id/assign', async (c) => {
  const id = Number(c.req.param('id'))
  const db = c.env.DB
  if (!db || !id) return c.json({ error: 'ID invalide' }, 400)
  const { technician } = await c.req.json().catch(() => ({}))
  if (!technician) return c.json({ error: 'Technicien requis' }, 400)
  try {
    await db.prepare(`
      UPDATE sav_tickets 
      SET assigned_technician = ?, status = 'in_progress', updated_at = datetime('now')
      WHERE id = ?
    `).bind(technician, id).run()
    return c.json({ success: true, message: 'Technicien assigné' })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

mobileAdminRouter.get('/admin/sav/stats', async (c) => {
  const db = c.env.DB
  if (!db) return c.json({})
  try {
    const total = await db.prepare('SELECT COUNT(*) as count FROM sav_tickets').first() as any
    const open = await db.prepare('SELECT COUNT(*) as count FROM sav_tickets WHERE status = "open"').first() as any
    const inProgress = await db.prepare('SELECT COUNT(*) as count FROM sav_tickets WHERE status = "in_progress"').first() as any
    const resolved = await db.prepare('SELECT COUNT(*) as count FROM sav_tickets WHERE status = "resolved"').first() as any
    const urgent = await db.prepare('SELECT COUNT(*) as count FROM sav_tickets WHERE priority = "urgent"').first() as any
    return c.json({
      total: total?.count || 0,
      open: open?.count || 0,
      in_progress: inProgress?.count || 0,
      resolved: resolved?.count || 0,
      urgent: urgent?.count || 0,
    })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

// ─── NOTIFICATIONS ───────────────────────────────────────────────────────────

mobileAdminRouter.get('/admin/notifications', async (c) => {
  const db = c.env.DB
  if (!db) return c.json([])
  try {
    const { status, limit = 50, offset = 0 } = c.req.query()
    let query = 'SELECT * FROM notification_campaigns WHERE 1=1'
    const params: any[] = []
    if (status) {
      query += ' AND status = ?'
      params.push(status)
    }
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
    params.push(parseInt(String(limit), 10), parseInt(String(offset), 10))

    const rows = await db.prepare(query).bind(...params).all()
    return c.json(rows.results || [])
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

mobileAdminRouter.get('/admin/notifications/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const db = c.env.DB
  if (!db || !id) return c.json({ error: 'ID invalide' }, 400)
  try {
    const notification = await db.prepare('SELECT * FROM notification_campaigns WHERE id = ?').bind(id).first()
    if (!notification) return c.json({ error: 'Notification introuvable' }, 404)
    return c.json(notification)
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

mobileAdminRouter.post('/admin/notifications', async (c) => {
  const db = c.env.DB
  if (!db) return c.json({ error: 'Service indisponible' }, 503)
  const notifBody = await c.req.json().catch(() => ({}))
  const { title, body: messageBody, target_segment = 'all', scheduled_for } = notifBody
  if (!title || !messageBody) return c.json({ error: 'Titre et message requis' }, 400)

  try {
    const result = await db.prepare(`
      INSERT INTO notification_campaigns (title, body, target_segment, scheduled_for, status)
      VALUES (?, ?, ?, ?, 'draft')
    `).bind(title, messageBody, target_segment, scheduled_for || null).run()

    return c.json({ success: true, id: result.meta?.last_row_id })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

mobileAdminRouter.get('/admin/notifications/stats', async (c) => {
  const db = c.env.DB
  if (!db) return c.json({})
  try {
    const total = await db.prepare('SELECT COUNT(*) as count FROM notification_campaigns').first() as any
    const sent = await db.prepare('SELECT COUNT(*) as count, SUM(recipient_count) as total_recipients FROM notification_campaigns WHERE status = "sent"').first() as any
    const draft = await db.prepare('SELECT COUNT(*) as count FROM notification_campaigns WHERE status = "draft"').first() as any
    const opened = await db.prepare('SELECT SUM(opened_count) as total_opened FROM notification_campaigns WHERE status = "sent"').first() as any
    return c.json({
      total: total?.count || 0,
      sent: { count: sent?.count || 0, recipients: sent?.total_recipients || 0 },
      draft: draft?.count || 0,
      opened: opened?.total_opened || 0,
    })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

// ─── REALISATIONS ────────────────────────────────────────────────────────────

mobileAdminRouter.get('/admin/realisations', async (c) => {
  const db = c.env.DB
  if (!db) return c.json([])
  try {
    const { category, status, limit = 50, offset = 0 } = c.req.query()
    let query = 'SELECT * FROM realisations WHERE 1=1'
    const params: any[] = []
    if (category) {
      query += ' AND category = ?'
      params.push(category)
    }
    if (status) {
      query += ' AND status = ?'
      params.push(status)
    }
    query += ' ORDER BY featured DESC, created_at DESC LIMIT ? OFFSET ?'
    params.push(parseInt(String(limit), 10), parseInt(String(offset), 10))

    const rows = await db.prepare(query).bind(...params).all()
    return c.json(rows.results || [])
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

mobileAdminRouter.get('/admin/realisations/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const db = c.env.DB
  if (!db || !id) return c.json({ error: 'ID invalide' }, 400)
  try {
    const item = await db.prepare('SELECT * FROM realisations WHERE id = ?').bind(id).first()
    if (!item) return c.json({ error: 'Réalisation introuvable' }, 404)
    return c.json(item)
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

mobileAdminRouter.post('/admin/realisations', async (c) => {
  const db = c.env.DB
  if (!db) return c.json({ error: 'Service indisponible' }, 503)
  const body = await c.req.json().catch(() => ({}))
  const { title, description, category, images, client_name, location, completion_date, featured = false } = body
  if (!title || !images || !Array.isArray(images) || images.length === 0) {
    return c.json({ error: 'Titre et images requis' }, 400)
  }
  try {
    const result = await db.prepare(`
      INSERT INTO realisations (title, description, category, images, client_name, location, completion_date, featured)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(title, description || null, category || null, JSON.stringify(images), client_name || null, location || null, completion_date || null, featured ? 1 : 0).run()
    return c.json({ success: true, id: result.meta?.last_row_id })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

mobileAdminRouter.delete('/admin/realisations/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const db = c.env.DB
  if (!db || !id) return c.json({ error: 'ID invalide' }, 400)
  try {
    await db.prepare('DELETE FROM realisations WHERE id = ?').bind(id).run()
    return c.json({ success: true, message: 'Réalisation supprimée' })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

mobileAdminRouter.get('/admin/realisations/stats', async (c) => {
  const db = c.env.DB
  if (!db) return c.json({})
  try {
    const total = await db.prepare('SELECT COUNT(*) as count FROM realisations').first() as any
    const published = await db.prepare('SELECT COUNT(*) as count FROM realisations WHERE status = "published"').first() as any
    const featured = await db.prepare('SELECT COUNT(*) as count FROM realisations WHERE featured = 1').first() as any
    const draft = await db.prepare('SELECT COUNT(*) as count FROM realisations WHERE status = "draft"').first() as any
    return c.json({
      total: total?.count || 0,
      published: published?.count || 0,
      featured: featured?.count || 0,
      draft: draft?.count || 0,
    })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})
