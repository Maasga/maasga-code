# Mobile UI Kit Specification (from provided visuals)

## Design intent
The visual direction is:
- clean white base
- blue/cyan brand gradients
- rounded cards and CTA buttons
- icon-first navigation
- high readability for forms and calculators

This UI kit turns those visuals into reusable Flutter tokens and components.

## Core design tokens

### Color tokens
- `maasgaBlue900`: `#0B3F8A`
- `maasgaBlue700`: `#0077B6`
- `maasgaCyan500`: `#00B4D8`
- `maasgaCyan400`: `#38BDF8`
- `surfacePrimary`: `#FFFFFF`
- `surfaceSecondary`: `#F5F7FA`
- `textPrimary`: `#101828`
- `textSecondary`: `#475467`
- `success500`: `#12B76A`
- `warning500`: `#F79009`
- `error500`: `#F04438`

### Gradient tokens
- `brandGradientPrimary`: `linear(135deg, #0B3F8A -> #00B4D8)`
- `brandGradientSoft`: `linear(180deg, #F7FCFF -> #EAF6FF)`

### Radius tokens
- `radiusXs`: `8`
- `radiusSm`: `12`
- `radiusMd`: `16`
- `radiusLg`: `20`
- `radiusPill`: `999`

### Spacing tokens
- `space2`: `8`
- `space3`: `12`
- `space4`: `16`
- `space5`: `20`
- `space6`: `24`

### Typography tokens
- `headingXL`: 32 / semibold
- `headingL`: 24 / semibold
- `headingM`: 20 / semibold
- `bodyM`: 16 / regular
- `bodyS`: 14 / regular
- `caption`: 12 / regular
- Font family: `Inter` (fallback: system sans)

## Component library (V1)

### 1) `MaasgaAppBar`
- Logo centered, left menu icon, optional right icon (bell/profile).
- Heights:
  - compact: 56
  - default: 64

### 2) `MaasgaSearchField`
- Rounded capsule, leading search icon, optional trailing filter icon.
- States: default, focused, disabled.

### 3) `MaasgaPrimaryButton`
- Pill gradient button matching visuals.
- Variants:
  - `primaryGradient`
  - `secondaryOutline`
  - `danger`
- Sizes: `sm`, `md`, `lg`.

### 4) `MaasgaCard`
- Rounded white card with subtle shadow.
- Used for:
  - simulator blocks
  - order cards
  - profile summary
  - maintenance widgets

### 5) `MaasgaSegmentChip`
- Multi-choice option chips (simulator choices: exposure, room type, occupancy).
- States:
  - unselected
  - selected
  - disabled

### 6) `MaasgaBottomNav`
- 5 tabs:
  - Home
  - Catalogue
  - Service
  - Panier
  - Profil
- Active color: `maasgaBlue700`.

### 7) `MaasgaStatusPill`
- Status chips:
  - pending / paid / livraison / installed / cancelled
- Color-coded semantic variants.

### 8) `MaasgaInputField`
- Rounded input with icon support (email/password in visuals).
- Validation/error helper text integrated.

### 9) `MaasgaMetricTile`
- Small KPI tiles for profile area (`commandes`, `installations`, `rdv`, `maintenance`).

### 10) `MaasgaEmptyState`
- Reusable illustration + title + action CTA.

## Screen patterns (mapped to your visuals)

### A) Onboarding / Welcome
- Hero image oval frame + brand logo.
- Primary CTA: `Démarrer`.
- Secondary link: login.
- Use `brandGradientSoft` background decorations.

### B) Auth screens
- Reuse onboarding top hero section.
- Compact card form at lower fold.
- Inputs with icon-left and minimalist border.

### C) Service selector (Rendez-vous)
- Card list with icon + title + short description.
- Single selection mode.
- Sticky bottom CTA.

### D) BTU Simulator
- Input card left/top.
- Result card with strong visual hierarchy (`9 000 BTU / 1 CV`).
- Chip groups for exposure/room type/occupancy.

### E) Profile dashboard
- Header profile card.
- KPI grid of 4 tiles.
- Sections:
  - commandes
  - rdv
  - contrats maintenance

### F) Catalogue + Cart
- Product list cards with image + specs + price + add button.
- Cart line item with quantity stepper and summary totals.

## Accessibility and UX constraints
- Minimum touch target: 44x44.
- Contrast >= WCAG AA for text.
- Dynamic text scaling support.
- Error messages in plain FR, no technical jargon.

## Flutter implementation notes
- Put tokens in `lib/shared/design_tokens/`.
- Create a `ThemeExtension` for custom tokens.
- Export components from `lib/shared/widgets/`.
- Build golden tests for key components:
  - primary button
  - status pill
  - segment chip
  - metric tile

## V1 component backlog (priority)
1. AppBar, Button, Input, Card
2. BottomNav, SegmentChip, StatusPill
3. MetricTile, EmptyState, LoadingSkeleton
