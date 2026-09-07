# Implementation Plan: admin-ui-light-refactor

## Overview

This plan covers two complementary axes: (1) critical bug fixes that unblock the admin UI, and (2) a full visual migration from dark mode to a light SaaS theme driven by isolated CSS tokens. Tasks are ordered by strict dependency — Tasks 1 and 2 are independent and can run in parallel, all subsequent tasks depend on both.

The stack is Hono JSX SSR + vanilla JS inline. No React runtime. Tests use Vitest + fast-check.

---

## Tasks

- [x] 1. Corrections de bugs critiques (bloquantes)
  - [x] 1.1 Supprimer `src/components/admin/ImprovedAdminCommandesPage.tsx` — ce fichier contient des hooks React (`useState`, `useEffect`) incompatibles avec Hono SSR et bloque la compilation TypeScript
    - Supprimer le fichier physique
    - Retirer tout import de `ImprovedAdminCommandesPage` dans `src/pages/admin.tsx`
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 1.2 Ajouter `normalizeVisitStatus` dans `src/hooks/useAdminMaintenanceData.ts`
    - Créer la fonction `normalizeVisitStatus(status: string): string` mappant `'scheduled' → 'planifiee'` et `'done' → 'effectuee'`, passthrough pour toute autre valeur
    - Appliquer cette fonction sur chaque objet visite retourné par le hook avant exposition aux composants
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [x] 1.3 Corriger les liens invalides dans `src/components/admin/ClientDetailModal.tsx`
    - Changer le lien "Nouvelle commande" : `href="/admin/commandes/nouveau?client_id=${client.id}"` → `href="/admin/commandes?client_id=${client.id}"`
    - Changer le lien "Nouveau RDV" : `href="/rendez-vous?client_phone=..."` → `href="/admin/rdv${client.phone ? '?client_phone=' + encodeURIComponent(client.phone) : ''}"`
    - Conserver le lien WhatsApp `https://wa.me/...` inchangé
    - Conserver `id="client-detail-modal"` inchangé dans ce fichier (utilisé par `/admin/clients`)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 1.4 Résoudre le conflit d'ID `client-detail-modal` dans `AdminCommandesPage` (`src/pages/admin.tsx`)
    - Dans `AdminCommandesPage`, changer la modale client inline : `id="client-detail-modal"` → `id="order-client-detail-modal"`
    - Mettre à jour tous les `getElementById('client-detail-modal')` dans le JS inline de `AdminCommandesPage` pour pointer sur `'order-client-detail-modal'`
    - _Requirements: 9.1, 9.2, 9.3_

  - [x] 1.5 Corriger la grille orpheline autour de `CommandesProcessDiagram` dans `AdminCommandesPage`
    - Remplacer le wrapper `<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">` contenant le seul enfant `CommandesProcessDiagram` par `<div class="mb-6">`
    - _Requirements: 8.1, 8.2_

  - [x] 1.6 Ajouter l'entrée "Réalisations" dans la sidebar de `AdminLayout`
    - Dans le tableau de navigation de `AdminLayout` (admin.tsx), insérer `{ href: "/admin/realisations", icon: "fa-images", label: "Réalisations", key: "realisations" }` après l'entrée `avis` et avant `audit-log`
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [x] 1.7 Tests unitaires — corrections bug
    - Lancer `tsc --noEmit` et vérifier 0 erreurs TypeScript
    - Vérifier qu'aucun fichier `.ts/.tsx` n'importe `ImprovedAdminCommandesPage`
    - Vérifier que `ClientDetailModal` génère des hrefs vers `/admin/commandes` et `/admin/rdv`
    - Vérifier que la sidebar contient un lien `/admin/realisations` positionné entre `avis` et `audit-log`
    - Vérifier qu'aucune page n'a deux éléments avec `id="client-detail-modal"` simultanément
    - _Requirements: 2.1, 2.2, 3.1, 3.3, 4.1, 4.3, 9.1, 9.2_

- [x] 2. Créer `public/static/admin-tokens.css`
  - [x] 2.1 Créer le fichier `public/static/admin-tokens.css` avec toutes les variables `--admin-*` scopées exclusivement sous `.admin-ui { }` (jamais `:root`)
    - Backgrounds : `--admin-bg: #f8fafc`, `--admin-bg-elevated: #f1f5f9`, `--admin-sidebar-bg: #0f172a`, `--admin-card-bg: #ffffff`
    - Borders : `--admin-border: #e2e8f0`
    - Typography : `--admin-text-primary: #0f172a`, `--admin-text-muted: #94a3b8`, `--admin-font-sans: 'Inter', system-ui, -apple-system, sans-serif`
    - Accent : `--admin-accent: #0369a1`, `--admin-accent-hover: #0284c7`, `--admin-accent-light: #e0f2fe`
    - Semantic : `--admin-success: #059669`, `--admin-success-light: #d1fae5`, `--admin-warning: #d97706`, `--admin-warning-light: #fef3c7`, `--admin-danger: #dc2626`, `--admin-danger-light: #fee2e2`, `--admin-info: #2563eb`, `--admin-info-light: #dbeafe`
    - Status : `--admin-status-pending: #d97706`, `--admin-status-confirmed: #059669`, `--admin-status-processing: #2563eb`, `--admin-status-delivered: #0369a1`, `--admin-status-cancelled: #dc2626`
    - Layout : `--admin-radius: 0.75rem`, `--admin-shadow-card: 0 1px 4px rgba(15,23,42,0.06), 0 0 0 1px rgba(15,23,42,0.04)`, `--admin-btn-primary-bg: linear-gradient(135deg, #0369a1, #0284c7)`
    - Font : `font-family: var(--admin-font-sans);` appliqué sur `.admin-ui` directement
    - _Requirements: 10.2, 10.4, 10.5, 10.6, 16.1_

  - [x] 2.2 Ajouter les règles utilitaires dans `admin-tokens.css`
    - Scrollbar light theme : `track: #f1f5f9`, `thumb: #cbd5e1`, `thumb:hover: #94a3b8`
    - Neutralisation min-height : `.admin-ui a, .admin-ui button { min-height: unset; }` (annule la règle 44px de app.css)
    - Préservation explicite : `.admin-ui .btn-primary, .admin-ui .btn-secondary { min-height: 2.5rem; }`
    - Override mobile **ciblé modales uniquement** : `@media (max-width: 639px) { .admin-ui .modal .rounded-3xl, .admin-ui .modal .rounded-2xl, .admin-ui [role="dialog"] .rounded-3xl, .admin-ui [role="dialog"] .rounded-2xl { max-width: calc(100vw - 1rem) !important; } }`
    - Le fichier NE DOIT PAS importer app.css, tailwind.css ni aucune bibliothèque
    - _Requirements: 10.7, 17.1, 17.2, 17.3, 18.1, 18.2, 18.3_

  - [x] 2.3 Tests unitaires — token file
    - Vérifier qu'aucune déclaration `:root` n'existe dans `admin-tokens.css`
    - Vérifier que l'override mobile ne cible que `.modal` et `[role="dialog"]`, pas les éléments `.rounded-2xl` à la racine
    - Vérifier que les 18 variables `--admin-*` listées dans Req 10.4 sont toutes présentes
    - _Requirements: 10.2, 10.4, 10.7, 17.1_

- [~] 3. Checkpoint — Compiler et vérifier les fondations
  - Lancer `tsc --noEmit` — zéro erreur attendue avant de migrer les composants
  - Vérifier que `admin-tokens.css` est lisible depuis un navigateur sur n'importe quelle page admin
  - Si des erreurs subsistent, corriger avant de continuer. Poser toute question à l'utilisateur si nécessaire.

- [ ] 4. Migrer `AdminLayout` vers le Light Theme
  - Dépend de : Tasks 1 et 2
  - [x] 4.1 Dans `<head>` de `AdminLayout` : ajouter `<link rel="stylesheet" href="/static/admin-tokens.css" />` entre `tailwind.css` et `style.css`
    - _Requirements: 10.1, 10.3_

  - [x] 4.2 Sur `<body>` : ajouter la classe `admin-ui` et remplacer le fond encodé en dur
    - Résultat : `class="admin-ui min-h-screen flex overflow-x-hidden"` et `style="background: var(--admin-bg);"`
    - _Requirements: 11.1, 11.2, 11.5_

  - [x] 4.3 Dans le `<style>` inline de `AdminLayout` : nettoyer les règles déplacées dans `admin-tokens.css`
    - Supprimer `* { font-family: 'Inter', sans-serif; }` (déplacé dans admin-tokens.css)
    - Supprimer la règle scrollbar `::-webkit-scrollbar-*` (déplacée dans admin-tokens.css)
    - Supprimer l'override mobile `.rounded-3xl, .rounded-2xl { max-width: calc(100vw - 1rem) !important }` global (remplacé par la version ciblée dans admin-tokens.css)
    - _Requirements: 16.2, 17.1_

  - [x] 4.4 Dans le `<style>` inline : mettre à jour les classes de composants vers les tokens
    - `.card-shadow` → `box-shadow: var(--admin-shadow-card); background: var(--admin-card-bg); border: 1px solid var(--admin-border);`
    - `.stat-card` → `background: var(--admin-card-bg); border: 1px solid var(--admin-border);` + `color: var(--admin-text-primary);`
    - `.input-field` → `background: var(--admin-card-bg); color: var(--admin-text-primary); border: 1.5px solid var(--admin-border);`
    - `.input-field:focus` → `border-color: var(--admin-accent); box-shadow: 0 0 0 3px rgba(3,105,161,0.15);`
    - `.input-field::placeholder` → `color: var(--admin-text-muted);`
    - Remplacer `.btn-primary` par `.admin-ui .btn-primary { background: var(--admin-btn-primary-bg); color: white; transition: all 0.2s; box-shadow: 0 4px 12px rgba(3,105,161,0.25); }` et `.admin-ui .btn-primary:hover { opacity: 0.92; transform: translateY(-1px); }`
    - _Requirements: 11.7, 12.1, 15.2, 15.3, 20.1, 20.2, 20.3_

  - [x] 4.5 Migrer la `<header>` (Topbar) vers le light theme
    - Topbar fond : `background:rgba(11,17,32,0.92)` → `background:rgba(255,255,255,0.92); backdrop-filter:blur(12px); border-bottom:1px solid var(--admin-border);`
    - Titre `<h1>` : `text-white` → `style="color: var(--admin-text-primary)"`
    - Sous-titre date : `text-gray-400` → `style="color: var(--admin-text-muted)"`
    - Badge "Système actif" : fond vert-sombre → `background: var(--admin-success-light); color: var(--admin-success)`
    - _Requirements: 11.4_

  - [x] 4.6 Migrer les éléments de recherche globale et notifications vers les tokens
    - Champ recherche globale : `background:rgba(15,23,42,0.8); color:white` → `background:rgba(241,245,249,0.8); border:1px solid var(--admin-border); color: var(--admin-text-primary)`
    - Panneau `#global-search-results` : `background:#111827; border:rgba(56,189,248,0.2)` → `background: var(--admin-card-bg); border:1px solid var(--admin-border);`
    - Hover résultat recherche → `background: rgba(3,105,161,0.04)`
    - Panneau `#notif-panel` : `background:#111827` → `background: var(--admin-card-bg); border:1px solid var(--admin-border);`
    - Séparateur header notif : `border-gray-800` → `border-color: var(--admin-border)`
    - Ligne non lue notif : `bg-cyan-500/5` → `background: rgba(3,105,161,0.04)`
    - _Requirements: 21.2, 21.3, 21.4, 22.1, 22.2, 22.3_

  - [x] 4.7 Migrer les couleurs de toast vers les tokens sémantiques dans `window.showToast`
    - `success: 'linear-gradient(135deg, var(--admin-success), #10b981)'`
    - `error: 'linear-gradient(135deg, var(--admin-danger), #ef4444)'`
    - `warning: 'linear-gradient(135deg, var(--admin-warning), #f59e0b)'`
    - `info: 'linear-gradient(135deg, var(--admin-info), #3b82f6)'`
    - Texte toast reste blanc (toasts gardent fond coloré intentionnellement pour la visibilité sur fond clair)
    - _Requirements: 21.1_

  - [x] 4.8 Ajouter le bloc `<script>` définissant `window.adminBulkAction` et `window.adminClearSelection` dans `AdminCommandesPage`
    - Le bloc doit être positionné **avant** le rendu de `BulkActionsToolbar`
    - Utiliser le pattern `window.adminBulkAction = window.adminBulkAction || function(type) {...}` (guard `||` anti-redéfinition)
    - Implémenter les actions : `status` (prompt + fetch `/api/admin/commandes/bulk-status`), `export` (redirect `/api/admin/commandes/export?ids=...`), `delete` (confirm + fetch `/api/admin/commandes/bulk-delete`)
    - Implémenter `window.adminClearSelection` : vider `window.adminSelectedIds`, décocher `.order-checkbox`, masquer `#bulk-toolbar`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

  - [-] 4.9 Tests unitaires — AdminLayout light theme
    - Vérifier que `<body>` a la classe `admin-ui` dans le rendu de `AdminLayout`
    - Vérifier que `admin-tokens.css` est chargé après `tailwind.css` et avant `style.css`
    - Vérifier que `window.adminBulkAction` et `window.adminClearSelection` sont des fonctions après rendu de `AdminCommandesPage`
    - _Requirements: 10.1, 10.3, 11.1, 1.5_

- [ ] 5. Migrer `CommandesTable.tsx` et `CommandesKPIs.tsx`
  - Dépend de : Tasks 1 et 2
  - [x] 5.1 Dans `CommandesTable.tsx` : activer la pagination
    - Ajouter `data-paginate="20"` sur l'élément `<tbody>` du tableau de commandes
    - _Requirements: 5.1, 5.2_

  - [x] 5.2 Dans `CommandesTable.tsx` : protéger la définition de `filterTable` contre la double définition
    - Envelopper la définition dans `if (typeof window.filterTable !== 'function') { window.filterTable = function(tableId, query) {...}; }`
    - _Requirements: 7.1, 7.3_

  - [x] 5.3 Dans `CommandesTable.tsx` : migrer les styles du tableau vers les tokens légers
    - Conteneur table : ajouter `background: var(--admin-card-bg); border: 1px solid var(--admin-border); border-radius: var(--admin-radius)`
    - `<thead><tr>` : `background:rgba(15,23,42,0.4)` → `background: #f1f5f9`
    - `<th>` : `color:#64748b` → `color: var(--admin-text-muted)`
    - `<tr>` hover : `hover:bg-white/[0.02]` → `hover:bg-[rgba(3,105,161,0.04)]` (ou équivalent inline)
    - Séparateurs `border-color:rgba(56,189,248,0.06)` → `var(--admin-border)`
    - `<td>` texte principal (`#e2e8f0`) → `var(--admin-text-primary)` ; texte secondaire (`#64748b`) → `var(--admin-text-muted)`
    - _Requirements: 13.1, 13.2, 13.3, 13.4_

  - [x] 5.4 Dans `CommandesTable.tsx` : migrer le champ de recherche inline et le bouton Export CSV
    - Champ recherche : `background:rgba(15,23,42,0.6); border:rgba(56,189,248,0.12); color:#e2e8f0` → `background: var(--admin-bg-elevated); border: 1px solid var(--admin-border); color: var(--admin-text-primary)`
    - Bouton Export CSV : `background:rgba(52,211,153,0.1); color:#34d399` → `background: rgba(5,150,105,0.08); color: #059669; border: 1px solid rgba(5,150,105,0.2)`
    - _Requirements: 13.1_

  - [x] 5.5 Dans `CommandesTable.tsx` : standardiser les Status Badges et mettre à jour `STATUS_MAP`
    - Format uniforme pour tous les badges : `border-radius:9999px`, `padding:0.2rem 0.65rem`, `font-size:0.7rem`, `font-weight:600`, bg-opacity `0.12`
    - Nouvelles couleurs sémantiques dans `STATUS_MAP` : `en_attente→#d97706`, `confirme→#059669`, `contacte→#2563eb`, `en_livraison→#2563eb`, `livre→#0369a1`, `annule→#dc2626`
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

  - [x] 5.6 Dans `CommandesKPIs.tsx` : migrer les KPI cards vers les tokens légers
    - Remplacement des fonds hardcodés `rgba(x,x,x,0.1)` → `background: var(--admin-accent-light); border: 1px solid var(--admin-border);`
    - Valeur numérique : `text-white` → `color: var(--admin-text-primary)`
    - Libellé : `color:#94a3b8` → `color: var(--admin-text-muted)`
    - Icônes gardent leur couleur sémantique spécifique pour la lisibilité rapide
    - _Requirements: 12.1, 12.2, 12.3_

  - [~] 5.7 Tests unitaires et property tests — CommandesTable
    - **Property 2: Pagination invariant** — pour tout n > 20 commandes rendues, après exécution de `adminPaginate()`, au plus 20 `<tr>` sont visibles simultanément
      - Annotée `// Feature: admin-ui-light-refactor, Property 2: Pagination invariant`
      - Validates: Requirements 5.1, 5.2
    - **Property 4: filterTable single definition invariant** — pour 2 à 5 `CommandesTable` rendus sur la même page, `window.filterTable` est défini exactement une fois
      - Annotée `// Feature: admin-ui-light-refactor, Property 4: filterTable single definition invariant`
      - Validates: Requirements 7.1, 7.2, 7.3
    - **Property 6: Status badge uniformity invariant** — pour tout statut de commande valide, le `.status-badge` rendu a `border-radius` arrondi, `font-size` ≤ 11.2px, `font-weight` ≥ 600
      - Annotée `// Feature: admin-ui-light-refactor, Property 6: Status badge uniformity invariant`
      - Validates: Requirements 14.1, 14.3, 14.4
    - Test unitaire : vérifier que `filterTable` filtre uniquement les lignes du tableau dont l'id correspond au `tableId` passé
    - _Requirements: 5.1, 5.2, 7.1, 7.2, 7.3, 14.1, 14.3, 14.4_

- [ ] 6. Migrer `OrderDetailModal.tsx` et `ClientDetailModal.tsx`
  - Dépend de : Tasks 1 et 2
  - [x] 6.1 Dans `OrderDetailModal.tsx` : migrer le fond et la bordure de la modale
    - `background:#0b1120` → `var(--admin-card-bg)`
    - `border:1px solid rgba(56,189,248,0.15)` → `border: 1px solid var(--admin-border)`
    - Overlay conservé : `background:rgba(0,0,0,0.5)` (lisibilité sur fond clair)
    - _Requirements: 19.1, 19.2, 19.4_

  - [x] 6.2 Dans `OrderDetailModal.tsx` : migrer les couleurs de texte et de formulaire
    - Titre `<h2>` : `text-white` → `style="color: var(--admin-text-primary)"`
    - Labels `color:#64748b` → `color: var(--admin-text-muted)`
    - Valeurs `color:white` / `text-white` → `color: var(--admin-text-primary)`
    - Montant : `color:white` → `color: var(--admin-accent)` (mise en valeur)
    - `<select>` statut : `background:#1e293b` → `var(--admin-bg-elevated)`; border → `var(--admin-border)`; color → `var(--admin-text-primary)`
    - Séparateur header : `border-color:rgba(56,189,248,0.1)` → `var(--admin-border)`
    - _Requirements: 19.3, 20.1_

  - [x] 6.3 Dans `OrderDetailModal.tsx` : standardiser les Status Badges (même format que CommandesTable)
    - Appliquer le même `STATUS_MAP` light avec les couleurs sémantiques et le format uniforme
    - _Requirements: 14.1, 14.3, 14.4_

  - [x] 6.4 Dans `ClientDetailModal.tsx` : appliquer les mêmes migrations visuelles
    - Fond modale → `var(--admin-card-bg)` ; border → `var(--admin-border)`
    - Titres, labels, valeurs → tokens `--admin-text-primary` / `--admin-text-muted`
    - Séparateurs → `var(--admin-border)`
    - Conserver `id="client-detail-modal"` (déjà vérifié en Task 1.3)
    - _Requirements: 19.1, 19.2, 19.3, 19.5_

  - [~] 6.5 Tests unitaires — modales
    - Vérifier que `OrderDetailModal` rendu a un fond `var(--admin-card-bg)` et non une couleur foncée hardcodée
    - Vérifier que `ClientDetailModal` rendu a des liens pointant vers `/admin/commandes` et `/admin/rdv` (déjà couvert en 1.7, re-vérifier après migration visuelle)
    - Vérifier que l'overlay est `rgba(0,0,0,0.5)`
    - _Requirements: 19.1, 19.2, 19.4, 3.1, 3.3_

- [ ] 7. Migrer `BulkActionsToolbar.tsx` et toutes les pages admin restantes
  - Dépend de : Tasks 2, 4
  - [-] 7.1 Dans `BulkActionsToolbar.tsx` : migration light theme complète
    - Conteneur : `background:rgba(59,130,246,0.08); border:rgba(59,130,246,0.15)` → `background: var(--admin-accent-light); border: 1px solid var(--admin-border)`
    - Texte compteur : `text-white` → `color: var(--admin-text-primary)`
    - Bouton "Statut en lot" : → `background: var(--admin-warning-light); color: var(--admin-warning); border: 1px solid rgba(217,119,6,0.25)`
    - Bouton "Exporter" : → `background: var(--admin-info-light); color: var(--admin-info); border: 1px solid rgba(37,99,235,0.25)`
    - Bouton "Supprimer" : → `background: var(--admin-danger-light); color: var(--admin-danger); border: 1px solid rgba(220,38,38,0.25)`
    - Bouton "Effacer sélection" : → `background: var(--admin-bg-elevated); color: var(--admin-text-muted)`
    - _Requirements: 11.2, 19.1_

  - [-] 7.2 Dans `src/pages/admin.tsx` — migrer les tableaux inline des 14 pages admin non couvertes par Tasks 4–6
    - Pages : `AdminProduitsPage`, `AdminRDVPage`, `AdminClientsPage`, `AdminAvisPage`, `AdminDevisListPage`, `AdminDevisNewPage`, `AdminPaiementsPage`, `AdminMaintenancePage`, `AdminMessagesPage`, `AdminSAVPage`, `AdminSAVDetailPage`, `AdminAuditLogPage`, `AdminNotificationsPage`, `AdminRealisationsPage`, `AdminParametresPage`
    - Pour chaque tableau : `<thead>` background → `#f1f5f9` ; `<th>` color → `var(--admin-text-muted)` ; séparateurs → `var(--admin-border)` ; textes `<td>` → `var(--admin-text-primary)` / `var(--admin-text-muted)`
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

  - [-] 7.3 Dans `src/pages/admin.tsx` — migrer toutes les modales inline
    - Toutes les `<div>` de modal (`id="add-product-modal"`, `id="edit-product-modal"`, `id="add-rdv-modal"`, `id="add-client-modal"`, `id="edit-client-modal"`, modale galerie, validation-modal, etc.) : fond `#0b1120` / `#111827` → `var(--admin-card-bg)` ; bordures → `var(--admin-border)` ; titres/textes → tokens
    - Overlays conservés à `background:rgba(0,0,0,0.5)` ou `rgba(0,0,0,0.75)` (lisibilité sur fond clair)
    - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5_

  - [-] 7.4 Dans `src/pages/admin.tsx` — vérifier et migrer les KPI stat-cards de chaque page
    - S'assurer que les styles inline hardcodés sur les cartes KPI de chaque page utilisent les tokens (ou s'appuient sur la classe `.stat-card` déjà migrée en Task 4.4)
    - `AdminPage` dashboard : migrer les widgets spécifiques (grille "Cette semaine", "Actions rapides") vers les tokens
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

  - [~] 7.5 Tests property-based — invariants transversaux
    - **Property 1: Function existence invariant** — pour tout tableau de commandes rendu (0 à 50 commandes), `window.adminBulkAction` et `window.adminClearSelection` sont des fonctions avant toute interaction
      - Annotée `// Feature: admin-ui-light-refactor, Property 1: Function existence invariant`
      - Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5
    - **Property 3: Maintenance status mapping invariant** — pour tout objet visite avec `status === 'scheduled'` ou `status === 'done'`, le statut normalisé est respectivement `'planifiee'` ou `'effectuee'` ; tout autre statut est retourné inchangé
      - Annotée `// Feature: admin-ui-light-refactor, Property 3: Maintenance status mapping invariant`
      - Validates: Requirements 6.1, 6.2, 6.3, 6.4
    - **Property 5: Unique DOM IDs invariant** — pour chaque page admin rendue (`commandes`, `clients`, `rdv`, `dashboard`), tous les `id` HTML du DOM sont uniques ; en particulier `client-detail-modal` et `order-client-detail-modal` ne coexistent jamais sur la même page
      - Annotée `// Feature: admin-ui-light-refactor, Property 5: Unique DOM IDs invariant`
      - Validates: Requirements 9.1, 9.2, 9.3
    - **Property 7: Token isolation invariant** — vérifier statiquement que les fichiers `.tsx` migrés ne contiennent aucune occurrence des valeurs dark hardcodées (`#0b1120`, `#111827`, `rgba(15,23,42,`) dans leurs styles inline après migration
      - Annotée `// Feature: admin-ui-light-refactor, Property 7: Token isolation invariant`
      - Validates: Requirements 10.2, 11.5, 12.1, 13.1, 19.1
    - _Requirements: 1.1–1.5, 6.1–6.4, 9.1–9.3, 10.2_

- [~] 8. Checkpoint final — Vérification complète
  - Lancer `tsc --noEmit` — zéro erreur de compilation attendue
  - Parcourir les 16 pages admin pour vérifier : fond clair `#f8fafc`, sidebar navy conservée, topbar blanc translucide, tableaux sur fond blanc, badges uniformes, modales sur fond blanc
  - Vérifier en console browser : aucune `ReferenceError` pour `adminBulkAction` / `adminClearSelection` / `filterTable`
  - Vérifier que la pagination fonctionne sur les tableaux CommandesTable avec > 20 lignes
  - Si des problèmes subsistent, corriger avant de marquer cette tâche comme complète. Poser toute question à l'utilisateur si nécessaire.

---

## Notes

- Les sous-tâches marquées `*` sont optionnelles et peuvent être passées pour un MVP plus rapide
- Tasks 1 et 2 sont indépendantes et peuvent être exécutées en parallèle
- Tasks 4, 5, 6 dépendent de Task 2 et peuvent être exécutées en parallèle entre elles
- Task 7 dépend de Task 4 (admin-tokens.css chargé dans AdminLayout)
- Task 3 (checkpoint intermédiaire) et Task 8 (checkpoint final) ne sont pas des tâches de code — ce sont des points de validation
- Les tests PBT utilisent **fast-check** avec minimum 100 itérations par propriété
- Chaque test propriété référence son numéro de propriété via un commentaire `// Feature: admin-ui-light-refactor, Property N: ...`
- La sidebar navy (`#0f172a`) est intentionnellement conservée — c'est l'identité de marque MAASGA
- Les toasts gardent leur fond coloré même en light theme pour la visibilité maximale
- Aucune tâche de déploiement ou de validation utilisateur n'est incluse — ce plan couvre uniquement les tâches de code

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3", "1.4", "1.5", "1.6", "2.1", "2.2"] },
    { "id": 1, "tasks": ["1.7", "2.3", "4.1", "4.2", "4.3", "4.4", "4.5", "4.6", "4.7", "4.8", "5.1", "5.2", "5.3", "5.4", "5.5", "5.6", "6.1", "6.2", "6.3", "6.4"] },
    { "id": 2, "tasks": ["4.9", "5.7", "6.5", "7.1", "7.2", "7.3", "7.4"] },
    { "id": 3, "tasks": ["7.5"] }
  ]
}
```
