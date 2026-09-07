# Design Document — bulk-import-optional-fields

## Overview

Two files change. Nothing else moves.

1. **`src/utils/importProduits.ts`** — extend `CHAMPS_CORRIGEABLES` and `COLONNES_MODELE`.
2. **`src/pages/admin.tsx`** — extend the Preview_Table header and the `rendreApercu()` vanilla-JS function injected via `dangerouslySetInnerHTML`.

The backend (`src/index.tsx`) already persists every optional field; no server changes are needed.

---

## Architecture

### Data flow (unchanged)

```
Excel file (browser)
  → SheetJS → raw rows
  → POST /api/admin/produits/import { mode: 'analyse' }
  → analyserClasseur() → ProduitDerive[]  (all fields already derived)
  → rendreApercu() (browser)  ← THIS IS WHAT WE EXTEND
```

The `ProduitDerive` object returned by the server already contains:
- `champs.modele`, `champs.prixGrossisteFcfa`, `champs.disponible`, `champs.description`
- `champs.mentions` (string[]), `champs.refrigerant`, `champs.compresseur`, `champs.garantie`
- `origines.*` for all of the above

So the browser already receives all the data — it just doesn't render it yet.

---

## Change 1 — `importProduits.ts`

### 1a. Extend `CHAMPS_CORRIGEABLES`

```ts
// Before
export const CHAMPS_CORRIGEABLES: ChampCible[] = [
  'nom', 'marque', 'categorie', 'puissanceBtu', 'prixFcfa', 'stockInitial'
]

// After
export const CHAMPS_CORRIGEABLES: ChampCible[] = [
  'nom', 'marque', 'categorie', 'puissanceBtu', 'prixFcfa', 'stockInitial',
  'modele', 'prixGrossisteFcfa', 'disponible', 'garantie'
]
```

The four added fields are safe to correct manually:
- `modele` — text, no validation risk.
- `prixGrossisteFcfa` — number, already validated by `construireProduit` on re-analysis.
- `disponible` — boolean, already parsed by `parseBooleen`.
- `garantie` — text, max 80 chars, already sanitized.

`description`, `mentions`, `refrigerant`, `compresseur` stay read-only in the preview — descriptions are auto-generated and long; refrigerant/compressor are "never invented" so an empty field is intentional.

### 1b. Extend `COLONNES_MODELE`

Add the five columns that were missing from the downloadable template. The order matches the natural left-to-right reading of a product datasheet:

```ts
export const COLONNES_MODELE: Array<[string, string]> = [
  ['Désignation',       'Climatiseur LG Dual Cool 12000 BTU Inverter'],
  ['Marque',            'LG'],
  ['Modèle',            'S4-Q12JA3QA'],          // already present
  ['Catégorie',         'Mural/Split'],
  ['Puissance BTU',     '12000'],
  ['Prix de vente',     '450000'],
  ['Prix grossiste',    '400000'],               // already present
  ['Quantité',          '5'],
  ['Classe énergétique','A++'],
  ['Inverter',          'oui'],
  ['Fluide réfrigérant','R32'],                  // already present
  ['Compresseur',       'Rotatif'],              // already present
  ['Garantie',          '2 ans constructeur'],   // already present
  ['Description',       'Refroidissement rapide, faible consommation.'],  // already present
  ['Mentions',          'Inverter; Filtre antibactérien; Mode nuit'],      // already present
  ['Disponible',        'oui'],                  // NEW
]
```

The current `COLONNES_MODELE` already has Modèle, Prix grossiste, Fluide réfrigérant, Compresseur, Garantie, Description, Mentions. Only `Disponible` is missing. We add it at the end so existing template users are not surprised.

---

## Change 2 — `admin.tsx` (Preview_Table)

### 2a. Table header

Add 8 `<th>` elements after the existing `Inverter` column and before `État`:

| Column | Width hint |
|---|---|
| Modèle | auto |
| Prix gros. | auto |
| Dispo | auto |
| Description | auto (truncated) |
| Mentions | auto (truncated) |
| Réfrigérant | auto |
| Compresseur | auto |
| Garantie | auto |

### 2b. `rendreApercu()` — new helper `celluleTronquee`

```js
function celluleTronquee(texte, origine) {
  var td = document.createElement('td');
  td.className = 'px-3 py-2';
  var s = (texte === null || texte === undefined || texte === '') ? '—' : String(texte);
  var affiche = s.length > 80 ? s.slice(0, 80) + '…' : s;
  td.textContent = affiche;
  if (s.length > 80) td.title = s;   // native tooltip with full text
  if (origine) td.appendChild(pastille(origine));
  return td;
}
```

### 2c. `rendreApercu()` — new editable cells for optional fields

Four new `celluleEditable` calls:
- `modele` → `input[type=text]` width `w-32`
- `prixGrossisteFcfa` → `input[type=number]` width `w-28`
- `disponible` → `<select>` (`oui`/`non`) width `w-20`
- `garantie` → `input[type=text]` width `w-32`

Three new `celluleTronquee` calls (read-only):
- `description` → joined text, truncated
- `mentions` → `Array.join(', ')`, truncated
- `refrigerant` → plain text
- `compresseur` → plain text

### 2d. `celluleEditable` — handle `disponible` and `prixGrossisteFcfa`

The existing `celluleEditable` function handles `categorie` as a special `<select>`. We extend it with:

```js
if (champ === 'disponible') {
  controle = document.createElement('select');
  ['oui', 'non'].forEach(function(opt) {
    var o = document.createElement('option');
    o.value = opt;
    o.textContent = opt;
    controle.appendChild(o);
  });
  controle.value = valeur ? 'oui' : 'non';
  controle.className = 'rounded-lg px-2 py-1 text-xs text-white w-20';
}
```

When the admin changes `disponible`, the correction is stored as the string `'oui'` or `'non'`, which `parseBooleen` in `construireProduit` already handles correctly (`'oui'` → `true`, `'non'` → `false`).

---

## Width strategy for the extended table

The table already uses `whitespace-nowrap` on the container. The new `overflow-x: auto` wrapper is already in place (`max-h-80 overflow-auto`). No layout change is needed — the horizontal scrollbar will simply appear when the 19-column table overflows.

---

## No backend changes

`COLONNES_IMPORT` in `index.tsx` already maps all optional fields to their DB columns. `apporteValeur` already respects the `origine` flag. Nothing in the API changes.

---

## Security

All cell content is assigned via `textContent` or `element.value` — never via `innerHTML` concatenation. `celluleTronquee` follows the same pattern as the existing `cellule` helper. No XSS surface is added.
