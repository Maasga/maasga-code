# Flutter Mobile V1 - Delivery Backlog and Sprint Plan

## Delivery principles
- Android-first, production-usable at each sprint boundary.
- Backend reuse first, minimal API additions only when blocking UX.
- Keep each sprint testable with explicit acceptance criteria.

## Epic map
- EPIC-01: Foundation and architecture
- EPIC-02: Auth and session
- EPIC-03: Catalog, cart, checkout, payment
- EPIC-04: Simulator BTU
- EPIC-05: Rendez-vous and service flows
- EPIC-06: Espace client
- EPIC-07: Push notifications and support
- EPIC-08: QA, release, observability

## Sprint 0 (Setup)
### Goals
- Bootstrapped Flutter app with architecture skeleton and CI baseline.

### Stories
- Initialize Flutter Android project and environment flavors.
- Implement app theme + token loader from UI kit.
- Setup router shell (`go_router`) and module placeholders.
- Setup network client (`dio`) + cookie manager.
- Setup secure storage and app bootstrap sequence.

### Acceptance
- App launches to splash and routes to placeholder home.
- Build passes in debug/release.
- API base URL configurable with `dart-define`.

## Sprint 1 (Auth + Home + Catalog)
### Goals
- A user can authenticate and browse product catalog.

### Stories
- Login/register/reset-password screens and validation.
- Session restoration using `/api/session-check`.
- Home screen with quick actions.
- Catalog list + filter + search.
- Product detail screen.

### Dependencies
- JSON login mode (backend delta A).

### Acceptance
- Successful login persists session after app restart.
- User can browse products and open product details.
- Error states are handled for offline/5xx.

## Sprint 2 (Cart + Checkout + Ligdicash)
### Goals
- A user can create an order and pay via Ligdicash flow.

### Stories
- Cart management (add/update/remove).
- Checkout form (client data + address/quartier).
- Order creation via `/api/order/create`.
- Payment initiation via `/api/payment/initiate`.
- Payment return handling in WebView/redirect callback pattern.

### Acceptance
- Order is created with server-calculated price.
- Ligdicash flow opens and returns correctly.
- User sees payment status and order summary.

## Sprint 3 (Simulator + Rendez-vous + Client Space)
### Goals
- Service-oriented flows are complete.

### Stories
- Simulator BTU screen + recommendation output.
- Rendez-vous creation for devis/install/maintenance.
- Client dashboard aggregate view (orders, rdv, maintenance, payments).
- Devis actions from client space (validate/refuse where eligible).

### Dependencies
- Dashboard aggregate endpoint (backend delta B).
- Optional simulator endpoint (delta D) or parity local calculator.

### Acceptance
- User can complete BTU simulation and navigate to compatible products.
- User can create and track rendez-vous.
- Client space shows synchronized data from backend.

## Sprint 4 (Push + Support + Hardening + Release)
### Goals
- Production readiness on Android.

### Stories
- FCM integration and permission handling.
- Push token registration lifecycle (delta C).
- Notifications center screen.
- Support entrypoint (WhatsApp deep-link + optional support API log).
- Crash logging, analytics, performance profiling, release prep.

### Acceptance
- Push notification received on critical events.
- Notifications list loads and deep-links to relevant screens.
- Signed Android build ready for distribution.

## Detailed backlog (priority order)

## P0 (must-have before release)
- Mobile-auth JSON contract support.
- Session persistence and secure cookie handling.
- Product listing + detail + cart.
- Order creation + Ligdicash payment flow.
- Client space with orders and rendez-vous.
- Basic push notifications.

## P1 (important, can ship shortly after)
- Maintenance contract detail enhancements.
- Offline cache for catalog.
- Advanced filter/sort on catalog.
- Rich notification categories.

## P2 (post-V1)
- In-app real-time chat.
- iOS adaptation.
- Personalized recommendations and A/B testing.

## QA plan
- Unit tests:
  - validation and mappers
  - use cases
- Widget tests:
  - auth forms
  - cart and checkout forms
  - simulator options
- Integration tests:
  - login to order flow
  - rdv creation flow
  - payment initiation handoff
- UAT checklist with business owner:
  - pricing consistency
  - status lifecycle correctness
  - push reception on test device

## Release gates
- No critical crash in smoke tests.
- API timeout/retry behaviors validated on poor network.
- Security check:
  - no secrets in logs
  - release build with obfuscation as required
- Performance check:
  - cold start acceptable on target Android device class.
