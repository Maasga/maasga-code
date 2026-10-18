import { Hono } from 'hono'
import type { HonoEnv } from '../../types'
import { mobileAuth } from '../../services/auth.service'
import { ProductRepository, OrderRepository, AppointmentRepository, ClientRepository, MaintenanceRepository } from '../../repositories'
import { products } from '../../data/products'
import { quartiers } from '../../data/quartiers'
import { reviews } from '../../data/store'
import { getReviews, getQuartiers } from '../../db'
import { calculatePlanPricing, generateVisitDates } from '../../services/pricing.service'

export const mobileClientRouter = new Hono<HonoEnv>()

// ── POST /api/mobile/login ──────────────────────────────────────────
mobileClientRouter.post('/login', mobileAuth, async (c) => {
  const user = c.get('mobileUser')
  const db = c.env.DB
  if (db) {
    try {
      const clientRepo = new ClientRepository(db)
      const existing = await clientRepo.findByFirebaseUid(user.uid) || (user.email ? await clientRepo.findByEmail(user.email) : null)

      if (!existing) {
        await clientRepo.create({
          firebase_uid: user.uid,
          name: user.name || '',
          email: user.email || '',
        })
      } else if (!existing.firebase_uid) {
        await clientRepo.update(existing.id, { firebase_uid: user.uid })
      }
    } catch (e) {
      console.error('Mobile login sync error:', e)
    }
  }
  return c.json({ success: true, uid: user.uid, role: user.role })
})

// ── POST /api/mobile/register ───────────────────────────────────────
mobileClientRouter.post('/register', mobileAuth, async (c) => {
  const user = c.get('mobileUser')
  const body = (await c.req.json().catch(() => ({}))) as any
  const phone = (body.phone || '').trim().replace(/\s/g, '')
  const quartier = (body.quartier || '').trim()
  const name = (body.name || user.name || '').trim()

  const db = c.env.DB
  if (db) {
    try {
      const fullPhone = phone ? (phone.startsWith('+226') ? phone : '+226' + phone) : null
      const clientRepo = new ClientRepository(db)
      const existing = await clientRepo.findByFirebaseUid(user.uid)

      if (existing) {
        await clientRepo.update(existing.id, {
          name: name || existing.name,
          phone: fullPhone || existing.phone,
          quartier: quartier || existing.quartier,
        })
      } else {
        await clientRepo.create({
          firebase_uid: user.uid,
          name,
          email: user.email || '',
          phone: fullPhone || '',
          quartier: quartier || null,
        })
      }
    } catch (e) {
      console.error('Mobile register sync error:', e)
    }
  }
  return c.json({ success: true, uid: user.uid })
})

// ── GET /api/mobile/profile ─────────────────────────────────────────
mobileClientRouter.get('/profile', mobileAuth, async (c) => {
  const user = c.get('mobileUser')
  const db = c.env.DB
  if (db) {
    try {
      const clientRepo = new ClientRepository(db)
      const client = await clientRepo.findByFirebaseUid(user.uid)
      if (client) return c.json({ ...client, uid: user.uid, role: user.role })
    } catch (_) {}
  }
  return c.json({ uid: user.uid, name: user.name, email: user.email, role: user.role })
})

// ── PATCH /api/mobile/profile ───────────────────────────────────────
mobileClientRouter.patch('/profile', mobileAuth, async (c) => {
  const user = c.get('mobileUser')
  const db = c.env.DB
  if (!db) return c.json({ error: 'Service indisponible' }, 503)

  const body = (await c.req.json().catch(() => ({}))) as any
  const name = (body?.name || '').trim()
  const quartier = (body?.quartier || '').trim()

  if (!name && !quartier) return c.json({ error: 'Aucune donnée à mettre à jour' }, 400)
  if (name && (name.length < 2 || name.length > 80)) {
    return c.json({ error: 'Nom invalide (2–80 caractères)' }, 400)
  }

  try {
    const clientRepo = new ClientRepository(db)
    const client = await clientRepo.findByFirebaseUid(user.uid) || (user.email ? await clientRepo.findByEmail(user.email) : null)
    if (!client) return c.json({ error: 'Profil introuvable' }, 404)

    await clientRepo.update(client.id, {
      ...(name ? { name } : {}),
      ...(quartier ? { quartier } : {}),
    })

    return c.json({ success: true, name: name || undefined, quartier: quartier || undefined })
  } catch (e) {
    console.error('Profile update error:', e)
    return c.json({ error: 'Erreur lors de la mise à jour' }, 500)
  }
})

// ── GET /api/mobile/client-dashboard ────────────────────────────────
mobileClientRouter.get('/client-dashboard', mobileAuth, async (c) => {
  const user = c.get('mobileUser')
  const db = c.env.DB

  let client: any = { name: user.name, email: user.email, phone: '', quartier: '', created_at: new Date().toISOString() }
  let clientOrders: any[] = []
  let rdvs: any[] = []
  let maintenanceContracts: any[] = []
  let freeMaintenances: any[] = []
  const payments: any[] = []

  if (db) {
    try {
      const clientRepo = new ClientRepository(db)
      const orderRepo = new OrderRepository(db)
      const apptRepo = new AppointmentRepository(db)

      const clientRow = await clientRepo.findByFirebaseUid(user.uid) || (user.email ? await clientRepo.findByEmail(user.email) : null)

      if (clientRow) {
        client = clientRow
        clientOrders = await orderRepo.findByClientId(clientRow.id)

        const userPhone = clientRow.phone || ''
        const last8 = userPhone.replace(/\D/g, '').slice(-8)

        rdvs = await apptRepo.findByClientId(clientRow.id)
        if (rdvs.length === 0 && userPhone) {
          rdvs = await apptRepo.findByPhone(userPhone)
        }

        // Maintenance contracts & visits
        const contractsResult = await db.prepare(
          'SELECT * FROM maintenance_contracts WHERE (client_id IS NOT NULL AND client_id = ?) OR (client_phone != "" AND (client_phone = ? OR client_phone LIKE ?)) ORDER BY created_at DESC'
        ).bind(clientRow.id || 0, userPhone, last8 ? `%${last8}` : '__none__').all()

        const rawContracts = (contractsResult.results || []) as any[]
        const planLabel: Record<string, string> = {
          residentiel: 'Résidentiel',
          professionnel: 'Professionnel / PME',
          professionnel_pme: 'Professionnel / PME',
          industriel: 'Industriel',
          sur_mesure: 'Sur Mesure',
          semestriel: 'Semestriel (2 visites/an)',
          trimestriel: 'Trimestriel (3 visites/an)',
          annuel: 'Annuel (1 visite/an)',
          mensuel: 'Mensuel (12 visites/an)',
          bimestriel: 'Bimestriel (6 visites/an)',
          sav_gratuit: 'SAV Gratuit',
        }
        const planVis: Record<string, number> = {
          residentiel: 2, professionnel: 2, professionnel_pme: 2,
          industriel: 3, sur_mesure: 2, semestriel: 2,
          trimestriel: 3, annuel: 1, mensuel: 12, bimestriel: 6, sav_gratuit: 1,
        }
        const stLabel: Record<string, string> = {
          en_attente: 'En attente', pending: 'En attente',
          contacte: 'Contacté', contacted: 'Contacté',
          actif: 'Actif', active: 'Actif',
          expire: 'Expiré', expired: 'Expiré',
          annule: 'Annulé', cancelled: 'Annulé', refused: 'Refusé',
        }
        const fmtMY = (d: string) => { try { return d ? new Date(d).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }) : '' } catch { return d || '' } }
        const fmtP = (p: number | null | undefined) => (!p ? '—' : p.toLocaleString('fr-FR') + ' FCFA')

        maintenanceContracts = await Promise.all(
          rawContracts.map(async (ct: any) => {
            const key = (ct.plan_type || 'annuel').toLowerCase()
            const totalV = ct.total_visits ?? planVis[key] ?? 1
            const doneV = ct.completed_visits ?? 0
            let visites: any[] = []
            try {
              const vr = await db.prepare('SELECT visit_date, status, technician FROM maintenance_visits WHERE contract_id = ? ORDER BY visit_date ASC').bind(ct.id).all()
              visites = (vr.results || []).map((v: any) => ({
                date: fmtMY(v.visit_date),
                technician_name: v.technician || 'Technicien MAASGA',
                is_completed: v.status === 'done' || v.status === 'completed',
              }))
            } catch (_) {}
            const period = ct.start_date && ct.end_date ? `${fmtMY(ct.start_date)} – ${fmtMY(ct.end_date)}` : ct.start_date ? `Depuis ${fmtMY(ct.start_date)}` : ''
            return {
              id: ct.id,
              type: planLabel[key] ?? key,
              period,
              price: fmtP(ct.plan_price),
              status: stLabel[ct.status ?? 'pending'] ?? (ct.status ?? 'En attente'),
              visites,
              visites_effectuees: doneV,
              visites_totales: totalV,
              quartier: clientRow.quartier || '',
              plan_type: key,
              invoice_url: ct.invoice_url ?? null,
            }
          })
        )

        try {
          const freeResult = await db.prepare(
            'SELECT mv.*, a.name as tech FROM maintenance_visits mv LEFT JOIN appointments a ON mv.appointment_id = a.id WHERE mv.client_id = ? AND mv.plan_type = ? ORDER BY mv.scheduled_date ASC LIMIT 3'
          ).bind(clientRow.id, 'gratuit').all()
          freeMaintenances = (freeResult.results || []) as any[]
        } catch (_) {}
      }
    } catch (e) {
      console.error('client-dashboard error:', e)
    }
  }

  return c.json({
    client: {
      id: client.id || 0,
      name: client.name || user.name || '',
      phone: client.phone || '',
      email: client.email || user.email || '',
      quartier: client.quartier || '',
      photoUrl: null,
      created_at: client.created_at || new Date().toISOString(),
    },
    orders: clientOrders,
    rdvs,
    maintenanceContracts,
    freeMaintenances,
    payments,
  })
})

// ── POST /api/mobile/order/:id/devis-action ─────────────────────────
mobileClientRouter.post('/order/:id/devis-action', mobileAuth, async (c) => {
  const orderId = Number(c.req.param('id'))
  const body = (await c.req.json().catch(() => ({}))) as any
  const action = body.action // 'accept' | 'refuse'
  const reason = body.reason || ''
  const db = c.env.DB
  if (!db) return c.json({ error: 'DB indisponible' }, 503)

  const newStatus = action === 'accept' ? 'confirme' : 'annule'
  const orderRepo = new OrderRepository(db)
  await orderRepo.updateStatus(orderId, newStatus, reason)
  return c.json({ success: true })
})

// ── GET /api/mobile/products ────────────────────────────────────────
mobileClientRouter.get('/products', async (c) => {
  const db = c.env.DB
  const availableOnly = c.req.query('available') === 'true'

  if (db) {
    try {
      const prodRepo = new ProductRepository(db)
      const list = await prodRepo.findAll(availableOnly ? { activeOnly: true } : undefined)
      if (list.length > 0) return c.json(list)
    } catch (e) {
      console.error('Mobile products error:', e)
    }
  }

  let list: any[] = [...products]
  if (availableOnly) {
    list = list.filter((p: any) => p.available || p.stock > 0)
  }
  return c.json(list)
})

// ── GET /api/mobile/products/:id ────────────────────────────────────
mobileClientRouter.get('/products/:id', async (c) => {
  const id = parseInt(c.req.param('id'), 10)
  const db = c.env.DB
  if (db) {
    try {
      const prodRepo = new ProductRepository(db)
      const p = await prodRepo.findById(id)
      if (p) return c.json(p)
    } catch (_) {}
  }
  const fallback = products.find((p: any) => p.id === id)
  if (!fallback) return c.json({ error: 'Produit non trouvé' }, 404)
  return c.json(fallback)
})

// ── GET /api/mobile/reviews ─────────────────────────────────────────
mobileClientRouter.get('/reviews', async (c) => {
  const db = c.env.DB
  let list = reviews.filter((r: any) => r.approved)
  if (db) {
    try {
      const dbReviews = await getReviews(db, true)
      if (dbReviews.length > 0) list = dbReviews as any[]
    } catch (_) {}
  }
  return c.json(list)
})

// ── GET /api/mobile/quartiers ───────────────────────────────────────
mobileClientRouter.get('/quartiers', async (c) => {
  const db = c.env.DB
  let list = quartiers
  if (db) {
    try {
      const dbQuartiers = await getQuartiers(db)
      if (dbQuartiers && dbQuartiers.length > 0) list = dbQuartiers as any
    } catch (_) {}
  }
  return c.json(list)
})

// ── POST /api/mobile/rdv ────────────────────────────────────────────
mobileClientRouter.post('/rdv', mobileAuth, async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const user = c.get('mobileUser')
  const db = c.env.DB

  const name = (body.name || user.name || '').trim()
  const phone = (body.phone || '').trim()
  const quartier = (body.quartier || '').trim()
  const date = (body.date || '').trim()
  const heureDebut = (body.heure_debut || '08:00').trim()
  const heureFin = (body.heure_fin || '18:00').trim()
  const type = (body.type || 'installation').trim()
  const notes = body.notes || ''

  if (!name || !phone || !quartier || !date) {
    return c.json({ error: 'Champs requis manquants (nom, téléphone, quartier, date)' }, 400)
  }

  if (db) {
    try {
      const apptRepo = new AppointmentRepository(db)
      const created = await apptRepo.create({
        name,
        phone,
        quartier,
        date,
        heure_debut: heureDebut,
        heure_fin: heureFin,
        type,
        notes,
        status: 'pending',
      })
      return c.json({ success: true, rdv: created })
    } catch (e: any) {
      console.error('Mobile rdv create error:', e)
      return c.json({ error: 'Erreur lors de la réservation' }, 500)
    }
  }

  return c.json({ success: true })
})

// ── GET /api/mobile/my-rdvs ─────────────────────────────────────────
mobileClientRouter.get('/my-rdvs', mobileAuth, async (c) => {
  const user = c.get('mobileUser')
  const db = c.env.DB
  if (!db) return c.json([])
  try {
    const clientRepo = new ClientRepository(db)
    const apptRepo = new AppointmentRepository(db)
    const client = await clientRepo.findByFirebaseUid(user.uid)
    if (client) {
      const list = await apptRepo.findByClientId(client.id)
      if (list.length > 0) return c.json(list)
      if (client.phone) {
        return c.json(await apptRepo.findByPhone(client.phone))
      }
    }
    return c.json([])
  } catch (e) {
    console.error('Mobile my-rdvs error:', e)
    return c.json([])
  }
})

// ── GET /api/mobile/my-orders ───────────────────────────────────────
mobileClientRouter.get('/my-orders', mobileAuth, async (c) => {
  const db = c.env.DB
  if (!db) return c.json([])
  try {
    const orderRepo = new OrderRepository(db)
    const user = c.get('mobileUser')
    const clientRepo = new ClientRepository(db)
    const client = await clientRepo.findByFirebaseUid(user.uid)
    if (client) {
      return c.json(await orderRepo.findByClientId(client.id))
    }
    return c.json([])
  } catch (e) {
    console.error('Mobile my-orders error:', e)
    return c.json([])
  }
})

// ── POST /api/mobile/commandes ──────────────────────────────────────
mobileClientRouter.post('/commandes', mobileAuth, async (c) => {
  const body = await c.req.json()
  const user = c.get('mobileUser')
  const db = c.env.DB

  const clientName = (body.client_name || user.name || '').trim()
  const clientPhone = (body.client_phone || '').trim()
  const quartier = (body.quartier || '').trim()
  const productId = body.product_id ? parseInt(body.product_id, 10) : null
  const quantity = Math.max(1, parseInt(body.quantity, 10) || 1)
  const paymentMethod = body.payment_method || 'Téléphone'
  const notes = body.notes || ''

  if (!clientName || !clientPhone) return c.json({ error: 'Nom et téléphone requis' }, 400)

  if (db) {
    try {
      const prodRepo = new ProductRepository(db)
      let unitPrice = 0
      if (productId) {
        const product = await prodRepo.findById(productId)
        if (!product) return c.json({ error: 'Produit introuvable ou indisponible' }, 404)
        unitPrice = product.price || 0
      }
      const totalPrice = unitPrice * quantity

      const items = body.items as Array<{ product_id: number; name: string; quantity: number; unit_price: number; line_total: number }> | undefined
      const resolvedTotal = items
        ? items.reduce((sum: number, item: any) => sum + (item.line_total || item.unit_price * item.quantity || 0), 0)
        : totalPrice
      const productLabel = items && items.length > 0
        ? items.map((i: any) => `${i.quantity}x ${i.name}`).join(', ')
        : null
      const resolvedProductId = items && items.length === 1 ? items[0].product_id : productId
      const resolvedQuantity = items ? items.reduce((sum: number, i: any) => sum + (i.quantity || 1), 0) : quantity
      const resolvedNotes = [
        `[${paymentMethod}]`,
        productLabel ? `Produits: ${productLabel}` : '',
        notes,
      ].filter(Boolean).join(' | ').trim()

      const clientRepo = new ClientRepository(db)
      const existingClient = await clientRepo.findByFirebaseUid(user.uid)
      const clientId = body.client_id ? parseInt(body.client_id, 10) : (existingClient?.id || null)
      const clientEmail = body.client_email || user.email || null

      const orderRepo = new OrderRepository(db)
      await orderRepo.create({
        client_id: clientId,
        client_name: clientName,
        client_phone: clientPhone,
        client_email: clientEmail,
        quartier,
        product_id: resolvedProductId,
        quantity: resolvedQuantity,
        notes: resolvedNotes,
        total_price: resolvedTotal,
        type: 'commande',
        status: 'en_attente',
      })
      return c.json({ success: true })
    } catch (e) {
      console.error('Mobile commande create error:', e)
    }
  }
  return c.json({ success: true })
})

// ── POST /api/mobile/commandes/:id/annuler ──────────────────────────
mobileClientRouter.post('/commandes/:id/annuler', mobileAuth, async (c) => {
  const id = Number(c.req.param('id'))
  const db = c.env.DB
  if (!db) return c.json({ error: 'DB non disponible' }, 503)

  try {
    const orderRepo = new OrderRepository(db)
    await orderRepo.updateStatus(id, 'annule', 'Annulé par le client via l\'application mobile')
    return c.json({ success: true })
  } catch (e: any) {
    return c.json({ error: e.message || 'Erreur lors de l\'annulation' }, 500)
  }
})

// ── POST /api/mobile/maintenance ────────────────────────────────────
mobileClientRouter.post('/maintenance', mobileAuth, async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const user = c.get('mobileUser')
  const db = c.env.DB
  if (!db) return c.json({ error: 'DB non disponible' }, 503)

  try {
    const maintRepo = new MaintenanceRepository(db)
    const clientRepo = new ClientRepository(db)
    const client = await clientRepo.findByFirebaseUid(user.uid)

    const req = await maintRepo.createRequest({
      client_id: client?.id || null,
      name: body.name || user.name || '',
      phone: body.phone || client?.phone || '',
      email: body.email || user.email || '',
      quartier: body.quartier || client?.quartier || '',
      request_type: body.request_type || 'occasionnelle',
      description: body.description || '',
      preferred_date: body.preferred_date || null,
      equipment_type: body.equipment_type || null,
      plan_type: body.plan_type || null,
      status: 'pending',
    })

    return c.json({ success: true, request: req })
  } catch (e: any) {
    return c.json({ error: e.message || 'Erreur lors de la demande de maintenance' }, 500)
  }
})

// ── POST /api/client/push-token ─────────────────────────────────────
mobileClientRouter.post('/push-token', mobileAuth, async (c) => {
  const user = c.get('mobileUser')
  const db = c.env.DB
  if (!db) return c.json({ error: 'Service indisponible' }, 503)

  const body = (await c.req.json().catch(() => ({}))) as any
  const token = (body?.token || '').trim()
  const platform = (body?.platform || 'android').trim()
  const appVersion = (body?.appVersion || '').trim()

  if (!token) return c.json({ error: 'Token FCM manquant' }, 400)

  let clientId = 0
  try {
    const row = (await db.prepare('SELECT id FROM clients WHERE firebase_uid = ?').bind(user.uid).first()) as any
    if (row?.id) clientId = Number(row.id)
  } catch (_) {}

  try {
    await db.prepare(`CREATE TABLE IF NOT EXISTS push_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      token TEXT NOT NULL UNIQUE,
      platform TEXT DEFAULT 'android',
      app_version TEXT DEFAULT '',
      updated_at TEXT NOT NULL
    )`).run()
  } catch (_) {}

  await db.prepare(`
    INSERT INTO push_tokens (client_id, token, platform, app_version, updated_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(token) DO UPDATE SET
      client_id   = excluded.client_id,
      platform    = excluded.platform,
      app_version = excluded.app_version,
      updated_at  = excluded.updated_at
  `).bind(clientId, token, platform, appVersion, new Date().toISOString()).run()

  return c.json({ success: true })
})

// ── DELETE /api/client/push-token ───────────────────────────────────
mobileClientRouter.delete('/push-token', mobileAuth, async (c) => {
  const db = c.env.DB
  if (!db) return c.json({ error: 'Service indisponible' }, 503)

  const body = (await c.req.json().catch(() => ({}))) as any
  const token = (body?.token || '').trim()

  if (!token) return c.json({ error: 'Token FCM manquant' }, 400)

  await db.prepare('DELETE FROM push_tokens WHERE token = ?').bind(token).run()
  return c.json({ success: true })
})

