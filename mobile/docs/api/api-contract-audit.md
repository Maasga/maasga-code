# API Contract Audit - Flutter Mobile V1

## Scope
This audit maps the existing backend endpoints in `src/index.tsx` to the Android Flutter V1 scope:
- Authentification
- Catalogue + panier + commande
- Simulateur BTU
- Rendez-vous
- Espace client
- Notifications + support

## Base URL and session model
- **Base URL**: `https://maasga-website.pages.dev`
- **Session model**: cookie-based (`maasga_session`, `HttpOnly`, `Secure`, `SameSite=Lax`)
- **Important for Flutter**:
  - Native `http` clients do not persist browser cookies automatically like Web pages.
  - For V1, API calls must use a persistent cookie jar (`dio` + cookie manager) for authenticated flows.

## Endpoint inventory for mobile V1

### 1) Authentication and session
- `POST /api/register`
  - Supports JSON and form body.
  - Returns JSON on JSON requests (`{ success, redirect }`) and sets session cookie.
  - **Mobile readiness**: good.
- `POST /api/login`
  - Form-first route, returns redirects in most cases.
  - Sets session cookie on success.
  - **Gap**: needs explicit JSON mode for mobile (`Accept: application/json` or `/api/mobile/login`).
- `GET /api/session-check`
  - Used by front-end to check session status.
  - **Mobile readiness**: good.
- `GET /api/logout`
  - Clears session cookie.
  - **Mobile readiness**: good.
- Password reset:
  - `POST /api/client/request-reset-email`
  - `POST /api/client/request-reset`
  - `POST /api/client/verify-reset-code`
  - `POST /api/client/reset-password`
  - **Mobile readiness**: good (JSON-friendly).

### 2) Catalogue / product
- `GET /api/products?available=true&brand=...`
- `GET /api/products/:id`
- `GET /api/reviews`
- `GET /api/quartiers`
- **Mobile readiness**: good.

### 3) Orders / checkout / payment
- `POST /api/order/create`
  - Creates order with server-side price calculation.
  - **Mobile readiness**: good.
- `POST /api/payment/initiate`
  - Starts Ligdicash flow.
  - **Mobile readiness**: good (required for WebView/redirect flow).
- `POST /api/payment/callback`
  - Webhook/callback route.
  - **Mobile handling**: backend-side, no direct app call.
- `GET /api/order/invoice/:id`
- `GET /api/order/devis/download/:id`
- `GET /api/order/:orderId/devis`
- `POST /api/order/devis/validate`
- `POST /api/order/devis/refuse`
- `POST /api/order/confirm-delivery`
- `POST /api/order/cancel-order`
- `POST /api/order/refund-request`
- **Mobile readiness**: mostly good; relies on session cookie ownership checks.

### 4) Rendez-vous / maintenance / SAV
- `POST /api/rdv`
- `POST /api/maintenance/request`
- `GET /api/maintenance/invoice/:id`
- SAV client:
  - `POST /api/client/sav/create`
  - `GET /api/client/sav/list`
- **Mobile readiness**: good.

### 5) Realisations and support content
- `GET /api/realisations`
- `POST /api/contact`
- **Mobile readiness**: good.

## Contract gaps and required API deltas

### Gap A - Login route is redirect-first
`POST /api/login` currently returns browser redirects, which complicates native app login UX and error handling.

**Delta**:
- Add JSON mode to `POST /api/login`:
  - Request: `{ identifier, password }`
  - Response success: `{ success: true, client: { id, name, phone, email } }` + session cookie
  - Response failure: `{ success: false, error: "..." }` with HTTP 4xx

### Gap B - No dedicated JSON dashboard endpoint
Current `/espace-client` page aggregates many datasets server-side for HTML.

**Delta**:
- Add `GET /api/client/dashboard` returning:
  - `profile`
  - `orders`
  - `rdvs`
  - `maintenanceContracts`
  - `maintenanceVisits`
  - `maintenanceRequests`
  - `payments`
  - `activityLog`

### Gap C - No mobile push token endpoint
No endpoint currently persists FCM device tokens.

**Delta**:
- Add:
  - `POST /api/client/push-token` (`token`, `platform`, `appVersion`)
  - `DELETE /api/client/push-token`

### Gap D - Simulateur BTU currently front logic centric
The simulator appears mainly UI-driven on web.

**Delta**:
- Add `POST /api/simulateur/btu`:
  - Input: room dimensions + exposure + occupancy + room type
  - Output: `recommendedBtu`, `recommendedCv`, `compatibleProductIds`

### Gap E - Chat support in-app
Current support path is mostly WhatsApp/contact.

**Delta (V1 pragmatic)**:
- Keep WhatsApp deep-link in app.
- Optional minimal endpoint: `POST /api/support/message` to log in D1 for analytics.

## Security and platform constraints
- Keep cookie strategy for V1, but enforce:
  - secure cookie jar in app
  - CSRF-compatible headers for mutating routes if required by middleware
- Continue server-side ownership checks (already implemented on sensitive order/devis routes).
- Never trust client-provided prices (already enforced in `/api/order/create`).

## API readiness verdict
- **Ready now (without backend changes)**: catalogue, order create, payment initiate, rdv, maintenance request, SAV list/create, product details, reviews, quartiers.
- **Needs small backend adaptation for smooth mobile UX**: login JSON mode, dashboard JSON aggregate, push token endpoints, optional simulator API endpoint.

## Proposed rollout
1. Implement Gap A + B first (blocks auth/dashboard quality).
2. Implement Gap C (push infra).
3. Implement Gap D (simulator parity).
4. Keep chat as WhatsApp deep-link for V1, backend chat in V2.
