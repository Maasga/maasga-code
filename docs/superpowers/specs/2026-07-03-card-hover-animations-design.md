# Amélioration des animations hover des cartes — design

## Contexte

Le site utilise deux systèmes de cartes avec des traitements hover divergents :

- `.surface-elevated` (`src/styles/app.css:121-132`) — utilisé dans `home.tsx` pour les cartes services, avantages, fonctionnalités et produits vedettes. Lift `translateY(-6px)`, ombre `--shadow-lg`, easing `var(--ease-spring)`. Certaines de ces cartes combinent en plus `data-tilt` (tilt 3D piloté par GSAP, script inline dans `home.tsx:719-746`).
- `.glass-card` + `.hover-lift` (`src/styles/app.css:166-176, 340-341`) — utilisé dans `catalogue.tsx` pour les cartes produits. Lift similaire, mais easing `cubic-bezier(0.175, 0.885, 0.32, 1.275)` différent, ombre neutre, pas de tilt 3D.

Résultat : le ressenti hover n'est pas homogène site-wide, et les cartes produits (catalogue + vedettes home) n'ont pas le tilt 3D déjà en place ailleurs.

## Objectif

Un hover premium et cohérent sur toutes les cartes du site, sans introduire de nouvelle dépendance ni casser le comportement mobile/tactile existant (`data-tilt` déjà désactivé sous `hover: none`).

## Changements

### CSS (`src/styles/app.css`)

- `.surface-elevated:hover` et `.glass-card:hover` : remplacer l'ombre actuelle par une ombre "glow" teintée accent, deux couches (diffuse + rapprochée) :
  `box-shadow: 0 20px 45px rgba(3,105,161,0.18), 0 6px 16px rgba(3,105,161,0.10);`
- Harmoniser l'easing des deux règles sur `var(--ease-out-expo)` (déjà utilisé par `.hover-lift`), en retirant `var(--ease-spring)` et le `cubic-bezier` bounce du `.glass-card`.
- `translateY(-6px)` inchangé sur les deux (déjà cohérent).
- `.hover-lift` : aligner son easing sur `var(--ease-out-expo)` (déjà le cas — vérifier qu'il n'y a pas de divergence résiduelle).

### JS (`src/components/Layout.tsx` + `src/pages/home.tsx`)

- Déplacer le script de tilt 3D actuellement inline dans `home.tsx` (lignes 719-746) vers le moteur GSAP déclaratif global de `Layout.tsx` (fonction `initGsap`, à côté du traitement `data-parallax` et `.magnetic`, lignes ~554-602). Le sélecteur `[data-tilt]` et la logique restent identiques (rotation via `mousemove`/`mouseleave`, désactivé sous `hover: none`).
- Supprimer le bloc `<script>` dédié au tilt dans `home.tsx` une fois la logique déplacée (évite la duplication et rend `data-tilt` utilisable sur n'importe quelle page sans script supplémentaire, sur le modèle déjà établi par `data-reveal`/`data-stagger`/`data-parallax`).

### Markup

- Ajouter `data-tilt` sur :
  - `home.tsx` : les 3 cartes produits vedettes (section "Le Meilleur du Froid", actuellement `class="surface-elevated overflow-hidden group flex flex-col"`).
  - `catalogue.tsx` : la carte produit du catalogue (`product-card glass-card ...`, ligne 165), sauf pour les produits indisponibles/en rupture (qui gardent `opacity-60` sans `hover-lift` — cohérence avec le comportement existant : pas d'effet hover sur les cartes désactivées).

## Hors scope

- Pas de nouvel effet visuel (pas de glow externe, pas de shine/reflet balayant) — le style validé est "premium sobre".
- Pas de changement sur `.card-hover` (classe existante mais non utilisée dans les pages actuelles) ni sur les cartes non listées ci-dessus (ex. FAQ, avis clients, qui n'ont pas vocation à tilter).

## Risques / vérifications

- Coexistence CSS `transition: transform` + GSAP `transform` inline : déjà le comportement en prod sur les cartes services/avantages (`data-tilt` + `.surface-elevated`), donc pas de risque nouveau en l'étendant aux cartes produits.
- Vérifier visuellement (Playwright ou navigateur) que le tilt fonctionne sur les cartes produits après déplacement du script, et qu'aucune régression n'apparaît sur les cartes qui l'avaient déjà (services/avantages/fonctionnalités).
