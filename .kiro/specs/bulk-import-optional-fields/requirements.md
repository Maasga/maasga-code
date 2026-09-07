# Requirements Document

## Introduction

L'interface d'import en masse de produits (modale 4 étapes dans le back-office MAASGA) affiche déjà un aperçu des produits avant confirmation (étape 3). Cet aperçu n'expose que les champs primaires (Nom, Marque, Catégorie, BTU, Prix, Stock, Surfaces, Classe, Inverter), alors que le moteur serveur (`importProduits.ts`) dérive et persist déjà en base huit champs supplémentaires : Description, Mentions/Fonctionnalités, Fluide réfrigérant, Type de compresseur, Garantie, Prix grossiste, Disponible à la vente, Modèle/Référence.

L'objectif est de rendre ces champs optionnels visibles dans l'aperçu de l'étape 3, avec édition inline pour ceux qui sont corrigeables, afin que l'admin puisse vérifier et ajuster toutes les valeurs avant de confirmer l'import — exactement comme il le ferait depuis le formulaire d'ajout individuel.

## Glossary

- **Import_Modal** : la modale d'import en masse (4 étapes) accessible depuis la page Produits du back-office.
- **Preview_Table** : le tableau de l'étape 3 de l'Import_Modal qui présente une ligne par produit à importer.
- **Engine** : le module `src/utils/importProduits.ts` qui analyse le classeur et dérive les valeurs de chaque champ.
- **Field_Origin** : provenance d'une valeur de champ — `fichier` (lue dans le tableur), `deduit` (inférée par le moteur), `defaut` (constante de repli). Chaque origine est indiquée par une pastille colorée.
- **Editable_Cell** : cellule de la Preview_Table dont la valeur peut être modifiée par l'admin ; toute modification déclenche un round-trip serveur via l'Engine pour mettre à jour l'aperçu.
- **Optional_Fields** : les huit champs déjà traités par l'Engine et persistés en base, mais absents de la Preview_Table : Description, Mentions, Fluide réfrigérant, Type de compresseur, Garantie, Prix grossiste, Disponible à la vente, Modèle/Référence.
- **CHAMPS_CORRIGEABLES** : liste exportée par `importProduits.ts` des champs que l'admin peut corriger manuellement depuis l'aperçu.
- **COLONNES_MODELE** : tableau exporté par `importProduits.ts` définissant les colonnes du fichier modèle `.xlsx` téléchargeable.
- **Tooltip** : info-bulle HTML native (`title` attribute) affichant le contenu complet d'une cellule tronquée.
- **XSS_Safety** : contrainte de construction DOM — toutes les valeurs utilisateur sont assignées via `textContent` ou `value`, jamais par concaténation HTML.

## Requirements

### Requirement 1 : Afficher les champs optionnels dans l'aperçu (étape 3)

**User Story:** En tant qu'administrateur, je veux voir tous les champs qui seront importés dans l'aperçu de l'étape 3, afin de vérifier l'intégralité de la fiche produit avant de confirmer l'import.

#### Acceptance Criteria

1. WHEN l'admin atteint l'étape 3 de l'Import_Modal, THE Preview_Table SHALL afficher une colonne pour chacun des Optional_Fields suivants : Modèle/Référence, Prix grossiste, Disponible, Description, Mentions, Fluide réfrigérant, Compresseur, Garantie.
2. THE Preview_Table SHALL afficher les colonnes des Optional_Fields à la droite des colonnes existantes (Nom, Marque, Catégorie, BTU, Prix, Stock, Surfaces, Classe, Inverter, État), dans l'ordre : Modèle, Prix grossiste, Disponible, Description, Mentions, Réfrigérant, Compresseur, Garantie.
3. WHEN la valeur d'un Optional_Field est absente (`null`, `undefined` ou chaîne vide), THE Preview_Table SHALL afficher « — » dans la cellule correspondante.
4. THE Preview_Table SHALL afficher une pastille Field_Origin colorée dans chaque cellule d'Optional_Field, selon la même convention visuelle que les champs existants (`fichier` = gris-ardoise, `deduit` = bleu, `defaut` = gris foncé).
5. WHEN la valeur de Description dépasse 80 caractères, THE Preview_Table SHALL tronquer l'affichage à 80 caractères suivis de « … » et SHALL exposer le texte intégral via un Tooltip sur la cellule.
6. WHEN la valeur de Mentions est un tableau non vide, THE Preview_Table SHALL afficher les éléments joints par « , » (virgule espace), avec la même règle de troncature à 80 caractères que la Description.
7. THE Preview_Table SHALL être entièrement construite selon la contrainte XSS_Safety : aucune valeur utilisateur n'est injectée via innerHTML ou concaténation de chaînes HTML.

---

### Requirement 2 : Permettre la correction des champs optionnels corrigeables

**User Story:** En tant qu'administrateur, je veux pouvoir corriger les champs optionnels directement dans l'aperçu, afin d'ajuster des valeurs mal déduites sans quitter la modale.

#### Acceptance Criteria

1. WHEN un Optional_Field est présent dans CHAMPS_CORRIGEABLES, THE Preview_Table SHALL rendre sa cellule éditable via un contrôle HTML adapté au type du champ.
2. WHEN l'admin modifie la valeur d'un Editable_Cell d'Optional_Field, THE Import_Modal SHALL enregistrer la correction dans l'objet `etat.corrections` et SHALL déclencher un appel à `analyser()` pour rafraîchir l'aperçu depuis l'Engine.
3. THE champ `modele` SHALL être éditable via un `<input type="text">`.
4. THE champ `prixGrossisteFcfa` SHALL être éditable via un `<input type="number">`.
5. THE champ `disponible` SHALL être éditable via un `<select>` proposant les options « oui » (valeur `true`) et « non » (valeur `false`).
6. THE champ `garantie` SHALL être éditable via un `<input type="text">`.
7. IF un champ Optional_Field n'est pas dans CHAMPS_CORRIGEABLES (`description`, `mentions`, `refrigerant`, `compresseur`), THEN THE Preview_Table SHALL afficher sa valeur en lecture seule (cellule non éditable).
8. THE Preview_Table SHALL construire tous les contrôles d'édition des Optional_Fields selon la contrainte XSS_Safety.

---

### Requirement 3 : Étendre CHAMPS_CORRIGEABLES aux nouveaux champs éditables

**User Story:** En tant que développeur, je veux que la liste CHAMPS_CORRIGEABLES du moteur reflète tous les champs que l'admin peut corriger depuis l'aperçu, afin d'éviter toute divergence entre l'Engine et l'interface.

#### Acceptance Criteria

1. THE Engine SHALL inclure `modele`, `prixGrossisteFcfa`, `disponible` et `garantie` dans CHAMPS_CORRIGEABLES.
2. WHEN un champ est présent dans CHAMPS_CORRIGEABLES, THE Engine SHALL appliquer la correction transmise par l'interface lors du mode `analyse` et du mode `execution`.
3. THE Engine SHALL continuer à inclure les champs existants dans CHAMPS_CORRIGEABLES (`nom`, `marque`, `categorie`, `puissanceBtu`, `prixFcfa`, `stockInitial`).

---

### Requirement 4 : Mettre à jour le modèle Excel téléchargeable

**User Story:** En tant qu'administrateur, je veux que le fichier modèle `.xlsx` téléchargeable inclue des colonnes pour tous les champs importables, afin que les fournisseurs remplissent d'emblée les champs optionnels.

#### Acceptance Criteria

1. THE Engine SHALL inclure les colonnes suivantes dans COLONNES_MODELE (en plus des colonnes existantes) : Modèle/Référence, Prix grossiste, Fluide réfrigérant, Type de compresseur, Garantie.
2. WHEN l'admin clique sur « Télécharger un modèle », THE Import_Modal SHALL générer un fichier `.xlsx` contenant toutes les colonnes de COLONNES_MODELE mises à jour, avec une ligne d'exemple.
3. THE Import_Modal SHALL nommer le fichier généré `modele_import_produits_MAASGA.xlsx` (nom inchangé).
4. WHEN une colonne optionnelle a une valeur d'exemple vide ou non applicable, THE Import_Modal SHALL laisser la cellule exemple vide dans le modèle généré plutôt que d'afficher une valeur inventée.

---

### Requirement 5 : Maintenir la compacité de la modale

**User Story:** En tant qu'administrateur, je veux que la modale reste utilisable après l'ajout de colonnes, afin de ne pas être gêné par un tableau illisible ou une interface trop large.

#### Acceptance Criteria

1. WHILE l'étape 3 est active, THE Preview_Table SHALL être contenu dans un conteneur `overflow-x: auto` permettant le défilement horizontal sans élargir la modale au-delà de sa largeur maximale de 6xl (`max-w-6xl`).
2. THE Preview_Table SHALL définir `white-space: nowrap` sur les cellules des Optional_Fields pour éviter les sauts de ligne non désirés dans les colonnes étroites.
3. THE colonnes éditables des Optional_Fields SHALL avoir une largeur de contrôle adaptée : `w-32` pour `modele` et `garantie`, `w-28` pour `prixGrossisteFcfa`, `w-20` pour `disponible`.
