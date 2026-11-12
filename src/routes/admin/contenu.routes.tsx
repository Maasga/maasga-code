// Contenus : avis, messages, réalisations, paramètres du site
// (module généré par découpage de l'ancien src/routes/admin/index.tsx, 5 600 lignes)
import { Hono } from 'hono'
import type { HonoEnv } from '../../types'
import {
  AdminAvisPage,
  AdminParametresPage,
  AdminMessagesPage,
  AdminRealisationsPage
} from '../../pages/admin'
import {
  reviews
} from '../../data/store'
import { quartiers } from '../../data/quartiers'
import {
  getReviews,
  getQuartiers
} from '../../db'
import { adminAuth, refreshAdminCache } from './shared'

export const adminContenuRouter = new Hono<HonoEnv>()

// Note : l'ancien endpoint POST /api/admin/order/terrain-validation a été retiré.
// Il écrivait orders.status = 'validation_terrain', valeur supprimée par la
// migration 0036 (le CHECK n'accepte plus que en_attente/contacte/confirme/
// en_livraison/livre/annule), donc chaque appel violait la contrainte. Aucune vue
// admin ne le référençait : l'étape « validation terrain » est couverte par le
// statut 'contacte' et par les RDV.

// ============================================================
// ADMIN ROUTES
// ============================================================

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

async function getSiteSettings(db: any): Promise<Record<string, string>> {
  try {
    await ensureSiteSettings(db)
    const rows = (await db.prepare('SELECT key, value FROM site_settings').all())?.results || []
    const settings: Record<string, string> = {}
    ;(rows as any[]).forEach((r: any) => { settings[r.key] = r.value })
    return settings
  } catch(_) { return {} }
}

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
        ['facebook', ''], ['instagram', ''], ['slogan', 'Spécialiste climatisation & froid à Ouagadougou']
      ]
      for (const [k, v] of defaults) {
        await db.prepare('INSERT OR IGNORE INTO site_settings (key, value) VALUES (?, ?)').bind(k, v).run()
      }
    }
  } catch(_) {}
}

adminContenuRouter.get('/admin/avis', adminAuth, refreshAdminCache, async (c) => {
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

adminContenuRouter.get('/admin/messages', adminAuth, refreshAdminCache, async (c) => {
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

adminContenuRouter.post('/api/admin/messages/:id/read', adminAuth, async (c) => {
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

adminContenuRouter.post('/api/admin/messages/:id/unread', adminAuth, async (c) => {
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

adminContenuRouter.post('/api/admin/messages/:id/delete', adminAuth, async (c) => {
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

adminContenuRouter.get('/admin/realisations', adminAuth, refreshAdminCache, async (c) => {
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

adminContenuRouter.post('/api/admin/realisations/add', adminAuth, async (c) => {
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

adminContenuRouter.post('/api/admin/realisations/update', adminAuth, async (c) => {
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

adminContenuRouter.post('/api/admin/realisations/delete', adminAuth, async (c) => {
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
adminContenuRouter.get('/api/realisations', async (c) => {
  const db = c.env.DB
  if (!db) return c.json([])
  try {
    await ensureRealisationsTable(db)
    const result = await db.prepare('SELECT id, title, description, category, client_name, quartier, image_url, date_realisation, is_featured FROM realisations WHERE is_visible = 1 ORDER BY is_featured DESC, date_realisation DESC').all()
    return c.json(result?.results || [])
  } catch(e) { return c.json([]) }
})

adminContenuRouter.get('/admin/parametres', adminAuth, refreshAdminCache, async (c) => {
  const success = c.req.query('success')
  const error = c.req.query('error')
  const db = c.env.DB
  let siteSettings: Record<string, string> = {}
  if (db) siteSettings = await getSiteSettings(db)
  return c.html(<AdminParametresPage success={success} error={error} siteSettings={siteSettings} />)
})

// Save site settings
adminContenuRouter.post('/api/admin/site-settings', adminAuth, async (c) => {
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

// API Admin - Approuver avis
adminContenuRouter.post('/api/admin/avis/approve', adminAuth, async (c) => {
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
  
  return c.redirect('/admin/avis?success=1')
})

// API Admin - Rejeter avis
adminContenuRouter.post('/api/admin/avis/reject', adminAuth, async (c) => {
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
  
  return c.redirect('/admin/avis?deleted=1')
})

adminContenuRouter.get('/api/reviews', async (c) => {
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

adminContenuRouter.get('/api/quartiers', async (c) => {
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
