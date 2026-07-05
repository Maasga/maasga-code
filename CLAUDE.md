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
- **Card tilt parallax** (`[data-tilt]`, handled in the same GSAP engine): container itself no longer rotates — only marked children move independently. `.tilt-image` (icon/photo, ±5° rotation), `.tilt-caption` (title/text or name/price, ±20px translate), `.tilt-shine` (empty decorative div, accent-cyan diagonal sweep, ±50px translate, most movement of the three). All three are optional per card — the engine skips whichever is absent, no errors.
- `.icon-pulse`: continuous CSS scale pulse (2.2s loop) — apply to the icon `<i>` glyph itself, never to a `.tilt-image` wrapper (would fight the GSAP transform on the same element).
- **Card layer scroll-reveal** (`.tilt-image`/`.tilt-caption`/`.tilt-shine` inside a `[data-tilt]` card that itself sits inside `[data-stagger]`/`[data-hero]`): these layers get their own nested 3D "settle-in" transition, independent of the mouse-hover tilt, that fires when the parent grid's `.in` class is added — icon rotates in via `perspective`/`rotateX`/`rotateY`/`scale`, caption follows with `translateY`, shine sweeps in with `translate` — each with its own `transition-delay` (0.12s/0.2s/0.3s) so they cascade after the card itself. The `[data-tilt]` container never gets a transform here either, same rule as the hover tilt. Pure CSS, no JS/markup needed — it rides the existing `.in` class the reveal engine already toggles, so it also applies automatically anywhere else the same `[data-stagger]/[data-hero]` + `[data-tilt]` + layer-class pattern is used (e.g. catalogue product cards use `.reveal`, not `[data-stagger]`, so they are **not** currently affected by this).
- All animations respect `prefers-reduced-motion` — a global CSS block and GSAP guard disable everything when set. **If a user reports "animations aren't playing," check their OS/browser reduced-motion setting first — most sessions' first hypothesis should be this, not a code bug.** The reduced-motion block zeroes both `transition-duration` **and** `transition-delay` on the universal selector (`*, *::before, *::after`) — duration alone isn't enough, since per-element `transition-delay` (stagger cascades, nested card-layer delays above) would otherwise still make the user wait out the delay before the near-instant transition kicks in.

### GSAP animation engine
Injected once in `Layout.tsx` via `dangerouslySetInnerHTML`. It:
1. Polls for `window.gsap` + `window.ScrollTrigger` (loaded from cdnjs via `<script defer>`)
2. Adds `html.gsap-ready` class — CSS uses this to set initial `opacity:0; transform:translateY(24px)` on `[data-reveal]` / `[data-stagger] > *` elements (prevents FOUC if GSAP fails)
3. Wires up all `data-*` attributes site-wide — pages only need HTML attributes, no per-page JS

### Async page transitions (client-side router)
All internal navigation on public pages is intercepted and handled without a full HTTP reload — a hand-rolled PJAX-style router, injected in `Layout.tsx` right after the GSAP engine script block (no framework, no bundler for client code):
- **Swap scope**: only `<main id="main-content">` is replaced. Header, nav, footer, `#page-transition` overlay, and `#cgu-modal` are never touched.
- **Flow**: click on an internal `<a href>` → `preventDefault()` → show a full-screen navy overlay with the destination page's name sliding across (`ROUTE_LABELS` map, `Layout.tsx` top) → `fetch()` the destination in parallel with a 900ms minimum-display timer (`Promise.all`) → parse the response with `DOMParser`, extract `#main-content` + `<title>` → `document.adoptNode` + `replaceWith` → **re-create every `<script>` inside the new `<main>`** (scripts inserted via `DOMParser`/`innerHTML` never auto-execute — must be recreated as fresh `<script>` elements) → re-run `window.__maasgaInitPageBehaviors(newMain)` / `window.__maasgaReinitGsap(newMain)` (scroll-reveal observers + GSAP parallax/magnetic/tilt, both refactored in `Layout.tsx` to accept an optional `root` param defaulting to `document`, so re-init after a swap only touches the new content, not the untouched header/footer) → `history.pushState` (skipped on `popstate`) → sync the header's active-page styling from the fetched doc (`syncNavActiveState`, matches nav links by `href`, copies class/`aria-current`/icon styling — the header itself is never swapped, so this is the only way its active-state stays correct) → GA4 virtual pageview (`gtag('event','page_view',...)`, since GA4 doesn't see `pushState` navigation on its own).
- **Fallback**: any fetch failure, non-2xx, 5000ms timeout (`AbortController`), or a response missing `#main-content` → `window.location.href = href` (real navigation, always reaches the destination).
- **Back/forward**: same pipeline via `popstate`, `navigate(path, isPopstate=true)` — no `pushState`, no `window.scrollTo(0,0)` (scroll reset only applies to forward/click nav, matching prior full-reload behavior; scroll restoration on back/forward is explicitly out of scope).
- **Excluded**: `/admin*` (different `AdminLayout` component, never includes this script anyway — the check is defensive), `#anchor`, `http(s)://`, `tel:`, `mailto:`, `target="_blank"`, and any click with a modifier key or non-primary button (`e.metaKey`/`ctrlKey`/`shiftKey`/`altKey`/`e.button !== 0`) — those must fall through to native browser behavior (new tab, etc.).
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
- Known issue (fix in progress, **uncommitted** as of this writing): most Lordicon icon IDs hardcoded in `Layout.tsx`'s nav (`msetzzbt`, `becezzra`, `wmluxarr`, `hbwbeoul`, `jyvscvfr`, `diuoeasy`, `tftunupn`, `zzaxpnyy`) do not render even with correct CSP — likely invalid or premium-only assets on Lordicon's free CDN. Only `gmzxduhd` (used for "Accueil") was confirmed working. There is an **uncommitted working-tree change** (not from this session's own work) that replaces the Lordicon-based `AnimatedIcon` component with a new `NavIcon` component using Font Awesome (`<i class="fas ...">` + inline `color` style) instead — check `git diff src/components/Layout.tsx` before starting new nav/icon work, since this may already be resolved-but-uncommitted by the time you read this. If committed, `syncNavActiveState` (see "Async page transitions" above) must target `i.fas` + `style` instead of `lord-icon` + `colors` — confirm this was updated together with the icon swap.

### Git remote
`origin` points to `https://github.com/Maasga/maasga-code.git` (private, account `maasgabf@gmail.com`) — changed from a prior personal `sayta22/maasga-code` remote. Local git commit identity (`git config user.email/name`) is still `sayta22` — commits are authored as sayta22 but pushed to the Maasga account; nobody has yet decided whether to update the local commit identity to match.

### Routing conventions
All routes live in `src/index.tsx`:
- `GET /` → `HomePage`, `GET /catalogue` → `CataloguePage`, etc.
- `GET /admin*` → admin pages (auth-gated middleware)
- `POST /api/rendez-vous`, `/api/commande`, `/api/contact`, etc. → JSON API
- `/api/mobile/*` → endpoints for the Expo mobile app (same D1, separate auth)
- Static files served from `public/` via `hono/cloudflare-workers` `serveStatic`
