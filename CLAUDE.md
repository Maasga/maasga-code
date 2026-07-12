# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development (Vite dev server — SSR via @hono/vite-dev-server)
npm run dev            # starts on :5173 (may shift to :5174 if port busy)

# CSS MUST be rebuilt separately — dev server does NOT auto-compile Tailwind
npm run build:css      # tailwindcss src/styles/app.css → public/static/tailwind.css

# Production build (always runs build:css first)
npm run build          # build:css + vite build → dist/_worker.js (~1 MB limit)

# Deploy to Cloudflare Pages
npm run deploy         # build + wrangler pages deploy --project-name maasga-website

# D1 database migrations
npm run migrate        # apply migrations to remote (production) D1
npm run migrate:local  # apply migrations to local D1 (wrangler dev)

# Wrangler local sandbox (uses built dist/, not source)
npm run dev:sandbox    # wrangler pages dev dist --port 3000
```

> **Critical**: when editing `src/styles/app.css` or `tailwind.config.cjs`, always run `npm run build:css` before testing in the browser. `npm run dev` serves `public/static/tailwind.css` statically — new Tailwind classes won't appear otherwise.

## Architecture

### Runtime
- **Cloudflare Pages** with a **Cloudflare Worker** (`dist/_worker.js`)
- **Hono** framework for routing and SSR — all pages are server-rendered JSX (`.tsx`) via `hono/jsx`
- **Zero client-side hydration** — no React, no VDOM on the client. Interactive behaviour is vanilla JS injected via `dangerouslySetInnerHTML` blocks inside JSX components
- **D1 (SQLite)** for all persistent data — bound as `c.env.DB` in every route handler
- Worker bundle ceiling: ~1 MB. Current build: ~1,062 KB. Avoid adding server-side dependencies

### Request flow
```
Browser → Cloudflare PoP (edge cache, 10 min TTL for public pages)
       → Worker (src/index.tsx)
         ├── Middleware: edge cache, security headers, rate limiting
         ├── GET /page     → import Page component → return c.html(<Page />)
         └── POST /api/*   → validate → D1 query → JSON response
```

### Key files
| File | Role |
|------|------|
| `src/index.tsx` | Single entry point — all routes, middleware, API handlers |
| `src/types.ts` | `HonoEnv` type (Bindings: DB, ADMIN_SECRET, API keys…) |
| `src/db.ts` | D1 query functions (never import D1 directly in pages) |
| `src/utils/helpers.ts` | `escapeHtml`, `isValidEmail`, `isValidPhone`, `validateImageMagicBytes` |
| `src/utils/notifications.ts` | Telegram bot, SMS (Brevo), admin notifications, activity/security logging |
| `src/components/Layout.tsx` | Global HTML shell, nav, footer, GSAP engine, `AnimatedIcon` (LordIcon) |
| `src/components/CGUModal.tsx` | CGU/cookie consent — uses `localStorage` key `maasga_cgu_accepted` |
| `src/styles/app.css` | Source CSS — design tokens in `:root`, utility classes, Tailwind `@layer` |
| `public/static/tailwind.css` | **Compiled output** — do not edit manually |
| `tailwind.config.cjs` | Tailwind config — content paths, custom colors/fonts/shadows |

### CSS / design system
- Source: `src/styles/app.css` → compiled by `build:css` → `public/static/tailwind.css`
- Design tokens in `:root`: `--primary`, `--accent`, `--dark`, `--secondary`, shadow scale (`--shadow-sm/md/lg/xl`), easing (`--ease-out-expo`, `--ease-spring`)
- Key utility classes: `.glass`, `.glass-card`, `.glass-premium`, `.gradient-hero`, `.btn-primary`, `.btn-secondary`, `.input-field`, `.hover-lift`, `.frost-grain`, `.frost-edge`, `.surface`, `.surface-elevated`, `.display-1`, `.display-2`
- **Animation attributes** (handled globally by GSAP engine in `Layout.tsx`): `data-reveal` (scroll reveal), `data-stagger` (cascade children), `data-parallax="N"` (parallax px offset), `data-count="N" data-suffix="X"` (number counter), `.magnetic` (mouse-tracking hover on desktop)
- **Card tilt** (`[data-tilt]`, handled in the same GSAP engine): the **whole card tilts in 3D** toward the cursor (`rotateY: x*20`, `rotateX: -y*20` → up to ±10° each; `transformPerspective:900` + `transformOrigin:center` set once via `gsap.set`). Mouse tracking is deliberately **snappy**: `gsap.to(card, { …, duration:0.14, ease:'power2.out', overwrite:'auto' })` on `mousemove` — a longer duration *without* `overwrite` made tweens pile up so the tilt visibly lagged the cursor. `mouseleave` → accentuated elastic return (`elastic.out(1.3, 0.3)`, ~1.05s). **No inner-layer hover parallax** and **the `.tilt-shine` glare is removed** (global `.tilt-shine{display:none!important}` in `app.css`; the `.tilt-image`/`.tilt-caption`/`.tilt-shine` divs may still exist in markup but do **not** move on hover). Hover also gets an accentuated CSS cue: `[data-tilt]:hover` → accent-cyan ring + border + deep shadow. Applied site-wide on public pages (home, catalogue, à-propos, avis, simulateur[display cards only], rendez-vous, contact, réalisations); **not** on espace-client/admin. **Runs even under `prefers-reduced-motion`** — the tilt is a *direct pointer interaction*, not an auto-played animation, so the GSAP init no longer early-returns on `reduce` (only `data-parallax` scroll-motion stays gated), and `[data-tilt]` is excluded from the reduced-motion `transform:none !important` reveal-reset so GSAP's inline transform wins. ⚠️ **GSAP loads from cdnjs `<script defer>` and can take several seconds on a slow network** — the init now polls ~20s **and** re-runs on `window 'load'` (guarded by a `gsapInited` flag), so the tilt attaches automatically even on slow loads; previously it gave up at 3s and the tilt only started working after a navigation re-triggered `__maasgaReinitGsap`. (History: pre-2026-07 only `.tilt-image` rotated; a mid-2026-07 pass added whole-card tilt + moving layers + shine; those layers/shine were then removed and tracking made snappy per user feedback.)
- `.icon-pulse`: continuous CSS scale pulse (2.2s loop) — apply to the icon `<i>` glyph itself, never to a `.tilt-image` wrapper (would fight the GSAP transform on the same element).
- **Card layer scroll-reveal** (`.tilt-image`/`.tilt-caption`/`.tilt-shine` inside a `[data-tilt]` card that itself sits inside `[data-stagger]`/`[data-hero]`): these layers get their own nested 3D "settle-in" transition, independent of the mouse-hover tilt, that fires when the parent grid's `.in` class is added — icon rotates in via `perspective`/`rotateX`/`rotateY`/`scale`, caption follows with `translateY`, shine sweeps in with `translate` — each with its own `transition-delay` (0.12s/0.2s/0.3s) so they cascade after the card itself. The `[data-tilt]` container itself gets no transform in this CSS settle-in (only its inner layers animate) — note this differs from the hover tilt, which *does* now rotate the container in 3D (see above). Pure CSS, no JS/markup needed — it rides the existing `.in` class the reveal engine already toggles, so it also applies automatically anywhere else the same `[data-stagger]/[data-hero]` + `[data-tilt]` + layer-class pattern is used (e.g. catalogue product cards use `.reveal`, not `[data-stagger]`, so they are **not** currently affected by this).
- All animations respect `prefers-reduced-motion` — a global CSS block and GSAP guard disable everything when set. **If a user reports "animations aren't playing," check their OS/browser reduced-motion setting first — most sessions' first hypothesis should be this, not a code bug.** The reduced-motion block zeroes both `transition-duration` **and** `transition-delay` on the universal selector (`*, *::before, *::after`) — duration alone isn't enough, since per-element `transition-delay` (stagger cascades, nested card-layer delays above) would otherwise still make the user wait out the delay before the near-instant transition kicks in.

### GSAP animation engine
Injected once in `Layout.tsx` via `dangerouslySetInnerHTML`. It:
1. Polls for `window.gsap` + `window.ScrollTrigger` (loaded from cdnjs via `<script defer>`)
2. Adds `html.gsap-ready` class — CSS uses this to set initial `opacity:0; transform:translateY(24px)` on `[data-reveal]` / `[data-stagger] > *` elements (prevents FOUC if GSAP fails)
3. Wires up all `data-*` attributes site-wide — pages only need HTML attributes, no per-page JS

### Home — « Notre Expertise » (split-screen pinned / sticky scroll)
The home services section ([home.tsx](src/pages/home.tsx), `#services.expertise-pin`) is a **pinned split-screen scroll storytelling** (Codrops-style). On desktop (`lg+`) the `.expertise-stage` is `position:sticky; top:0; min-height:100vh` and its wrapper `.expertise-pin` is `height:320vh`, so the stage **stays pinned** while ~220vh of scroll drives the 3 steps. Left = 3 `.exp-step` text blocks stacked in a single CSS-grid cell (`grid-area:1/1`) and cross-faded; right = a navy `.exp-panel` whose stacked `.exp-visual` icons cross-fade (`scale/rotate`); `.exp-dot`s show progress. Driven by a small inline **IIFE script right after the section** (`window.__maasgaExpertiseCleanup`): it reads `section.getBoundingClientRect()` in `requestAnimationFrame` on `scroll`/`resize`, computes progress `= clamp(-rect.top, 0, rect.height-vh) / (rect.height-vh)`, and toggles `.is-active` on the `.exp-step`/`.exp-visual`/`.exp-dot` for the matching bucket (`floor(p*n)`). **Deliberately no GSAP ScrollTrigger** — CSS `sticky` avoids pin-spacer + PJAX-cleanup fragility and the slow-GSAP dependency, and it works with reduced-motion. PJAX-safe: on re-exec it calls the previous `__maasgaExpertiseCleanup` to remove old `scroll`/`resize` listeners before re-binding. Mobile (`<lg`): **no pin** — `.exp-right` is hidden and every `.exp-step` shows as a normal vertical list (each with its own `.exp-step-icon`). All `.exp-*` styles live in `app.css`. To change the expertises, edit the `EXPERTISES` array at the top of `HomePage`.

### Async page transitions (client-side router)
All internal navigation on public pages is intercepted and handled without a full HTTP reload — a hand-rolled PJAX-style router, injected in `Layout.tsx` right after the GSAP engine script block (no framework, no bundler for client code):
- **Native View Transitions integration**: `navigate()` feature-detects `document.startViewTransition`. **When supported (Chrome/Edge)**: the navy sliding-text overlay is **skipped** and the `#main-content` swap is wrapped in `document.startViewTransition(...)` — the browser crossfades the page and *morphs* any element sharing a `view-transition-name` across the two pages. This powers the catalogue-card → product-page image morph (Codrops-style): the product image carries `style="view-transition-name: product-image-{id}"` on **both** the catalogue card ([catalogue.tsx](src/pages/catalogue.tsx)) and the product page ([produit.tsx](src/pages/produit.tsx)). **When unsupported (Safari/Firefox)**: falls back to the original navy overlay + 900ms-min-timer flow. `prefers-reduced-motion` zeroes `::view-transition-*` animation-duration (instant swap, navigation never disabled). A `view-transition-name` must be unique per document at capture time — each catalogue card uses a distinct `product-image-{id}`, and the product page renders that image only once.
- **Swap scope**: only `<main id="main-content">` is replaced. Header, nav, footer, `#page-transition` overlay, and `#cgu-modal` are never touched.
- **Flow**: click on an internal `<a href>` → `preventDefault()` → show a full-screen navy overlay with the destination page's name sliding across (`ROUTE_LABELS` map, `Layout.tsx` top) → `fetch()` the destination in parallel with a 900ms minimum-display timer (`Promise.all`) → parse the response with `DOMParser`, extract `#main-content` + `<title>` → `document.adoptNode` + `replaceWith` → **re-create every `<script>` inside the new `<main>`** (scripts inserted via `DOMParser`/`innerHTML` never auto-execute — must be recreated as fresh `<script>` elements) → re-run `window.__maasgaInitPageBehaviors(newMain)` / `window.__maasgaReinitGsap(newMain)` (scroll-reveal observers + GSAP parallax/magnetic/tilt, both refactored in `Layout.tsx` to accept an optional `root` param defaulting to `document`, so re-init after a swap only touches the new content, not the untouched header/footer) → `history.pushState` (skipped on `popstate`) → sync the header's active-page styling from the fetched doc (`syncNavActiveState`, pairs old/new `<a href>` **by index, not by href** — the header is rendered by the same `Layout` for every page so the `a[href]` order is identical, and the same href appears in several nav variants (xl/lg/dropdown/mobile) + the "Rendez-vous" CTA, so href-matching cross-clobbered the active state; guarded with a `oldLinks.length === newLinks.length` check. Copies class/`aria-current`/`style`/inner `i.fas` style, plus the `#nav-more-wrapper > button` "Plus" class separately since it's a `<button>`, not an `<a>`. The "Plus" button is marked `active` server-side when `activePage ∈ {apropos, client}`) → GA4 virtual pageview (`gtag('event','page_view',...)`, since GA4 doesn't see `pushState` navigation on its own).
- **Fallback**: any fetch failure, non-2xx, 5000ms timeout (`AbortController`), or a response missing `#main-content` → `window.location.href = href` (real navigation, always reaches the destination).
- **Back/forward**: same pipeline via `popstate`, `navigate(path, isPopstate=true)` — no `pushState`, no `window.scrollTo(0,0)` (scroll reset only applies to forward/click nav, matching prior full-reload behavior; scroll restoration on back/forward is explicitly out of scope).
- **Excluded**: `/admin*` (different `AdminLayout` component, never includes this script anyway — the check is defensive), `#anchor`, `http(s)://`, `tel:`, `mailto:`, `target="_blank"`, and any click with a modifier key or non-primary button (`e.metaKey`/`ctrlKey`/`shiftKey`/`altKey`/`e.button !== 0`) — those must fall through to native browser behavior (new tab, etc.).
- **Menu collapse on navigate**: `navigate()` closes any open nav overlay at the start — hides `#nav-more-dropdown` (the desktop "Plus" dropdown only closed on outside-click, so clicking a link *inside* it left it open over the new page), removes `.open` from `#mobile-menu`, and resets the burger button (`aria-expanded=false`, icon back to `fa-bars`). Applies to both click and `popstate` paths.
- **GSAP `ScrollTrigger` cleanup**: before replacing the old `<main>`, every `ScrollTrigger` whose `.trigger` element lives inside it is `.kill()`ed — otherwise repeated navigations leak triggers bound to detached DOM nodes.
- **⚠️ Known trap for every page with an inline `<script>` in its content**: since this router re-executes a page's own scripts on every visit (not just the first), any **top-level `const`/`let`** in that script throws `Uncaught SyntaxError: Identifier '...' has already been declared` on the second visit in one session, silently killing that whole script block. `var` is fine (redeclaration is a no-op). **Fix pattern** (already applied to `catalogue.tsx`'s two inline scripts, `simulateur.tsx`, `rendez-vous.tsx`, `avis.tsx`): wrap the entire script body in `(function() { ... })();`, then add explicit `window.fn = fn;` for exactly the functions invoked from inline `onclick="..."` attributes elsewhere in that page (cross-reference via a grep for `onclick` across the whole file, including HTML built dynamically via `.innerHTML =` strings — don't assume, verify per file). **Any new page-level inline script must follow this pattern from the start.**

### Security patterns
- **Admin auth**: HMAC-signed token (not JWT) — `ADMIN_SECRET` env var. Cookie `maasga_admin` + per-request verification
- **Rate limiting**: in-memory sliding window per Cloudflare isolate — `rateLimit(key, max, windowMs)`. Per-IP and per-identifier limits on login/sensitive endpoints. Cap at 10 000 entries to prevent OOM
- **CSP** (`src/index.tsx` security-headers middleware): allows `cdnjs.cloudflare.com`, `cdn.jsdelivr.net`, `cdn.lordicon.com`, `fonts.googleapis.com`. **Any new CDN source requires editing the CSP header here** — and remember `<lord-icon>` needs its domain in **both** `script-src` (loads the player) **and** `connect-src` (the player `fetch()`s each icon's animation JSON at runtime) — missing either one fails silently (no visible icon, no thrown error unless you check the console for CSP violations)
- **XSS**: all user-supplied strings must go through `escapeHtml()` (server-side) or `textContent` / `createTextNode` (client-side inline JS). Never use `innerHTML` with user data in admin JS
- **Input validation**: `isValidEmail`, `isValidPhone` (Burkina Faso: 8 digits ± `+226` prefix), `validateImageMagicBytes` for uploads

### Environment variables (Cloudflare secrets)
Defined in `src/types.ts` → `HonoEnv.Bindings`:
`DB`, `ADMIN_SECRET`, `ADMIN_INITIAL_PASSWORD`, `LIGDICASH_API_KEY`, `LIGDICASH_AUTH_TOKEN`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `ADMIN_EMAIL`, `ADMIN_WHATSAPP`, `BREVO_API_KEY`

Set via `wrangler secret put <NAME>` — never in code.

### Database migrations
28 SQL migration files in `migrations/`. Apply in order with `npm run migrate` (remote) or `npm run migrate:local` (local wrangler D1). Never edit applied migrations — add a new numbered file instead.

### Local dev / testing gotchas
- On this machine, `npm run dev` (Vite) sometimes binds `[::1]:5173` (IPv6 loopback) only — `http://localhost:5173` or `http://127.0.0.1:5173` can fail to connect even though the server is up. Try `http://[::1]:5173/` explicitly, or prefer `npm run build && npm run dev:sandbox` (wrangler, binds all interfaces on `:3000`) for automated/browser testing — more reliable, though it serves the last built `dist/`, not live source.
- Any browser automation (Playwright, etc.) hitting a fresh context will get blocked by the CGU consent modal on first load. Pre-seed `localStorage` before navigating: `maasga_cgu_accepted` and `maasga_cookies_accepted`, both `'true'`.
- **Resolved (Lordicon → Font Awesome)**: the nav previously used Lordicon (`<lord-icon>`), but most hardcoded free-CDN icon IDs 404'd / crashed the Lottie player in a loop. Replaced by a `NavIcon` component using Font Awesome (`<i class="fas ...">` + inline `color` style). `cdn.lordicon.com` was removed from both `script-src` and `connect-src` in the CSP. `syncNavActiveState` copies inner `i.fas` `style` (not `lord-icon colors`) accordingly.
- **Reduced-motion**: this machine's owner runs the OS with "reduce animations" **ON**. Under `prefers-reduced-motion: reduce` the GSAP card tilt is skipped (`Layout.tsx` `if (reduce) return true`) and the card lift is neutralised (`app.css` `[data-stagger] > * { transform:none !important }`), so cards fall back to a **motion-free** hover (accent border + ring + shadow + `filter: brightness/saturate` on `.tilt-image`, defined inside the reduced-motion media block in `app.css`). When testing animations with Playwright, set `reducedMotion: 'no-preference'` on the context — headless Chromium otherwise defaults to `reduce` and gives false "animation broken" negatives.

### Git remote
`origin` points to `https://github.com/Maasga/maasga-code.git` (private, account `maasgabf@gmail.com`) — changed from a prior personal `sayta22/maasga-code` remote. Local git commit identity (`git config user.email/name`) is still `sayta22` — commits are authored as sayta22 but pushed to the Maasga account; nobody has yet decided whether to update the local commit identity to match.

### Routing conventions
All routes live in `src/index.tsx`:
- `GET /` → `HomePage`, `GET /catalogue` → `CataloguePage`, etc.
- `GET /admin*` → admin pages (auth-gated middleware)
- `POST /api/rendez-vous`, `/api/commande`, `/api/contact`, etc. → JSON API
- `/api/mobile/*` → endpoints for the Expo mobile app (same D1, separate auth)
- Static files served from `public/` via `hono/cloudflare-workers` `serveStatic`
