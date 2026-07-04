# Async Page Transitions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current full-page-reload navigation with async transitions — clicking an internal link fetches the destination page, swaps only `<main id="main-content">`, and shows a "big text sliding across the screen" overlay while loading, without a full HTTP navigation.

**Architecture:** A single new vanilla-JS module (embedded via `dangerouslySetInnerHTML` in `src/components/Layout.tsx`, same pattern as the existing GSAP engine) intercepts clicks on internal links and `popstate` events. It fetches the destination HTML, extracts `<main id="main-content">` and `<title>`, swaps them into the live DOM, re-executes the new `<main>`'s inline `<script>` tags, and re-runs the existing scroll-reveal/GSAP init scoped to the new content only. Two existing script blocks in `Layout.tsx` are refactored to expose reusable "reinit on a given root" functions so the new module can call into them without duplicating logic or double-initializing unrelated (unchanged) header/footer elements.

**Tech Stack:** Vanilla JS (no framework, no bundler for client code), Hono SSR (server unchanged), GSAP + ScrollTrigger (already loaded via CDN `<script defer>`), Tailwind CSS (`src/styles/app.css` → `public/static/tailwind.css`).

## Global Constraints

- Swap scope is `<main id="main-content">` only — header, nav, footer, `#page-transition` overlay, and `#cgu-modal` are never replaced.
- Excluded from the async pipeline entirely: `/admin*`, `#` anchors, `http(s)://` absolute URLs, `tel:`, `mailto:`, `target="_blank"` links — same filter list as today's handler, `/admin` added.
- Minimum overlay display time: 900ms, even when the fetch resolves faster (Cloudflare edge cache, 10 min TTL, makes fast responses common).
- Fetch timeout: 5000ms. On timeout, non-2xx response, missing `<main>` in the response, or any fetch rejection → fall back to `window.location.href = href` (real navigation), never leave the user stuck.
- All new CSS animations must use only `animation`/`transition` (no JS-driven `requestAnimationFrame` loops for the overlay) so the site-wide `@media (prefers-reduced-motion: reduce)` rule in `src/styles/app.css:431-437` (which forces `animation-duration: 0.001ms !important` / `transition-duration: 0.001ms !important` on `*`) neutralizes them automatically — no per-component reduced-motion override needed.
- No new npm dependencies. No test runner exists in this repo (`package.json` has no vitest/jest/playwright dependency) — verification is manual/browser-driven for every task, using concrete marker-based checks described in each task.

---

## File Map

| File | Change |
|---|---|
| `src/components/Layout.tsx` | Add `ROUTE_LABELS` constant; refactor two existing `<script>` blocks to expose `window.__maasgaInitPageBehaviors` and `window.__maasgaReinitGsap`; replace `#page-transition` markup; replace the old click-handler script block with the new async navigation module. |
| `src/styles/app.css` | Add `.pt-text` / `.pt-slide` / `@keyframes pt-slide-across` for the sliding-text overlay. |

No server-side (`src/index.tsx`) or database changes.

---

### Task 1: Expose reusable reinit hooks (no visible behavior change)

**Files:**
- Modify: `src/components/Layout.tsx:443-561` (the "Loader hide + Scroll Reveal + Scroll Progress + Back-to-top + Counter animation + Page transitions" script block)
- Modify: `src/components/Layout.tsx:572-653` (the GSAP declarative engine script block)

**Interfaces:**
- Produces: `window.__maasgaInitPageBehaviors(root)` — observes `.reveal,.reveal-left,.reveal-right`, `[data-reveal],[data-stagger],[data-hero]`, and `[data-count]` elements under `root` (defaults to `document`) with the existing (now module-level, reused) `IntersectionObserver` instances.
- Produces: `window.__maasgaReinitGsap(root)` — re-runs the GSAP parallax/magnetic/tilt wiring scoped to elements under `root` (defaults to `document`).

This task is pure refactor: hoist the three `IntersectionObserver` instances and the GSAP wiring logic out of their current one-shot `document.querySelectorAll(...)` calls into named functions that accept a `root` parameter, so they can run again later on just the newly-swapped `<main>` without re-touching header/footer/already-initialized elements (which would double-attach `mousemove`/`mouseleave` listeners on magnetic buttons and tilt cards outside the swap scope).

- [ ] **Step 1: Replace the script block at `Layout.tsx:443-561`**

Read the current block first to confirm line numbers still match (`sed -n '443,561p' src/components/Layout.tsx` or open the file), then replace the entire `<script dangerouslySetInnerHTML={{ __html: \`...\` }} />` block (from the `{/* Loader hide + ... */}` comment through the closing `` `}} /> `` after the old "Page transitions for internal links" handler) with:

```tsx
        {/* Loader hide + Scroll Reveal + Scroll Progress + Back-to-top + Counter animation */}
        <script dangerouslySetInnerHTML={{ __html: `
          // Hide loader (rapide si déjà visité)
          (function() {
            function hideLoader() {
              var l = document.getElementById('page-loader');
              if (!l || l.style.display === 'none') return;
              l.style.opacity = '0';
              l.style.visibility = 'hidden';
              setTimeout(function() { l.style.display = 'none'; }, 350);
            }
            // Use DOMContentLoaded instead of load — don't wait for external fonts/images
            if (document.readyState !== 'loading') { setTimeout(hideLoader, 50); }
            else { document.addEventListener('DOMContentLoaded', function() { setTimeout(hideLoader, 50); }); }
          })();

          // Scroll reveal (+ left/right variants) — classe legacy .visible
          var legacyRevealObserver = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
              if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                legacyRevealObserver.unobserve(entry.target);
              }
            });
          }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

          // Moteur de révélation data-* — robuste, indépendant de GSAP.
          // Ajoute .in dès que l'élément entre à l'écran (CSS gère l'anim + cascade).
          var revealObserver = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
              if (entry.isIntersecting) {
                entry.target.classList.add('in');
                revealObserver.unobserve(entry.target);
              }
            });
          }, { threshold: 0.05, rootMargin: '0px 0px -8% 0px' });

          // Animated number counters
          var counterObserver = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
              if (entry.isIntersecting) {
                var el = entry.target;
                var target = el.getAttribute('data-count');
                var isNum = /^\\d+$/.test(target);
                if (isNum) {
                  var end = parseInt(target);
                  var duration = 1800;
                  var startTime = null;
                  function animate(timestamp) {
                    if (!startTime) startTime = timestamp;
                    var progress = Math.min((timestamp - startTime) / duration, 1);
                    var eased = 1 - Math.pow(1 - progress, 3);
                    el.textContent = Math.floor(eased * end) + (el.getAttribute('data-suffix') || '');
                    if (progress < 1) requestAnimationFrame(animate);
                  }
                  requestAnimationFrame(animate);
                }
                counterObserver.unobserve(el);
              }
            });
          }, { threshold: 0.3 });

          // Attache les 3 observers ci-dessus à tout élément concerné sous root —
          // document au chargement initial, le nouveau <main> après un swap de
          // transition async (voir bloc "ASYNC PAGE TRANSITIONS" plus bas).
          function initPageBehaviors(root) {
            root = root || document;
            root.querySelectorAll('.reveal,.reveal-left,.reveal-right').forEach(function(el) { legacyRevealObserver.observe(el); });
            root.querySelectorAll('[data-reveal],[data-stagger],[data-hero]').forEach(function(el) { revealObserver.observe(el); });
            root.querySelectorAll('[data-count]').forEach(function(el) { counterObserver.observe(el); });
          }
          window.__maasgaInitPageBehaviors = initPageBehaviors;

          document.addEventListener('DOMContentLoaded', function() {
            // Close "Plus" dropdown on outside click
            document.addEventListener('click', function(e) {
              var dd = document.getElementById('nav-more-dropdown');
              var wr = document.getElementById('nav-more-wrapper');
              if (dd && wr && !wr.contains(e.target)) dd.classList.add('hidden');
            });
            // Close mobile menu on link click
            document.querySelectorAll('#mobile-menu a').forEach(function(a) {
              a.addEventListener('click', function() {
                var m = document.getElementById('mobile-menu');
                if (m) m.classList.remove('open');
              });
            });

            // Profile avatar: show first letter of name when logged in
            (function() {
              fetch('/api/session-check', { credentials: 'same-origin' })
                .then(function(r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
                .then(function(data) {
                  if (data && data.loggedIn && data.name) {
                    var btn = document.getElementById('user-nav-btn');
                    if (!btn) return;
                    var letter = data.name.trim().charAt(0).toUpperCase();
                    btn.innerHTML = '<span style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#0077b6,#0ea5e9);color:#fff;font-weight:800;font-size:0.85rem;display:flex;align-items:center;justify-content:center;pointer-events:none;">' + letter + '</span>';
                    btn.style.padding = '0';
                    btn.title = data.name;
                  }
                })
                .catch(function() {});
            })();

            initPageBehaviors(document);

            var backToTop = document.getElementById('back-to-top');
            var headerPill = document.getElementById('header-pill');
            window.addEventListener('scroll', function() {
              var scrollTop = window.scrollY;
              if (backToTop) backToTop.style.display = scrollTop > 400 ? 'flex' : 'none';
              if (headerPill) headerPill.classList.toggle('scrolled', scrollTop > 20);
            }, { passive: true });
          });
        `}} />
```

Note what changed vs. the original: the three observers and the counter logic are unchanged, but they're now created once at top level (not re-created inside `DOMContentLoaded`), wrapped by `initPageBehaviors(root)`, and the old **"Page transitions for internal links (rapide)"** click handler (previously the last 12 lines of this block) is deleted here — it's replaced entirely by a new dedicated module in Task 3.

- [ ] **Step 2: Replace the GSAP engine block at `Layout.tsx:572-653`**

Replace the script content (keep the surrounding comment and `<script dangerouslySetInnerHTML={{ __html: \`...\`}} />` wrapper) with:

```tsx
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

            function initGsap(root) {
              root = root || document;
              if (!window.gsap || !window.ScrollTrigger) return false;
              var gsap = window.gsap;
              gsap.registerPlugin(window.ScrollTrigger);

              // Les reveals/cascades sont gérés en CSS+IntersectionObserver (robuste).
              // GSAP n'ajoute QUE des enrichissements : parallax + CTA magnétiques.
              if (reduce) return true;

              gsap.utils.toArray(root.querySelectorAll('[data-parallax]')).forEach(function(el) {
                var amount = parseFloat(el.getAttribute('data-parallax')) || 30;
                amount = Math.max(-80, Math.min(80, amount));
                gsap.to(el, {
                  y: amount, ease: 'none',
                  scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 1 }
                });
              });

              if (finePointer) {
                root.querySelectorAll('.magnetic').forEach(function(btn) {
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

                // Tilt parallax — cartes avec [data-tilt], couches .tilt-image/.tilt-caption/.tilt-shine
                root.querySelectorAll('[data-tilt]').forEach(function(card) {
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
              }
              return true;
            }
            window.__maasgaReinitGsap = initGsap;

            // GSAP chargé en defer : on tente jusqu'à ~3s, sinon le contenu reste visible
            if (!initGsap(document)) {
              var tries = 0;
              var iv = setInterval(function() {
                tries++;
                if (initGsap(document) || tries > 60) clearInterval(iv);
              }, 50);
            }
          })();
        `}} />
```

- [ ] **Step 3: Regression-verify no behavior changed**

Run: `npm run build:css && npm run build && npm run dev:sandbox`

Open `http://localhost:3000/` in a browser (or use the Playwright skill). Verify:
- Page loads, loader hides, header pill still adds `.scrolled` on scroll.
- Scroll down the home page — sections with `data-reveal`/`data-stagger` still fade/slide in (unchanged visually).
- Hover over a card with `[data-tilt]` — tilt/shine effect still works.
- Open the browser console and run `typeof window.__maasgaInitPageBehaviors` and `typeof window.__maasgaReinitGsap` — both must print `"function"`.
- Clicking an internal nav link still does a **full page reload** (unchanged — Task 3 replaces this).

- [ ] **Step 4: Commit**

```bash
git add src/components/Layout.tsx
git commit -m "refactor: expose page-behavior and GSAP reinit hooks scoped to a root element"
```

---

### Task 2: Route labels + overlay visual assets

**Files:**
- Modify: `src/components/Layout.tsx:3-14` (add `ROUTE_LABELS` after `PAGE_LABELS`)
- Modify: `src/components/Layout.tsx:199-202` (overlay markup)
- Modify: `src/styles/app.css` (insert after the `.icon-pulse` block, `app.css:362-372`)

**Interfaces:**
- Produces: `ROUTE_LABELS` (server-side `Record<string,string>`, path → display label), serialized into the client script in Task 3 via `${JSON.stringify(ROUTE_LABELS)}`.
- Produces: CSS classes `.pt-text` (base/rest state) and `.pt-text.pt-slide` (triggers the slide-across animation), plus `#page-transition-text` element id for JS to target.

- [ ] **Step 1: Add `ROUTE_LABELS` in `Layout.tsx`, right after the existing `PAGE_LABELS` constant (`Layout.tsx:3-14`)**

```ts
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

// Mapping route → libellé pour le texte de l'overlay de transition de page
// (client-side, voir bloc ASYNC PAGE TRANSITIONS). Couvre toutes les routes
// publiques définies dans src/index.tsx ; /admin* n'a pas besoin d'entrée
// puisqu'il est exclu du pipeline de transition.
const ROUTE_LABELS: Record<string, string> = {
  "/": PAGE_LABELS.home,
  "/catalogue": PAGE_LABELS.catalogue,
  "/contrat-maintenance": PAGE_LABELS.maintenance,
  "/simulateur": PAGE_LABELS.simulateur,
  "/rendez-vous": PAGE_LABELS.rdv,
  "/avis": PAGE_LABELS.avis,
  "/a-propos": PAGE_LABELS.apropos,
  "/contact": PAGE_LABELS.contact,
  "/realisations": PAGE_LABELS.realisations,
  "/espace-client": PAGE_LABELS.client,
}
```

- [ ] **Step 2: Replace the overlay markup at `Layout.tsx:199-202`**

```tsx
        {/* PAGE TRANSITION OVERLAY — grand texte qui traverse pendant le fetch async */}
        <div id="page-transition" style="position:fixed; inset:0; z-index:99999; background:#03045e; display:flex; align-items:center; justify-content:center; overflow:hidden; transition:opacity 0.3s ease; pointer-events:none; opacity:0;">
          <span id="page-transition-text" class="pt-text"></span>
        </div>
```

- [ ] **Step 3: Add CSS in `src/styles/app.css`, right after the `.icon-pulse` block (after `app.css:372`, before the `/* ─── MOBILE MENU ─── */` comment)**

```css
/* ─── Page transition overlay : texte qui glisse (async page transitions) ─── */
.pt-text {
  position: absolute;
  white-space: nowrap;
  font-weight: 800;
  font-size: clamp(2rem, 8vw, 4.5rem);
  color: #caf0f8;
  letter-spacing: -0.02em;
  transform: translateX(110%);
}
.pt-text.pt-slide {
  animation: pt-slide-across 1s var(--ease-out-expo) forwards;
}
@keyframes pt-slide-across {
  from { transform: translateX(110%); }
  to { transform: translateX(-110%); }
}
```

- [ ] **Step 4: Verify visually (markup renders, no JS wired yet)**

Run: `npm run build:css && npm run build && npm run dev:sandbox`, open `http://localhost:3000/`. Open the browser console and run:

```js
var t = document.getElementById('page-transition-text');
t.textContent = 'Catalogue';
document.getElementById('page-transition').style.opacity = '1';
t.classList.add('pt-slide');
```

Expected: the screen goes navy blue and "Catalogue" in large bold light-blue text slides from right to left across the screen once. Run `document.getElementById('page-transition').style.opacity = '0'` to hide it again. Confirm the same in a mobile viewport width (Playwright `page.setViewportSize({width: 375, height: 667})` or DevTools device toolbar) — text must not overflow horizontally (the `clamp()` font-size keeps it from being too wide even on small screens, since `white-space: nowrap` + oversized text on a narrow screen would otherwise take longer to fully traverse but never truly overflow the fixed, `overflow:hidden` overlay).

- [ ] **Step 5: Commit**

```bash
git add src/components/Layout.tsx src/styles/app.css
git commit -m "feat: add route labels and sliding-text overlay assets for page transitions"
```

---

### Task 3: Core async navigation (fetch + DOM swap)

**Files:**
- Modify: `src/components/Layout.tsx` — add a new script block right after the GSAP engine block (after the block modified in Task 1 Step 2, i.e. right before the CGU-modal script block that currently starts at the old `Layout.tsx:655`).

**Interfaces:**
- Consumes: `window.__maasgaInitPageBehaviors(root)` and `window.__maasgaReinitGsap(root)` from Task 1; `ROUTE_LABELS` (serialized) and the `#page-transition` / `#page-transition-text` markup from Task 2.
- Produces: click-driven async navigation for internal links. `popstate` support and error fallback are intentionally minimal here (hardening comes in Tasks 4–5) but the module's structure (`navigate(href, isPopstate)`) already accepts a `popstate` flag so Task 4 only adds the event listener, no reshaping.

- [ ] **Step 1: Add the new script block**

Insert this new `<script>` block immediately after the GSAP engine `<script>` block from Task 1 Step 2 (i.e., between it and the `{/* CGU MODAL logic */}` script block):

```tsx
        {/* ASYNC PAGE TRANSITIONS — fetch + swap de <main>, overlay texte qui glisse */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            var MIN_DISPLAY_MS = 900;
            var FETCH_TIMEOUT_MS = 5000;
            var ROUTE_LABELS = ${JSON.stringify(ROUTE_LABELS)};
            var navigationInProgress = false;

            function labelForPath(pathname) {
              if (ROUTE_LABELS[pathname]) return ROUTE_LABELS[pathname];
              var segment = pathname.split('/').filter(Boolean).pop() || 'Accueil';
              return segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
            }

            function showOverlay(label) {
              var overlay = document.getElementById('page-transition');
              var text = document.getElementById('page-transition-text');
              if (!overlay || !text) return;
              text.textContent = label;
              text.classList.remove('pt-slide');
              void text.offsetWidth; // force reflow so the animation restarts every time
              text.classList.add('pt-slide');
              overlay.style.opacity = '1';
              overlay.style.pointerEvents = 'all';
            }

            function hideOverlay() {
              var overlay = document.getElementById('page-transition');
              if (overlay) {
                overlay.style.opacity = '0';
                overlay.style.pointerEvents = 'none';
              }
            }

            function runNewMainScripts(main) {
              main.querySelectorAll('script').forEach(function(oldScript) {
                var newScript = document.createElement('script');
                for (var i = 0; i < oldScript.attributes.length; i++) {
                  var attr = oldScript.attributes[i];
                  newScript.setAttribute(attr.name, attr.value);
                }
                newScript.textContent = oldScript.textContent;
                oldScript.parentNode.replaceChild(newScript, oldScript);
              });
            }

            function swapContent(html) {
              var doc = new DOMParser().parseFromString(html, 'text/html');
              var newMain = doc.getElementById('main-content');
              var currentMain = document.getElementById('main-content');
              if (!newMain || !currentMain) return false;
              document.adoptNode(newMain);
              currentMain.replaceWith(newMain);
              document.title = doc.title;
              runNewMainScripts(newMain);
              if (window.__maasgaInitPageBehaviors) window.__maasgaInitPageBehaviors(newMain);
              if (window.__maasgaReinitGsap) window.__maasgaReinitGsap(newMain);
              return true;
            }

            function navigate(href, isPopstate) {
              if (navigationInProgress) return;
              navigationInProgress = true;
              var pathname = href.split('?')[0].split('#')[0];
              showOverlay(labelForPath(pathname));

              var minTimer = new Promise(function(resolve) { setTimeout(resolve, MIN_DISPLAY_MS); });
              var fetchPromise = fetch(href, { credentials: 'same-origin' })
                .then(function(res) {
                  if (!res.ok) throw new Error('HTTP ' + res.status);
                  return res.text();
                });

              Promise.all([fetchPromise, minTimer]).then(function(results) {
                var ok = swapContent(results[0]);
                if (!ok) { window.location.href = href; return; }
                hideOverlay();
                navigationInProgress = false;
              }).catch(function() {
                window.location.href = href;
              });
            }

            document.addEventListener('click', function(e) {
              var link = e.target.closest('a[href]');
              if (!link) return;
              var href = link.getAttribute('href');
              if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('tel:') || href.startsWith('mailto:') || href.startsWith('/admin') || link.target === '_blank') return;
              e.preventDefault();
              navigate(href, false);
            });

            window.__maasgaNavigate = navigate; // exposé pour le hardening des tâches suivantes
          })();
        `}} />
```

- [ ] **Step 2: Verify async swap works (no full reload)**

Run: `npm run build:css && npm run build && npm run dev:sandbox`, open `http://localhost:3000/`.

In the browser console, set a marker that only survives if the page does NOT fully reload:

```js
window.__navMarker = 'still-here';
```

Click the "Catalogue" nav link. Expected:
- The navy overlay appears with "Catalogue" sliding across for roughly 900ms–1s.
- The URL bar updates to `/catalogue` — but check the Network tab: exactly **one** `fetch` request to `/catalogue` (type `fetch`, not `document`).
- After the overlay hides, run `window.__navMarker` in the console again — it must still print `'still-here'`. If the page had done a real navigation, this variable would be gone (reset to `undefined`).
- `document.title` must now be the catalogue page's title (check via `document.title`).
- The catalogue's product cards must be visible and interactive (scroll down — `data-reveal` sections should fade in; hover a product card — tilt effect should work), confirming `__maasgaInitPageBehaviors`/`__maasgaReinitGsap` ran on the swapped content.
- Click "Accueil" to go back — same checks, `window.__navMarker` still present.

- [ ] **Step 3: Commit**

```bash
git add src/components/Layout.tsx
git commit -m "feat: implement async page transitions (fetch + main swap, no full reload)"
```

---

### Task 4: Back/forward navigation (`popstate`)

**Files:**
- Modify: `src/components/Layout.tsx` (the script block added in Task 3)

**Interfaces:**
- Consumes: `navigate(href, isPopstate)` from Task 3 (already accepts the flag; this task wires the `popstate` listener and adds the `pushState` call gated by that flag).

- [ ] **Step 1: Add `history.pushState` on successful client-triggered navigation, and a `popstate` listener**

In the `navigate` function's success branch (inside `Promise.all([...]).then(...)`, right after `var ok = swapContent(results[0]);` and its `if (!ok) { ...; return; }` guard), add the `pushState` call:

```js
              Promise.all([fetchPromise, minTimer]).then(function(results) {
                var ok = swapContent(results[0]);
                if (!ok) { window.location.href = href; return; }
                if (!isPopstate) history.pushState(null, '', href);
                hideOverlay();
                navigationInProgress = false;
              }).catch(function() {
                window.location.href = href;
              });
```

Then, right after the `window.__maasgaNavigate = navigate;` line, add:

```js
            window.addEventListener('popstate', function() {
              navigate(window.location.pathname + window.location.search, true);
            });
```

- [ ] **Step 2: Verify back/forward triggers the same transition**

Run: `npm run build:css && npm run build && npm run dev:sandbox`, open `http://localhost:3000/`.

1. Click "Catalogue" (overlay + swap, as in Task 3).
2. Click "Contact" (overlay + swap again).
3. Click the browser's **back** button. Expected: the overlay appears with "Catalogue" sliding across, `<main>` swaps back to the catalogue content, URL bar shows `/catalogue`, `document.title` matches.
4. Click the browser's **forward** button. Expected: overlay with "Contact", swaps forward, URL shows `/contact`.
5. Re-run the `window.__navMarker` check from Task 3 Step 2 before step 1 — it must still be defined after all of the above (confirms no full reload happened even via back/forward).

- [ ] **Step 3: Commit**

```bash
git add src/components/Layout.tsx
git commit -m "feat: support browser back/forward in async page transitions"
```

---

### Task 5: Error fallback + ScrollTrigger cleanup

**Files:**
- Modify: `src/components/Layout.tsx` (the script block from Tasks 3–4)

**Interfaces:**
- Consumes: `window.ScrollTrigger` (global, loaded via CDN, already used by `__maasgaReinitGsap`).
- Produces: no new externally-visible function — hardens `navigate`/`swapContent` internally.

Two robustness gaps remain from Tasks 3–4:
1. **Timeout is not actually enforced** — `fetch()` has no abort wiring yet, so a hung request would never fall back until the browser's own (much longer) default timeout.
2. **GSAP `ScrollTrigger` instances created for `[data-parallax]` elements are never killed** when their `<main>` is replaced — each navigation would silently accumulate dead `ScrollTrigger` entries bound to detached DOM elements (memory/perf leak on a long browsing session).

- [ ] **Step 1: Add fetch timeout via `AbortController`**

Replace the `fetchPromise` construction in `navigate`:

```js
              var controller = new AbortController();
              var timeoutId = setTimeout(function() { controller.abort(); }, FETCH_TIMEOUT_MS);
              var fetchPromise = fetch(href, { credentials: 'same-origin', signal: controller.signal })
                .then(function(res) {
                  clearTimeout(timeoutId);
                  if (!res.ok) throw new Error('HTTP ' + res.status);
                  return res.text();
                });
```

- [ ] **Step 2: Kill stale `ScrollTrigger`s for the old `<main>` before replacing it**

In `swapContent`, right before `currentMain.replaceWith(newMain);`, add:

```js
              if (window.ScrollTrigger) {
                window.ScrollTrigger.getAll().forEach(function(st) {
                  if (st.trigger && currentMain.contains(st.trigger)) st.kill();
                });
              }
```

So the full `swapContent` function now reads:

```js
            function swapContent(html) {
              var doc = new DOMParser().parseFromString(html, 'text/html');
              var newMain = doc.getElementById('main-content');
              var currentMain = document.getElementById('main-content');
              if (!newMain || !currentMain) return false;
              document.adoptNode(newMain);
              if (window.ScrollTrigger) {
                window.ScrollTrigger.getAll().forEach(function(st) {
                  if (st.trigger && currentMain.contains(st.trigger)) st.kill();
                });
              }
              currentMain.replaceWith(newMain);
              document.title = doc.title;
              runNewMainScripts(newMain);
              if (window.__maasgaInitPageBehaviors) window.__maasgaInitPageBehaviors(newMain);
              if (window.__maasgaReinitGsap) window.__maasgaReinitGsap(newMain);
              return true;
            }
```

- [ ] **Step 3: Verify the timeout fallback**

Run: `npm run build:css && npm run build && npm run dev:sandbox`, open `http://localhost:3000/`. Use DevTools → Network tab → set throttling to "Offline", then click an internal nav link.

Expected: after ~5 seconds, the browser performs a **real navigation** (address bar shows a full page load — the URL changes and a fresh `document`-type request appears in the Network tab once you go back online, or immediately errors out to a browser offline error page, both acceptable — the key check is that it did NOT hang forever showing the overlay).

Turn throttling back to "Online", reload, and confirm a normal click still works exactly as in Task 3 Step 2 (overlay for ~900ms–1s, one `fetch` request, swap succeeds).

- [ ] **Step 4: Verify `ScrollTrigger` cleanup**

With throttling back to Online: open `http://localhost:3000/`, run `window.ScrollTrigger.getAll().length` in the console and note the number. Navigate to `/catalogue` (which also has `[data-parallax]`/`[data-tilt]` elements), then back to `/` again. Run `window.ScrollTrigger.getAll().length` again — it should be roughly the same order of magnitude as the first reading (not growing unbounded after each round-trip), confirming old triggers are killed rather than accumulating.

- [ ] **Step 5: Commit**

```bash
git add src/components/Layout.tsx
git commit -m "fix: enforce fetch timeout and kill stale ScrollTriggers on page transition swap"
```

---

### Task 6: GA4 virtual pageview + full regression pass

**Files:**
- Modify: `src/components/Layout.tsx` (the script block from Tasks 3–5)

**Interfaces:**
- Consumes: `window.gtag` (global function, already loaded by the existing GA4 snippet at `Layout.tsx:121-132`).

GA4's `gtag('config', ...)` call only fires once per real page load (`Layout.tsx:131`, using `page_path: window.location.pathname` at load time). Since async transitions never reload the document, subsequent navigations need an explicit virtual pageview event or GA4 will only ever see the very first page of a session.

- [ ] **Step 1: Send a virtual pageview after each successful swap**

In `navigate`'s success branch, right after `if (!isPopstate) history.pushState(null, '', href);`, add:

```js
                if (typeof window.gtag === 'function') {
                  window.gtag('event', 'page_view', { page_path: pathname, page_title: document.title });
                }
```

(`pathname` is already in scope — computed at the top of `navigate` via `href.split('?')[0].split('#')[0]`.)

- [ ] **Step 2: Verify the GA4 event fires**

Run: `npm run build:css && npm run build && npm run dev:sandbox`, open `http://localhost:3000/`. Accept cookies (consent banner — required for `analytics_storage: 'granted'`, otherwise GA4 requests are blocked by design, same as today). Open DevTools → Network tab, filter by `collect` or `g/collect`. Click an internal nav link. Expected: a new request to Google Analytics' collect endpoint fires after the swap, distinct from the one that fired on initial page load.

- [ ] **Step 3: Full regression pass across the site**

Using the Playwright skill (or manual browser testing), walk through the full test plan from the design spec (`docs/superpowers/specs/2026-07-04-async-page-transitions-design.md`):

1. Navigate home → catalogue → contact → home using nav links only. Confirm at each step: overlay shows the correct destination label, `<main>` content is correct, `document.title` is correct, exactly one `fetch` per navigation (no `document`-type requests), `window.__navMarker` (set once at the very start) survives the whole sequence.
2. On the contact page, submit the contact form (or at minimum confirm its client-side validation JS still runs — this exercises `runNewMainScripts` against a real page-specific inline script, not just the shared engine).
3. Use back/forward buttons through the same sequence — confirm transitions replay correctly (Task 4).
4. In DevTools, enable "Emulate CSS media feature `prefers-reduced-motion: reduce`". Reload, click a nav link: confirm the swap still happens (fetch, title, URL all update) but the overlay text does not visibly slide (appears/disappears near-instantly, per the global reduced-motion CSS override) — screenshot both states if using Playwright.
5. Click any link pointing at `/admin` if one exists in the current build (there isn't one in the public nav today, but confirm by grep: `grep -rn 'href="/admin"' src/` returns nothing) — if none exists, explicitly type `/admin` in the address bar instead and confirm it always does a full server-rendered load (expected — `/admin` uses `AdminLayout`, a different component that never includes this script, so there is nothing to intercept).
6. Confirm `npm run build` completes with no new TypeScript errors beyond the pre-existing ones already noted in `HANDOFF.md` (mobile/paiement/activity-log section) — run `npx tsc --noEmit` if unsure whether a given error predates this change, comparing against `git stash` output on the base commit.

- [ ] **Step 4: Commit**

```bash
git add src/components/Layout.tsx
git commit -m "feat: send GA4 virtual pageview on async page transitions"
```

---

## Self-Review Notes

- **Spec coverage:** ambition (async fetch+swap) → Task 3; swap scope (`<main>` only) → Tasks 2–3; script re-execution → Task 3 (`runNewMainScripts`); page scope (`/admin*` excluded) → Task 3 Step 1 click filter + Task 6 Step 3.5 verification; overlay style (variant A) → Task 2; error fallback → Task 5; back/forward → Task 4; minimum overlay duration → Task 3; GA4 → Task 6. All spec sections have a task.
- **Type/name consistency checked:** `window.__maasgaInitPageBehaviors` and `window.__maasgaReinitGsap` (Task 1) are called with the same names and single `root` argument everywhere they're consumed (Task 3's `swapContent`). `ROUTE_LABELS` (Task 2, server-side TS) matches the variable name used in Task 3's serialized client script. `navigate(href, isPopstate)` signature introduced in Task 3 matches its two call sites added in Task 3 (click handler) and Task 4 (`popstate` listener).
- **No placeholders:** every step includes complete, runnable code — no "add error handling here" or "similar to Task N" shortcuts.
