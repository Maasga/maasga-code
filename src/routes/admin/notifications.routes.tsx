// Notifications et journal d’audit
// (module généré par découpage de l'ancien src/routes/admin/index.tsx, 5 600 lignes)
import { Hono } from 'hono'
import type { HonoEnv } from '../../types'
import {
  AdminAuditLogPage,
  AdminNotificationsPage
} from '../../pages/admin'
import {
  ensureNotificationsTable
} from '../../utils/notifications'
import { adminAuth, refreshAdminCache } from './shared'

export const adminNotificationsRouter = new Hono<HonoEnv>()

// ============================================================
// ADMIN NOTIFICATIONS API
// ============================================================
adminNotificationsRouter.get('/api/admin/notifications', adminAuth, async (c) => {
  const db = c.env.DB
  if (!db) return c.json({ notifications: [] })
  try {
    await ensureNotificationsTable(db)
    const result = await db.prepare(
      'SELECT * FROM admin_notifications ORDER BY created_at DESC LIMIT 50'
    ).all()
    return c.json({ notifications: result.results || [] })
  } catch(e) {
    return c.json({ notifications: [] })
  }
})

adminNotificationsRouter.post('/api/admin/notifications/mark-read', adminAuth, async (c) => {
  const db = c.env.DB
  if (!db) return c.json({ ok: true })
  try {
    await db.prepare('UPDATE admin_notifications SET read = 1 WHERE read = 0').run()
    return c.json({ ok: true })
  } catch(e) {
    return c.json({ ok: false })
  }
})

adminNotificationsRouter.get('/api/admin/notifications/count', adminAuth, async (c) => {
  const db = c.env.DB
  if (!db) return c.json({ count: 0 })
  try {
    await ensureNotificationsTable(db)
    const row = await db.prepare('SELECT COUNT(*) as count FROM admin_notifications WHERE read = 0').first() as any
    return c.json({ count: row?.count || 0 })
  } catch(e) {
    return c.json({ count: 0 })
  }
})

// AUDIT LOG — Admin page
// ============================================================
adminNotificationsRouter.get('/admin/audit-log', adminAuth, refreshAdminCache, async (c) => {
  const db = c.env.DB
  let logs: any[] = []
  if (db) {
    try {
      logs = (await db.prepare('SELECT * FROM user_activity_log ORDER BY created_at DESC LIMIT 500').all())?.results || []
    } catch(_) {}
  }
  return c.html(<AdminAuditLogPage logs={logs} />)
})

adminNotificationsRouter.get('/api/admin/audit-log', adminAuth, async (c) => {
  const db = c.env.DB
  if (!db) return c.json([])
  try {
    const rows = (await db.prepare('SELECT * FROM user_activity_log ORDER BY created_at DESC LIMIT 500').all())?.results || []
    return c.json(rows)
  } catch(_) { return c.json([]) }
})

// NOTIFICATIONS — Admin page
// ============================================================
adminNotificationsRouter.get('/admin/notifications', adminAuth, refreshAdminCache, async (c) => {
  const db = c.env.DB
  let notifications: any[] = []
  if (db) {
    try {
      await ensureNotificationsTable(db)
      notifications = (await db.prepare('SELECT * FROM admin_notifications ORDER BY created_at DESC LIMIT 200').all())?.results || []
    } catch(_) {}
  }
  return c.html(<AdminNotificationsPage notifications={notifications} />)
})
