import { describe, it, expect, vi } from 'vitest'

// On court-circuite l'auth Firebase (testée à part) pour tester le routage seul.
vi.mock('../services/auth.service', async (orig) => ({
  ...(await orig<typeof import('../services/auth.service')>()),
  mobileAdminAuth: async (_c: any, next: any) => next(),
}))

const { mobileAdminRouter } = await import('../routes/api-mobile/admin.routes')

// D1 factice : toute requête échoue → un handler « stats » répond 500,
// alors qu'un handler « /:id » répondrait 400 « ID invalide » avant même la DB.
const env = { DB: { prepare() { throw new Error('no db in test') } } } as any

const STATIC_PATHS = [
  '/admin/orders/stats',
  '/admin/rdv/calendar',
  '/admin/payments/stats',
  '/admin/devis/stats',
  '/admin/messages/stats',
  '/admin/sav/stats',
  '/admin/notifications/stats',
  '/admin/realisations/stats',
]

describe('Routes admin mobile : les chemins statiques ne sont pas capturés par /:id', () => {
  for (const path of STATIC_PATHS) {
    it(`GET ${path} atteint son propre handler`, async () => {
      const res = await mobileAdminRouter.request(path, {}, env)
      const body = await res.json().catch(() => ({})) as any
      expect(body.error).not.toBe('ID invalide')
      expect(res.status).not.toBe(400)
    })
  }

  it('GET /admin/orders/abc (id non numérique) ne matche aucun handler détail', async () => {
    const res = await mobileAdminRouter.request('/admin/orders/abc', {}, env)
    expect(res.status).toBe(404)
  })
})
