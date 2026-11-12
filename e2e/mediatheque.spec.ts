import { createHmac } from 'node:crypto'
import { execSync } from 'node:child_process'
import { readFileSync, existsSync } from 'node:fs'
import { test, expect, gotoReady } from './fixtures'

/**
 * Médiathèque : affecter en une fois une vignette + des images annexes à un produit.
 * Les images de test pointent vers des fichiers statiques (pas d'envoi R2) et
 * l'état du produit ciblé est restauré à la fin.
 */
function readDevVar(name: string): string | null {
  if (!existsSync('.dev.vars')) return null
  const line = readFileSync('.dev.vars', 'utf8').split(/\r?\n/).find((l) => l.startsWith(name + '='))
  return line ? line.slice(name.length + 1).trim().replace(/^["']|["']$/g, '') : null
}

function d1(sql: string): any[] {
  const out = execSync(`npx wrangler d1 execute maasga_db --local --json --command "${sql.replace(/"/g, '\\"')}"`,
    { stdio: ['ignore', 'pipe', 'ignore'] }).toString()
  return JSON.parse(out)[0]?.results ?? []
}

const secret = readDevVar('ADMIN_SECRET')
const LABEL = 'e2e-mediatheque'

test.describe('médiathèque — affectation vignette + annexes', () => {
  test.skip(!secret, 'ADMIN_SECRET absent de .dev.vars')
  test.skip(({ isMobile }) => isMobile, 'back-office testé sur desktop')

  let epoch = '1'
  let product: { id: number; name: string; imageUrl: string; image_url: string; media_urls: string } | null = null

  test.beforeAll(async () => {
    test.setTimeout(240_000)
    try { epoch = String(parseInt(d1("SELECT value FROM admin_settings WHERE key='admin_token_epoch'")[0]?.value ?? '1', 10) || 1) } catch {}
    product = d1('SELECT id, name, imageUrl, image_url, media_urls FROM products ORDER BY id LIMIT 1')[0] ?? null
    d1(`DELETE FROM brand_media_library WHERE label LIKE '${LABEL}%'`)
    // Une seule ligne : la commande passe par le shell (cmd.exe sous Windows)
    d1(`INSERT INTO brand_media_library (brand, url, delete_url, label) VALUES ('E2E', '/static/icon-192.png', '', '${LABEL}-1'), ('E2E', '/static/icon-512.png', '', '${LABEL}-2'), ('E2E', '/static/icon-192.png?b', '', '${LABEL}-3')`)
  })

  test.afterAll(async () => {
    test.setTimeout(240_000)
    d1(`DELETE FROM brand_media_library WHERE label LIKE '${LABEL}%'`)
    if (product) {
      const q = (v: any) => (v === null || v === undefined ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`)
      d1(`UPDATE products SET imageUrl = ${q(product.imageUrl)}, image_url = ${q(product.image_url)}, media_urls = ${q(product.media_urls)} WHERE id = ${product.id}`)
    }
  })

  test.beforeEach(async ({ context, baseURL }) => {
    const payload = `admin_${epoch}_${Date.now()}`
    const sig = createHmac('sha256', secret!).update(payload).digest('hex')
    await context.addCookies([{ name: 'maasga_admin', value: `${payload}.${sig}`, url: baseURL! }])
  })

  test('cocher 3 images, choisir le produit et la vignette, affecter', async ({ page, issues }) => {
    test.setTimeout(120_000)
    expect(product, 'au moins un produit en base locale').not.toBeNull()
    await gotoReady(page, '/admin/produits')
    await page.evaluate(() => { try { sessionStorage.removeItem('maasga_mediatheque_open') } catch {} })

    // Ouvrir la médiathèque et filtrer sur la marque de test
    await page.locator('#mediatheque-toggle').click()
    await page.evaluate(() => (window as any).filterMediatheque('E2E'))
    const tiles = page.locator('#mediatheque-grid [data-media-id]')
    await expect(tiles).toHaveCount(3)

    // Bouton désactivé tant que rien n'est coché
    const assignBtn = page.locator('#btn-affecter-selection')
    await expect(assignBtn).toBeDisabled()
    for (let i = 0; i < 3; i++) await tiles.nth(i).click()
    await expect(page.locator('#mediatheque-grid [aria-checked="true"]')).toHaveCount(3)
    await expect(page.locator('#mediatheque-selection-count')).toContainText('3 images cochées')
    await page.screenshot({ path: 'test-results/mediatheque-grille.png', fullPage: false })
    await assignBtn.click()

    // Fenêtre d'affectation : produit à choisir, n° 1 proposée comme vignette
    const modal = page.locator('#assign-media-modal')
    await expect(modal).toBeVisible()
    await expect(page.locator('#assign-confirm-btn')).toBeDisabled()
    await expect(page.locator('#assign-summary')).toContainText('cocher le produit')
    await page.locator('#assign-product-brand').selectOption('')
    await page.locator('#assign-product-search').fill(product!.name.slice(0, 12))
    await page.locator('#assign-product-list label', { hasText: product!.name }).first().locator('input').check()

    const cards = page.locator('#assign-images > div')
    await expect(cards).toHaveCount(3)
    await expect(cards.nth(0)).toContainText('Vignette')
    // Choisir la 2e image comme vignette
    await cards.nth(1).getByRole('button', { name: 'Choisir comme vignette' }).click()
    await expect(cards.nth(1)).toContainText('Vignette')
    await expect(cards.nth(0)).toContainText('Annexe')
    await expect(page.locator('#assign-summary')).toContainText('1 vignette')
    await expect(page.locator('#assign-summary')).toContainText('2 images annexes')
    await page.screenshot({ path: 'test-results/mediatheque-affectation.png', fullPage: false })

    const [resp] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/admin/media/brand/assign')),
      page.locator('#assign-confirm-btn').click(),
    ])
    const body = await resp.json()
    expect(body.success, JSON.stringify(body)).toBe(true)
    expect(body.main).toBe(1)
    expect(body.gallery).toBe(2)

    const row = d1(`SELECT imageUrl, image_url, media_urls FROM products WHERE id = ${product!.id}`)[0]
    expect(row.imageUrl).toBe('/static/icon-512.png')
    expect(row.image_url).toBe('/static/icon-512.png')
    const urls = JSON.parse(row.media_urls || '[]').map((g: any) => (typeof g === 'string' ? g : g.url))
    expect(urls).toContain('/static/icon-192.png')
    expect(urls).toContain('/static/icon-192.png?b')
    expect(urls).not.toContain('/static/icon-512.png')

    expect(issues.errors.filter((e) => !/favicon/.test(e)), issues.errors.join('\n')).toEqual([])
  })

  test('depuis une ligne produit : le produit est pré-choisi', async ({ page, issues }) => {
    await gotoReady(page, '/admin/produits')
    await page.locator(`button[onclick="openAssignForProduct(${product!.id})"]`).first().click()
    await expect(page.locator('#assign-media-modal')).toBeVisible()
    await expect(page.locator('#assign-product-list input:checked')).toHaveCount(1)
    await expect(page.locator('#assign-picker')).toBeVisible()
    await page.locator('#assign-picker-brand').selectOption('E2E')
    await expect(page.locator('#assign-picker-grid button')).toHaveCount(3)
    await page.locator('#assign-picker-grid button').first().click()
    await expect(page.locator('#assign-images > div')).toHaveCount(1)
    await expect(page.locator('#assign-confirm-btn')).toBeEnabled()
    await page.keyboard.press('Escape')
    await expect(page.locator('#assign-media-modal')).toBeHidden()
    expect(issues.errors.filter((e) => !/favicon/.test(e)), issues.errors.join('\n')).toEqual([])
  })
})
