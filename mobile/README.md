# MAASGA Mobile (Flutter V1)

This directory contains implementation-ready product and technical documentation for the Flutter Android V1 aligned with the existing MAASGA web backend.

## Documents
- API contract audit: `mobile/docs/api/api-contract-audit.md`
- Flutter architecture foundation: `mobile/docs/architecture/flutter-foundation.md`
- Mobile UI kit spec from provided visuals: `mobile/docs/product/ui-kit-mobile.md`
- Sprint backlog and delivery plan: `mobile/docs/product/mvp-delivery-backlog.md`

## Immediate execution order
1. Implement backend deltas from API audit (login JSON mode, dashboard aggregate, push token endpoints).
2. Bootstrap Flutter foundation from architecture document.
3. Build shared UI components from UI kit before feature screens.
4. Execute sprint backlog in sequence (Sprint 0 -> Sprint 4).

## Definition of done for kickoff
- Backend deltas validated via Postman/Insomnia.
- Flutter shell runs on Android emulator/device.
- Auth + catalog module demo available.
