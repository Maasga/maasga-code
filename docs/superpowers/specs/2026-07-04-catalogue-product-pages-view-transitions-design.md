# Fiches produit dédiées + View Transitions catalogue — design

## Contexte

Demande utilisateur : s'inspirer de [Animating Multi-Page Navigations with Browser View Transitions and Astro](https://tympanus.net/codrops/2023/10/03/animating-multi-page-navigations-with-browser-view-transitions-and-astro/) (Codrops) pour le catalogue de produits.

Aujourd'hui, le catalogue (`src/pages/catalogue.tsx`) n'a pas de page dédiée par produit : le bouton "Voir les détails" ouvre une modale (`#product-detail-modal`) remplie côté client depuis `window.__CAT_PRODUCTS__`, sans navigation. La technique de l'article (View Transitions API sur navigation cross-document, via `@view-transition { navigation: auto }` + `view-transition-name` partagé) suppose au contraire une vraie navigation entre deux pages.

Ceci est un chantier distinct de la feature "transitions de page asynchrones" déjà spécifiée (`docs/superpowers/specs/2026-07-04-async-page-transitions-design.md`, plan associé) : celle-ci intercepte les clics et fait un `fetch()` + swap du `<main>` avec un overlay texte qui glisse, pour **toutes** les pages publiques. Cette feature-ci utilise l'API native du navigateur sur une **vraie navigation classique** (lien `<a href>`, rechargement complet), sans JS de routing — les deux techniques sont incompatibles sur un même clic (si le clic est intercepté pour un fetch+swap, la transition native cross-document du navigateur ne se déclenche jamais). Les deux chantiers restent donc indépendants ; celui-ci ne touche pas au pipeline fetch+swap déjà spécifié.

## Décisions validées avec l'utilisateur

- **Portée** : création d'une vraie page produit dédiée par climatiseur (pas seulement un effet sur l'ouverture de la modale existante).
- **Technique de transition** : View Transitions natives du navigateur sur navigation classique (lien `<a>`, pas d'interception JS). Dégradation gracieuse sur navigateurs sans support (Safari/Firefox à ce jour) : navigation normale, aucun effet, aucune casse.
- **URL** : `/catalogue/:id` (ex: `/catalogue/42`) — pas de slug, cohérent avec la structure existante, pas de champ à ajouter aux données produit.
- **Bouton "Voir les détails"** : remplacé par un lien `<a href="/catalogue/{id}">` vers la nouvelle page. La modale `#product-detail-modal` actuelle est retirée du catalogue — son contenu est repris tel quel sur la nouvelle page produit.
- **Flux de commande** : la page produit garde son propre bouton "Commander" fonctionnel, branché sur le même flux (formulaire + paiement LigdiCash/Wave/carte/téléphone) que le catalogue aujourd'hui. Pour éviter la duplication de code (~400 lignes de modale + JS), ce bloc est extrait en composant partagé réutilisé par les deux pages.
- **Fonctions annexes sur la page produit** : bouton panier flottant + "Ajouter au panier" conservés (cohérent avec une page qui peut mener à l'achat). "Comparer" retiré — fonctionnalité intrinsèquement multi-produits, sans sens sur une fiche unique ; le lien retour vers `/catalogue` permet d'y accéder.
- **Éléments qui "morphent" (view-transition-name partagé)** : l'image du produit uniquement. Le reste (titre, prix, specs) apparaît en fondu standard du navigateur. Choix qui limite le risque de bugs de layout (un texte dont la taille de police change radicalement entre carte et page peut "sauter" bizarrement pendant la transition ; une image rectangulaire morph proprement).

## Architecture

### Nouvelle route

`GET /catalogue/:id` dans `src/index.tsx`, ajoutée juste après la route `/catalogue` existante (`src/index.tsx:443`).

- Recherche le produit dans `products` (import statique depuis `src/data/products.ts`, comme le fait déjà `catalogue.tsx`) — pas de requête D1, cohérent avec le catalogue actuel.
- Id absent, non numérique, ou produit introuvable → `c.redirect('/catalogue?error=produit_introuvable')`, même convention que les redirects existants (ex: `src/index.tsx:4833`).
- Rend `<ProductDetailPage product={p} />`.

### Nouveau composant page : `src/pages/produit.tsx`

`ProductDetailPage({ product })`, structure :

- `<Layout title={\`${product.name} — MAASGA Ouagadougou\`} activePage="catalogue" canonicalPath={'/catalogue/' + product.id} description={...}>` — meta description générée à partir de `product.description` (tronquée si besoin), pour un référencement par produit.
- Reprend les sections de l'actuelle modale (`catalogue.tsx:322-399`), converties de `<div id="modal-...">` remplis en JS vers du HTML server-rendu directement à partir de `product` :
  - Image principale (grande zone centrée), avec `style={'view-transition-name: product-image-' + product.id}` sur l'`<img>`.
  - Marque, référence, badges (inverter, classe énergie, stock).
  - Grille specs clés (BTU/CV, surface).
  - Prix + badge stock.
  - Description (si présente).
  - Fonctionnalités (liste complète, pas de troncature à 3 comme sur la carte).
  - Caractéristiques techniques (`product.techSpecs`, réutilise la table `TECH_LABELS` définie aujourd'hui dans `catalogue.tsx:737-752` — à déplacer dans un module partagé, ex: `src/data/techSpecsLabels.ts`, pour éviter la duplication).
  - Galerie média (`product.media`), si présente.
  - Sélecteur de quantité + CTA ("Ajouter au panier", "Commander").
- Lien retour visible vers `/catalogue`.
- Bouton panier flottant (identique à `catalogue.tsx:42-47`).

### Extraction du flux de commande partagé

- Nouveau composant `src/components/OrderModal.tsx`, contenant le HTML de `#order-modal` (`catalogue.tsx:442-722`) et son JS associé (`openOrderModal`, `submitOrder`, gestion des méthodes de paiement, restauration de commande en attente, etc.).
- `#cart-modal` et son JS (`addToCart`, `openCartModal`, `catalogue.tsx:1014` et suivants) sont extraits de la même façon dans le même composant partagé ou un composant `CartModal.tsx` séparé (décision d'implémentation, à trancher pendant le plan selon le couplage réel du JS).
- `CataloguePage` et `ProductDetailPage` incluent tous deux ce(s) composant(s) partagé(s) au lieu de dupliquer le HTML/JS.
- `catalogue.tsx` : suppression du bloc `#product-detail-modal` (`catalogue.tsx:322-399`) et de la fonction `openProductDetail()` (`catalogue.tsx:861` et suivants) ainsi que tout le JS de remplissage de modale qui n'a plus d'utilité — remplacés par la navigation vers la nouvelle page.

### Cartes catalogue (`catalogue.tsx`)

- Les deux boutons "Voir les détails" (branche en stock `catalogue.tsx:219-222` et branche rupture `catalogue.tsx:238-241`) deviennent des `<a href={'/catalogue/' + p.id}>` au lieu de `onclick="openProductDetail(...)"`.
- L'image de la carte (`catalogue.tsx:169-170`) reçoit `style={'view-transition-name: product-image-' + p.id}` en plus de ses classes actuelles.

### Effet de transition (CSS uniquement, aucun JS)

- `src/styles/app.css` : ajout de la règle `@view-transition { navigation: auto; }`. Active les View Transitions natives sur navigation cross-document (Chrome/Edge 126+). Ignorée silencieusement par les navigateurs sans support (Safari/Firefox à ce jour) — navigation classique inchangée, sans erreur ni effet visuel dégradé.
- `view-transition-name: product-image-{id}` posé en inline sur l'image de la carte **et** l'image de la page produit correspondante → le navigateur anime automatiquement position/taille entre les deux au moment de la navigation.
- `prefers-reduced-motion` : ajout dans le bloc media query global déjà existant (celui qui désactive les animations GSAP) d'une règle désactivant la durée des transitions natives (`::view-transition-group(*), ::view-transition-old(*), ::view-transition-new(*) { animation-duration: 0.01ms !important; }`) — la navigation elle-même n'est jamais désactivée, seule l'animation l'est.

## Hors scope

- Le pipeline de transitions de page asynchrones (fetch+swap + overlay texte, déjà spécifié séparément) n'est ni implémenté ni modifié par cette feature.
- Pas d'entrée sitemap.xml par produit (le catalogue reste indexé globalement ; ajout possible dans une itération future si un besoin SEO spécifique est confirmé).
- Pas de cache edge Cloudflare sur `/catalogue/:id` (rendu statique à partir de données en mémoire, déjà rapide sans requête D1 — pas de gain mesurable attendu).
- "Comparer" reste une fonctionnalité de la seule grille catalogue.
- Pas de nouvelle route API ni de changement de schéma D1 — les produits restent des données statiques (`src/data/products.ts`).

## Risques / vérifications

- **Support navigateur** : à vérifier lors de l'implémentation que l'absence de support (Safari/Firefox) ne casse rien — la règle `@view-transition` doit être un no-op propre, et la navigation `<a href>` doit fonctionner normalement dans tous les cas (elle ne dépend d'aucun JS ajouté par cette feature).
- **`view-transition-name` dupliqué** : un `view-transition-name` ne doit apparaître qu'une seule fois dans le DOM visible au moment de la transition — à vérifier qu'aucune autre image sur la page catalogue ou produit ne réutilise accidentellement le même nom (ex: image dans une modale encore ouverte, image de la galerie média du produit).
- **Produits sans `imageUrl`** (fallback `/static/ac-placeholder.svg`) : le morph doit rester correct même quand carte et page utilisent toutes deux le placeholder générique — pas de cas particulier attendu, mais à vérifier visuellement.
- **Extraction du flux de commande** : en déplaçant `#order-modal`/`#cart-modal` hors de `catalogue.tsx`, s'assurer qu'aucune fonction JS du composant partagé ne référence implicitement des éléments DOM qui n'existent que sur `catalogue.tsx` (ex: `#products-grid`, `#product-count`) — le composant partagé doit être autonome.
- **`TECH_LABELS`** : actuellement défini inline dans le `<script>` de `catalogue.tsx` (`catalogue.tsx:737-752`) et consommé côté client en JS pour remplir la modale. Sur la page produit, le rendu étant server-side, ces libellés doivent être disponibles côté serveur (TypeScript) — nécessite de dupliquer/déplacer cette table dans un module partagé plutôt que de la laisser uniquement dans le `<script>` client.
