import { test, expect, gotoReady } from './fixtures'

const PUBLIC_PAGES = [
  '/', '/catalogue', '/simulateur', '/rendez-vous', '/avis',
  '/a-propos', '/contact', '/realisations', '/espace-client',
  '/mentions-legales', '/politique-de-confidentialite',
]

test.describe('pages publiques', () => {
  for (const path of PUBLIC_PAGES) {
    test(`${path} se charge sans erreur JS ni violation CSP`, async ({ page, issues }) => {
      const res = await gotoReady(page, path)
      expect(res?.status(), 'statut HTTP').toBeLessThan(400)
      await expect(page.locator('#main-content')).toBeVisible()
      // Le JS global (site.js) doit être chargé et initialisé
      await expect.poll(() => page.evaluate(() => typeof (window as any).showToast)).toBe('function')
      expect(issues.errors, issues.errors.join('\n')).toEqual([])
    })
  }
})

test('aucun texte mal encodé (mojibake) sur les pages principales', async ({ page }) => {
  for (const path of ['/', '/mentions-legales', '/politique-de-confidentialite']) {
    await gotoReady(page, path)
    const text = await page.locator('body').innerText()
    expect(text, path).not.toMatch(/Ã[ -¿ ]|â€|Â©/)
  }
})

test('navigation PJAX : seul <main> est remplacé, pas de rechargement complet', async ({ page, issues, isMobile }) => {
  test.skip(isMobile, 'la nav desktop est masquée sur mobile')
  await gotoReady(page, '/')
  await page.evaluate(() => ((window as any).__e2eMarker = 'still-here'))
  await page.locator('header nav a[href="/catalogue"]:visible').first().click()
  await expect(page).toHaveURL(/\/catalogue$/)
  await expect(page.locator('#main-content')).toBeVisible()
  expect(await page.evaluate(() => (window as any).__e2eMarker)).toBe('still-here')
  // Lien actif synchronisé
  await expect(page.locator('header nav a[href="/catalogue"][aria-current="page"]:visible').first()).toBeVisible()
  // Retour arrière
  await page.goBack()
  await expect(page).toHaveURL(/\/$/)
  expect(issues.errors, issues.errors.join('\n')).toEqual([])
})

test('les fonctions globales appelées par onclick existent (widget WhatsApp)', async ({ page }) => {
  await gotoReady(page, '/contact')
  const fns = await page.evaluate(() => ['toggleWaPanel', 'closeWaPanel', 'openWa', 'handleCookieConsent']
    .filter((n) => typeof (window as any)[n] !== 'function'))
  expect(fns).toEqual([])
  // desktop : bouton flottant ; mobile : entrée « WhatsApp » de la barre d'actions
  const trigger = page.locator('#wa-btn:visible, nav.mobile-action-bar button:visible').first()
  await trigger.click()
  await expect(page.locator('#wa-panel')).toBeVisible()
})

test('les assets statiques sont versionnés', async ({ page }) => {
  await gotoReady(page, '/')
  const urls = await page.evaluate(() => [
    ...Array.from(document.querySelectorAll('link[rel=stylesheet]')).map((l) => (l as HTMLLinkElement).getAttribute('href') || ''),
    ...Array.from(document.querySelectorAll('script[src]')).map((s) => s.getAttribute('src') || ''),
  ].filter((u) => u.startsWith('/static/')))
  expect(urls.length).toBeGreaterThan(0)
  for (const u of urls) expect(u, u).toMatch(/\?v=[a-f0-9]{10}$/)
})

test('404 renvoie la page dédiée', async ({ page }) => {
  const res = await page.goto('/cette-page-n-existe-pas')
  expect(res?.status()).toBe(404)
  await expect(page.getByText('Page introuvable')).toBeVisible()
})
