# Card Hover Animations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unify the hover treatment (shadow, easing) across `.surface-elevated` and `.glass-card`/`.hover-lift`, and extend the existing 3D tilt effect (currently home-page-only) to every product card on the site via the shared GSAP declarative engine.

**Architecture:** Pure CSS tuning in `src/styles/app.css` for the shadow/easing unification. The tilt logic moves from a page-specific inline `<script>` in `home.tsx` into the existing global `initGsap()` function in `Layout.tsx` (same pattern already used there for `data-parallax` and `.magnetic`), so any page can opt in by adding `data-tilt` to an element with no extra script tag. No new dependencies — GSAP is already loaded site-wide.

**Tech Stack:** Hono JSX (SSR, no client hydration), Tailwind (compiled via `npm run build:css`), GSAP 3.13.0 (loaded via CDN in `Layout.tsx`), vanilla JS in `dangerouslySetInnerHTML` blocks.

## Global Constraints

- No new npm dependencies — everything must load via the CDNs already whitelisted in the CSP (`cdnjs.cloudflare.com`, `cdn.jsdelivr.net`).
- Tilt effect must stay disabled on touch devices — guard with `window.matchMedia('(hover: none)').matches`.
- Cards with `opacity-60` (unavailable/out-of-stock products in the catalogue) must NOT get `data-tilt` or `hover-lift` — matches current disabled-card behavior.
- After any `src/styles/app.css` edit, `npm run build:css` must be run before the change is visible in the browser (`npm run dev` does not compile Tailwind).
- No automated test suite exists in this project (confirmed via `CLAUDE.md` — only `npm run dev`/`build`/`deploy` scripts). Verification steps in this plan use direct browser inspection (Playwright script or DevTools), not unit tests.

---

### Task 1: Unify hover shadow and easing in `app.css`

**Files:**
- Modify: `src/styles/app.css:121-132` (`.surface-elevated`, `.surface-elevated:hover`)
- Modify: `src/styles/app.css:166-176` (`.glass-card`, `.glass-card:hover`)
- Modify: `src/styles/app.css:340-341` (`.hover-lift`, `.hover-lift:hover`)

**Interfaces:**
- Consumes: nothing (pure CSS, no dependency on other tasks)
- Produces: a shared visual contract — any element with `.surface-elevated` or `.glass-card` now has the same hover shadow color/easing. Task 3 relies on this being in place before adding `data-tilt` to product cards, so the combined effect (tilt + glow) looks consistent everywhere.

- [ ] **Step 1: Read current state to confirm line numbers before editing**

Run: `grep -n "surface-elevated\|glass-card\|hover-lift" "src/styles/app.css" | head -30`
Expected: line numbers matching the ranges above (they may have shifted slightly since this plan was written — use the printed line numbers, not the ones in this plan, if they differ).

- [ ] **Step 2: Edit `.surface-elevated` and `.surface-elevated:hover`**

Replace:
```css
.surface-elevated {
  background: var(--bg-card);
  border: 1px solid var(--slate-200);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  transition: transform 0.45s var(--ease-spring), box-shadow 0.45s var(--ease-out-expo), border-color 0.4s ease;
}
.surface-elevated:hover {
  transform: translateY(-6px);
  box-shadow: var(--shadow-lg);
  border-color: rgba(3,105,161,0.3);
}
```

With:
```css
.surface-elevated {
  background: var(--bg-card);
  border: 1px solid var(--slate-200);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  transition: transform 0.45s var(--ease-out-expo), box-shadow 0.45s var(--ease-out-expo), border-color 0.4s var(--ease-out-expo);
}
.surface-elevated:hover {
  transform: translateY(-6px);
  box-shadow: 0 20px 45px rgba(3,105,161,0.18), 0 6px 16px rgba(3,105,161,0.10);
  border-color: rgba(3,105,161,0.3);
}
```

- [ ] **Step 3: Edit `.glass-card` and `.glass-card:hover`**

Replace:
```css
.glass-card {
  background: #ffffff;
  border: 1px solid rgba(0,119,182,0.12);
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.glass-card:hover {
  border-color: rgba(0,119,182,0.28);
  box-shadow: 0 20px 40px rgba(0,119,182,0.1);
  background: #f0f8ff;
  transform: translateY(-6px);
}
```

With:
```css
.glass-card {
  background: #ffffff;
  border: 1px solid rgba(0,119,182,0.12);
  transition: all 0.4s var(--ease-out-expo);
}
.glass-card:hover {
  border-color: rgba(3,105,161,0.3);
  box-shadow: 0 20px 45px rgba(3,105,161,0.18), 0 6px 16px rgba(3,105,161,0.10);
  background: #f0f8ff;
  transform: translateY(-6px);
}
```

- [ ] **Step 4: Confirm `.hover-lift` already uses the shared easing**

Run: `grep -n -A1 "^\.hover-lift" "src/styles/app.css"`
Expected: `.hover-lift { transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease; }` — this curve (`cubic-bezier(0.4, 0, 0.2, 1)`) is functionally equivalent to a standard ease-out and is only applied on top of `.glass-card` (never alone), so no edit needed here. If a future reviewer wants byte-for-byte identical curves, replace `0.3s cubic-bezier(0.4, 0, 0.2, 1)` with `0.3s var(--ease-out-expo)` and `0.3s ease` with `0.3s var(--ease-out-expo)` — but this is optional polish, not required for this task's deliverable.

- [ ] **Step 5: Rebuild CSS**

Run: `npm run build:css`
Expected: exits 0, `public/static/tailwind.css` modified time updates.

- [ ] **Step 6: Verify the new shadow color is compiled in**

Run: `grep -c "rgba(3,105,161,0.18)" public/static/tailwind.css`
Expected: `1` (Tailwind's CSS minifier collapses whitespace but preserves the literal rgba string).

- [ ] **Step 7: Commit**

```bash
git add src/styles/app.css public/static/tailwind.css
git commit -m "style: unify card hover shadow color and easing across .surface-elevated and .glass-card"
```

---

### Task 2: Move the 3D tilt script from `home.tsx` into the global GSAP engine

**Files:**
- Modify: `src/components/Layout.tsx:554-602` (the `initGsap()` function inside the declarative animation engine `<script>` block)
- Modify: `src/pages/home.tsx:719-746` (remove the standalone tilt `<script>` block)

**Interfaces:**
- Consumes: the existing `initGsap()` structure in `Layout.tsx` — specifically the pattern used for `data-parallax` (`gsap.utils.toArray('[data-parallax]').forEach(...)`) and the `finePointer` / `reduce` guards already declared at the top of the enclosing IIFE.
- Produces: any page can now use `data-tilt` on an element and get the 3D tilt effect with zero additional script — this is what Task 3 depends on.

- [ ] **Step 1: Read the current `initGsap` function to confirm the insertion point**

Run: `sed -n '554,602p' src/components/Layout.tsx`
Expected: the function body ending with the `.magnetic` `mousemove`/`mouseleave` handlers inside `if (finePointer) { ... }`, followed by `return true; }`.

- [ ] **Step 2: Add the tilt handling inside `initGsap()`, after the `.magnetic` block**

Find this closing sequence inside `initGsap()`:
```javascript
              if (finePointer) {
                document.querySelectorAll('.magnetic').forEach(function(btn) {
                  btn.addEventListener('mousemove', function(e) {
                    var r = btn.getBoundingClientRect();
                    var mx = e.clientX - r.left - r.width / 2;
                    var my = e.clientY - r.top - r.height / 2;
                    gsap.to(btn, { x: mx * 0.22, y: my * 0.3, duration: 0.4, ease: 'power3.out' });
                  });
                  btn.addEventListener('mouseleave', function() {
                    gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.4)' });
                  });
                });
              }
              return true;
            }
```

Replace it with (adds the tilt block before `return true`):
```javascript
              if (finePointer) {
                document.querySelectorAll('.magnetic').forEach(function(btn) {
                  btn.addEventListener('mousemove', function(e) {
                    var r = btn.getBoundingClientRect();
                    var mx = e.clientX - r.left - r.width / 2;
                    var my = e.clientY - r.top - r.height / 2;
                    gsap.to(btn, { x: mx * 0.22, y: my * 0.3, duration: 0.4, ease: 'power3.out' });
                  });
                  btn.addEventListener('mouseleave', function() {
                    gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.4)' });
                  });
                });

                // Tilt 3D — cartes avec [data-tilt], desktop uniquement
                document.querySelectorAll('[data-tilt]').forEach(function(card) {
                  var rect = null;
                  card.addEventListener('mousemove', function(e) {
                    rect = rect || card.getBoundingClientRect();
                    var x = (e.clientX - rect.left) / rect.width - 0.5;
                    var y = (e.clientY - rect.top) / rect.height - 0.5;
                    gsap.to(card, {
                      rotateY: x * 9, rotateX: -y * 9,
                      transformPerspective: 800, transformOrigin: 'center',
                      duration: 0.4, ease: 'power2.out'
                    });
                  });
                  card.addEventListener('mouseleave', function() {
                    rect = null;
                    gsap.to(card, { rotateX: 0, rotateY: 0, duration: 0.6, ease: 'power3.out' });
                  });
                });
              }
              return true;
            }
```

Note: this reuses the same `finePointer` guard already computed at the top of the enclosing IIFE (`window.matchMedia('(hover: hover) and (pointer: fine)').matches`), which is equivalent to the standalone script's `window.matchMedia('(hover: none)').matches` check (inverted condition, same effect — touch devices get neither magnetic nor tilt).

- [ ] **Step 3: Remove the standalone tilt script block from `home.tsx`**

Delete this entire block (currently at `home.tsx:719-746`, immediately before the closing `</Layout>`):
```jsx
      {/* ===== Tilt 3D des cartes services (desktop, désactivé au toucher) ===== */}
      <script dangerouslySetInnerHTML={{ __html: `
        (function(){
          if (window.matchMedia('(hover: none)').matches) return;
          function run(){
            if (!window.gsap) return false;
            document.querySelectorAll('[data-tilt]').forEach(function(card){
              var rect = null;
              card.addEventListener('mousemove', function(e){
                rect = rect || card.getBoundingClientRect();
                var x = (e.clientX - rect.left) / rect.width - 0.5;
                var y = (e.clientY - rect.top) / rect.height - 0.5;
                gsap.to(card, {
                  rotateY: x * 9, rotateX: -y * 9,
                  transformPerspective: 800, transformOrigin: 'center',
                  duration: 0.4, ease: 'power2.out'
                });
              });
              card.addEventListener('mouseleave', function(){
                rect = null;
                gsap.to(card, { rotateX: 0, rotateY: 0, duration: 0.6, ease: 'power3.out' });
              });
            });
            return true;
          }
          if (!run()) { var n = 0, iv = setInterval(function(){ n++; if (run() || n > 60) clearInterval(iv); }, 50); }
        })();
      ` }} />

```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: `No errors found` (or equivalent zero-error output).

- [ ] **Step 5: Start the dev server and verify tilt still works on an existing card**

Run: `npm run dev` (background), then open `http://localhost:5173/` in a browser or via a Playwright script:
```javascript
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2500);
  const card = await page.locator('[data-tilt]').first();
  const box = await card.boundingBox();
  await page.mouse.move(box.x + 10, box.y + 10);
  await page.waitForTimeout(500);
  const transform = await card.evaluate(el => getComputedStyle(el).transform);
  console.log('transform after tilt mousemove:', transform);
  await browser.close();
})();
```
Expected: `transform` is NOT `none` and NOT the identity matrix `matrix(1, 0, 0, 1, 0, 0)` — confirms GSAP applied a rotation.

- [ ] **Step 6: Commit**

```bash
git add src/components/Layout.tsx src/pages/home.tsx
git commit -m "refactor: move card tilt effect into the global GSAP declarative engine"
```

---

### Task 3: Add `data-tilt` to product cards (home vedettes + catalogue)

**Files:**
- Modify: `src/pages/home.tsx` (featured products grid, `class="surface-elevated overflow-hidden group flex flex-col"`)
- Modify: `src/pages/catalogue.tsx:165` (product card `div`)

**Interfaces:**
- Consumes: `initGsap()`'s `[data-tilt]` handling from Task 2 (must be merged first — this task only adds markup, no new JS).
- Produces: nothing further downstream — this is the last task in this plan.

- [ ] **Step 1: Add `data-tilt` to the featured product card in `home.tsx`**

Find (inside the "PRODUITS VEDETTES" section, product map):
```jsx
            ) : featuredProducts.map(p => (
              <div class="surface-elevated overflow-hidden group flex flex-col">
```

Replace with:
```jsx
            ) : featuredProducts.map(p => (
              <div data-tilt class="surface-elevated overflow-hidden group flex flex-col">
```

- [ ] **Step 2: Add `data-tilt` conditionally to the catalogue product card**

Find (`catalogue.tsx:165`):
```jsx
                  <div data-brand={p.brand} data-btu={String(p.btu)} data-inverter={String(p.inverter)} data-stock={String(p.stock)} data-available={String(p.available)} data-id={String(p.id)} data-name={p.name} data-price={String(p.price)} data-model={p.model} data-energy={p.energy_class} data-image={p.image} class={`product-card glass-card rounded-2xl overflow-hidden transition-all duration-300 group ${!p.available || p.stock === 0 ? 'opacity-60' : 'hover-lift'}`}>
```

Replace with:
```jsx
                  <div {...((p.available && p.stock !== 0) ? { 'data-tilt': true } : {})} data-brand={p.brand} data-btu={String(p.btu)} data-inverter={String(p.inverter)} data-stock={String(p.stock)} data-available={String(p.available)} data-id={String(p.id)} data-name={p.name} data-price={String(p.price)} data-model={p.model} data-energy={p.energy_class} data-image={p.image} class={`product-card glass-card rounded-2xl overflow-hidden transition-all duration-300 group ${!p.available || p.stock === 0 ? 'opacity-60' : 'hover-lift'}`}>
```

This mirrors the existing `hover-lift` conditional exactly: unavailable/out-of-stock cards get neither `hover-lift` nor `data-tilt`.

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: `No errors found`.

- [ ] **Step 4: Verify visually with Playwright**

```javascript
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Home featured products
  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2500);
  const homeCount = await page.locator('[data-tilt]').count();
  console.log('home data-tilt elements:', homeCount); // expect 3 (services) + 4 (avantages) + 4 (fonctionnalites) + 3 (produits vedettes) = 14

  // Catalogue
  await page.goto('http://localhost:5173/catalogue', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2500);
  const catalogueTiltCount = await page.locator('.product-card[data-tilt]').count();
  const catalogueDisabledCount = await page.locator('.product-card.opacity-60[data-tilt]').count();
  console.log('catalogue product-card with data-tilt:', catalogueTiltCount);
  console.log('disabled cards that wrongly got data-tilt (must be 0):', catalogueDisabledCount);

  await browser.close();
})();
```
Expected: `home data-tilt elements: 14`, `catalogue product-card with data-tilt` > 0 (matches available product count on the page), `disabled cards that wrongly got data-tilt (must be 0): 0`.

- [ ] **Step 5: Commit**

```bash
git add src/pages/home.tsx src/pages/catalogue.tsx
git commit -m "feat: extend 3D tilt hover effect to product cards (home vedettes + catalogue)"
```
