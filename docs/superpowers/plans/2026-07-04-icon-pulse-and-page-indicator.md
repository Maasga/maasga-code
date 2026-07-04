# Icon Pulse Animation and Page Indicator Badge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a continuous, subtle pulse animation to the 3 "Notre Expertise" service card icons, and add a page-name badge in the header that fills the empty nav gap on viewports narrower than 1024px.

**Architecture:** Both are small, independent, additive changes. The icon pulse is a pure CSS `@keyframes` animation applied to existing `<i>` icon glyphs (not their `.tilt-image` parent, to avoid transform conflicts with the existing GSAP tilt engine). The page indicator is a new small label constant plus one conditional `<span>` in the existing header markup in `Layout.tsx`, gated by a Tailwind `lg:hidden` breakpoint so it only shows exactly where the desktop/tablet nav is currently hidden.

**Tech Stack:** Hono JSX (SSR), Tailwind (compiled via `npm run build:css`), plain CSS animations (no GSAP/JS needed for the pulse).

## Global Constraints

- No new npm dependencies, no new CDN scripts.
- The icon pulse must respect `prefers-reduced-motion: reduce` (disable the animation entirely).
- The icon pulse must apply to the `<i>` glyph only, never to the `.tilt-image` wrapper div (which already receives a GSAP `rotateX`/`rotateY` transform on hover from the existing tilt engine — animating `transform` via CSS on the same element would fight the JS-driven transform).
- The page indicator must only affect pages where `activePage` matches a known public-page key; unmatched keys (e.g. admin pages) must render nothing — no `undefined` text, no error.
- After any `src/styles/app.css` edit, run `npm run build:css` before the change is visible in the browser.
- No automated test suite exists in this project — verification is `npx tsc --noEmit` plus direct Playwright/browser checks, not unit tests.
- The dev server's first response after a cold start can take 20-60 seconds; a fresh browser context shows a CGU consent modal that blocks all mouse interaction unless `localStorage` (`maasga_cgu_accepted`, `maasga_cookies_accepted`) is pre-seeded via `page.addInitScript` before `page.goto`.

---

### Task 1: Icon pulse animation on the 3 service card icons

**Files:**
- Modify: `src/styles/app.css` (new `.icon-pulse` rule, inserted after the `.tilt-shine` block at line 352-360)
- Modify: `src/pages/home.tsx` (3 `<i>` tags: lines 197, 219, 238)

**Interfaces:**
- Consumes: nothing (pure CSS + markup, independent of Task 2).
- Produces: nothing further downstream (leaf task).

- [ ] **Step 1: Confirm current CSS insertion point**

Run: `grep -n "MOBILE MENU" src/styles/app.css`
Expected: a match around line 362 (`/* ─── MOBILE MENU ─── */`), immediately preceded by the `.tilt-shine { ... }` block. Use the printed line number if it differs from this plan.

- [ ] **Step 2: Add the `.icon-pulse` CSS rule**

Find:
```css
.tilt-shine {
  position: absolute;
  top: -60%;
  left: -60%;
  width: 220%;
  height: 220%;
  pointer-events: none;
  background: linear-gradient(45deg, transparent 35%, rgba(0,180,216,0.16) 50%, transparent 65%);
}

/* ─── MOBILE MENU ─── */
```

Replace with:
```css
.tilt-shine {
  position: absolute;
  top: -60%;
  left: -60%;
  width: 220%;
  height: 220%;
  pointer-events: none;
  background: linear-gradient(45deg, transparent 35%, rgba(0,180,216,0.16) 50%, transparent 65%);
}

/* ─── Icon pulse (cartes services) ─── */
@keyframes icon-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.12); }
}
.icon-pulse {
  animation: icon-pulse 2.2s ease-in-out infinite;
}
@media (prefers-reduced-motion: reduce) {
  .icon-pulse { animation: none; }
}

/* ─── MOBILE MENU ─── */
```

- [ ] **Step 3: Confirm current markup for the 3 icons**

Run: `grep -n "ph-shopping-cart-simple\|ph-wrench\|ph-chart-line-up" src/pages/home.tsx`
Expected: 4 matches — `ph-shopping-cart-simple` once, `ph-wrench` twice, `ph-chart-line-up` once. If the count or surrounding context differs from Step 4-6 below, stop and report BLOCKED rather than guessing which `ph-wrench` is the decorative watermark vs the real icon.

- [ ] **Step 4: Add `icon-pulse` to the "Vente Premium" icon**

Find (inside the `surface-elevated` card with `tilt-image` containing a gradient background):
```jsx
              <div class="tilt-image w-16 h-16 rounded-2xl flex items-center justify-center text-2xl mb-6 group-hover:rotate-6 transition-transform" style="background:linear-gradient(135deg,var(--accent),var(--accent-cyan)); color:#ffffff;">
                <i class="ph-duotone ph-shopping-cart-simple"></i>
              </div>
```

Replace with:
```jsx
              <div class="tilt-image w-16 h-16 rounded-2xl flex items-center justify-center text-2xl mb-6 group-hover:rotate-6 transition-transform" style="background:linear-gradient(135deg,var(--accent),var(--accent-cyan)); color:#ffffff;">
                <i class="icon-pulse ph-duotone ph-shopping-cart-simple"></i>
              </div>
```

- [ ] **Step 5: Add `icon-pulse` to the "Maintenance" icon (NOT the decorative watermark)**

Find (there are two `ph-wrench` icons in this card — the decorative background watermark, and the real foreground icon inside `.tilt-image`; only edit the second one):
```jsx
              <div class="absolute top-0 right-0 p-4 text-8xl" style="opacity:0.08; color:#ffffff;">
                <i class="ph-duotone ph-wrench"></i>
              </div>
              <div class="tilt-image w-16 h-16 rounded-2xl flex items-center justify-center text-2xl mb-6" style="background:rgba(202,240,248,0.14); color:var(--ice);">
                <i class="ph-duotone ph-wrench"></i>
              </div>
```

Replace with:
```jsx
              <div class="absolute top-0 right-0 p-4 text-8xl" style="opacity:0.08; color:#ffffff;">
                <i class="ph-duotone ph-wrench"></i>
              </div>
              <div class="tilt-image w-16 h-16 rounded-2xl flex items-center justify-center text-2xl mb-6" style="background:rgba(202,240,248,0.14); color:var(--ice);">
                <i class="icon-pulse ph-duotone ph-wrench"></i>
              </div>
```

Note: the decorative watermark block (`opacity:0.08`, `text-8xl`, `absolute top-0 right-0`) is left completely untouched — it must never get `icon-pulse`.

- [ ] **Step 6: Add `icon-pulse` to the "Suivi de Performance" icon**

Find:
```jsx
              <div class="tilt-image w-16 h-16 rounded-2xl flex items-center justify-center text-2xl mb-6 group-hover:rotate-6 transition-transform" style="background:linear-gradient(135deg,var(--accent),var(--accent-cyan)); color:#ffffff;">
                <i class="ph-duotone ph-chart-line-up"></i>
              </div>
```

Replace with:
```jsx
              <div class="tilt-image w-16 h-16 rounded-2xl flex items-center justify-center text-2xl mb-6 group-hover:rotate-6 transition-transform" style="background:linear-gradient(135deg,var(--accent),var(--accent-cyan)); color:#ffffff;">
                <i class="icon-pulse ph-duotone ph-chart-line-up"></i>
              </div>
```

- [ ] **Step 7: Rebuild CSS and typecheck**

Run: `npm run build:css`
Expected: exits 0.

Run: `npx tsc --noEmit` (if a shell hook intercepts this command, use `npx -y -p typescript tsc --noEmit` instead)
Expected: `No errors found`.

- [ ] **Step 8: Verify the compiled CSS contains the new rule**

Run: `grep -c "icon-pulse" public/static/tailwind.css`
Expected: `1` or more.

- [ ] **Step 9: Verify visually with Playwright**

Build and serve the production bundle (`npm run build` then `npm run dev:sandbox`, which serves `dist/` via `wrangler pages dev --port 3000`, binding to all interfaces so `http://127.0.0.1:3000/` works) — or use the Vite dev server on `http://[::1]:5173/` if already running and responsive. Then:

```javascript
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.addInitScript(() => {
    localStorage.setItem('maasga_cgu_accepted', 'true');
    localStorage.setItem('maasga_cookies_accepted', 'true');
  });
  await page.goto('http://127.0.0.1:3000/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(2500);
  const services = await page.locator('#services [data-tilt] i.icon-pulse').count();
  console.log('icon-pulse elements found in #services:', services);
  const watermarkUntouched = await page.locator('#services .absolute.top-0.right-0 i.icon-pulse').count();
  console.log('icon-pulse wrongly applied to the decorative watermark (must be 0):', watermarkUntouched);

  // Sample two animation frames of the first pulsing icon to confirm it's actually animating
  const icon = page.locator('#services i.icon-pulse').first();
  const t1 = await icon.evaluate(el => getComputedStyle(el).transform);
  await page.waitForTimeout(1100); // half the 2.2s cycle
  const t2 = await icon.evaluate(el => getComputedStyle(el).transform);
  console.log('transform at t=0:', t1, '| transform at t=1.1s:', t2, '| differ:', t1 !== t2);
})();
```
Expected: `icon-pulse elements found in #services: 3`, `icon-pulse wrongly applied to the decorative watermark (must be 0): 0`, and `differ: true` (proving the animation is actually running, not stuck at a static scale).

- [ ] **Step 10: Commit**

```bash
git add src/styles/app.css src/pages/home.tsx public/static/tailwind.css
git commit -m "feat: add continuous pulse animation to service card icons"
```

---

### Task 2: Page indicator badge in the header nav gap

**Files:**
- Modify: `src/components/Layout.tsx` (new `PAGE_LABELS` constant before the `Layout` component, and one new `<span>` inserted around line 258-260, between the closing `</nav>` of the tablet nav and the `{/* Actions */}` div)

**Interfaces:**
- Consumes: the existing `activePage` prop already passed to `Layout` by every page (no changes needed to any page file).
- Produces: nothing further downstream (leaf task).

- [ ] **Step 1: Confirm current insertion point**

Run: `grep -n "Actions" src/components/Layout.tsx | head -3`
Expected: a match around line 260 (`{/* Actions */}`), immediately preceded by the closing `</nav>` of the "Nav Tablet" block. Use the printed line number if it differs.

- [ ] **Step 2: Add the `PAGE_LABELS` constant**

Find (the very start of the file, before the `AnimatedIcon` export):
```jsx
import { CGUModal, initCGUModal } from './CGUModal'

export const AnimatedIcon = ({ src, trigger = "hover", size = 20, colors = "primary:#0077b6,secondary:#caf0f8", class: className = "" }: { src: string, trigger?: string, size?: number, colors?: string, class?: string }) => {
```

Replace with:
```jsx
import { CGUModal, initCGUModal } from './CGUModal'

const PAGE_LABELS: Record<string, string> = {
  home: "Accueil",
  simulateur: "Simulateur",
  catalogue: "Catalogue",
  maintenance: "Maintenance",
  rdv: "Rendez-vous",
  avis: "Avis",
  apropos: "À propos",
  contact: "Contact",
  client: "Espace client",
  realisations: "Réalisations",
}

export const AnimatedIcon = ({ src, trigger = "hover", size = 20, colors = "primary:#0077b6,secondary:#caf0f8", class: className = "" }: { src: string, trigger?: string, size?: number, colors?: string, class?: string }) => {
```

- [ ] **Step 3: Add the badge between the tablet nav and the Actions block**

Find (the closing of the "Nav Tablet" `<nav>` block, immediately followed by the Actions comment):
```jsx
              </div>
            </nav>

            {/* Actions */}
```

Replace with:
```jsx
              </div>
            </nav>

            {/* Indicateur de page — visible uniquement quand la nav desktop/tablette est masquée (<1024px) */}
            {activePage && PAGE_LABELS[activePage] && (
              <span class="eyebrow lg:hidden">{PAGE_LABELS[activePage]}</span>
            )}

            {/* Actions */}
```

Note: if this exact 3-line `</div>\n</nav>\n\n{/* Actions */}` sequence doesn't match verbatim (e.g. different blank-line count), locate the "Nav Tablet" `<nav>` block's closing tag by searching for the `nav-more-dropdown` wrapper `</div>` that immediately precedes it (the tablet nav's "Plus" dropdown, closed just before the nav's own closing `</nav>`), and insert the new block between that `</nav>` and the `{/* Actions */}` comment. Report BLOCKED if you can't confidently identify the exact spot.

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit` (or `npx -y -p typescript tsc --noEmit` if a shell hook intercepts it)
Expected: `No errors found`.

- [ ] **Step 5: Verify with Playwright — badge appears only below 1024px, on public pages with a known label**

```javascript
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.addInitScript(() => {
    localStorage.setItem('maasga_cgu_accepted', 'true');
    localStorage.setItem('maasga_cookies_accepted', 'true');
  });

  // Narrow viewport (nav hidden, badge should show)
  await page.setViewportSize({ width: 800, height: 900 });
  await page.goto('http://127.0.0.1:3000/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(2000);
  const narrowText = await page.locator('header .eyebrow.lg\\:hidden').first().textContent();
  const narrowVisible = await page.locator('header .eyebrow.lg\\:hidden').first().isVisible();
  console.log('narrow viewport (800px) — badge text:', narrowText, '| visible:', narrowVisible);

  // Wide viewport (nav visible, badge should be hidden by lg:hidden)
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(500);
  const wideVisible = await page.locator('header .eyebrow.lg\\:hidden').first().isVisible();
  console.log('wide viewport (1440px) — badge visible (must be false):', wideVisible);

  await page.goto('http://127.0.0.1:3000/catalogue', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.setViewportSize({ width: 800, height: 900 });
  await page.waitForTimeout(2000);
  const catalogueText = await page.locator('header .eyebrow.lg\\:hidden').first().textContent();
  console.log('catalogue page (800px) — badge text:', catalogueText);

  await browser.close();
})();
```
Expected: `narrow viewport (800px) — badge text: Accueil | visible: true`, `wide viewport (1440px) — badge visible (must be false): false`, `catalogue page (800px) — badge text: Catalogue`.

- [ ] **Step 6: Commit**

```bash
git add src/components/Layout.tsx
git commit -m "feat: add current-page indicator badge to header nav gap"
```
