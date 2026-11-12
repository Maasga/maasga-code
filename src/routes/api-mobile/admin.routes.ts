import { Hono } from 'hono'
import type { HonoEnv } from '../../types'
import { SITE_URL } from '../../types'
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
import { validateImageMagicBytes } from '../../utils/helpers'
import { gallerySelectColumns, parseGallery, saveProductGallery } from '../../utils/productGallery'
import { StorageService } from '../../services/storage.service'

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

mobileAdminRouter.get('/admin/rdv/:id{[0-9]+}', async (c) => {
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

mobileAdminRouter.post('/admin/rdv/:id{[0-9]+}/confirm', async (c) => {
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

mobileAdminRouter.post('/admin/rdv/:id{[0-9]+}/cancel', async (c) => {
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

mobileAdminRouter.get('/admin/clients/:id{[0-9]+}', async (c) => {
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

mobileAdminRouter.put('/admin/clients/:id{[0-9]+}', async (c) => {
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

mobileAdminRouter.get('/admin/clients/:id{[0-9]+}/orders', async (c) => {
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

mobileAdminRouter.get('/admin/clients/:id{[0-9]+}/rdv', async (c) => {
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

mobileAdminRouter.get('/admin/orders/:id{[0-9]+}', async (c) => {
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

mobileAdminRouter.patch('/admin/orders/:id{[0-9]+}/status', async (c) => {
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

mobileAdminRouter.get('/admin/orders/:id{[0-9]+}/notes', async (c) => {
  const db = c.env.DB
  if (!db) return c.json({ error: 'Service indisponible' }, 503)
  const id = parseInt(c.req.param('id'), 10)
  if (isNaN(id)) return c.json({ error: 'ID invalide' }, 400)

  try {
    const notes = await db.prepare('SELECT * FROM order_notes WHERE order_id = ? ORDER BY created_at DESC').bind(id).all()
    return c.json(notes.results || [])
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

mobileAdminRouter.put('/admin/products/:id{[0-9]+}', async (c) => {
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

mobileAdminRouter.delete('/admin/products/:id{[0-9]+}', async (c) => {
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

// ─── IMAGE UPLOAD (R2) ───────────────────────────────────────────────────────────

const imageUploadRateLimit = new Map<string, { count: number; resetAt: number }>()
const IMAGE_UPLOAD_MAX = 10
const IMAGE_UPLOAD_WINDOW = 60000
const IMAGE_SIZE_LIMIT = 5 * 1024 * 1024 // 5MB

// NOTE (per-isolate scope) : ce rate limiter en mémoire (Map module-level) est
// PER-ISOLATE. Dans Cloudflare Workers, chaque isolate possède son propre tas,
// donc `imageUploadRateLimit` n'est PAS partagé entre les requêtes concurrentes
// traitées par des isolates différents — un abus soutenu depuis une même IP peut
// contourner la limite. La Map stoppe tout de même l'abuseur séquentiel au sein
// d'un même isolate. La vraie protection DoS doit venir des règles de rate
// limiting natives de Cloudflare (config wrangler / dashboard) ; ne pas se fier
// à cette Map comme contrôle de sécurité.
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

mobileAdminRouter.post('/admin/upload/image', async (c) => {
  const clientIp = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown'
  const rl = checkImageUploadRateLimit(clientIp)
  if (!rl.allowed) {
    return c.json({ error: 'Trop d\'uploads récents. Attendez 1 minute.' }, 429)
  }

  let file: any = null
  try {
    const form = await c.req.formData()
    file = form.get('image')
  } catch (_) {
    const body = await c.req.parseBody()
    file = body['image']
  }

  if (!file || typeof file !== 'object' || typeof file.arrayBuffer !== 'function' || !file.size) {
    return c.json({ error: 'Fichier image manquant' }, 400)
  }

  if (file.size > IMAGE_SIZE_LIMIT) {
    return c.json({ error: 'Image trop volumineuse (max 5 MB)' }, 400)
  }

  const rawType = (file.type || '').toLowerCase()
  const fileType = rawType.startsWith('image/') ? rawType : 'image/jpeg'
  const buffer = await file.arrayBuffer()
  const bytes = new Uint8Array(buffer)

  if (!validateImageMagicBytes(bytes)) {
    return c.json({ error: 'Format d\'image non valide' }, 400)
  }

  try {
    const r2 = c.env.IMAGES_BUCKET
    if (!r2) {
      return c.json({ error: 'Stockage R2 non configuré' }, 500)
    }

    const storage = new StorageService(r2)
    const uploadRes = await storage.uploadImage(buffer, fileType, 'mobile-uploads', SITE_URL)

    return c.json({ url: uploadRes.url })
  } catch (e: any) {
    console.error('Upload error:', e)
    return c.json({ error: 'Upload échoué : ' + (e?.message || 'Erreur') }, 500)
  }
})

// ─── BRAND MEDIA LIBRARY HELPER & ROUTES ───────────────────────────────────────

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

// Nettoie les références produits vers une URL d'image supprimée de la médiathèque (D1 uniquement).
// Hard delete + nettoyage automatique des références produits (image principale et galerie) pour éviter les références cassées.
async function cleanupProductImageReferences(db: any, url: string) {
  if (!db || !url) return
  try {
    // (a) Image principale : vider imageUrl et image_url (alias) pour tous les produits qui référencent l'URL
    await db.prepare(`UPDATE products SET imageUrl = '', image_url = '', updated_at = ? WHERE imageUrl = ? OR image_url = ?`).bind(new Date().toISOString(), url, url).run()
    // (b) Galerie : retirer l'URL de media_urls et gallery (alias) pour chaque produit concerné
    const rows = await db.prepare(`SELECT id, ${await gallerySelectColumns(db)} FROM products`).all() as any
    for (const p of (rows?.results || [])) {
      const galleryList = parseGallery(p)
      const filtered = galleryList.filter((g: any) => (typeof g === 'string' ? g : g?.url) !== url)
      if (filtered.length !== galleryList.length) {
        await saveProductGallery(db, p.id, filtered)
      }
    }
  } catch (e) {
    console.error('cleanupProductImageReferences error:', e)
  }
}

mobileAdminRouter.post('/admin/media/brand/upload', async (c) => {
  const db = c.env.DB
  if (!db) return c.json({ error: 'Service indisponible' }, 503)
  await ensureBrandMediaTable(db)

  try {
    let brand = ''
    let label = ''
    let file: any = null

    try {
      const form = await c.req.formData()
      brand = (form.get('brand') as string || '').trim().toUpperCase()
      label = (form.get('label') as string || '').trim()
      file = form.get('image')
    } catch (_) {
      const body = await c.req.parseBody().catch(() => ({} as Record<string, any>))
      brand = (body['brand'] as string || '').trim().toUpperCase()
      label = (body['label'] as string || '').trim()
      file = body['image'] as any
    }

    if (!brand) {
      return c.json({ error: 'Marque requise' }, 400)
    }

    if (!file || typeof file !== 'object' || typeof file.arrayBuffer !== 'function' || !file.size) {
      return c.json({ error: 'Fichier image manquant' }, 400)
    }

    if (file.size > IMAGE_SIZE_LIMIT) {
      return c.json({ error: 'Image trop volumineuse (max 5 MB)' }, 400)
    }

    const rawType = (file.type || '').toLowerCase()
    const fileType = rawType.startsWith('image/') ? rawType : 'image/jpeg'
    const buffer = await file.arrayBuffer()
    const bytes = new Uint8Array(buffer)

    if (!validateImageMagicBytes(bytes)) {
      return c.json({ error: 'Format d\'image non valide' }, 400)
    }

    // Upload vers R2 via StorageService
    const storage = new StorageService(c.env.IMAGES_BUCKET)
    const uploadRes = await storage.uploadImage(buffer, fileType, `brand-media/${brand.toLowerCase()}`, SITE_URL)
    const url = uploadRes.url

    // Sauvegarder dans D1
    const result = await db.prepare(`
      INSERT INTO brand_media_library (brand, url, label, created_at)
      VALUES (?, ?, ?, datetime('now'))
    `).bind(brand, url, label || null).run()

    const id = result.meta?.last_row_id

    await logAdminAudit(db, {
      action: 'upload_brand_media',
      detail: `Upload image médiathèque pour ${brand} (${label || 'sans libellé'})`,
      ip: c.req.header('cf-connecting-ip') || 'unknown',
      userAgent: c.req.header('user-agent') || 'unknown',
    })

    return c.json({
      success: true,
      image: {
        id,
        brand,
        url,
        label: label || null,
        created_at: new Date().toISOString(),
      },
    })
  } catch (e: any) {
    console.error('Brand media upload error:', e)
    return c.json({ error: 'Upload échoué : ' + (e?.message || 'Erreur') }, 500)
  }
})

mobileAdminRouter.post('/admin/media/brand/delete', async (c) => {
  const db = c.env.DB
  if (!db) return c.json({ error: 'Service indisponible' }, 503)
  await ensureBrandMediaTable(db)

  try {
    let id: number | null = null
    try {
      const body = await c.req.json()
      id = Number(body['id'])
    } catch (_) {
      const body = await c.req.parseBody().catch(() => ({} as Record<string, any>))
      id = Number(body['id'])
    }

    if (!id) {
      return c.json({ error: 'ID requis' }, 400)
    }

    // Récupérer l'image pour supprimer de R2
    const media = await db.prepare('SELECT url FROM brand_media_library WHERE id = ?').bind(id).first() as any
    if (media && media.url) {
      const storage = new StorageService(c.env.IMAGES_BUCKET)
      await storage.deleteImage(media.url)
    }

    // Supprimer de D1
    await db.prepare('DELETE FROM brand_media_library WHERE id = ?').bind(id).run()

    // Nettoyer les références produits (image principale + galerie) vers l'URL supprimée
    if (media && media.url) {
      await cleanupProductImageReferences(db, media.url)
    }

    return c.json({ success: true })
  } catch (e: any) {
    console.error('Brand media delete error:', e)
    return c.json({ error: 'Erreur suppression : ' + (e?.message || 'Erreur') }, 500)
  }
})

mobileAdminRouter.post('/admin/media/brand/assign', async (c) => {
  const db = c.env.DB
  if (!db) return c.json({ error: 'Service indisponible' }, 503)
  await ensureBrandMediaTable(db)

  try {
    let body: any = {}
    try {
      body = await c.req.json()
    } catch (_) {
      try {
        const form = await c.req.formData()
        body = Object.fromEntries((form as any).entries())
      } catch (_) {
        body = await c.req.parseBody().catch(() => ({} as Record<string, any>))
      }
    }

    const mediaId = Number(body['media_id'] ?? body['mediaId'])
    const scope = String(body['scope'] || '').trim().toLowerCase() // 'brand' or 'single'
    const rawProductId = body['product_id'] ?? body['productId']
    const productId = rawProductId ? Number(rawProductId) : null
    const target = (String(body['target'] || 'main').trim().toLowerCase() === 'gallery') ? 'gallery' : 'main'

    if (!mediaId || !scope) {
      return c.json({ error: 'media_id et scope requis' }, 400)
    }

    const mediaRow = await db.prepare('SELECT * FROM brand_media_library WHERE id = ?').bind(mediaId).first() as any
    if (!mediaRow || !mediaRow.url) {
      return c.json({ error: 'Image introuvable dans la médiathèque' }, 404)
    }

    if (scope === 'brand') {
      const brandName = (mediaRow.brand || '').trim()
      if (!brandName) {
        return c.json({ error: 'Aucune marque associée à cette image' }, 400)
      }

      if (target === 'main') {
        // Appliquer à l'image principale de tous les produits de la marque (mise à jour simultanée imageUrl et image_url)
        const updateRes = await db.prepare(`
          UPDATE products
          SET imageUrl = ?, image_url = ?, updated_at = datetime('now')
          WHERE LOWER(brand) = LOWER(?)
        `).bind(mediaRow.url, mediaRow.url, brandName).run()

        const count = updateRes.meta?.changes ?? 0

        await logAdminAudit(db, {
          action: 'assign_brand_media_main',
          detail: `Image principale appliquée à ${count} produits de la marque ${brandName}`,
          ip: c.req.header('cf-connecting-ip') || 'unknown',
          userAgent: c.req.header('user-agent') || 'unknown',
        })

        return c.json({
          success: true,
          count,
          message: `Image principale appliquée à tous les ${count} produits ${brandName}.`,
        })
      } else {
        // Ajouter à la galerie de tous les produits de la marque
        const matchingProds = await db.prepare(`
          SELECT id, ${await gallerySelectColumns(db)} FROM products WHERE LOWER(brand) = LOWER(?)
        `).bind(brandName).all() as any

        const rows = matchingProds?.results || []
        let count = 0
        for (const prodRow of rows) {
          let galleryList: any[] = []
          try {
            galleryList = JSON.parse(prodRow.media_urls || prodRow.gallery || '[]')
          } catch (_) {}
          if (!Array.isArray(galleryList)) galleryList = []

          if (!galleryList.some((g: any) => (typeof g === 'string' ? g : g?.url) === mediaRow.url)) {
            galleryList.push({
              url: mediaRow.url,
              deleteUrl: mediaRow.delete_url || '',
              type: 'image',
              caption: mediaRow.label || '',
            })
            await saveProductGallery(db, Number(prodRow.id), galleryList)
            count++
          }
        }

        await logAdminAudit(db, {
          action: 'assign_brand_media_gallery',
          detail: `Image ajoutée à la galerie de ${count} produits de la marque ${brandName}`,
          ip: c.req.header('cf-connecting-ip') || 'unknown',
          userAgent: c.req.header('user-agent') || 'unknown',
        })

        return c.json({
          success: true,
          count,
          message: `Image ajoutée à la galerie de ${count} produits ${brandName}.`,
        })
      }
    } else {
      // Scope single
      if (!productId) {
        return c.json({ error: 'product_id requis pour l\'affectation individuelle' }, 400)
      }

      if (target === 'main') {
        const updateRes = await db.prepare(`
          UPDATE products
          SET imageUrl = ?, image_url = ?, updated_at = datetime('now')
          WHERE id = ?
        `).bind(mediaRow.url, mediaRow.url, productId).run()

        if ((updateRes.meta?.changes ?? 0) === 0) {
          return c.json({ error: 'Produit introuvable' }, 404)
        }

        await logAdminAudit(db, {
          action: 'assign_product_media_main',
          detail: `Image principale affectée au produit #${productId}`,
          ip: c.req.header('cf-connecting-ip') || 'unknown',
          userAgent: c.req.header('user-agent') || 'unknown',
        })

        return c.json({
          success: true,
          message: `Image affectée au produit #${productId}.`,
        })
      } else {
        const prodRow = await db.prepare(`
          SELECT id, ${await gallerySelectColumns(db)} FROM products WHERE id = ?
        `).bind(productId).first() as any

        if (!prodRow) {
          return c.json({ error: 'Produit introuvable' }, 404)
        }

        let galleryList: any[] = []
        try {
          galleryList = JSON.parse(prodRow.media_urls || prodRow.gallery || '[]')
        } catch (_) {}
        if (!Array.isArray(galleryList)) galleryList = []

        if (!galleryList.some((g: any) => (typeof g === 'string' ? g : g?.url) === mediaRow.url)) {
          galleryList.push({
            url: mediaRow.url,
            deleteUrl: mediaRow.delete_url || '',
            type: 'image',
            caption: mediaRow.label || '',
          })
          await saveProductGallery(db, Number(productId), galleryList)
        }

        await logAdminAudit(db, {
          action: 'assign_product_media_gallery',
          detail: `Image ajoutée à la galerie du produit #${productId}`,
          ip: c.req.header('cf-connecting-ip') || 'unknown',
          userAgent: c.req.header('user-agent') || 'unknown',
        })

        return c.json({
          success: true,
          message: `Image ajoutée à la galerie du produit #${productId}.`,
        })
      }
    }
  } catch (e: any) {
    console.error('Brand media assign error:', e)
    return c.json({ error: 'Erreur affectation : ' + (e?.message || 'Erreur') }, 500)
  }
})

// ─── BANNERS (CRUD) ───────────────────────────────────────────────────────────────

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

mobileAdminRouter.get('/admin/banners/:id{[0-9]+}', async (c) => {
  const db = c.env.DB
  if (!db) return c.json({ error: 'Service indisponible' }, 503)
  const id = parseInt(c.req.param('id'), 10)
  if (isNaN(id)) return c.json({ error: 'ID invalide' }, 400)

  try {
    const bannerRepo = new BannerRepository(db)
    const banner = await bannerRepo.findBannerById(id)
    if (!banner) return c.json({ error: 'Bannière non trouvée' }, 404)
    return c.json(banner)
  } catch (e: any) {
    return c.json({ error: 'Erreur: ' + e.message }, 500)
  }
})

mobileAdminRouter.post('/admin/banners', async (c) => {
  const db = c.env.DB
  if (!db) return c.json({ error: 'Service indisponible' }, 503)

  try {
    const body = await c.req.json()
    const bannerRepo = new BannerRepository(db)
    const created = await bannerRepo.createBanner(body)

    await logAdminAudit(db, {
      action: 'create_banner',
      detail: `Bannière: ${body.title}`,
      ip: c.req.header('cf-connecting-ip') || 'unknown',
      userAgent: c.req.header('user-agent') || 'unknown',
    })

    return c.json({ success: true, banner: created })
  } catch (e: any) {
    return c.json({ error: 'Erreur: ' + e.message }, 500)
  }
})

mobileAdminRouter.put('/admin/banners/:id{[0-9]+}', async (c) => {
  const db = c.env.DB
  if (!db) return c.json({ error: 'Service indisponible' }, 503)
  const id = parseInt(c.req.param('id'), 10)
  if (isNaN(id)) return c.json({ error: 'ID invalide' }, 400)

  try {
    const body = await c.req.json()
    const bannerRepo = new BannerRepository(db)
    const updated = await bannerRepo.updateBanner(id, body)
    if (!updated) return c.json({ error: 'Bannière introuvable' }, 404)

    await logAdminAudit(db, {
      action: 'update_banner',
      detail: `Bannière ID: ${id}`,
      ip: c.req.header('cf-connecting-ip') || 'unknown',
      userAgent: c.req.header('user-agent') || 'unknown',
    })

    return c.json({ success: true })
  } catch (e: any) {
    return c.json({ error: 'Erreur: ' + e.message }, 500)
  }
})

mobileAdminRouter.patch('/admin/banners/:id{[0-9]+}/toggle', async (c) => {
  const db = c.env.DB
  if (!db) return c.json({ error: 'Service indisponible' }, 503)
  const id = parseInt(c.req.param('id'), 10)
  if (isNaN(id)) return c.json({ error: 'ID invalide' }, 400)

  try {
    const body = await c.req.json()
    const bannerRepo = new BannerRepository(db)
    await bannerRepo.updateBanner(id, { is_active: body.is_active ? 1 : 0 })

    await logAdminAudit(db, {
      action: 'toggle_banner',
      detail: `Bannière ID: ${id} → ${body.is_active}`,
      ip: c.req.header('cf-connecting-ip') || 'unknown',
      userAgent: c.req.header('user-agent') || 'unknown',
    })

    return c.json({ success: true })
  } catch (e: any) {
    return c.json({ error: 'Erreur: ' + e.message }, 500)
  }
})

// ─── BRANDS (CRUD) ───────────────────────────────────────────────────────────────

mobileAdminRouter.get('/admin/brands/:id{[0-9]+}', async (c) => {
  const db = c.env.DB
  if (!db) return c.json({ error: 'Service indisponible' }, 503)
  const id = parseInt(c.req.param('id'), 10)
  if (isNaN(id)) return c.json({ error: 'ID invalide' }, 400)

  try {
    const bannerRepo = new BannerRepository(db)
    const brand = await bannerRepo.findBrandById(id)
    if (!brand) return c.json({ error: 'Marque non trouvée' }, 404)
    return c.json(brand)
  } catch (e: any) {
    return c.json({ error: 'Erreur: ' + e.message }, 500)
  }
})

mobileAdminRouter.post('/admin/brands', async (c) => {
  const db = c.env.DB
  if (!db) return c.json({ error: 'Service indisponible' }, 503)

  try {
    const body = await c.req.json()
    const bannerRepo = new BannerRepository(db)
    const created = await bannerRepo.createBrand(body)

    await logAdminAudit(db, {
      action: 'create_brand',
      detail: `Marque: ${body.name}`,
      ip: c.req.header('cf-connecting-ip') || 'unknown',
      userAgent: c.req.header('user-agent') || 'unknown',
    })

    return c.json({ success: true, brand: created })
  } catch (e: any) {
    return c.json({ error: 'Erreur: ' + e.message }, 500)
  }
})

mobileAdminRouter.put('/admin/brands/:id{[0-9]+}', async (c) => {
  const db = c.env.DB
  if (!db) return c.json({ error: 'Service indisponible' }, 503)
  const id = parseInt(c.req.param('id'), 10)
  if (isNaN(id)) return c.json({ error: 'ID invalide' }, 400)

  try {
    const body = await c.req.json()
    const bannerRepo = new BannerRepository(db)
    await bannerRepo.updateBrand(id, body)

    await logAdminAudit(db, {
      action: 'update_brand',
      detail: `Marque ID: ${id}`,
      ip: c.req.header('cf-connecting-ip') || 'unknown',
      userAgent: c.req.header('user-agent') || 'unknown',
    })

    return c.json({ success: true })
  } catch (e: any) {
    return c.json({ error: 'Erreur: ' + e.message }, 500)
  }
})

mobileAdminRouter.delete('/admin/brands/:id{[0-9]+}', async (c) => {
  const db = c.env.DB
  if (!db) return c.json({ error: 'Service indisponible' }, 503)
  const id = parseInt(c.req.param('id'), 10)
  if (isNaN(id)) return c.json({ error: 'ID invalide' }, 400)

  try {
    const bannerRepo = new BannerRepository(db)
    await bannerRepo.deleteBrand(id)

    await logAdminAudit(db, {
      action: 'delete_brand',
      detail: `Marque ID: ${id}`,
      ip: c.req.header('cf-connecting-ip') || 'unknown',
      userAgent: c.req.header('user-agent') || 'unknown',
    })

    return c.json({ success: true })
  } catch (e: any) {
    return c.json({ error: 'Erreur: ' + e.message }, 500)
  }
})

mobileAdminRouter.patch('/admin/brands/:id{[0-9]+}/toggle', async (c) => {
  const db = c.env.DB
  if (!db) return c.json({ error: 'Service indisponible' }, 503)
  const id = parseInt(c.req.param('id'), 10)
  if (isNaN(id)) return c.json({ error: 'ID invalide' }, 400)

  try {
    const body = await c.req.json()
    const bannerRepo = new BannerRepository(db)
    await bannerRepo.updateBrand(id, { is_active: body.is_active ? 1 : 0 })

    await logAdminAudit(db, {
      action: 'toggle_brand',
      detail: `Marque ID: ${id} → ${body.is_active}`,
      ip: c.req.header('cf-connecting-ip') || 'unknown',
      userAgent: c.req.header('user-agent') || 'unknown',
    })

    return c.json({ success: true })
  } catch (e: any) {
    return c.json({ error: 'Erreur: ' + e.message }, 500)
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
  if (!db) return c.json({ images: [] })
  await ensureBrandMediaTable(db)

  const brand = (c.req.query('brand') || '').trim()
  const brandId = Number(c.req.query('brand_id')) || 0

  try {
    if (brandId > 0 && !brand) {
      const bannerRepo = new BannerRepository(db)
      const list = await bannerRepo.findBrandMedia(brandId)
      if (list && list.length > 0) return c.json({ images: list })
    }

    const sql = brand
      ? 'SELECT * FROM brand_media_library WHERE LOWER(brand) = LOWER(?) ORDER BY created_at DESC'
      : 'SELECT * FROM brand_media_library ORDER BY brand ASC, created_at DESC'
    const res = brand ? await db.prepare(sql).bind(brand).all() : await db.prepare(sql).all()
    const results = (res as any)?.results || []
    return c.json({ images: results })
  } catch (e: any) {
    console.error('GET /admin/media/brand error:', e)
    return c.json({ images: [] })
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
  await ensureBrandMediaTable(db)
  const id = Number(c.req.param('id'))
  if (!id) return c.json({ error: 'ID invalide' }, 400)

  try {
    const media = await db.prepare('SELECT url FROM brand_media_library WHERE id = ?').bind(id).first() as any
    if (media && media.url) {
      const storage = new StorageService(c.env.IMAGES_BUCKET)
      await storage.deleteImage(media.url)
    }
    await db.prepare('DELETE FROM brand_media_library WHERE id = ?').bind(id).run()
    // Nettoyer les références produits (image principale + galerie) vers l'URL supprimée
    if (media && media.url) {
      await cleanupProductImageReferences(db, media.url)
    }
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

mobileAdminRouter.post('/admin/maintenance/contracts/:id/activate', async (c) => {
  const db = c.env.DB
  if (!db) return c.json({ error: 'Service indisponible' }, 503)
  const id = parseInt(c.req.param('id'), 10)
  if (isNaN(id)) return c.json({ error: 'ID invalide' }, 400)

  try {
    await db.prepare("UPDATE maintenance_contracts SET status = 'active', updated_at = datetime('now') WHERE id = ?").bind(id).run()
    return c.json({ success: true })
  } catch (e: any) {
    return c.json({ error: 'Erreur: ' + e.message }, 500)
  }
})

mobileAdminRouter.patch('/admin/maintenance/requests/:id/status', async (c) => {
  const db = c.env.DB
  if (!db) return c.json({ error: 'Service indisponible' }, 503)
  const id = parseInt(c.req.param('id'), 10)
  if (isNaN(id)) return c.json({ error: 'ID invalide' }, 400)

  try {
    const body = await c.req.json()
    const status = body['status']
    if (!status) return c.json({ error: 'Statut requis' }, 400)

    await db.prepare("UPDATE maintenance_requests SET status = ?, updated_at = datetime('now') WHERE id = ?").bind(status, id).run()
    return c.json({ success: true })
  } catch (e: any) {
    return c.json({ error: 'Erreur: ' + e.message }, 500)
  }
})

mobileAdminRouter.patch('/admin/maintenance/visits/:id/validate', async (c) => {
  const db = c.env.DB
  if (!db) return c.json({ error: 'Service indisponible' }, 503)
  const id = parseInt(c.req.param('id'), 10)
  if (isNaN(id)) return c.json({ error: 'ID invalide' }, 400)

  try {
    await db.prepare("UPDATE maintenance_visits SET status = 'completed', updated_at = datetime('now') WHERE id = ?").bind(id).run()
    return c.json({ success: true })
  } catch (e: any) {
    return c.json({ error: 'Erreur: ' + e.message }, 500)
  }
})

// ─── REVIEWS ───────────────────────────────────────────────────────────────────

mobileAdminRouter.get('/admin/reviews', async (c) => {
  const db = c.env.DB
  if (!db) return c.json([])
  try {
    const { limit = 50, offset = 0 } = c.req.query()
    const rows = await db.prepare('SELECT * FROM reviews ORDER BY created_at DESC LIMIT ? OFFSET ?')
      .bind(parseInt(String(limit), 10), parseInt(String(offset), 10))
      .all()
    return c.json(rows.results || [])
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

mobileAdminRouter.get('/admin/reviews/:id{[0-9]+}', async (c) => {
  const db = c.env.DB
  if (!db) return c.json({ error: 'Service indisponible' }, 503)
  const id = parseInt(c.req.param('id'), 10)
  if (isNaN(id)) return c.json({ error: 'ID invalide' }, 400)

  try {
    const review = await db.prepare('SELECT * FROM reviews WHERE id = ?').bind(id).first()
    if (!review) return c.json({ error: 'Avis non trouvé' }, 404)
    return c.json(review)
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

// ─── PRODUCT IMAGE UPDATE ───────────────────────────────────────────────────────

mobileAdminRouter.post('/admin/products/:id{[0-9]+}/image', async (c) => {
  const db = c.env.DB
  if (!db) return c.json({ error: 'Service indisponible' }, 503)
  const id = parseInt(c.req.param('id'), 10)
  if (isNaN(id)) return c.json({ error: 'ID invalide' }, 400)

  try {
    let imageUrl = ''
    try {
      const body = await c.req.json()
      imageUrl = (body['image_url'] || body['imageUrl'] || '').trim()
    } catch (_) {
      const body = await c.req.parseBody().catch(() => ({} as Record<string, any>))
      imageUrl = (body['image_url'] as string || body['imageUrl'] as string || '').trim()
    }

    if (!imageUrl) {
      return c.json({ error: 'URL image requise' }, 400)
    }

    await db.prepare(`
      UPDATE products
      SET imageUrl = ?, image_url = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(imageUrl, imageUrl, id).run()

    await logAdminAudit(db, {
      action: 'update_product_image',
      detail: `Image mise à jour pour le produit #${id}`,
      ip: c.req.header('cf-connecting-ip') || 'unknown',
      userAgent: c.req.header('user-agent') || 'unknown',
    })

    return c.json({ success: true, url: imageUrl })
  } catch (e: any) {
    return c.json({ error: 'Erreur: ' + e.message }, 500)
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

mobileAdminRouter.get('/admin/payments/:id{[0-9]+}', async (c) => {
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

mobileAdminRouter.patch('/admin/payments/:id{[0-9]+}/status', async (c) => {
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

mobileAdminRouter.get('/admin/devis/:id{[0-9]+}', async (c) => {
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

mobileAdminRouter.patch('/admin/devis/:id{[0-9]+}/status', async (c) => {
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

mobileAdminRouter.post('/admin/devis/:id{[0-9]+}/convert', async (c) => {
  const id = Number(c.req.param('id'))
  const db = c.env.DB
  if (!db || !id) return c.json({ error: 'ID invalide' }, 400)

  try {
    // Update devis status to accepted
    await db.prepare("UPDATE devis SET status = 'accepted', updated_at = datetime('now') WHERE id = ?").bind(id).run()

    // Optionally create an order from the devis
    const devis = await db.prepare('SELECT * FROM devis WHERE id = ?').bind(id).first() as any
    if (devis) {
      const result = await db.prepare(`
        INSERT INTO orders (client_id, total_amount, status, notes, created_at)
        VALUES (?, ?, 'pending', ?, datetime('now'))
      `).bind(devis.client_id, devis.total_amount, `Converti depuis devis #${id}`).run()

      return c.json({ success: true, order_id: result.meta?.last_row_id })
    }

    return c.json({ success: true })
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

mobileAdminRouter.get('/admin/messages/:id{[0-9]+}', async (c) => {
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

mobileAdminRouter.post('/admin/messages/:id{[0-9]+}/respond', async (c) => {
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

mobileAdminRouter.patch('/admin/messages/:id{[0-9]+}/status', async (c) => {
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

mobileAdminRouter.get('/admin/sav/:id{[0-9]+}', async (c) => {
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

mobileAdminRouter.patch('/admin/sav/:id{[0-9]+}/status', async (c) => {
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

mobileAdminRouter.patch('/admin/sav/:id{[0-9]+}/assign', async (c) => {
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

mobileAdminRouter.patch('/admin/sav/:id{[0-9]+}/resolve', async (c) => {
  const id = Number(c.req.param('id'))
  const db = c.env.DB
  if (!db || !id) return c.json({ error: 'ID invalide' }, 400)
  const { resolution_notes } = await c.req.json().catch(() => ({}))
  try {
    await db.prepare("UPDATE sav_tickets SET status = 'resolved', resolution_notes = ?, updated_at = datetime('now') WHERE id = ?")
      .bind(resolution_notes || null, id).run()
    return c.json({ success: true, message: 'Ticket résolu' })
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

mobileAdminRouter.get('/admin/notifications/:id{[0-9]+}', async (c) => {
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

mobileAdminRouter.get('/admin/realisations/:id{[0-9]+}', async (c) => {
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

mobileAdminRouter.delete('/admin/realisations/:id{[0-9]+}', async (c) => {
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

mobileAdminRouter.patch('/admin/realisations/:id{[0-9]+}/featured', async (c) => {
  const id = Number(c.req.param('id'))
  const db = c.env.DB
  if (!db || !id) return c.json({ error: 'ID invalide' }, 400)
  const { featured } = await c.req.json().catch(() => ({}))
  try {
    await db.prepare("UPDATE realisations SET featured = ?, updated_at = datetime('now') WHERE id = ?")
      .bind(featured ? 1 : 0, id).run()
    return c.json({ success: true, message: 'Statut featured mis à jour' })
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
