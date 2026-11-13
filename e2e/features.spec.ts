import { test, expect, gotoReady } from './fixtures'

test.describe('barre d’actions mobile', () => {
  test('visible sur mobile, masquée sur desktop, ne recouvre pas les CTA', async ({ page, isMobile }) => {
    await gotoReady(page, '/')
    const bar = page.locator('nav.mobile-action-bar')
    if (!isMobile) { await expect(bar).toBeHidden(); return }
    await expect(bar).toBeVisible()
    await expect(bar.getByRole('link', { name: 'Appeler' })).toHaveAttribute('href', /^tel:\+226/)
    await expect(bar.getByRole('link', { name: 'Rendez-vous' })).toHaveAttribute('href', '/rendez-vous')
    // l'ancien bouton flottant WhatsApp recouvrait « Demander un devis »
    await expect(page.locator('#wa-btn')).toBeHidden()
    await bar.getByRole('button', { name: 'WhatsApp' }).click()
    await expect(page.locator('#wa-panel')).toBeVisible()
  })
})

test('estimateur de consommation : calcule et réagit aux réglages', async ({ page }) => {
  await gotoReady(page, '/catalogue/1')
  const month = page.locator('#ee-month')
  await expect(month).not.toHaveText('—')
  const at8h = Number((await month.innerText()).replace(/\D/g, ''))
  expect(at8h).toBeGreaterThan(0)
  await page.locator('#ee-hours').fill('16')
  await expect.poll(async () => Number((await month.innerText()).replace(/\D/g, ''))).toBeGreaterThan(at8h * 1.9)
})

test('fiche produit : données structurées Product + fil d’Ariane', async ({ page }) => {
  await gotoReady(page, '/catalogue/1')
  const raw = await page.locator('script[type="application/ld+json"]').first().textContent()
  const data = JSON.parse(raw || '[]')
  const product = data.find((d: any) => d['@type'] === 'Product')
  expect(product.offers.priceCurrency).toBe('XOF')
  expect(Number(product.offers.price)).toBeGreaterThan(0)
  expect(data.some((d: any) => d['@type'] === 'BreadcrumbList')).toBe(true)
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'product')
})

test('sitemap : inclut les fiches produits, exclut les pages privées', async ({ request }) => {
  const xml = await (await request.get('/sitemap.xml')).text()
  expect(xml).toMatch(/\/catalogue\/\d+<\/loc>/)
  expect(xml).not.toContain('/contrat-maintenance<')
  expect(xml).not.toContain('<lastmod>')
})

test('PWA : la page hors connexion prend le relais', async ({ page, context }) => {
  await gotoReady(page, '/')
  await page.evaluate(() => navigator.serviceWorker?.ready)
  await page.reload() // la page est désormais contrôlée par le service worker
  await page.evaluate(() => navigator.serviceWorker?.ready)
  await context.setOffline(true)
  await page.goto('/une-page-jamais-visitee').catch(() => {})
  await expect(page.getByRole('heading', { name: 'Vous êtes hors connexion' })).toBeVisible()
  await context.setOffline(false)
})

test('boîte d’envoi : un message rédigé hors connexion est gardé localement', async ({ page, context }) => {
  await gotoReady(page, '/contact')
  await context.setOffline(true)
  await page.evaluate(() => {
    const f = document.querySelector('form[data-offline-queue]') as HTMLFormElement
    ;(f.querySelector('[name="name"]') as HTMLInputElement).value = 'Test hors ligne'
    ;(f.querySelector('[name="message"]') as HTMLTextAreaElement).value = 'Bonjour, message rédigé sans réseau.'
    f.requestSubmit()
  })
  const outbox = await page.evaluate(() => JSON.parse(localStorage.getItem('maasga_outbox') || '[]'))
  expect(outbox).toHaveLength(1)
  expect(outbox[0].action).toBe('/api/contact')
  // on vide la file pour ne pas réellement l'envoyer au retour du réseau
  await page.evaluate(() => localStorage.removeItem('maasga_outbox'))
  await context.setOffline(false)
})
