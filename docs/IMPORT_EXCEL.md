# Import en masse — Guide Excel

> Accessible depuis : **Admin → Produits & Stock → bouton "Importer en masse"**

---

## Principe

Tu glisses n'importe quel fichier tableau fournisseur (`.xlsx`, `.xls`, `.csv`) dans la modale. Le système détecte automatiquement la structure — ligne d'en-tête, colonnes, synonymes d'intitulés — et te montre un aperçu complet de ce qui sera écrit avant toute confirmation.

---

## Les 4 étapes

### 1. Fichier
Glisse le fichier ou clique pour parcourir. Si le classeur contient plusieurs feuilles, un sélecteur apparaît.

**Formats acceptés :** `.xlsx`, `.xls`, `.csv`
**Taille max :** 500 lignes par lot (les fichiers plus grands sont découpés automatiquement)

Tu peux aussi télécharger un **modèle pré-rempli** (lien sous la zone de dépôt) pour voir exactement comment structurer ton fichier.

---

### 2. Correspondance des colonnes
Le système affiche sa lecture de chaque colonne :
- **Intitulé reconnu** (vert) — correspondance exacte ou proche avec un champ MAASGA
- **Déduit du contenu** (jaune) — détection par les valeurs (ex : une colonne de nombres entre 50 000 et 10 000 000 → Prix)
- **Non reconnue** (gris) — tu peux forcer la correspondance via le menu déroulant

Tu peux aussi corriger la **ligne d'en-tête** si elle n'est pas sur la première ligne du fichier (champ "Ligne d'en-tête" en haut à droite — `0` = aucune en-tête).

Toute modification relance l'analyse serveur immédiatement.

---

### 3. Aperçu
Tableau complet de ce qui sera importé, ligne par ligne. Chaque valeur porte une **pastille d'origine** :

| Couleur | Signification |
|---|---|
| ⬤ Gris clair | Lue dans le fichier |
| ⬤ Bleu | Déduite du libellé (BTU extrait du nom, catégorie inférée…) |
| ⬤ Gris foncé | Valeur par défaut (aucune donnée dans le fichier) |

**Champs éditables directement dans l'aperçu :**
Nom, Marque, Catégorie, BTU, Prix de vente, Stock, Modèle/Référence, Prix grossiste, Disponible, Garantie. Toute correction relance l'analyse et rafraîchit l'aperçu — ce que tu vois est exactement ce qui sera écrit en base.

**Option "Produit déjà au catalogue" :**
- *Mettre à jour la fiche* — seuls les champs apportés par le fichier écrasent la fiche existante (la photo et les valeurs saisies manuellement sont préservées)
- *Laisser inchangée* — les doublons sont ignorés
- *Créer une fiche de plus* — une nouvelle fiche est créée même si un produit similaire existe

---

### 4. Résultat
Récapitulatif : créés / mis à jour / ignorés / en erreur. Les lignes en erreur sont listées avec le numéro de ligne du fichier source pour retrouver facilement.

---

## Structure du fichier Excel

L'ordre des colonnes est libre. Les intitulés sont reconnus par synonymes (ex : `PU`, `Prix unitaire`, `Price` → Prix de vente).

| # | Colonne | Type | Obligatoire | Exemple |
|---|---|---|---|---|
| 1 | Désignation | Texte | ✅ | `Climatiseur LG Dual Cool 12000 BTU Inverter` |
| 2 | Marque | Texte | ✅ | `LG` |
| 3 | Modèle | Texte | — | `S4-Q12JA3QA` |
| 4 | Catégorie | Texte | — | `Mural/Split` |
| 5 | Puissance BTU | Nombre | ✅ | `12000` |
| 6 | Prix de vente | Nombre (FCFA) | ✅ | `450000` |
| 7 | Prix grossiste | Nombre (FCFA) | — | `400000` |
| 8 | Quantité | Nombre | — | `5` |
| 9 | Classe énergétique | Texte | — | `A++` |
| 10 | Inverter | Oui/Non | — | `oui` |
| 11 | Disponible | Oui/Non | — | `oui` |
| 12 | Fluide réfrigérant | Texte | — | `R32` |
| 13 | Compresseur | Texte | — | `Rotatif` |
| 14 | Garantie | Texte | — | `2 ans constructeur` |
| 15 | Description | Texte long | — | `Refroidissement rapide…` |
| 16 | Mentions | Liste (séparateur `;`) | — | `Inverter; Filtre antibactérien; Mode nuit` |

**4 colonnes bloquantes** : sans Désignation, Marque, Puissance BTU ou Prix de vente, la ligne est rejetée.

### Catégories reconnues
`Mural/Split` · `Cassette` · `Gainable` · `Colonne` · `Multi-split` · `Rooftop` · `Industriel`

### Puissance
Accepte BTU, CV ou kW — la conversion est automatique. `1.5 CV` → `12 000 BTU`, `3.5 kW` → `11 944 BTU`.

### Séparateur des Mentions
Priorité : `;` > retour à la ligne > `|` > `,` (la virgule est utilisée en dernier recours car elle peut apparaître dans une mention).

---

## Ce qui n'est PAS importé
- **Les photos** — elles s'ajoutent manuellement depuis chaque fiche ou via la Médiathèque par marque.
- **Les vidéos** — idem.

Une colonne "photo" détectée dans le fichier génère un avertissement visible dans l'aperçu.
