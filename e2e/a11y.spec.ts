import { AxeBuilder } from '@axe-core/playwright'
import { test, expect, gotoReady } from './fixtures'

/**
 * Accessibilité WCAG 2.2 AA (axe-core). Toute violation « critical » ou « serious »
 * (contraste, libellés, noms de boutons, taille des cibles…) fait échouer la CI.
 */
const PAGES = ['/', '/catalogue', '/catalogue/1', '/simulateur', '/rendez-vous', '/avis', '/a-propos', '/contact', '/realisations', '/espace-client', '/mentions-legales']

for (const path of PAGES) {
  test(`a11y ${path}`, async ({ page }) => {
    await gotoReady(page, path)
    // les éléments à révélation au scroll doivent être dans leur état final
    await page.evaluate(() => document.querySelectorAll('[data-reveal],[data-stagger],[data-hero],.reveal,.reveal-left,.reveal-right')
      .forEach((e) => e.classList.add('in', 'visible')))
    await page.waitForTimeout(400)
    const { violations } = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze()
    const blocking = violations.filter((v) => v.impact === 'critical' || v.impact === 'serious')
    const report = blocking.map((v) => `${v.impact} ${v.id} (${v.nodes.length}) : ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`).join('\n')
    expect(blocking, report).toEqual([])
  })
}
