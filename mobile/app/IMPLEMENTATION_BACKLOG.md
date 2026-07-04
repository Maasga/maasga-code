# MAASGA Flutter V1 - Implementation Backlog

## Status legend
- Done: delivered in current scaffold
- Next: planned in next coding iteration

## Sprint 0 - Foundation
- Done: Flutter Android project scaffold (`mobile/app`)
- Done: Riverpod + GoRouter + Dio + cookie manager setup
- Done: Theme and first design tokens
- Done: Base navigation shell and bottom navigation

## Sprint 1 - Auth + Home + Catalog
- Done: Login screen and register screen
- Done: Auth repository with `/api/login`, `/api/register`, `/api/session-check`, `/api/logout`
- Done: Home screen with quick actions
- Done: Catalog screen wired to `/api/products`
- Done: Cart state with add/remove and total

## Sprint 2 - Cart + Checkout + Payment
- Done: Checkout screen
- Done: Order create call (`/api/order/create`)
- Done: Payment initiation call (`/api/payment/initiate`)
- Done: Payment redirect handoff screen
- Next: inline WebView payment experience + callback deep-link

## Sprint 3 - Simulator + RDV + Client Space
- Done: Simulator screen (local calculator skeleton)
- Done: RDV creation form wired to `/api/rdv`
- Done: Client space skeleton with auth-aware state
- Next: hydrate client-space with aggregate endpoint (`/api/client/dashboard`)

## Sprint 4 - Notifications + Support + QA
- Done: Push service skeleton (`firebase_messaging`)
- Done: Notifications screen skeleton
- Done: Support screen with WhatsApp deep-link
- Done: `flutter analyze` and `flutter test` passing
- Next: complete FCM server token registration endpoints and UI list from backend.
