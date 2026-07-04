# Pulsation des icônes services + indicateur de page dans la nav — design

## Contexte

Deux demandes distinctes issues d'un retour visuel sur le build de production local :

1. Les 3 icônes des cartes "Notre Expertise" (Vente Premium, Maintenance, Suivi de Performance) doivent être animées.
2. La zone entre le logo et le bouton "Rendez-vous"/le menu mobile, actuellement vide en dessous de 1024px de large, doit afficher la page où on se trouve.

**Piste écartée pour (1) :** icônes Lordicon animées (Lottie). Trois blocages concrets rencontrés et vérifiés :
- Le CSP `connect-src` ne whitelistait pas `cdn.lordicon.com` (le `<lord-icon>` charge son animation via `fetch()`, distinct du `script-src` qui ne fait que charger le lecteur) — corrigé (commit `42ec621`), mais révèle un problème plus large : la plupart des IDs Lordicon déjà codés en dur dans la nav du site (`msetzzbt`, `becezzra`, `wmluxarr`, etc.) ne s'affichent toujours pas une fois le CSP corrigé — probablement des icônes premium/invalides, hors scope de cette spec.
- Les icônes premium (ex. `2882-trolley-full`) chargent un `unlock-pro.json`, inutilisables sans licence payante.
- Les icônes gratuites de la bibliothèque "wired" par ID numérique (ex. `146-trolley`) sont servies via un fichier `.li` propriétaire avec `Access-Control-Allow-Origin: https://lordicon.com` uniquement — impossible à charger en cross-origin depuis le site, gratuit ou pas.

Conclusion : Lordicon n'est pas une option fiable ici sans investigation/licence supplémentaire. Approche retenue : animation CSS pure sur les icônes Phosphor déjà en place.

## Décisions validées avec l'utilisateur

- **Icônes :** pulsation continue et douce (pas seulement au survol), sur les icônes Phosphor statiques déjà en place — pas de nouvelle dépendance.
- **Indicateur de page :** un badge texte reprenant le style `.eyebrow` déjà utilisé partout sur le site, visible uniquement dans la zone vide identifiée (entre logo et actions), seulement quand la navigation normale est masquée.

## Architecture

### 1. Pulsation des icônes (`src/styles/app.css` + `src/pages/home.tsx`)

Nouvelle classe CSS :
```css
@keyframes icon-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.12); }
}
.icon-pulse {
  animation: icon-pulse 2.2s ease-in-out infinite;
}
@media (prefers-reduced-motion: reduce) {
  .icon-pulse { animation: none; }
}
```

Appliquée sur le `<i class="ph-duotone ph-...">` (le glyphe lui-même), PAS sur le `<div class="tilt-image ...">` englobant (déjà animé par le moteur de tilt GSAP en `rotateX`/`rotateY` — appliquer la pulsation `scale` sur un élément différent évite tout conflit de propriété `transform` entre CSS et GSAP). Concerne uniquement les 3 icônes des cartes services (`ph-shopping-cart-simple`, `ph-wrench` premier plan, `ph-chart-line-up`) — pas les icônes des cartes avantages/fonctionnalités (Font Awesome, hors scope de la demande initiale).

### 2. Indicateur de page (`src/components/Layout.tsx`)

Nouvelle constante `PAGE_LABELS` (objet clé→libellé), placée avant le composant `Layout`, couvrant les pages publiques déjà référencées dans les tableaux de nav existants :
```js
const PAGE_LABELS = {
  home: "Accueil",
  simulateur: "Simulateur",
  catalogue: "Catalogue",
  maintenance: "Maintenance",
  rdv: "Rendez-vous",
  avis: "Avis",
  apropos: "À propos",
  contact: "Contact",
  client: "Espace client",
  realisations: "Réalisations",
}
```

Nouveau badge inséré entre le logo et le bloc `{/* Actions */}` (juste après la balise `</nav>` fermant la nav tablette, ligne ~258) :
```jsx
{activePage && PAGE_LABELS[activePage] && (
  <span class="eyebrow lg:hidden">{PAGE_LABELS[activePage]}</span>
)}
```
`lg:hidden` : visible uniquement en dessous de 1024px, exactement là où les deux `<nav>` (`xl:flex` et `lg:flex xl:hidden`) sont masquées — pas de redondance avec la navigation desktop qui indique déjà la page active via `.nav-link.active`.

Si `activePage` ne correspond à aucune clé de `PAGE_LABELS` (pages admin, qui utilisent un layout différent, ou clé non couverte), rien ne s'affiche — pas d'erreur, pas de texte "undefined".

## Hors scope

- Pas de refonte des 3 tableaux de navigation existants (qui dupliquent déjà les libellés) — `PAGE_LABELS` est une nouvelle constante minimale dédiée au badge, pas un remplacement des tableaux de nav.
- Pas de correction des icônes Lordicon déjà cassées dans la nav (`msetzzbt`, `becezzra`, etc.) — signalé mais hors scope de cette spec.
- Pas de pulsation sur les icônes des cartes avantages/fonctionnalités — seulement les 3 cartes services explicitement désignées.

## Risques / vérifications

- Confirmer visuellement que la pulsation `scale` sur le glyphe `<i>` ne produit pas de scintillement/flou visuel combiné au `group-hover:rotate-6`/`scale-110` Tailwind déjà présent sur certaines de ces icônes (cartes services 1 et 3) — ce sont deux animations sur des propriétés différentes/déclenchées différemment (une en boucle CSS sur l'élément enfant `<i>`, l'autre au survol sur le conteneur), donc pas de conflit de propriété attendu, mais à vérifier visuellement.
- Confirmer que le badge `.eyebrow lg:hidden` ne provoque pas de retour à la ligne inattendu dans le header à largeur intermédiaire (ex. 800-1023px) selon la longueur du libellé le plus long ("Espace client").
