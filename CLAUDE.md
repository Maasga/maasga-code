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
- All animations respect `prefers-reduced-motion` — a global CSS block and GSAP guard disable everything when set

### GSAP animation engine
Injected once in `Layout.tsx` via `dangerouslySetInnerHTML`. It:
1. Polls for `window.gsap` + `window.ScrollTrigger` (loaded from cdnjs via `<script defer>`)
2. Adds `html.gsap-ready` class — CSS uses this to set initial `opacity:0; transform:translateY(24px)` on `[data-reveal]` / `[data-stagger] > *` elements (prevents FOUC if GSAP fails)
3. Wires up all `data-*` attributes site-wide — pages only need HTML attributes, no per-page JS

### Security patterns
- **Admin auth**: HMAC-signed token (not JWT) — `ADMIN_SECRET` env var. Cookie `maasga_admin` + per-request verification
- **Rate limiting**: in-memory sliding window per Cloudflare isolate — `rateLimit(key, max, windowMs)`. Per-IP and per-identifier limits on login/sensitive endpoints. Cap at 10 000 entries to prevent OOM
- **CSP** (`src/index.tsx` security-headers middleware): allows `cdnjs.cloudflare.com`, `cdn.jsdelivr.net`, `fonts.googleapis.com`. **Any new CDN source requires editing the CSP header here**
- **XSS**: all user-supplied strings must go through `escapeHtml()` (server-side) or `textContent` / `createTextNode` (client-side inline JS). Never use `innerHTML` with user data in admin JS
- **Input validation**: `isValidEmail`, `isValidPhone` (Burkina Faso: 8 digits ± `+226` prefix), `validateImageMagicBytes` for uploads

### Environment variables (Cloudflare secrets)
Defined in `src/types.ts` → `HonoEnv.Bindings`:
`DB`, `ADMIN_SECRET`, `ADMIN_INITIAL_PASSWORD`, `LIGDICASH_API_KEY`, `LIGDICASH_AUTH_TOKEN`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `ADMIN_EMAIL`, `ADMIN_WHATSAPP`, `BREVO_API_KEY`

Set via `wrangler secret put <NAME>` — never in code.

### Database migrations
28 SQL migration files in `migrations/`. Apply in order with `npm run migrate` (remote) or `npm run migrate:local` (local wrangler D1). Never edit applied migrations — add a new numbered file instead.

### Routing conventions
All routes live in `src/index.tsx`:
- `GET /` → `HomePage`, `GET /catalogue` → `CataloguePage`, etc.
- `GET /admin*` → admin pages (auth-gated middleware)
- `POST /api/rendez-vous`, `/api/commande`, `/api/contact`, etc. → JSON API
- `/api/mobile/*` → endpoints for the Expo mobile app (same D1, separate auth)
- Static files served from `public/` via `hono/cloudflare-workers` `serveStatic`
