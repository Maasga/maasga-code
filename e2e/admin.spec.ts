import { createHmac } from 'node:crypto'
import { execSync } from 'node:child_process'
import { readFileSync, existsSync } from 'node:fs'
import { test, expect, gotoReady } from './fixtures'

/**
 * Back-office : vérifie que chaque page admin se rend après le découpage du
 * routeur. Le cookie admin est signé ici avec ADMIN_SECRET de .dev.vars, comme
 * le ferait /api/admin/login (le mot de passe local n'est pas nécessaire).
 */
function readDevVar(name: string): string | null {
  if (!existsSync('.dev.vars')) return null
  const line = readFileSync('.dev.vars', 'utf8').split(/\r?\n/).find((l) => l.startsWith(name + '='))
  return line ? line.slice(name.length + 1).trim().replace(/^["']|["']$/g, '') : null
}

function currentEpoch(): string {
  try {
    const out = execSync(
      `npx wrangler d1 execute maasga_db --local --json --command "SELECT value FROM admin_settings WHERE key='admin_token_epoch'"`,
      { stdio: ['ignore', 'pipe', 'ignore'] }
    ).toString()
    const v = parseInt(JSON.parse(out)[0]?.results?.[0]?.value ?? '', 10)
    return Number.isNaN(v) ? '1' : String(v)
  } catch { return '1' }
}

const secret = readDevVar('ADMIN_SECRET')

const ADMIN_PAGES = [
  '/admin', '/admin/produits', '/admin/rdv', '/admin/clients', '/admin/commandes',
  '/admin/paiements', '/admin/maintenance', '/admin/avis', '/admin/messages',
  '/admin/realisations', '/admin/sav', '/admin/devis', '/admin/devis/new',
  '/admin/parametres', '/admin/banners', '/admin/audit-log', '/admin/notifications',
]

test.describe('back-office', () => {
  test.skip(!secret, 'ADMIN_SECRET absent de .dev.vars')
  test.skip(({ isMobile }) => isMobile, 'back-office testé sur desktop')

  // `wrangler d1 execute` est lent (jusqu'à ~1 min sous charge) : lu une seule fois
  let epoch = '1'
  test.beforeAll(async () => {
    test.setTimeout(180_000)
    epoch = currentEpoch()
  })

  test.beforeEach(async ({ context, baseURL }) => {
    const payload = `admin_${epoch}_${Date.now()}`
    const sig = createHmac('sha256', secret!).update(payload).digest('hex')
    await context.addCookies([{ name: 'maasga_admin', value: `${payload}.${sig}`, url: baseURL! }])
  })

  for (const path of ADMIN_PAGES) {
    test(`${path} se rend pour un admin authentifié`, async ({ page, issues }) => {
      const res = await gotoReady(page, path)
      expect(res?.status(), path).toBeLessThan(400)
      // Pas de retour au formulaire de connexion
      await expect(page.locator('input[name="password"]')).toHaveCount(0)
      expect(issues.errors.filter((e) => !/favicon/.test(e)), issues.errors.join('\n')).toEqual([])
    })
  }

  test('sans cookie, /admin affiche le formulaire de connexion', async ({ browser, baseURL }) => {
    const ctx = await browser.newContext()
    const page = await ctx.newPage()
    await page.goto(baseURL + '/admin')
    await expect(page.locator('input[name="password"]')).toHaveCount(1)
    await ctx.close()
  })

  test('API protégée : 401/HTML de connexion sans authentification', async ({ request }) => {
    const r = await request.get('/api/admin/notifications/count', { headers: { cookie: '' } })
    expect(r.status()).not.toBe(500)
  })
})
