import { test as base, expect, type Page } from '@playwright/test'

/** Erreurs JS / violations CSP collectées pendant un test. */
export type PageIssues = { errors: string[] }

// Bruit externe toléré (réseau CDN / analytics indisponible en local)
const IGNORED = [/googletagmanager|google-analytics|gtag/i, /net::ERR_/i, /Failed to load resource/i]

export const test = base.extend<{ issues: PageIssues }>({
  page: async ({ page }, use) => {
    // Le modal CGU bloque toute interaction au premier chargement
    await page.addInitScript(() => {
      try {
        localStorage.setItem('maasga_cgu_accepted', 'true')
        localStorage.setItem('maasga_cookies_accepted', 'true')
        sessionStorage.setItem('maasga_loaded', '1')
      } catch {}
    })
    await use(page)
  },
  issues: async ({ page }, use) => {
    const issues: PageIssues = { errors: [] }
    page.on('pageerror', (e) => issues.errors.push(`pageerror: ${e.message}`))
    page.on('console', (m) => {
      if (m.type() !== 'error') return
      const t = m.text()
      if (IGNORED.some((r) => r.test(t))) return
      issues.errors.push(`console: ${t}`)
    })
    await use(issues)
  },
})

export { expect }

export async function gotoReady(page: Page, path: string) {
  const res = await page.goto(path, { waitUntil: 'domcontentloaded' })
  await page.waitForLoadState('load')
  return res
}
