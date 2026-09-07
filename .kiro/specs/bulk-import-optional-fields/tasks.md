# Tasks — bulk-import-optional-fields

## Task 1 — Extend CHAMPS_CORRIGEABLES

**File:** `src/utils/importProduits.ts`

Add `modele`, `prixGrossisteFcfa`, `disponible`, `garantie` to the exported array.

```ts
// Before
export const CHAMPS_CORRIGEABLES: ChampCible[] = ['nom', 'marque', 'categorie', 'puissanceBtu', 'prixFcfa', 'stockInitial']

// After
export const CHAMPS_CORRIGEABLES: ChampCible[] = [
  'nom', 'marque', 'categorie', 'puissanceBtu', 'prixFcfa', 'stockInitial',
  'modele', 'prixGrossisteFcfa', 'disponible', 'garantie'
]
```

---

## Task 2 — Update COLONNES_MODELE

**File:** `src/utils/importProduits.ts`

Add `['Disponible', 'oui']` as the last entry in `COLONNES_MODELE`.

---

## Task 3 — Extend Preview_Table header

**File:** `src/pages/admin.tsx`

In the `<thead>` of the aperçu table (étape 3), add 8 `<th>` elements after `Inverter` and before `État`:

```
Modèle | Prix gros. | Dispo | Description | Mentions | Réfrigérant | Compresseur | Garantie
```

---

## Task 4 — Add `celluleTronquee` helper to rendreApercu JS

**File:** `src/pages/admin.tsx`

Inside the `(function () { … })()` IIFE, add a `celluleTronquee(texte, origine)` helper that:
- Returns a `<td>` with `textContent` set to the value (or `—` if empty).
- Truncates to 80 chars + `…` and sets `title` for tooltip when value exceeds 80 chars.
- Appends a `pastille(origine)` dot when `origine` is provided.

---

## Task 5 — Extend celluleEditable for disponible

**File:** `src/pages/admin.tsx`

In `celluleEditable`, before the `else { controle = document.createElement('input'); … }` branch, add:

```js
} else if (champ === 'disponible') {
  controle = document.createElement('select');
  ['oui', 'non'].forEach(function(opt) {
    var o = document.createElement('option');
    o.value = opt;
    o.textContent = opt;
    controle.appendChild(o);
  });
  controle.value = valeur ? 'oui' : 'non';
  controle.className = 'rounded-lg px-2 py-1 text-xs text-white w-20';
  controle.style.cssText = 'background:#0b1220; border:1px solid rgba(148,163,184,0.2);';
```

---

## Task 6 — Render optional field cells in rendreApercu

**File:** `src/pages/admin.tsx`

In `rendreApercu()`, after the existing `tr.appendChild(tdInv)` line and before the `tdEtat` block, add:

```js
// Editable optional fields
tr.appendChild(celluleEditable(p, 'modele', 'text'));
tr.appendChild(celluleEditable(p, 'prixGrossisteFcfa', 'number'));
tr.appendChild(celluleEditable(p, 'disponible', 'bool'));

// Read-only optional fields
var mentionsTexte = Array.isArray(p.champs.mentions) ? p.champs.mentions.join(', ') : '';
tr.appendChild(celluleTronquee(p.champs.description, p.origines.description));
tr.appendChild(celluleTronquee(mentionsTexte, p.origines.mentions));
tr.appendChild(celluleTronquee(p.champs.refrigerant, p.origines.refrigerant));
tr.appendChild(celluleTronquee(p.champs.compresseur, p.origines.compresseur));

// Editable optional field — garantie
tr.appendChild(celluleEditable(p, 'garantie', 'text'));
```

Width overrides for the smaller editable inputs: pass explicit CSS width class via an updated `celluleEditable` signature or override after creation:

```js
// modele input: w-32, garantie input: w-32, prixGrossisteFcfa: w-28
```
