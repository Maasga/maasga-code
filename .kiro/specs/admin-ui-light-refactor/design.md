# Design Document — admin-ui-light-refactor

## Overview

Ce document décrit la conception technique de la refonte de l'interface d'administration MAASGA. Le périmètre couvre deux axes complémentaires :

1. **Corrections de bugs fonctionnels** — fonctions `adminBulkAction`/`adminClearSelection` manquantes, fichier mort `ImprovedAdminCommandesPage.tsx`, liens invalides dans `ClientDetailModal`, entrée Réalisations absente de la sidebar, absence de `data-paginate` sur les `<tbody>` des tableaux de commandes, désynchronisation des statuts de maintenance (`scheduled` vs `planifiee`), double définition de `filterTable`, grille orpheline autour de `CommandesProcessDiagram`, et conflit d'ID `client-detail-modal`.

2. **Refonte visuelle vers un thème clair** — création d'un fichier de tokens CSS isolés (`admin-tokens.css`), application du Light Theme à AdminLayout, sidebar, topbar, cartes KPI, tableaux, badges de statut, modales, formulaires, toasts, notifications et barre de recherche globale. Résolution des conflits CSS liés à `.btn-primary`, à la police de caractères, aux overrides mobile trop larges et au gonflement des boutons.

Le projet est rendu entièrement côté serveur avec **Hono JSX SSR** — aucun runtime React n'est présent. Toutes les interactions sont gérées en **JavaScript vanilla inline**.

---

## Architecture

### Vue d'ensemble des fichiers modifiés

```
maasga-code/
├── public/static/
│   └── admin-tokens.css                  ← NOUVEAU fichier de tokens CSS
├── src/
│   ├── pages/
│   │   └── admin.tsx                     ← AdminLayout, AdminCommandesPage (bug fixes + light theme)
│   ├── components/admin/
│   │   ├── CommandesTable.tsx            ← data-paginate, filterTable guard, light theme
│   │   ├── CommandesKPIs.tsx             ← light theme tokens
│   │   ├── OrderDetailModal.tsx          ← light theme tokens
│   │   ├── ClientDetailModal.tsx         ← light theme + route fixes
│   │   ├── BulkActionsToolbar.tsx        ← light theme tokens
│   │   └── ImprovedAdminCommandesPage.tsx ← SUPPRIMÉ
│   └── hooks/
│       └── useAdminMaintenanceData.ts    ← mapping statuts scheduled→planifiee, done→effectuee
```

### Stratégie de thème CSS

Le thème admin est **entièrement isolé** du site public via une classe `.admin-ui` portée par le `<body>` de `AdminLayout`. Toutes les variables CSS `--admin-*` sont déclarées sous ce sélecteur, ce qui garantit qu'elles n'affectent pas les pages publiques et que les overrides du site public (app.css) ne pollulent pas l'admin.

**Ordre de chargement dans `<head>` :**

```html
<link rel="stylesheet" href="/static/tailwind.css" />
<link rel="stylesheet" href="/static/admin-tokens.css" />  <!-- NOUVEAU -->
<link rel="stylesheet" href="/static/style.css" />
```

`admin-tokens.css` doit être chargé **après** Tailwind (pour pouvoir l'overrider) et **avant** `style.css` (pour que le inline `<style>` de AdminLayout ait la priorité finale sur les tokens).

---

## Components and Interfaces

### 1. `public/static/admin-tokens.css` (nouveau)

Fichier autonome. N'importe aucune autre feuille de style.

```css
/* Toutes les variables sont scopées sous .admin-ui — jamais sur :root */
.admin-ui {
  /* Backgrounds */
  --admin-bg: #f8fafc;
  --admin-bg-elevated: #f1f5f9;
  --admin-sidebar-bg: #0f172a;        /* navy — identité de marque, ne change pas */
  --admin-card-bg: #ffffff;

  /* Borders */
  --admin-border: #e2e8f0;

  /* Typography */
  --admin-text-primary: #0f172a;
  --admin-text-muted: #94a3b8;
  --admin-font-sans: 'Inter', system-ui, -apple-system, sans-serif;

  /* Accent */
  --admin-accent: #0369a1;
  --admin-accent-hover: #0284c7;
  --admin-accent-light: #e0f2fe;

  /* Semantic colors */
  --admin-success: #059669;
  --admin-success-light: #d1fae5;
  --admin-warning: #d97706;
  --admin-warning-light: #fef3c7;
  --admin-danger: #dc2626;
  --admin-danger-light: #fee2e2;
  --admin-info: #2563eb;
  --admin-info-light: #dbeafe;

  /* Status badge colors */
  --admin-status-pending: #d97706;
  --admin-status-confirmed: #059669;
  --admin-status-processing: #2563eb;
  --admin-status-delivered: #0369a1;
  --admin-status-cancelled: #dc2626;

  /* Layout helpers */
  --admin-radius: 0.75rem;
  --admin-shadow-card: 0 1px 4px rgba(15,23,42,0.06), 0 0 0 1px rgba(15,23,42,0.04);
  --admin-btn-primary-bg: linear-gradient(135deg, #0369a1, #0284c7);

  /* Polices appliquées globalement au scope admin */
  font-family: var(--admin-font-sans);
}

/* Scrollbar thème clair */
.admin-ui ::-webkit-scrollbar-track { background: #f1f5f9; }
.admin-ui ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
.admin-ui ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

/* Neutraliser le min-height 44px de app.css sur les éléments interactifs admin */
.admin-ui a,
.admin-ui button { min-height: unset; }

/* Préserver les min-height explicites des boutons primaires/secondaires */
.admin-ui .btn-primary,
.admin-ui .btn-secondary { min-height: 2.5rem; }

/* Override mobile max-width : cibler uniquement les modales */
@media (max-width: 639px) {
  .admin-ui .modal .rounded-3xl,
  .admin-ui .modal .rounded-2xl,
  .admin-ui [role="dialog"] .rounded-3xl,
  .admin-ui [role="dialog"] .rounded-2xl {
    max-width: calc(100vw - 1rem) !important;
  }
}
```

**Décision de conception** : Les variables sont scopées sous `.admin-ui` et non `:root` afin d'éviter toute collision avec les tokens du site public qui utilisent `--primary`, `--accent`, etc. L'isolation totale permet de modifier le thème admin sans risque de régression sur les pages publiques.

---

### 2. `AdminLayout` (admin.tsx)

#### `<body>` tag

```tsx
<body class="admin-ui min-h-screen flex overflow-x-hidden" style="background: var(--admin-bg);">
```

Ajout de `admin-ui` pour activer les tokens CSS. Remplacement du fond encodé en dur `#0b1120` par `var(--admin-bg)`.

#### Inline `<style>` — changements clés

| Sélecteur | Avant | Après |
|---|---|---|
| `* { font-family }` | `'Inter', sans-serif` | **Supprimé** (déplacé dans admin-tokens.css) |
| `body` background | `#0b1120` | `var(--admin-bg)` |
| `.admin-sidebar` | `background: linear-gradient(180deg, #0f172a 0%, #1a3478 100%)` | **Inchangé** (contraste ≥ 4.5:1 garanti sur navy) |
| `.card-shadow` | `box-shadow: 0 2px 20px rgba(0,0,0,0.3), 0 0 0 1px rgba(56,189,248,0.06)` | `box-shadow: var(--admin-shadow-card); background: var(--admin-card-bg); border: 1px solid var(--admin-border)` |
| `.stat-card` | `background: #111827; border: 1px solid rgba(56,189,248,0.1)` | `background: var(--admin-card-bg); border: 1px solid var(--admin-border)` |
| `.input-field` | `border: 1.5px solid rgba(56,189,248,0.18); background: rgba(15,23,42,0.7); color: #e0f0ff` | `border: 1.5px solid var(--admin-border); background: var(--admin-card-bg); color: var(--admin-text-primary)` |
| `.input-field:focus` | `border-color: #38bdf8; box-shadow: 0 0 0 3px rgba(56,189,248,0.15)` | `border-color: var(--admin-accent); box-shadow: 0 0 0 3px rgba(3,105,161,0.15)` |
| `.input-field::placeholder` | `color: #64748b` | `color: var(--admin-text-muted)` |
| `.admin-ui .btn-primary` | conflit avec app.css | `background: var(--admin-btn-primary-bg); color: white; transition: all 0.2s; box-shadow: 0 4px 12px rgba(3,105,161,0.25)` |
| Mobile `.rounded-2xl` max-width | `max-width: calc(100vw - 1rem) !important` sur tous | **déplacé** dans admin-tokens.css, ciblant uniquement `.modal` et `[role=dialog]` |

#### Topbar (header)

```tsx
<header style="background:rgba(255,255,255,0.92); backdrop-filter:blur(12px); border-bottom:1px solid var(--admin-border);">
```

- Texte titre : `color: var(--admin-text-primary)`
- Sous-titre date : `color: var(--admin-text-muted)`
- Boutons icônes (cloche, engrenage) : `color: var(--admin-text-muted)` → `hover: var(--admin-text-primary)`
- Badge "Système actif" : `background: var(--admin-success-light); color: var(--admin-success)`

#### Barre de recherche globale (topbar)

```
Champ input :
  background: rgba(241,245,249,0.8);
  border: 1px solid var(--admin-border);
  color: var(--admin-text-primary);

Panneau résultats #global-search-results :
  background: var(--admin-card-bg);
  border: 1px solid var(--admin-border);
  box-shadow: var(--admin-shadow-card);

Hover résultat :
  background: rgba(3,105,161,0.04);
```

#### Panneau notifications #notif-panel

```
background: var(--admin-card-bg);
border: 1px solid var(--admin-border);
Header separator: border-color: var(--admin-border);
Ligne non lue: background: rgba(3,105,161,0.04);
```

#### Navigation sidebar — ajout Réalisations

```tsx
{ href: "/admin/realisations", icon: "fa-images", label: "Réalisations", key: "realisations" }
```

Positionnée après l'entrée `avis` et avant `audit-log`.

```tsx
{ href: "/admin/avis",         icon: "fa-star",        label: "Avis clients",     key: "avis" },
{ href: "/admin/realisations", icon: "fa-images",       label: "Réalisations",     key: "realisations" },  // NOUVEAU
{ href: "/admin/audit-log",    icon: "fa-clipboard-list", label: "Audit / Logs",  key: "audit-log" },
```

#### Toast system

Les toasts gardent leur fond coloré (succès vert, erreur rouge, warning orange, info bleu). Les couleurs deviennent références aux tokens sémantiques :

```js
var colors = {
  success: 'linear-gradient(135deg, var(--admin-success), #10b981)',
  error:   'linear-gradient(135deg, var(--admin-danger), #ef4444)',
  warning: 'linear-gradient(135deg, var(--admin-warning), #f59e0b)',
  info:    'linear-gradient(135deg, var(--admin-info), #3b82f6)'
};
```

Le texte reste blanc — les toasts gardent intentionnellement un fond sombre/coloré pour la visibilité sur fond clair.

---

### 3. `CommandesTable.tsx`

#### Pagination — Req 5

Ajout de `data-paginate="20"` sur le `<tbody>` :

```tsx
<tbody data-paginate="20">
  {orders.map(order => ( ... ))}
</tbody>
```

#### filterTable — guard against double definition — Req 7

La définition de `filterTable` dans le `<script>` du composant est protégée par un guard :

```js
if (typeof window.filterTable !== 'function') {
  window.filterTable = function(tableId, query) {
    var q = query.toLowerCase().trim();
    var rows = document.querySelectorAll('#' + tableId + ' tbody tr');
    rows.forEach(function(row) {
      var text = (row.getAttribute('data-search') || '').toLowerCase();
      row.style.display = (!q || text.includes(q)) ? '' : 'none';
    });
  };
}
```

**Décision de conception** : le guard `typeof` au lieu d'un simple `if (!window.filterTable)` est préféré car il gère correctement les valeurs `undefined` et les contextes où la variable est déclarée mais non initialisée.

#### Light theme — styles inline

| Élément | Avant | Après |
|---|---|---|
| Conteneur `.space-y-3` parent | — | `background: var(--admin-card-bg)` |
| `<table>` wrapper | `background:rgba(15,23,42,0.4)` | `background: var(--admin-card-bg); border: 1px solid var(--admin-border); border-radius: var(--admin-radius)` |
| `<thead> <tr>` | `background:rgba(15,23,42,0.4)` | `background: #f1f5f9` |
| `<th>` | `color:#64748b` | `color: var(--admin-text-muted)` |
| `<tr>` hover | `hover:bg-white/[0.02]` | `hover:bg-[rgba(3,105,161,0.04)]` |
| `<td>` texte principal | `color:#e2e8f0` | `color: var(--admin-text-primary)` |
| `<td>` texte secondaire | `color:#64748b` | `color: var(--admin-text-muted)` |
| `border-color` rows | `rgba(56,189,248,0.06)` | `var(--admin-border)` |
| Champ recherche | `background:rgba(15,23,42,0.6); border:rgba(56,189,248,0.12); color:#e2e8f0` | `background: var(--admin-bg-elevated); border: 1px solid var(--admin-border); color: var(--admin-text-primary)` |
| Bouton Export CSV | `background:rgba(52,211,153,0.1); color:#34d399` | `background: rgba(5,150,105,0.08); color: #059669; border: 1px solid rgba(5,150,105,0.2)` |

**Status badges** — format uniforme dans tous les composants :

```
border-radius: 9999px;
padding: 0.2rem 0.65rem;
font-size: 0.7rem;
font-weight: 600;
background: rgba({couleur-statut}, 0.12);
border: 1px solid rgba({couleur-statut}, 0.25);
```

Mapping couleurs via tokens :

| Statut | Couleur | Token |
|---|---|---|
| `en_attente` | `#d97706` | `--admin-status-pending` |
| `confirme` | `#059669` | `--admin-status-confirmed` |
| `en_livraison` | `#2563eb` | `--admin-status-processing` |
| `livre` | `#0369a1` | `--admin-status-delivered` |
| `annule` | `#dc2626` | `--admin-status-cancelled` |
| `contacte` | `#2563eb` | `--admin-status-processing` |

---

### 4. `CommandesKPIs.tsx`

KPI cards migrées vers tokens légers :

```tsx
/* Avant */
style={`background:${kpi.bg}; border:1px solid ${kpi.border};`}

/* Après */
style={`background: var(--admin-accent-light); border: 1px solid var(--admin-border);`}
```

- Valeur numérique : `color: var(--admin-text-primary)` (font-weight 700 conservé)
- Libellé : `color: var(--admin-text-muted)`
- Icône : garde sa couleur sémantique spécifique (vert, bleu, etc.) pour la lisibilité rapide

---

### 5. `OrderDetailModal.tsx`

Migration complète vers tokens clairs :

```
Conteneur modal :
  background: var(--admin-card-bg);
  border: 1px solid var(--admin-border);

Header :
  border-bottom: 1px solid var(--admin-border);
  Texte titre: color: var(--admin-text-primary);

Labels champs :
  color: var(--admin-text-muted);

Valeurs champs :
  color: var(--admin-text-primary);

Montant :
  color: var(--admin-accent); (mise en valeur)

Select statut :
  background: var(--admin-bg-elevated);
  border: 1px solid var(--admin-border);
  color: var(--admin-text-primary);

Overlay :
  background: rgba(0,0,0,0.5); (conservé pour la lisibilité)
```

---

### 6. `ClientDetailModal.tsx`

#### Corrections de routes — Req 3

```tsx
/* Avant (route inexistante) */
href={`/admin/commandes/nouveau?client_id=${client.id}`}

/* Après (route existante) */
href={`/admin/commandes?client_id=${client.id}`}
```

```tsx
/* Avant (route hors /admin) */
href={`/rendez-vous?client_phone=${encodeURIComponent(client.phone)}`}

/* Après (route admin) */
href={`/admin/rdv${client.phone ? '?client_phone=' + encodeURIComponent(client.phone) : ''}`}
```

Le lien WhatsApp reste inchangé : `href={`https://wa.me/${...}`}`.

#### Migration thème clair

Mêmes tokens que `OrderDetailModal` — voir section 5.

#### Note sur l'ID — Req 9

Le composant `ClientDetailModal.tsx` conserve `id="client-detail-modal"` (utilisé sur la page `/admin/clients`). Dans `AdminCommandesPage`, la modale client inline utilise `id="order-client-detail-modal"` pour éviter le conflit de duplication d'ID.

---

### 7. `BulkActionsToolbar.tsx`

Migration vers tokens légers :

```
Conteneur :
  background: var(--admin-accent-light);
  border: 1px solid var(--admin-border);

Compteur texte :
  color: var(--admin-text-primary);

Bouton "Statut en lot" :
  background: var(--admin-warning-light);
  color: var(--admin-warning);
  border: 1px solid rgba(217,119,6,0.25);

Bouton "Exporter" :
  background: var(--admin-info-light);
  color: var(--admin-info);
  border: 1px solid rgba(37,99,235,0.25);

Bouton "Supprimer" :
  background: var(--admin-danger-light);
  color: var(--admin-danger);
  border: 1px solid rgba(220,38,38,0.25);

Bouton "Effacer sélection" :
  background: var(--admin-bg-elevated);
  color: var(--admin-text-muted);
```

---

### 8. `AdminCommandesPage` (admin.tsx)

#### Définition des fonctions bulk — Req 1

Un bloc `<script>` est ajouté **avant** le rendu de `BulkActionsToolbar` dans la page Commandes. Les fonctions sont attachées sur `window` pour le scope global :

```js
window.adminSelectedIds = window.adminSelectedIds || new Set();

window.adminBulkAction = window.adminBulkAction || function(type) {
  var ids = Array.from(window.adminSelectedIds);
  if (!ids.length) {
    showToast('Aucune commande sélectionnée.', 'warning');
    return;
  }
  if (type === 'status') {
    var newStatus = prompt('Nouveau statut : en_attente | contacte | confirme | en_livraison | livre | annule');
    if (!newStatus) return;
    fetch('/api/admin/commandes/bulk-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: ids, status: newStatus })
    }).then(function(r) { return r.json(); })
      .then(function(d) {
        showToast((d.updated || 0) + ' commandes mises à jour.', 'success');
        setTimeout(function() { location.reload(); }, 1200);
      })
      .catch(function() { showToast('Erreur réseau.', 'error'); });
  } else if (type === 'export') {
    window.location.href = '/api/admin/commandes/export?ids=' + ids.join(',');
  } else if (type === 'delete') {
    if (!confirm('Supprimer ' + ids.length + ' commande(s) ? Cette action est irréversible.')) return;
    fetch('/api/admin/commandes/bulk-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: ids })
    }).then(function(r) { return r.json(); })
      .then(function(d) {
        showToast((d.deleted || 0) + ' commandes supprimées.', 'success');
        setTimeout(function() { location.reload(); }, 1200);
      })
      .catch(function() { showToast('Erreur réseau.', 'error'); });
  }
};

window.adminClearSelection = window.adminClearSelection || function() {
  window.adminSelectedIds.clear();
  document.querySelectorAll('.order-checkbox').forEach(function(cb) {
    cb.checked = false;
  });
  document.getElementById('bulk-toolbar').style.display = 'none';
};
```

**Décision de conception** : les fonctions sont définies avec `window.X = window.X || function()` pour éviter les redéfinitions si le script est exécuté plusieurs fois (rechargement partiel, HMR en développement).

#### Correction grille orpheline — Req 8

```tsx
/* Avant */
<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
  <CommandesProcessDiagram ... />
</div>

/* Après — pas de grid quand enfant unique */
<div class="mb-6">
  <CommandesProcessDiagram ... />
</div>
```

#### ID de modale client — Req 9

La modale client inline dans `AdminCommandesPage` reçoit `id="order-client-detail-modal"` au lieu de `id="client-detail-modal"`.

---

### 9. `ImprovedAdminCommandesPage.tsx` — Suppression — Req 2

Le fichier `src/components/admin/ImprovedAdminCommandesPage.tsx` est supprimé. Il contenait des hooks React (`useState`, `useEffect`) incompatibles avec Hono JSR SSR, provoquant des erreurs de compilation. Tous les imports vers ce fichier dans `admin.tsx` sont retirés.

---

### 10. `useAdminMaintenanceData.ts` — Req 6

Le hook mappe les statuts venant de la base de données vers les valeurs attendues par l'interface admin :

```ts
// Mapping des statuts legacy → valeurs attendues par l'UI
const normalizeVisitStatus = (status: string): string => {
  if (status === 'scheduled') return 'planifiee';
  if (status === 'done') return 'effectuee';
  return status;
};

// Appliqué sur chaque visite retournée
const visits = rawVisits.map(v => ({
  ...v,
  status: normalizeVisitStatus(v.status)
}));
```

**Décision de conception** : le mapping est appliqué dans le hook (couche données) et non dans les composants de présentation. Cela garantit que les composants ne reçoivent jamais les valeurs non normalisées, quel que soit le contexte d'appel.

---

## Data Models

### Token CSS (`--admin-*`)

Les tokens ne correspondent pas à des modèles de données applicatives mais à un **contrat de style**. Les composants font référence uniquement aux tokens nommés ; jamais à des valeurs hexadécimales encodées en dur dans les fichiers `.tsx` des composants admin (après migration).

### Structure d'un Status Badge

```
background: rgba({couleur}, 0.12)
border: 1px solid rgba({couleur}, 0.25)
color: {couleur}
border-radius: 9999px
padding: 0.2rem 0.65rem
font-size: 0.7rem
font-weight: 600
```

Où `{couleur}` est la valeur RGB correspondant au token `--admin-status-*`.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Function existence invariant

*For any* rendered `AdminCommandesPage`, both `typeof window.adminBulkAction === 'function'` and `typeof window.adminClearSelection === 'function'` hold true before any user interaction.

**Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5**

---

### Property 2: Pagination invariant

*For any* `CommandesTable` rendered with `n > 20` orders and after `adminPaginate()` has executed, at most 20 `<tr>` elements are visible (i.e., not `display:none`) at any given time.

**Validates: Requirements 5.1, 5.2**

---

### Property 3: Maintenance status mapping invariant

*For any* visit object returned by `useAdminMaintenanceData` with raw `status === 'scheduled'` or `status === 'done'`, the normalized status is `'planifiee'` or `'effectuee'` respectively. No visit with status `'scheduled'` or `'done'` is ever passed directly to a UI component.

**Validates: Requirements 6.1, 6.2, 6.3, 6.4**

---

### Property 4: filterTable single definition invariant

*For any* admin page that renders two or more `CommandesTable` components, `window.filterTable` is defined exactly once in the global scope — regardless of how many table components are mounted.

**Validates: Requirements 7.1, 7.2, 7.3**

---

### Property 5: Unique DOM IDs invariant

*For any* single rendered admin page, no two elements in the DOM share the same `id` attribute value. In particular, the IDs `client-detail-modal` and `order-client-detail-modal` are never present simultaneously in the same page.

**Validates: Requirements 9.1, 9.2, 9.3**

---

### Property 6: Status badge uniformity invariant

*For any* `.status-badge` element rendered across all admin pages, the computed style satisfies: `border-radius === 9999px`, `font-size === 0.7rem`, `font-weight === 600`, and background opacity is `0.12` (±0.01 tolerance for floating-point rounding).

**Validates: Requirements 14.1, 14.3, 14.4**

---

### Property 7: Token isolation invariant

*For any* CSS custom property applied inside `.admin-ui`, its value is expressed via a `var(--admin-*)` reference and not as a hardcoded dark hexadecimal value (i.e., no `#0b1120`, `#111827`, `rgba(15,23,42,*)` etc. in the migrated component inline styles).

**Validates: Requirements 10.2, 11.5, 12.1, 13.1, 19.1**

---

## Error Handling

### CSS token fallback

Si `admin-tokens.css` ne se charge pas (erreur réseau, fichier absent), les composants admin affichent toujours un rendu fonctionnel grâce aux valeurs de repli Tailwind et aux styles inline résiduels. La règle CSS `var(--admin-bg, #f8fafc)` avec valeur de fallback explicite est utilisée pour les propriétés critiques.

### Fonctions bulk manquantes

Si `adminBulkAction` ou `adminClearSelection` ne sont pas définies au moment où `BulkActionsToolbar` s'affiche (cas de rechargement partiel ou ordre d'exécution inattendu), les boutons affichent une alerte toast via un fallback inline :

```js
onclick="if(typeof adminBulkAction==='function'){adminBulkAction('status')}else{showToast('Fonctionnalité non disponible.','error')}"
```

### Maintenance status normalization

Si `useAdminMaintenanceData` retourne un statut inattendu (ni `'scheduled'`/`'done'` ni les valeurs déjà normalisées), la fonction `normalizeVisitStatus` retourne le statut tel quel — comportement safe-by-default, aucune exception levée.

### Route correction (ClientDetailModal)

Si `client.phone` est absent ou vide, le lien Nouveau RDV navigue vers `/admin/rdv` sans paramètre `client_phone` (Req 3, AC4). Aucune erreur n'est levée.

---

## Testing Strategy

### Approche duale

Deux types de tests complémentaires couvrent ce refactoring :

- **Tests unitaires (example-based)** : vérifient des comportements spécifiques avec des données concrètes (route correcte dans ClientDetailModal, classe `admin-ui` sur body, entrée Réalisations dans le nav, etc.)
- **Tests de propriétés (property-based)** : vérifient des invariants universels sur toute une gamme d'entrées (pagination, unicité des IDs, existence des fonctions bulk, etc.)

### Bibliothèque PBT recommandée

[**fast-check**](https://fast-check.dev/) — bibliothèque TypeScript/JavaScript mature, compatible avec n'importe quel test runner (Vitest, Jest).

### Configuration

- Minimum **100 itérations** par test de propriété (valeur par défaut fast-check)
- Chaque test de propriété référence son numéro de propriété dans ce document via un commentaire de tag :
  ```ts
  // Feature: admin-ui-light-refactor, Property 2: Pagination invariant
  ```

### Tests unitaires — exemples concrets

**Req 3 — Routes ClientDetailModal :**
```ts
// Rendre ClientDetailModal avec un client mock {id:42, phone:'+22655996418', name:'Test'}
// Vérifier que href du lien "Nouvelle commande" contient "/admin/commandes?client_id=42"
// Vérifier que href du lien "Nouveau RDV" commence par "/admin/rdv"
```

**Req 4 — Entrée Réalisations :**
```ts
// Rendre AdminLayout avec activePage="realisations"
// Vérifier qu'un lien avec href="/admin/realisations" est présent
// Vérifier que l'ordre est: "avis" < "realisations" < "audit-log" dans le DOM
```

**Req 2 — Suppression fichier mort :**
```ts
// Vérifier statiquement qu'aucun fichier .ts/.tsx n'importe ImprovedAdminCommandesPage
```

**Req 11 — Classe admin-ui :**
```ts
// Rendre AdminLayout, vérifier que le body a la classe "admin-ui"
```

**Req 17 — Override mobile :**
```ts
// Vérifier que le sélecteur mobile max-width dans admin-tokens.css
// cible ".modal .rounded-2xl" et NON ".rounded-2xl" à la racine
```

### Tests de propriétés — implémentation

**Property 1 — Function existence :**
```ts
// Feature: admin-ui-light-refactor, Property 1: Function existence invariant
fc.assert(fc.property(
  fc.array(arbitraryOrder(), { minLength: 0, maxLength: 50 }),
  (orders) => {
    renderAdminCommandesPage(orders);
    return (
      typeof (window as any).adminBulkAction === 'function' &&
      typeof (window as any).adminClearSelection === 'function'
    );
  }
));
```

**Property 2 — Pagination :**
```ts
// Feature: admin-ui-light-refactor, Property 2: Pagination invariant
fc.assert(fc.property(
  fc.integer({ min: 21, max: 200 }),
  (n) => {
    const orders = Array.from({ length: n }, arbitraryOrder);
    renderCommandesTable(orders);
    (window as any).adminPaginate();
    const visibleRows = document.querySelectorAll('tbody tr:not([style*="display: none"])');
    return visibleRows.length <= 20;
  }
));
```

**Property 3 — Maintenance status mapping :**
```ts
// Feature: admin-ui-light-refactor, Property 3: Maintenance status mapping invariant
fc.assert(fc.property(
  fc.record({
    id: fc.integer(),
    status: fc.constantFrom('scheduled', 'done', 'planifiee', 'effectuee', 'annulee')
  }),
  (visit) => {
    const normalized = normalizeVisitStatus(visit.status);
    if (visit.status === 'scheduled') return normalized === 'planifiee';
    if (visit.status === 'done')      return normalized === 'effectuee';
    return normalized === visit.status; // pas de mutation des autres statuts
  }
));
```

**Property 4 — filterTable single definition :**
```ts
// Feature: admin-ui-light-refactor, Property 4: filterTable single definition invariant
fc.assert(fc.property(
  fc.integer({ min: 2, max: 5 }),
  (n) => {
    delete (window as any).filterTable;
    for (let i = 0; i < n; i++) {
      renderCommandesTable([], { tableId: `table-${i}` });
    }
    // Compter les redéfinitions en patchant temporairement Object.defineProperty
    return typeof (window as any).filterTable === 'function';
    // La propriété n'est pas redéfinie — vérifiable via le guard typeof
  }
));
```

**Property 5 — Unique DOM IDs :**
```ts
// Feature: admin-ui-light-refactor, Property 5: Unique DOM IDs invariant
fc.assert(fc.property(
  fc.constantFrom('commandes', 'clients', 'rdv', 'dashboard'),
  (page) => {
    renderAdminPage(page);
    const ids = Array.from(document.querySelectorAll('[id]')).map(el => el.id);
    return ids.length === new Set(ids).size;
  }
));
```

**Property 6 — Status badge uniformity :**
```ts
// Feature: admin-ui-light-refactor, Property 6: Status badge uniformity invariant
fc.assert(fc.property(
  fc.constantFrom('en_attente', 'confirme', 'en_livraison', 'livre', 'annule', 'contacte'),
  (status) => {
    const badge = renderStatusBadge(status);
    const style = getComputedStyle(badge);
    return (
      style.borderRadius === '9999px' &&
      parseFloat(style.fontSize) <= 11.2 && // 0.7rem ≈ 11.2px
      parseInt(style.fontWeight) >= 600
    );
  }
));
```

### Property reflection — redondances éliminées

Après analyse des 7 propriétés initiales :

- **Property 1** absorbe les critères 1.1 à 1.5 (même invariant, différents boutons) → une seule propriété couvre tout.
- **Properties 5 et 9** (du brief initial) sont fusionnées : l'invariant d'unicité des IDs est plus général que le cas spécifique `client-detail-modal`.
- **Property 7** (route validity) du brief initial est reclassifiée en tests d'exemples unitaires (ce n'est pas un invariant universel sur des entrées variables — c'est une vérification de valeurs spécifiques).

Résultat : 6 propriétés distinctes, sans redondance.

---

## Diagramme d'architecture CSS

```mermaid
graph TD
    A[tailwind.css] -->|chargé 1er| B[admin-tokens.css]
    B -->|chargé 2ème| C[style.css]
    C -->|chargé 3ème| D["AdminLayout inline <style>"]

    D -->|scoped .admin-ui| E[body.admin-ui]
    B -->|vars --admin-*| E

    E --> F[Sidebar\nnavigation navy]
    E --> G[Topbar\nbackground blanc 92%]
    E --> H[Content area\nvar(--admin-bg)]
    H --> I[.stat-card\nvar(--admin-card-bg)]
    H --> J[Tables\nvar(--admin-card-bg)]
    H --> K[Modales\nvar(--admin-card-bg)]
    H --> L[Forms .input-field\nvar(--admin-card-bg)]
```

---

## Décisions de conception — récapitulatif

| Décision | Rationale |
|---|---|
| Tokens scoped `.admin-ui` et non `:root` | Isolation totale vis-à-vis du site public. Pas de risque de régression sur les pages clients. |
| Sidebar reste navy | Identité de marque MAASGA. Contraste ≥ 4.5:1 vérifié (texte blanc sur `#0f172a`). |
| `filterTable` guard `typeof` | Deux `CommandesTable` sur la même page définiraient la fonction deux fois sans ce guard, causant des comportements imprévisibles dans les environnements avec reload partiel. |
| Fonctions bulk sur `window` avec `||` guard | Le SSR Hono génère les scripts inline dans l'ordre du JSX. Le guard `||` évite les redéfinitions si plusieurs sections de la page définissent le même symbole. |
| Mapping statuts dans le hook, pas dans les composants | Séparation couche données / présentation. Les composants UI ne doivent pas connaître les noms de statuts legacy de la base. |
| Suppression du fichier mort avant migration | Un fichier avec hooks React dans un projet Hono SSR cause des erreurs TypeScript qui bloquent toute la compilation. Priorité absolue. |
| Toasts gardent fond coloré même en light theme | Les toasts doivent être visibles sur n'importe quel fond. Texte blanc sur fond coloré = contraste maximal garanti. |
