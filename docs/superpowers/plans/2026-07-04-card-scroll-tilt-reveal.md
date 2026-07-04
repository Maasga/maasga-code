# Card Scroll Tilt Reveal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make card icon/caption/shine layers settle into place with a 3D tilt as their grid scrolls into view, echoing the existing mouse-hover tilt, using only CSS additions to the site's existing reveal engine.

**Architecture:** The site already toggles a `.in` class on `[data-stagger]`/`[data-hero]` containers via IntersectionObserver (`src/components/Layout.tsx`), and CSS cascades that into a fade+translateY+scale on each direct child card (`src/styles/app.css`). This plan adds new CSS-only rules that target the `.tilt-image`/`.tilt-caption`/`.tilt-shine` layers *inside* each card (already present in the markup for the hover-tilt effect) so they animate in with a 3D settle, without touching the card container itself or any JS/markup. It also fixes a pre-existing robustness gap on the testimonial cards' reveal rule.

**Tech Stack:** Plain CSS (`src/styles/app.css`), Tailwind build pipeline (`npm run build:css`), no JS changes.

## Global Constraints

- No new npm dependencies, no new CDN scripts, no changes to `src/components/Layout.tsx` or any `.tsx` markup — this is a CSS-only change (spec: `docs/superpowers/specs/2026-07-04-card-scroll-tilt-reveal-design.md`).
- The `[data-tilt]` card container itself must never rotate (existing constraint documented in `CLAUDE.md`) — only its `.tilt-image`/`.tilt-caption`/`.tilt-shine` children may receive 3D transforms.
- After any `src/styles/app.css` edit, run `npm run build:css` before the change is visible in the browser (`npm run dev` serves the compiled `public/static/tailwind.css` statically and does not recompile it).
- No automated test suite exists in this project — verification is direct Playwright browser checks (computed `opacity`/`transform` values), not unit tests.
- A fresh browser context shows the CGU consent modal that blocks the page; pre-seed `localStorage` (`maasga_cgu_accepted` and `maasga_cookies_accepted` set to `'true'`) via `page.addInitScript` before `page.goto` in any Playwright check.
- The dev server's first response after a cold start can take 20–60 seconds; use generous timeouts (60s+) on the first request. Prefer `http://[::1]:5173/` over `localhost` (this machine sometimes binds Vite to IPv6 loopback only).
- `prefers-reduced-motion: reduce` is already handled globally (`src/styles/app.css` ~L449-461 forces `transition-duration: 0.001ms !important` on `*`) — no extra reduced-motion CSS is needed for the new rules; they inherit this automatically.

---

### Task 1: Add 3D settle-in reveal for card icon/caption/shine layers, and fix testimonial card reveal robustness

**Files:**
- Modify: `src/styles/app.css:436` (insert new rule block immediately after the existing `html.js-ready [data-parallax] { will-change: transform; }` line, before the `/* Header pill... */` comment)
- Modify: `src/styles/app.css:560-565` (replace the existing ungated `.testimonial-card-in` rules)

**Interfaces:**
- Consumes: the existing `.in` class already toggled by `revealObserver` on `[data-stagger]`/`[data-hero]` containers (`src/components/Layout.tsx:487-494`, `:524-529`) — no changes to that JS.
- Consumes: the existing `.in` class already toggled directly on each `[data-testimonial-card]` element (`src/pages/home.tsx:503-512`) — no changes to that JS.
- Consumes: the existing `.tilt-image` / `.tilt-caption` / `.tilt-shine` markup already present on every `[data-tilt]` card (`src/pages/home.tsx`) — no markup changes.
- Produces: nothing consumed by later tasks — this is the only task in the plan.

- [ ] **Step 1: Start the dev server and rebuild CSS to get a clean baseline**

Run:
```bash
npm run build:css
```
Expected: completes without error, prints something like `Done in <N>ms.`

Then start the dev server in the background if it isn't already running:
```bash
npm run dev
```
Expected: log line containing `Local:` and a `5173` port. Wait for that line before proceeding (first compile can take 20-60s).

- [ ] **Step 2: Write the baseline (RED) Playwright check**

Save this as `scratch-verify-tilt-reveal.js` in the repo root (temporary file, not committed):

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
  await page.waitForSelector('[data-stagger] [data-tilt] .tilt-image');

  // Baseline: read the icon layer's computed style BEFORE it scrolls into view.
  const before = await page.evaluate(() => {
    const el = document.querySelectorAll('[data-stagger] [data-tilt] .tilt-image')[0];
    const cs = getComputedStyle(el);
    return { opacity: cs.opacity, transform: cs.transform };
  });
  console.log('BEFORE scroll:', JSON.stringify(before));

  // Scroll the same element into view and let the transition settle.
  await page.evaluate(() => {
    document.querySelectorAll('[data-stagger] [data-tilt] .tilt-image')[0]
      .scrollIntoView({ block: 'center' });
  });
  await page.waitForTimeout(1500);

  const after = await page.evaluate(() => {
    const el = document.querySelectorAll('[data-stagger] [data-tilt] .tilt-image')[0];
    const cs = getComputedStyle(el);
    return { opacity: cs.opacity, transform: cs.transform };
  });
  console.log('AFTER scroll:', JSON.stringify(after));

  // Testimonial card check.
  const testimonial = await page.evaluate(() => {
    const el = document.querySelector('.testimonial-card-in');
    if (!el) return null;
    const cs = getComputedStyle(el);
    return { opacity: cs.opacity, transform: cs.transform };
  });
  console.log('TESTIMONIAL (may need scroll):', JSON.stringify(testimonial));

  await browser.close();
})();
```

Run:
```bash
node scratch-verify-tilt-reveal.js
```
Expected (RED — proves the hidden-before-reveal state does not exist yet): `BEFORE scroll` shows `"opacity":"1"` and `"transform":"none"` (there is no rule yet making the icon start hidden/rotated). This is the failing baseline we're about to fix.

- [ ] **Step 3: Add the icon/caption/shine reveal rules**

In `src/styles/app.css`, find this existing line (around L436):
```css
html.js-ready [data-parallax] { will-change: transform; }
```
Insert the following new block immediately after it (before the blank line and the `/* Header pill... */` comment):

```css

/* ─── Cartes : entrée 3D des couches internes (icône/texte/reflet) ───
   Le conteneur [data-tilt] ne tourne jamais lui-même (cf. tilt au survol,
   Layout.tsx) — seules ses couches internes animent, en cascade, quand
   son [data-stagger]/[data-hero] parent reçoit .in. */
html.js-ready [data-stagger] > [data-tilt] .tilt-image,
html.js-ready [data-hero] > [data-tilt] .tilt-image {
  opacity: 0;
  transform: perspective(700px) rotateX(35deg) rotateY(-14deg) scale(0.75);
  transition: opacity 0.5s var(--ease-out-expo) 0.12s,
              transform 0.65s var(--ease-out-expo) 0.12s;
}
html.js-ready [data-stagger].in > [data-tilt] .tilt-image,
html.js-ready [data-hero].in > [data-tilt] .tilt-image {
  opacity: 1;
  transform: none;
}
html.js-ready [data-stagger] > [data-tilt] .tilt-caption,
html.js-ready [data-hero] > [data-tilt] .tilt-caption {
  opacity: 0;
  transform: translateY(14px);
  transition: opacity 0.5s var(--ease-out-expo) 0.2s,
              transform 0.5s var(--ease-out-expo) 0.2s;
}
html.js-ready [data-stagger].in > [data-tilt] .tilt-caption,
html.js-ready [data-hero].in > [data-tilt] .tilt-caption {
  opacity: 1;
  transform: none;
}
html.js-ready [data-stagger] > [data-tilt] .tilt-shine,
html.js-ready [data-hero] > [data-tilt] .tilt-shine {
  opacity: 0;
  transform: translate(-40%, -40%);
  transition: opacity 0.5s ease 0.3s,
              transform 0.7s var(--ease-out-expo) 0.3s;
}
html.js-ready [data-stagger].in > [data-tilt] .tilt-shine,
html.js-ready [data-hero].in > [data-tilt] .tilt-shine {
  opacity: 1;
  transform: none;
}
```

- [ ] **Step 4: Fix the testimonial card reveal (add `html.js-ready` gate + rotateX)**

In `src/styles/app.css`, find and replace:

```css
.testimonial-card-in {
  opacity: 0;
  transform: translateY(24px) scale(0.96);
  transition: opacity 0.7s cubic-bezier(.16,1,.3,1), transform 0.7s cubic-bezier(.16,1,.3,1);
}
.testimonial-card-in.in { opacity: 1; transform: none; }
```

with:

```css
html.js-ready .testimonial-card-in {
  opacity: 0;
  transform: perspective(700px) rotateX(14deg) translateY(24px) scale(0.94);
  transition: opacity 0.7s cubic-bezier(.16,1,.3,1), transform 0.7s cubic-bezier(.16,1,.3,1);
}
html.js-ready .testimonial-card-in.in { opacity: 1; transform: none; }
```

(This also fixes a pre-existing robustness gap: previously `.testimonial-card-in` was hidden by default even when `html.js-ready` was never added — i.e. if JS failed to load, these cards stayed invisible forever. Gating behind `html.js-ready`, like every other reveal rule in this file, means they fall back to visible.)

- [ ] **Step 5: Rebuild CSS**

Run:
```bash
npm run build:css
```
Expected: completes without error.

- [ ] **Step 6: Re-run the Playwright check — expect GREEN**

Run:
```bash
node scratch-verify-tilt-reveal.js
```
Expected:
- `BEFORE scroll`: `"opacity":"0"` and a `transform` value that is **not** `"none"` (a `matrix3d(...)` string).
- `AFTER scroll`: `"opacity":"1"` and `"transform":"none"`.
- `TESTIMONIAL`: `"opacity":"1"` and `"transform":"none"` (page load already scrolled past hero, or the element observed on initial paint — if it prints `"opacity":"0"` instead, that's fine too as long as it is a valid CSS value, not `undefined`; the important regression check is that it is never permanently stuck invisible, confirmed by the JS still adding `.in` normally).

If `BEFORE scroll` still shows `"opacity":"1"`, check that `npm run build:css` actually completed after Step 3/4 edits and that the dev server response isn't cached — reload is unnecessary since Playwright launches a fresh browser each run, but confirm `public/static/tailwind.css` on disk contains the string `tilt-image` (`grep -c tilt-image public/static/tailwind.css` should print `1` or more).

- [ ] **Step 7: Verify reduced-motion fallback stays visible**

Run:
```javascript
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    localStorage.setItem('maasga_cgu_accepted', 'true');
    localStorage.setItem('maasga_cookies_accepted', 'true');
  });
  await page.goto('http://[::1]:5173/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.evaluate(() => {
    document.querySelectorAll('[data-stagger] [data-tilt] .tilt-image')[0]
      .scrollIntoView({ block: 'center' });
  });
  await page.waitForTimeout(300);
  const result = await page.evaluate(() => {
    const el = document.querySelectorAll('[data-stagger] [data-tilt] .tilt-image')[0];
    const cs = getComputedStyle(el);
    return { opacity: cs.opacity, transform: cs.transform };
  });
  console.log('REDUCED MOTION after scroll (300ms):', JSON.stringify(result));
  await browser.close();
})();
```
Expected: `"opacity":"1"` and `"transform":"none"` after only 300ms (the near-zero transition duration forced by `prefers-reduced-motion: reduce` means the reveal is effectively instant, not stuck mid-animation or invisible).

- [ ] **Step 8: Manual visual check of the four card grids and testimonials**

Using the Playwright skill (or a manual browser), navigate to `http://[::1]:5173/`, and for each of these sections, scroll it into view slowly and confirm visually that the icon settles from a tilted/scaled state into place, the caption follows just after, and the shine sweeps once, all without the card container itself rotating:
- "Notre Expertise" (3 cards)
- "Une approche professionnelle" (4 cards)
- "Nos fonctionnalités" (4 cards)
- "Ce que disent nos clients" (testimonial cards)

Take a screenshot mid-transition on at least one grid (e.g. `page.screenshot({ path: 'scratch-tilt-reveal-mid.png' })` right after `scrollIntoView` before the 1.5s wait) to confirm the icon is visibly mid-rotation, not just snapping in.

- [ ] **Step 9: Clean up the scratch verification file**

```bash
rm scratch-verify-tilt-reveal.js scratch-tilt-reveal-mid.png
```
Expected: files removed, `git status` shows no untracked leftovers from verification.

- [ ] **Step 10: Commit**

```bash
git add src/styles/app.css
git commit -m "$(cat <<'EOF'
feat: add 3D settle-in reveal to card icon/caption/shine on scroll

Cards already tilt on hover via .tilt-image/.tilt-caption/.tilt-shine
layers; this makes those same layers settle into place with a subtle
3D rotation as their grid scrolls into view, without rotating the card
container itself. Also gates .testimonial-card-in behind html.js-ready
so it falls back to visible if JS fails to load, matching every other
reveal rule in the file.
EOF
)"
```
Expected: commit succeeds, `git status` clean on `src/styles/app.css`.

---

## Self-Review Notes

- **Spec coverage:** icon settle-in (Step 3), caption follow (Step 3), shine sweep (Step 3), card container left untouched (Step 3, no `[data-tilt]` rule added), testimonial treatment + robustness fix (Step 4), reduced-motion (Step 7, inherited automatically — verified rather than re-implemented), propagation note (no task needed — it's a property of the generic selector, verified implicitly by targeting `[data-stagger] [data-tilt]` rather than a page-specific selector). All spec sections are covered by Task 1.
- **Placeholder scan:** no TBD/TODO; every step has literal code or commands.
- **Type consistency:** N/A (CSS-only, no function signatures to track across tasks — single task, single file).
