# Layered Tilt Parallax Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current single-rotation tilt effect on `[data-tilt]` cards with a Codrops-inspired multi-layer parallax: an inner "image" layer (icon or photo) tilts slightly, a "caption" layer (title/text or name/price) translates more, and a new diagonal "shine" sweep translates the most — each layer moving independently based on mouse position within the card.

**Architecture:** The card container (`[data-tilt]`) itself stops rotating; only its marked children (`.tilt-image`, `.tilt-caption`, `.tilt-shine`) transform. This mirrors the reference demo's structure (`.tilter__figure`/`.tilter__caption`/`.tilt__deco--shine` each with their own movement factor) but is implemented purely in GSAP — already loaded site-wide — with no new library. The JS lives in the existing global declarative engine (`initGsap()` in `Layout.tsx`), so any card gets the effect automatically once it has `data-tilt` and the right child classes.

**Tech Stack:** Hono JSX (SSR), Tailwind (compiled via `npm run build:css`), GSAP 3.13.0 (CDN, already loaded).

## Global Constraints

- No new npm dependencies, no new CDN scripts (GSAP only — do not add anime.js).
- Effect stays disabled on touch (`hover: none`) and under `prefers-reduced-motion: reduce` — both guards already exist in `initGsap()`; do not weaken them.
- No decorative line frame (explicitly rejected by the user) — only image/caption/shine layers.
- Shine tint: `rgba(0,180,216,…)` accent-cyan diagonal gradient, not neutral white/black.
- After any `src/styles/app.css` edit, run `npm run build:css` before it's visible in the browser.
- No automated test suite exists in this project — verification is `npx tsc --noEmit` plus direct Playwright browser checks (computed `transform` values), not unit tests.
- The dev server's first response after a cold start can take 20–60 seconds (Vite SSR transform) — use generous timeouts (60s+) on the first request in any verification script, and note that a fresh browser context shows the CGU consent modal that blocks the whole page; pre-seed `localStorage` (`maasga_cgu_accepted` and `maasga_cookies_accepted` set to `'true'`) via `page.addInitScript` before `page.goto` in any Playwright check.

---

### Task 1: CSS foundations for the shine layer and card containment

**Files:**
- Modify: `src/styles/app.css` (add a new rule block after `.hover-glow:hover`, currently around line 344)

**Interfaces:**
- Consumes: nothing (pure CSS).
- Produces: the `.tilt-shine` class and `[data-tilt]` containment rule that Task 2's JS will animate and Tasks 3/4's markup will use.

- [ ] **Step 1: Locate the insertion point**

Run: `grep -n "hover-glow" src/styles/app.css`
Expected: a match around line 343-344 (`.hover-glow { transition: box-shadow 0.3s ease; }` / `.hover-glow:hover { box-shadow: 0 0 20px rgba(0,119,182,0.2); }`). Use the printed line number, not the one in this plan, if it has shifted.

- [ ] **Step 2: Add the new CSS block immediately after `.hover-glow:hover { ... }`**

```css

/* ─── Tilt parallax layers (image/caption/shine) ─── */
[data-tilt] {
  position: relative;
  overflow: hidden;
}

.tilt-shine {
  position: absolute;
  top: -60%;
  left: -60%;
  width: 220%;
  height: 220%;
  pointer-events: none;
  background: linear-gradient(45deg, transparent 35%, rgba(0,180,216,0.16) 50%, transparent 65%);
}
```

Note: `overflow: hidden` on `[data-tilt]` clips the oversized `.tilt-shine` div so it never visually escapes the card — it does NOT clip the card's own `box-shadow` (box-shadow paints around the element's border box and is unaffected by that same element's `overflow` value; only child content that visually overflows gets clipped). No conflict with the glow shadow from the earlier hover-unification work.

- [ ] **Step 3: Rebuild CSS**

Run: `npm run build:css`
Expected: exits 0.

- [ ] **Step 4: Verify the new rules compiled**

Run: `grep -c "tilt-shine" public/static/tailwind.css`
Expected: `1` or more (the class selector must appear in the compiled output).

- [ ] **Step 5: Commit**

```bash
git add src/styles/app.css public/static/tailwind.css
git commit -m "style: add tilt-shine layer CSS and [data-tilt] containment"
```

---

### Task 2: Rewrite the tilt engine in `Layout.tsx` for multi-layer parallax

**Files:**
- Modify: `src/components/Layout.tsx:590-607` (the current single-rotation `[data-tilt]` block inside `initGsap()`)

**Interfaces:**
- Consumes: the `finePointer` and `gsap` variables already in scope inside `initGsap()` (no change to their definitions).
- Produces: the new tilt behavior that Tasks 3 and 4 rely on — any `[data-tilt]` card with `.tilt-image`, `.tilt-caption`, and/or `.tilt-shine` children gets independent parallax on each present layer; a card with none of these children simply does nothing on mousemove (safe no-op), which is what happens until Tasks 3/4 land.

- [ ] **Step 1: Confirm current code matches before editing**

Run: `sed -n '590,607p' src/components/Layout.tsx`
Expected output:
```javascript
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
```
If the current code differs from this (line numbers may have shifted, that's fine — the content must match), stop and report BLOCKED with what you found.

- [ ] **Step 2: Replace it with the multi-layer version**

```javascript
                // Tilt parallax — cartes avec [data-tilt], couches .tilt-image/.tilt-caption/.tilt-shine
                document.querySelectorAll('[data-tilt]').forEach(function(card) {
                  var rect = null;
                  var img = card.querySelector('.tilt-image');
                  var caption = card.querySelector('.tilt-caption');
                  var shine = card.querySelector('.tilt-shine');
                  var layers = [img, caption, shine].filter(Boolean);
                  card.addEventListener('mousemove', function(e) {
                    rect = rect || card.getBoundingClientRect();
                    var x = (e.clientX - rect.left) / rect.width - 0.5;
                    var y = (e.clientY - rect.top) / rect.height - 0.5;
                    if (img) {
                      gsap.to(img, {
                        rotateY: x * 10, rotateX: -y * 10,
                        transformPerspective: 800, transformOrigin: 'center',
                        duration: 0.4, ease: 'power2.out'
                      });
                    }
                    if (caption) {
                      gsap.to(caption, { x: x * 40, y: y * 40, duration: 0.4, ease: 'power2.out' });
                    }
                    if (shine) {
                      gsap.to(shine, { x: x * 100, y: y * 100, duration: 0.4, ease: 'power2.out' });
                    }
                  });
                  card.addEventListener('mouseleave', function() {
                    rect = null;
                    if (layers.length) {
                      gsap.to(layers, { rotateX: 0, rotateY: 0, x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' });
                    }
                  });
                });
```

Notes on the numbers (so you don't second-guess them): `x`/`y` range from -0.5 to 0.5 across the card. `.tilt-image` rotation factor `10` gives a ±5° swing (matches the design spec's "rotation ±5°"). `.tilt-caption` factor `40` gives ±20px (matches "translation ±20px"). `.tilt-shine` factor `100` gives ±50px (matches "translation ±50px", the most ample movement, per the design spec).

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: `No errors found` (this is a `dangerouslySetInnerHTML` string, so tsc mainly confirms the surrounding TSX is still syntactically valid).

- [ ] **Step 4: Verify no runtime error with zero layers present (markup not added yet)**

Start the dev server if not already running (`npm run dev`, background; first request may take 20-60s). Then run this Playwright check (pre-seed CGU consent as noted in Global Constraints):

```javascript
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.addInitScript(() => {
    localStorage.setItem('maasga_cgu_accepted', 'true');
    localStorage.setItem('maasga_cookies_accepted', 'true');
  });
  await page.goto('http://[::1]:5173/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(2500);
  const card = page.locator('[data-tilt]').first();
  const box = await card.boundingBox();
  await page.mouse.move(box.x + 10, box.y + 10, { steps: 5 });
  await page.mouse.move(box.x + box.width - 10, box.y + box.height - 10, { steps: 5 });
  await page.mouse.move(box.x + box.width / 2, box.y - 50); // move away to trigger mouseleave
  await page.waitForTimeout(700);
  console.log('page errors:', JSON.stringify(errors));
})();
```
Expected: `page errors: []` — no `TypeError` or similar from the new code running against cards that don't yet have `.tilt-image`/`.tilt-caption`/`.tilt-shine` children (proving the `if (img)`/`if (caption)`/`if (shine)` guards work).

- [ ] **Step 5: Commit**

```bash
git add src/components/Layout.tsx
git commit -m "refactor: rewrite tilt effect as multi-layer parallax (image/caption/shine)"
```

---

### Task 3: Add tilt layers to home.tsx cards (services, avantages, fonctionnalités, produits vedettes)

**Files:**
- Modify: `src/pages/home.tsx` (four card groups: lines ~195-243 services, ~262-268 avantages, ~295-335 produits vedettes, ~364-370 fonctionnalités — line numbers may have shifted since this plan was written; use the greps in Step 1 to confirm)

**Interfaces:**
- Consumes: `.tilt-image`, `.tilt-caption`, `.tilt-shine` classes handled by Task 2's JS and Task 1's CSS.
- Produces: nothing further downstream (this is a leaf task).

- [ ] **Step 1: Confirm current markup**

Run: `grep -n "data-tilt" src/pages/home.tsx`
Expected: 6 matches (2 in the services section including the navy card, 1 in avantages `.map`, 1 in produits vedettes `.map`, 1 in fonctionnalités `.map`) — cross-check against the exact snippets below before editing; if any snippet doesn't match verbatim, stop and report BLOCKED with what you found instead of guessing.

- [ ] **Step 2: Services card 1 ("Vente Premium")**

Find:
```jsx
            <div data-tilt class="surface-elevated p-8 group">
              <div class="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl mb-6 group-hover:rotate-6 transition-transform" style="background:linear-gradient(135deg,var(--accent),var(--accent-cyan)); color:#ffffff;">
                <i class="ph-duotone ph-shopping-cart-simple"></i>
              </div>
              <h3 class="text-2xl font-extrabold mb-4 font-display" style="color:var(--navy-900);">Vente Premium</h3>
              <p class="mb-6" style="color:var(--slate-700);">Des climatiseurs de marques internationales, économes en énergie et adaptés au climat sahélien.</p>
              <ul class="text-sm space-y-2 mb-8" style="color:var(--slate-500);">
```

Replace with:
```jsx
            <div data-tilt class="surface-elevated p-8 group">
              <div class="tilt-image w-16 h-16 rounded-2xl flex items-center justify-center text-2xl mb-6 group-hover:rotate-6 transition-transform" style="background:linear-gradient(135deg,var(--accent),var(--accent-cyan)); color:#ffffff;">
                <i class="ph-duotone ph-shopping-cart-simple"></i>
              </div>
              <div class="tilt-caption">
                <h3 class="text-2xl font-extrabold mb-4 font-display" style="color:var(--navy-900);">Vente Premium</h3>
                <p class="mb-6" style="color:var(--slate-700);">Des climatiseurs de marques internationales, économes en énergie et adaptés au climat sahélien.</p>
              </div>
              <div class="tilt-shine" aria-hidden="true"></div>
              <ul class="text-sm space-y-2 mb-8" style="color:var(--slate-500);">
```

(The `<ul>` and the `<a>` link after it stay outside the caption wrapper and untouched — only the icon and the title/description parallax; the list and CTA link remain static and fully clickable.)

- [ ] **Step 3: Services card 2 ("Maintenance", navy variant)**

Find:
```jsx
            <div data-tilt class="surface-navy p-8 relative overflow-hidden md:-mt-4 md:mb-[-1rem]">
              <div class="absolute top-0 right-0 p-4 text-8xl" style="opacity:0.08; color:#ffffff;">
                <i class="ph-duotone ph-wrench"></i>
              </div>
              <div class="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl mb-6" style="background:rgba(202,240,248,0.14); color:var(--ice);">
                <i class="ph-duotone ph-wrench"></i>
              </div>
              <h3 class="text-2xl font-extrabold mb-4 font-display" style="color:#ffffff;">Maintenance</h3>
              <p class="mb-6" style="color:#cbd5e1;">Interventions rapides et programmées pour garantir la longévité de vos appareils. SAV 7j/7.</p>
              <ul class="text-sm space-y-2 mb-8" style="color:#94a3b8;">
```

Replace with:
```jsx
            <div data-tilt class="surface-navy p-8 relative overflow-hidden md:-mt-4 md:mb-[-1rem]">
              <div class="absolute top-0 right-0 p-4 text-8xl" style="opacity:0.08; color:#ffffff;">
                <i class="ph-duotone ph-wrench"></i>
              </div>
              <div class="tilt-image w-16 h-16 rounded-2xl flex items-center justify-center text-2xl mb-6" style="background:rgba(202,240,248,0.14); color:var(--ice);">
                <i class="ph-duotone ph-wrench"></i>
              </div>
              <div class="tilt-caption">
                <h3 class="text-2xl font-extrabold mb-4 font-display" style="color:#ffffff;">Maintenance</h3>
                <p class="mb-6" style="color:#cbd5e1;">Interventions rapides et programmées pour garantir la longévité de vos appareils. SAV 7j/7.</p>
              </div>
              <div class="tilt-shine" aria-hidden="true"></div>
              <ul class="text-sm space-y-2 mb-8" style="color:#94a3b8;">
```

(The large decorative background wrench icon — `absolute top-0 right-0 ... opacity:0.08` — is left untouched; it is a static watermark, not the card's tilt-image.)

- [ ] **Step 4: Services card 3 ("Suivi de Performance")**

Find:
```jsx
            <div data-tilt class="surface-elevated p-8 group">
              <div class="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl mb-6 group-hover:rotate-6 transition-transform" style="background:linear-gradient(135deg,var(--accent),var(--accent-cyan)); color:#ffffff;">
                <i class="ph-duotone ph-chart-line-up"></i>
              </div>
              <h3 class="text-2xl font-extrabold mb-4 font-display" style="color:var(--navy-900);">Suivi de Performance</h3>
              <p class="mb-6" style="color:var(--slate-700);">Un espace client dédié pour consulter vos contrats, historiques d'interventions et alertes.</p>
              <ul class="text-sm space-y-2 mb-8" style="color:var(--slate-500);">
```

Replace with:
```jsx
            <div data-tilt class="surface-elevated p-8 group">
              <div class="tilt-image w-16 h-16 rounded-2xl flex items-center justify-center text-2xl mb-6 group-hover:rotate-6 transition-transform" style="background:linear-gradient(135deg,var(--accent),var(--accent-cyan)); color:#ffffff;">
                <i class="ph-duotone ph-chart-line-up"></i>
              </div>
              <div class="tilt-caption">
                <h3 class="text-2xl font-extrabold mb-4 font-display" style="color:var(--navy-900);">Suivi de Performance</h3>
                <p class="mb-6" style="color:var(--slate-700);">Un espace client dédié pour consulter vos contrats, historiques d'interventions et alertes.</p>
              </div>
              <div class="tilt-shine" aria-hidden="true"></div>
              <ul class="text-sm space-y-2 mb-8" style="color:var(--slate-500);">
```

- [ ] **Step 5: Avantages cards (mapped array, 4 cards)**

Find:
```jsx
            <div data-tilt class="surface-elevated p-6 text-center group">
              <div class="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform" style={`background:${av.color}14; border:1px solid ${av.color}26;`}>
                <i class={`fas ${av.icon} text-2xl`} style={`color:${av.color};`}></i>
              </div>
              <h3 class="font-bold mb-2 font-display" style="color:var(--navy-900);">{av.title}</h3>
              <p class="text-sm leading-relaxed" style="color:var(--slate-700);">{av.desc}</p>
            </div>
          ))}
```

Replace with:
```jsx
            <div data-tilt class="surface-elevated p-6 text-center group">
              <div class="tilt-image w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform" style={`background:${av.color}14; border:1px solid ${av.color}26;`}>
                <i class={`fas ${av.icon} text-2xl`} style={`color:${av.color};`}></i>
              </div>
              <div class="tilt-caption">
                <h3 class="font-bold mb-2 font-display" style="color:var(--navy-900);">{av.title}</h3>
                <p class="text-sm leading-relaxed" style="color:var(--slate-700);">{av.desc}</p>
              </div>
              <div class="tilt-shine" aria-hidden="true"></div>
            </div>
          ))}
```

- [ ] **Step 6: Produits vedettes cards (mapped array, 3 cards)**

Find:
```jsx
              <div data-tilt class="surface-elevated overflow-hidden group flex flex-col">
                {/* Image */}
                <div class="relative" style="background:linear-gradient(145deg,#f0f7ff,#dbeafe); padding:28px 24px 20px;">
```

Replace with:
```jsx
              <div data-tilt class="surface-elevated overflow-hidden group flex flex-col">
                {/* Image */}
                <div class="tilt-image relative" style="background:linear-gradient(145deg,#f0f7ff,#dbeafe); padding:28px 24px 20px;">
```

Then find (immediately following, inside the same card, the brand/name/price block):
```jsx
                <div class="p-6 flex flex-col flex-1">
                  <div class="text-xs font-bold uppercase tracking-wider mb-1" style="color:var(--accent);">{p.brand}</div>
                  <h3 class="font-extrabold text-lg mb-2 leading-snug font-display" style="color:var(--navy-900);">{p.name}</h3>
                  <p class="text-sm mb-4 leading-relaxed" style="color:var(--slate-500);">{p.description}</p>
                  <div class="flex items-end justify-between mb-5 mt-auto">
                    <div>
                      <div class="text-2xl font-extrabold font-display" style="color:var(--accent);">{p.price.toLocaleString()} <span class="text-sm font-normal" style="color:var(--slate-500);">FCFA</span></div>
                      <div class="text-xs font-semibold mt-0.5" style="color:#10b981;"><i class="fas fa-circle-check mr-1"></i>Installation et livraison offerte</div>
                    </div>
                    <div class="text-right">
                      <div class="text-base font-bold" style="color:var(--navy-900);">{p.btu.toLocaleString()} BTU</div>
                      <div class="text-xs" style="color:var(--slate-500);">{p.surface_min}–{p.surface_max} m²</div>
                    </div>
                  </div>
                  <a href={`/catalogue?product=${p.id}`} class="w-full btn-primary font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 text-sm">
                    <i class="fas fa-eye text-sm"></i>
                    <span>Voir &amp; Commander</span>
                  </a>
                </div>
              </div>
            ))}
```

Replace with:
```jsx
                <div class="p-6 flex flex-col flex-1">
                  <div class="tilt-caption">
                    <div class="text-xs font-bold uppercase tracking-wider mb-1" style="color:var(--accent);">{p.brand}</div>
                    <h3 class="font-extrabold text-lg mb-2 leading-snug font-display" style="color:var(--navy-900);">{p.name}</h3>
                    <p class="text-sm mb-4 leading-relaxed" style="color:var(--slate-500);">{p.description}</p>
                  </div>
                  <div class="flex items-end justify-between mb-5 mt-auto">
                    <div>
                      <div class="text-2xl font-extrabold font-display" style="color:var(--accent);">{p.price.toLocaleString()} <span class="text-sm font-normal" style="color:var(--slate-500);">FCFA</span></div>
                      <div class="text-xs font-semibold mt-0.5" style="color:#10b981;"><i class="fas fa-circle-check mr-1"></i>Installation et livraison offerte</div>
                    </div>
                    <div class="text-right">
                      <div class="text-base font-bold" style="color:var(--navy-900);">{p.btu.toLocaleString()} BTU</div>
                      <div class="text-xs" style="color:var(--slate-500);">{p.surface_min}–{p.surface_max} m²</div>
                    </div>
                  </div>
                  <a href={`/catalogue?product=${p.id}`} class="w-full btn-primary font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 text-sm">
                    <i class="fas fa-eye text-sm"></i>
                    <span>Voir &amp; Commander</span>
                  </a>
                  <div class="tilt-shine" aria-hidden="true"></div>
                </div>
              </div>
            ))}
```

(Only brand/name/description move as the caption — price, BTU/surface, and the CTA button stay static and fully clickable, matching the design spec's "nom/prix" scope. The `.tilt-shine` div sits as a sibling at the end so it overlays the whole card via `position:absolute` from Task 1's CSS regardless of where in the DOM it sits.)

- [ ] **Step 7: Fonctionnalités cards (mapped array, 4 cards, note this one is an `<a>` not a `<div>`)**

Find:
```jsx
              <a href={f.href} data-tilt class="surface-elevated p-6 text-center group block">
                <div class="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform" style={`background:${f.color}14; border:1px solid ${f.color}26;`}>
                  <i class={`fas ${f.icon} text-2xl`} style={`color:${f.color};`}></i>
                </div>
                <h3 class="font-bold mb-2 font-display" style="color:var(--navy-900);">{f.title}</h3>
                <p class="text-sm leading-relaxed" style="color:var(--slate-700);">{f.desc}</p>
              </a>
```

Replace with:
```jsx
              <a href={f.href} data-tilt class="surface-elevated p-6 text-center group block">
                <div class="tilt-image w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform" style={`background:${f.color}14; border:1px solid ${f.color}26;`}>
                  <i class={`fas ${f.icon} text-2xl`} style={`color:${f.color};`}></i>
                </div>
                <div class="tilt-caption">
                  <h3 class="font-bold mb-2 font-display" style="color:var(--navy-900);">{f.title}</h3>
                  <p class="text-sm leading-relaxed" style="color:var(--slate-700);">{f.desc}</p>
                </div>
                <div class="tilt-shine" aria-hidden="true"></div>
              </a>
```

(`data-tilt` on an `<a>` works identically to on a `<div>` — `querySelector` and event listeners don't care about tag name. The whole link stays clickable since none of the new wrapper divs have `pointer-events: none` except `.tilt-shine`, which is purely decorative and sits on top but doesn't intercept clicks.)

- [ ] **Step 8: Typecheck**

Run: `npx tsc --noEmit`
Expected: `No errors found`.

- [ ] **Step 9: Verify with Playwright — distinct per-layer transforms**

```javascript
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.addInitScript(() => {
    localStorage.setItem('maasga_cgu_accepted', 'true');
    localStorage.setItem('maasga_cookies_accepted', 'true');
  });
  await page.goto('http://[::1]:5173/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(2500);

  const card = page.locator('#services [data-tilt]').first();
  await card.scrollIntoViewIfNeeded();
  const box = await card.boundingBox();
  await page.mouse.move(box.x + box.width * 0.1, box.y + box.height * 0.1, { steps: 8 });
  await page.waitForTimeout(500);

  const result = await card.evaluate(el => {
    const img = el.querySelector('.tilt-image');
    const caption = el.querySelector('.tilt-caption');
    const shine = el.querySelector('.tilt-shine');
    return {
      cardTransform: getComputedStyle(el).transform,
      imgTransform: img && getComputedStyle(img).transform,
      captionTransform: caption && getComputedStyle(caption).transform,
      shineTransform: shine && getComputedStyle(shine).transform,
    };
  });
  console.log(JSON.stringify(result, null, 2));
})();
```
Expected: `cardTransform` is `"none"` (the container itself no longer rotates — only its children do), while `imgTransform`, `captionTransform`, and `shineTransform` are each a distinct non-identity matrix (proving three independently-moving layers, not one uniform transform).

- [ ] **Step 10: Commit**

```bash
git add src/pages/home.tsx
git commit -m "feat: add layered tilt parallax to home page cards (services, avantages, fonctionnalités, produits vedettes)"
```

---

### Task 4: Add tilt layers to the catalogue product card

**Files:**
- Modify: `src/pages/catalogue.tsx` (product card around line 165-181 for the image block, 184-187 for the caption block — line numbers may have shifted; confirm via Step 1's grep)

**Interfaces:**
- Consumes: same `.tilt-image`/`.tilt-caption`/`.tilt-shine` handling from Task 2.
- Produces: nothing further downstream (leaf task).

- [ ] **Step 1: Confirm current markup**

Run: `grep -n "product-card glass-card" src/pages/catalogue.tsx`
Expected: one match; use the printed line number to locate the card. Confirm the snippets below match verbatim before editing — if not, stop and report BLOCKED.

- [ ] **Step 2: Mark the image block**

Find:
```jsx
                    {/* Image */}
                    <div class="relative p-6 text-center" style="background:linear-gradient(145deg,#e8f2ff,#f0f7ff);">
```

Replace with:
```jsx
                    {/* Image */}
                    <div class="tilt-image relative p-6 text-center" style="background:linear-gradient(145deg,#e8f2ff,#f0f7ff);">
```

- [ ] **Step 3: Mark the caption block (brand/name/ref only, not the specs grid or buttons)**

Find:
```jsx
                    {/* Info */}
                    <div class="p-5">
                      <div class="text-xs font-bold uppercase tracking-wider mb-1" style="color:#38bdf8;">{p.brand}</div>
                      <h3 class="font-bold text-white text-sm mb-1 leading-tight">{p.name}</h3>
                      <p class="text-xs mb-3" style="color:#64748b;">Réf: {p.model}</p>

                      <div class="grid grid-cols-2 gap-2 my-3">
```

Replace with:
```jsx
                    {/* Info */}
                    <div class="p-5">
                      <div class="tilt-caption">
                        <div class="text-xs font-bold uppercase tracking-wider mb-1" style="color:#38bdf8;">{p.brand}</div>
                        <h3 class="font-bold text-white text-sm mb-1 leading-tight">{p.name}</h3>
                        <p class="text-xs mb-3" style="color:#64748b;">Réf: {p.model}</p>
                      </div>

                      <div class="grid grid-cols-2 gap-2 my-3">
```

- [ ] **Step 4: Add the shine layer and close the wrapper**

Find the end of the card's content `<div class="p-5">` block — locate this exact closing sequence (the compare button is the last element before the two closing `</div>` tags that end the info block and the card):
```jsx
                          <button id={`compare-btn-${p.id}`} onclick={`toggleCompare(${p.id})`} class="w-full font-semibold py-1.5 rounded-xl flex items-center justify-center space-x-2 text-xs transition-all" style="background:rgba(167,139,250,0.07); color:#a78bfa; border:1px solid rgba(167,139,250,0.18);">
                            <i class="fas fa-balance-scale text-xs"></i>
                            <span>Comparer</span>
                          </button>
                        </div>
                      ) : (
```

Do not modify this block — it's inside the `available && stock > 0` branch. Instead, add the shine div as a sibling right after the closing `</div>` of `<div class="p-5">` (i.e., right before the card's own closing `</div>`). Find the card's closing tag — search for the end of the product card, which is a lone `</div>` at the same indentation as the opening `<div {...(...)} data-brand=...>` from Step 1. Add `<div class="tilt-shine" aria-hidden="true"></div>` as the last child, immediately before that closing `</div>`:

Find (the line immediately before the card's closing tag — confirm via `grep -n "compare-btn-\${p.id}" -A 40 src/pages/catalogue.tsx` to see the exact surrounding lines, since the exact closing sequence depends on the disabled-card branch too):
```jsx
                  </div>
                ))}
              </div>
```

Replace with:
```jsx
                  <div class="tilt-shine" aria-hidden="true"></div>
                  </div>
                ))}
              </div>
```

If this exact three-line sequence doesn't appear (e.g. there's different trailing whitespace or an extra closing brace from the ternary), find the `</div>` that closes the product card itself (matching the opening `<div {...((p.available && p.stock !== 0) ...` from Step 1) and insert `<div class="tilt-shine" aria-hidden="true"></div>` as its last child, right before that specific closing tag. Report BLOCKED if you can't confidently identify which closing `</div>` belongs to the card root.

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: `No errors found`.

- [ ] **Step 6: Verify with Playwright**

```javascript
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.addInitScript(() => {
    localStorage.setItem('maasga_cgu_accepted', 'true');
    localStorage.setItem('maasga_cookies_accepted', 'true');
  });
  await page.goto('http://[::1]:5173/catalogue', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(2500);

  const card = page.locator('.product-card[data-tilt]').first();
  await card.scrollIntoViewIfNeeded();
  const box = await card.boundingBox();
  await page.mouse.move(box.x + box.width * 0.85, box.y + box.height * 0.15, { steps: 8 });
  await page.waitForTimeout(500);

  const result = await card.evaluate(el => {
    const img = el.querySelector('.tilt-image');
    const caption = el.querySelector('.tilt-caption');
    const shine = el.querySelector('.tilt-shine');
    return {
      cardTransform: getComputedStyle(el).transform,
      imgTransform: img && getComputedStyle(img).transform,
      captionTransform: caption && getComputedStyle(caption).transform,
      shineTransform: shine && getComputedStyle(shine).transform,
    };
  });
  console.log(JSON.stringify(result, null, 2));

  // Confirm the "Commander" button inside the caption's sibling area is still clickable
  const disabledCount = await page.locator('.product-card.opacity-60 .tilt-shine').count();
  console.log('shine layers wrongly added to disabled cards (must be 0):', disabledCount);
})();
```
Expected: same pattern as Task 3 (`cardTransform: "none"`, three distinct non-identity layer transforms), and `disabledCount` is `0` (disabled/out-of-stock cards never had `data-tilt` to begin with, so Task 2's `querySelectorAll('[data-tilt]')` never touches them — this just confirms no shine div leaked onto a card lacking `data-tilt`, which would indicate a copy-paste mistake in Step 4).

- [ ] **Step 7: Commit**

```bash
git add src/pages/catalogue.tsx
git commit -m "feat: add layered tilt parallax to catalogue product cards"
```
