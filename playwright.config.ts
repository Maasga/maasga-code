import { defineConfig, devices } from '@playwright/test'

/**
 * Tests E2E — tournent contre le Worker réel (wrangler pages dev + D1 locale).
 *   npm run build && npm run test:e2e
 * Le serveur est démarré automatiquement s'il ne tourne pas déjà sur :3000.
 */
const PORT = 3000

export default defineConfig({
  testDir: './e2e',
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    // Les animations doivent tourner pendant les tests (headless = reduce par défaut)
    reducedMotion: 'no-preference',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: `npx wrangler pages dev dist --ip 127.0.0.1 --port ${PORT}`,
    url: `http://127.0.0.1:${PORT}/robots.txt`,
    reuseExistingServer: true,
    timeout: 120_000,
  },
})
