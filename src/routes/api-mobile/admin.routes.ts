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
