// Pages du tableau de bord admin
// (module généré par découpage de l'ancien src/routes/admin/index.tsx, 5 600 lignes)
import { Hono } from 'hono'
import type { HonoEnv } from '../../types'
import {
  AdminPage,
  AdminProduitsPage,
  AdminRDVPage,
  AdminClientsPage,
  AdminCommandesPage,
  AdminPaiementsPage
} from '../../pages/admin'
import { adminAuth, refreshAdminCache } from './shared'

export const adminPagesRouter = new Hono<HonoEnv>()

adminPagesRouter.get('/admin', adminAuth, refreshAdminCache, (c) => {
  return c.html(<AdminPage />)
})

adminPagesRouter.get('/admin/produits', adminAuth, refreshAdminCache, (c) => {
  const success = c.req.query('success')
  const deleted = c.req.query('deleted')
  return c.html(<AdminProduitsPage success={success} deleted={deleted} />)
})

adminPagesRouter.get('/admin/rdv', adminAuth, refreshAdminCache, (c) => {
  const status = c.req.query('status')
  return c.html(<AdminRDVPage filterStatus={status} />)
})

adminPagesRouter.get('/admin/clients', adminAuth, refreshAdminCache, (c) => {
  return c.html(<AdminClientsPage />)
})

adminPagesRouter.get('/admin/commandes', adminAuth, refreshAdminCache, async (c) => {
  return c.html(<AdminCommandesPage />)
})

// ============================================================
// ADMIN PAIEMENTS
// ============================================================

adminPagesRouter.get('/admin/paiements', adminAuth, refreshAdminCache, async (c) => {
  const db = c.env.DB
  let payments: any[] = []
  if (db) {
    try {
      const rows = await db.prepare(
        `SELECT id, client_name, client_phone, client_email, status, total_price, type, notes, created_at, updated_at
        FROM orders
        ORDER BY created_at DESC
        LIMIT 500`
      ).all()
      payments = rows.results || []
    } catch (e) {
      console.error('Admin paiements load:', e)
    }
  }
  const statusFilter = c.req.query('status')
  const filtered = statusFilter ? payments.filter((p: any) => p.status === statusFilter) : payments
  // Calcul des stats depuis les commandes
  const stats = {
    total: payments.length,
    pending: payments.filter((p: any) => p.status === 'en_attente').length,
    completed: payments.filter((p: any) => ['confirme','en_livraison','livre'].includes(p.status)).length,
    failed: payments.filter((p: any) => p.status === 'annule').length,
    revenue: payments.filter((p: any) => ['confirme','en_livraison','livre'].includes(p.status)).reduce((sum: number, p: any) => sum + (p.total_price || 0), 0),
  }
  return c.html(<AdminPaiementsPage payments={filtered} stats={stats} />)
})
