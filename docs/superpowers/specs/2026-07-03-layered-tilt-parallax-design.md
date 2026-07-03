# Tilt hover en parallax multi-couches (façon Codrops) — design

## Contexte

Le site a déjà un hover unifié sur les cartes (glow + tilt 3D simple, cf. `docs/superpowers/specs/2026-07-03-card-hover-animations-design.md` et son plan associé, déjà implémentés). L'utilisateur a demandé de s'inspirer de la démo Codrops [Tilt Hover Effects](https://tympanus.net/Development/TiltHoverEffects/) pour enrichir cet effet.

**Étude de la démo** (via inspection directe de `main.js`/`component.css`, pas de la doc marketing) :
- Chaque carte (`.tilter`) contient plusieurs couches indépendantes : l'image (`.tilter__figure`), un cadre décoratif en lignes SVG (`.tilter__deco--lines`), une légende (`.tilter__caption`), un reflet diagonal (`.tilter__deco--shine`).
- Au `mousemove`, un calcul de position relative de la souris dans la carte pilote une interpolation linéaire de translation/rotation, appliquée différemment par couche (l'image bouge peu, le reflet bouge beaucoup) — c'est un **parallax**, pas juste un tilt uniforme.
- Seul le retour au repos (`mouseleave`) utilise une librairie tierce (anime.js, easing `easeOutElastic`) ; le suivi en temps réel est du JS pur.

## Décisions validées avec l'utilisateur

- **Toutes les cartes du site** sont concernées (cartes icônes ET cartes produits), avec un traitement adapté par famille :
  - **Cartes icônes** (services, avantages, fonctionnalités) : l'icône joue le rôle de la couche "image" (parallax léger), le titre+texte parallaxent un peu plus, un reflet balaie la carte. **Pas de cadre décoratif** (pas de photo à encadrer).
  - **Cartes produits** (vedettes home + grille catalogue) : la photo produit est la couche "image", le nom/prix la légende, un reflet balaie la carte. **Pas de cadre décoratif** non plus (les cartes ont déjà des badges/bordures propres).
- **Teinte du reflet** : dégradé diagonal dans les tons accent du site (`rgba(3,105,161,…)` → `rgba(0,180,216,…)`), pas de gris/blanc neutre comme l'original.
- **Pas de nouvelle dépendance** : le retour élastique au repos utilise GSAP (`elastic.out(1, 0.4)`), déjà chargé et déjà utilisé pour l'effet magnétique des boutons (`Layout.tsx`) — pas besoin d'anime.js.

## Architecture

### Markup — nouvelle couche de reflet

Chaque carte `[data-tilt]` reçoit un enfant supplémentaire, ajouté juste avant la fermeture de la carte :
```html
<div class="tilt-shine" aria-hidden="true"></div>
```
- Cartes icônes : le titre+texte existants sont regroupés dans un wrapper `.tilt-caption` (nouveau) pour pouvoir les faire parallaxer ensemble ; l'icône existante reçoit la classe `.tilt-image`.
- Cartes produits : le conteneur d'image existant reçoit `.tilt-image`, le bloc nom/prix reçoit `.tilt-caption`.

### CSS (`src/styles/app.css`)

```css
[data-tilt] { overflow: hidden; } /* contient le reflet qui déborde */

.tilt-shine {
  position: absolute; inset: 0; pointer-events: none;
  background: linear-gradient(45deg, transparent 30%, rgba(0,180,216,0.16) 50%, transparent 70%);
  transform: translate(-60%, -60%);
  width: 220%; height: 220%;
}
```
`.tilt-image` et `.tilt-caption` ne nécessitent pas de nouvelles règles de position (ce sont les éléments existants, juste marqués pour être ciblés par le JS) — sauf `position: relative` si l'élément n'en a pas déjà besoin pour que sa translation JS ne casse pas le flux.

### JS — extension du bloc `[data-tilt]` dans `initGsap()` (`Layout.tsx`)

Le bloc actuel (rotation unique sur toute la carte) est remplacé par une version multi-couches qui reprend la formule de la démo (position relative de la souris → interpolation linéaire), portée en GSAP :

- Sur `mousemove` : calcule `x`/`y` relatifs (0 à 1) dans la carte, puis pour chaque couche présente (`.tilt-image`, `.tilt-caption`, `.tilt-shine`), calcule une translation/rotation proportionnelle à un facteur par couche :
  - `.tilt-image` : rotation ±5°, pas de translation (remplace l'actuel rotateY/rotateX ±9° — légèrement réduit car c'est maintenant la couche la plus "sage" du groupe).
  - `.tilt-caption` : translation ±20px.
  - `.tilt-shine` : translation ±50px (le mouvement le plus ample, pour l'effet de balayage).
- Sur `mouseleave` : chaque couche revient à zéro via `gsap.to(layer, { ...zeros, duration, ease: 'elastic.out(1, 0.4)' })`.
- Si une carte n'a pas de couche donnée (ex. carte icône sans `.tilt-caption` distincte), le code l'ignore silencieusement — pas d'erreur.
- Les gardes existants restent : désactivé si `hover: none` (tactile) ou `prefers-reduced-motion: reduce`.

### Pages concernées

- `src/pages/home.tsx` : cartes services (3), avantages (4), fonctionnalités (4), produits vedettes (3) — ajout de `.tilt-image`/`.tilt-caption`/`.tilt-shine` à chacune.
- `src/pages/catalogue.tsx` : carte produit du catalogue — même traitement, uniquement sur les cartes déjà `data-tilt` (donc pas sur les cartes désactivées/rupture de stock, cf. logique existante).

## Hors scope

- Cadre décoratif en lignes SVG (refusé par l'utilisateur).
- anime.js ou toute autre librairie d'animation (GSAP suffit).
- Toute autre carte non listée ci-dessus (FAQ, avis clients) — inchangée.

## Risques / vérifications

- **Cartes sans couche caption séparée** : certaines cartes icônes actuelles ont titre+texte comme enfants directs sans wrapper commun ; il faudra les envelopper dans un `.tilt-caption` sans changer leur mise en page visuelle (juste un `<div>` neutre).
- **`.tilt-shine` et `overflow: hidden`** : ajouter `overflow: hidden` sur `[data-tilt]` pour contenir le reflet qui déborde peut couper l'ombre portée (`box-shadow`) actuelle si elle dépasse la boîte. À vérifier visuellement après implémentation — si l'ombre est coupée, déplacer le reflet dans un enfant additionnel dédié plutôt que de mettre `overflow: hidden` sur la carte elle-même.
- Vérification via Playwright (comme pour le hover précédent) : simuler un `mousemove` et confirmer que les trois couches ont des `transform` différents (preuve du parallax, pas d'un seul mouvement uniforme).
