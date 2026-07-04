# Apparition au scroll des cartes — tilt 3D cohérent (design)

## Contexte

L'utilisateur a montré deux captures d'écran de la home (`maasga-website.pages.dev`) en entourant les grilles de cartes : "Notre Expertise" (3), "Une approche professionnelle" (4), "Nos fonctionnalités" (4), et les cartes témoignages ("Ce que disent nos clients"). Sa demande initiale ("quels effets d'apparition au scroll existent sur Codrops ?") portait en réalité sur l'apparition de **ces cartes précises**.

Recherche Codrops ciblée (recherche "grid reveal animation", "stagger animation", "on scroll entrance", catégorie Tutorials) :
- *Sticky Grid Scroll: Building a Scroll-Driven Animated Grid* (mars 2026) — confirme le pattern de stagger-reveal de grille, mais en version "pin" (hors sujet ici).
- *SVG Mask Transitions on Scroll* — technique de masque/wipe (option écartée par l'utilisateur).
- *Making Stagger Reveal Animations for Text* (2020, GSAP + Splitting.js) — letter-by-letter, pertinent pour les titres `data-split` existants, pas pour des cartes.

Aucun tutoriel Codrops ne traite exactement "cartes déjà interactives au survol + apparition au scroll" — décision : étendre le moteur de reveal existant plutôt que copier une démo externe.

## État actuel du moteur (inspection du code)

- `src/components/Layout.tsx` : reveal/stagger gérés en **CSS + IntersectionObserver**, indépendants de GSAP (robuste, pas de dépendance CDN). L'observer ajoute `.in` sur le conteneur `[data-stagger]`/`[data-reveal]`/`[data-hero]` dès qu'il entre dans le viewport.
- `src/styles/app.css` (~L409-436) : les enfants directs d'un conteneur `[data-stagger]`/`[data-hero]` (donc chaque carte `[data-tilt]`) font actuellement `opacity 0→1` + `translateY(44px)→0` + `scale(0.975)→1`, avec cascade de délais par `nth-child`.
- Chaque carte `[data-tilt]` contient déjà des couches enfants marquées `.tilt-image`, `.tilt-caption`, `.tilt-shine`, utilisées aujourd'hui uniquement pour le parallax au survol souris (JS, `Layout.tsx` L622-653).
- **Contrainte actée** (CLAUDE.md) : le conteneur `[data-tilt]` lui-même **ne doit plus tourner** — seuls les enfants marqués bougent. C'était un fix volontaire ; on ne le recontourne pas.
- Cas à part : les cartes témoignages (`.testimonial-card-in`, `home.tsx` L480) ont leur propre mini-moteur IntersectionObserver local (`home.tsx` L503-512), sans `.tilt-image`/`.tilt-caption` (pas de survol tilt). Leur règle CSS actuelle (`app.css` L560-565) **n'est pas gardée par `html.js-ready`** — si le JS est bloqué, ces cartes resteraient invisibles pour toujours (bug de robustesse latent, distinct du reste du site).

## Décision validée avec l'utilisateur

- **Portée** : toutes les grilles de cartes (Expertise, Approche professionnelle, Fonctionnalités, Témoignages).
- **Style** : "Tilt 3D cohérent" — les cartes reçoivent une entrée en 3D qui fait écho au tilt existant au survol, sans dépendance ni changement JS.

## Architecture (CSS uniquement, `src/styles/app.css`)

Aucune modification de `Layout.tsx` ni de `home.tsx` : le mécanisme `.in` existe déjà et cascade naturellement aux descendants via CSS — on ajoute seulement des règles ciblant les couches `.tilt-image` / `.tilt-caption` / `.tilt-shine` **à l'intérieur** d'un conteneur stagger/hero.

### 1. Icône — "settle" 3D (nouveau)

```css
html.js-ready [data-stagger] > [data-tilt] .tilt-image,
html.js-ready [data-hero] > [data-tilt] .tilt-image {
  opacity: 0;
  transform: perspective(700px) rotateX(35deg) rotateY(-14deg) scale(0.75);
  transition: opacity 0.5s var(--ease-out-expo) 0.12s,
              transform 0.65s var(--ease-out-expo) 0.12s;
}
html.js-ready [data-stagger].in > [data-tilt] .tilt-image,
html.js-ready [data-hero].in > [data-tilt] .tilt-image {
  opacity: 1;
  transform: none;
}
```
Le délai de 0.12s fait apparaître l'icône légèrement après le début de l'apparition de la carte (cascade interne).

### 2. Texte — suit avec un léger décalage (nouveau)

```css
html.js-ready [data-stagger] > [data-tilt] .tilt-caption,
html.js-ready [data-hero] > [data-tilt] .tilt-caption {
  opacity: 0;
  transform: translateY(14px);
  transition: opacity 0.5s var(--ease-out-expo) 0.2s,
              transform 0.5s var(--ease-out-expo) 0.2s;
}
html.js-ready [data-stagger].in > [data-tilt] .tilt-caption,
html.js-ready [data-hero].in > [data-tilt] .tilt-caption {
  opacity: 1;
  transform: none;
}
```

### 3. Reflet — balayage unique à l'apparition (nouveau)

```css
html.js-ready [data-stagger] > [data-tilt] .tilt-shine,
html.js-ready [data-hero] > [data-tilt] .tilt-shine {
  opacity: 0;
  transform: translate(-40%, -40%);
  transition: opacity 0.5s ease 0.3s,
              transform 0.7s var(--ease-out-expo) 0.3s;
}
html.js-ready [data-stagger].in > [data-tilt] .tilt-shine,
html.js-ready [data-hero].in > [data-tilt] .tilt-shine {
  opacity: 1;
  transform: none;
}
```
`.tilt-shine` est déjà contenu par `overflow: hidden` sur `[data-tilt]` (existant) — pas de risque de débordement visuel.

### 4. Carte (`[data-tilt]`) elle-même : **inchangée**

Pas de rotation sur le conteneur — on respecte la contrainte existante. Le fade+translateY+scale actuel suffit à faire "entrer" la carte pendant que ses couches internes font le travail 3D.

### 5. Cartes témoignages — traitement dédié + fix robustesse

```css
html.js-ready .testimonial-card-in {
  opacity: 0;
  transform: perspective(700px) rotateX(14deg) translateY(24px) scale(0.94);
  transition: opacity 0.7s cubic-bezier(.16,1,.3,1),
              transform 0.7s cubic-bezier(.16,1,.3,1);
}
html.js-ready .testimonial-card-in.in {
  opacity: 1;
  transform: none;
}
```
Ces cartes n'ont pas de survol tilt (pas de `.tilt-image`/`.tilt-caption`), donc faire pivoter la carte entière ne pose pas le problème de double-transform évité pour `[data-tilt]`. Le gate `html.js-ready` corrige le bug de robustesse identifié ci-dessus (remplace les règles non gardées `app.css` L560-565).

## Propagation naturelle

Ces règles ciblent des sélecteurs génériques (`[data-stagger] > [data-tilt] .tilt-image`, etc.), pas une page précise : l'effet s'appliquera automatiquement partout où le motif `[data-stagger]/[data-hero]` + `[data-tilt]` + `.tilt-image/.tilt-caption/.tilt-shine` existe déjà (ex. cartes produits de `catalogue.tsx`), sans code supplémentaire. C'est cohérent avec le moteur déclaratif existant — pas un effet de bord à corriger.

## Hors scope

- Aucun changement JS/GSAP.
- Aucun nouveau markup dans `home.tsx` (les couches `.tilt-image`/`.tilt-caption`/`.tilt-shine` existent déjà partout).
- Le mini-mask "wipe" et le "focus pull" (options écartées lors du brainstorming).

## Risques / vérifications

- **`prefers-reduced-motion`** : déjà couvert globalement (`app.css` ~L449-461, `transition-duration: 0.001ms !important` sur `*`) — aucune règle supplémentaire nécessaire, les nouvelles couches en héritent automatiquement.
- **Cascade de délais existante** (`nth-child` sur `[data-stagger].in > *`) : les nouveaux délais (0.12s/0.2s/0.3s) s'additionnent au délai déjà posé sur la carte elle-même (jusqu'à 0.46s pour la 7e carte+) — à vérifier visuellement que l'empilement ne rend pas la dernière carte trop lente à finir d'apparaître (~0.46s + 0.3s + 0.7s ≈ 1.46s pire cas). Si trop lent, réduire les délais internes (0.12/0.2/0.3 → 0.06/0.1/0.15).
- **Carte navy centrale** ("Maintenance", `home.tsx` L214) : vérifier que le contraste de l'icône reste correct pendant la phase `rotateX/rotateY` (fond dégradé clair sur fond navy) — ne devrait rien changer visuellement puisque c'est la même icône, juste animée.
- Vérification visuelle finale sur `npm run dev:sandbox` (ou build local) en scrollant chaque section citée, plus un test avec `prefers-reduced-motion: reduce` activé dans les DevTools.
