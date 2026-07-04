# Transitions de page asynchrones (async fetch + DOM swap) — design

## Contexte

Demande en attente depuis la session précédente (voir `HANDOFF.md`) : s'inspirer de [Async Page Transitions in Vanilla JavaScript](https://async-page-transitions.crnacura.workers.dev/) (Codrops) pour remplacer la navigation actuelle. Le site est aujourd'hui du SSR multi-pages classique (Hono, sans router client) : chaque clic sur un lien interne déclenche un vrai rechargement HTTP, avec un overlay `#page-transition` simple (fade + icône flocon qui tourne, `Layout.tsx:200` et `:549-560`) affiché pendant les 150ms précédant `window.location.href`.

L'utilisateur a validé un changement d'architecture réel plutôt qu'un simple habillage visuel : interception des clics, `fetch()` de la page suivante, remplacement du DOM sans rechargement complet, overlay animé pendant le chargement — un vrai routing SPA-like en vanilla JS, cohérent avec l'esprit de la démo Codrops.

## Décisions validées avec l'utilisateur

- **Ambition** : vraies transitions async (fetch + DOM swap), pas seulement un nouvel habillage visuel de l'overlay actuel.
- **Portée du swap** : seul `<main id="main-content">` est remplacé. Header, nav, footer et overlay restent en place (déjà identiques sur toutes les pages) — moins de flicker, pas de re-init inutile du nav/back-to-top/badge de page.
- **Ré-exécution JS** : les `<script>` présents dans le nouveau `<main>` sont recréés dynamiquement (le DOM n'exécute jamais un `<script>` injecté via `innerHTML`/parsing) puis réinjectés pour forcer leur exécution. Le moteur GSAP global (`data-reveal`/`data-stagger`/`data-tilt`) est réinitialisé sur les nouveaux éléments après le swap.
- **Périmètre pages** : toutes les pages publiques, **hors `/admin*`** — l'admin garde la navigation classique (zone auth-gérée, hors scope de cette feature).
- **Style visuel de l'overlay** : validé via mockups dans le compagnon visuel — variante **A, grand texte qui traverse l'écran**. Le texte affiché est le **nom de la page de destination**, tiré de la constante `PAGE_LABELS` déjà existante dans `Layout.tsx` (ajoutée pour le badge de page mobile, session précédente) — pas de nouvelle table à maintenir. Fallback générique (capitalize du dernier segment d'URL) si la route n'a pas d'entrée dans `PAGE_LABELS`.
- **Fallback erreur** : si le `fetch()` échoue, renvoie un statut non-200, ou dépasse ~5s, on abandonne le swap et on retombe sur une navigation classique (`window.location.href = href`) — l'utilisateur arrive à destination dans tous les cas.
- **Back/forward navigateur** : même pipeline animé (fetch + swap + overlay) via `popstate`, pour une expérience cohérente peu importe comment on navigue.
- **Durée minimum de l'overlay** : ~700ms forcés même si le fetch revient plus vite (fréquent avec le cache edge Cloudflare, 10 min TTL) — évite un flash illisible où le texte n'a pas le temps de traverser l'écran. Le fetch continue en parallèle du timer.
- **Analytics** : un pageview virtuel GA4 (`gtag('event', 'page_view', { page_path })`) est envoyé à chaque navigation async, car GA4 ne détecte pas automatiquement les changements d'URL via `pushState`.

## Architecture

### Flux de navigation (clic sur un lien interne)

1. Le listener de clic global (remplace celui de `Layout.tsx:549-560`) intercepte les liens internes, avec les mêmes exclusions qu'aujourd'hui (`#`, `http`, `tel:`, `mailto:`, `target=_blank`) **plus** tout `href` commençant par `/admin`.
2. Un flag module-level `navigationInProgress` est vérifié : si une transition est déjà en cours, le clic est ignoré (pas de fetch concurrent).
3. `preventDefault()`, affichage de l'overlay avec le texte de la page cible (`getPageLabel(href)` → `PAGE_LABELS[key] ?? capitalize(lastSegment)`).
4. Lancement en parallèle de `fetch(href)` et d'un `setTimeout` de 700ms (durée minimum).
5. Dès que **les deux** sont résolus :
   - Si le fetch a échoué / timeout dépassé / statut non-200 / `<main>` introuvable dans la réponse → `window.location.href = href` (sortie du pipeline, pas de retour en arrière).
   - Sinon : parse le HTML reçu (`DOMParser`), extrait le nouveau `<main id="main-content">` et le `<title>`.
6. Remplace le `<main>` courant par le nouveau, met à jour `document.title`.
7. `history.pushState(null, '', href)` (sauf si déclenché par `popstate`, où l'historique est déjà à jour).
8. Recrée et réinjecte chaque `<script>` trouvé dans le nouveau `<main>` (nouveaux éléments `<script>` avec le même contenu textuel, insérés dans le DOM pour forcer l'exécution par le navigateur).
9. Relance l'init du moteur GSAP déclaratif (`data-reveal`, `data-stagger`, `data-tilt`, `.magnetic`) scoping sur le nouveau `<main>` uniquement (pas de double-init sur le reste de la page).
10. Envoie l'événement GA4 `page_view` avec le nouveau `page_path`.
11. Masque l'overlay, remet `navigationInProgress` à `false`.

### `popstate` (back/forward)

Même pipeline à partir de l'étape 3, sans l'étape 7 (`pushState` — l'historique est déjà correct puisque c'est le navigateur qui l'a fait naviguer).

### Fichiers touchés

- **`src/components/Layout.tsx`** :
  - Bloc `#page-transition` (`:200-202`) : remplace le flocon par le conteneur du texte qui glisse (fond navy, `<span>` avec le libellé de page, structure calquée sur la maquette validée).
  - Bloc script `:549-560` : remplacé par le nouveau module de navigation async (fetch, timer minimum, parsing, swap, réinjection scripts, réinit GSAP, historique, fallback erreur, GA4).
  - Ajout d'une fonction `getPageLabel(href)` réutilisant `PAGE_LABELS` (déjà défini `Layout.tsx:3-14`).
- **`src/styles/app.css`** : nouvelle classe pour l'overlay et l'animation du texte (utilise `--ease-out-expo` pour l'accélération/décélération, pas un `linear` pur — cohérent avec le reste du design system). Respecte `prefers-reduced-motion` (pas d'animation du texte si activé — voir Risques).
- **Aucun changement côté serveur** (`src/index.tsx`, routes) : chaque route continue de répondre en HTML complet SSR ; le client ne garde que le `<main>` de la réponse fetchée. Compatible tel quel avec le cache edge Cloudflare existant (10 min TTL).

## Hors scope

- `/admin*` : navigation classique inchangée, aucune modification du comportement auth-gate.
- Pas de correction des icônes Lordicon cassées dans la nav (sujet distinct, déjà signalé dans `HANDOFF.md`).
- Pas de prefetching au survol des liens (hover-prefetch) — uniquement fetch au clic, pour rester au plus près de la demande initiale.
- Pas de gestion de scroll restoration avancée (ex: mémoriser la position de scroll par page dans l'historique) — le scroll repart en haut de page à chaque navigation, comme c'est déjà implicitement le cas avec un rechargement complet.

## Risques / vérifications

- **`prefers-reduced-motion`** : le texte ne doit pas animer, mais le pipeline fetch/swap doit rester actif (c'est un gain de vitesse de nav, pas seulement une animation) — à vérifier que la classe CSS de l'animation du texte est bien conditionnée par le media query global déjà en place, sans désactiver le swap lui-même.
- **Scripts avec effets de bord au ré-exécution** : si un script de page fait des opérations non idempotentes (ex: incrémenter un compteur, écouter un event déjà attaché ailleurs), le réinjecter à chaque swap peut dupliquer des listeners. À vérifier page par page lors de l'implémentation — pas de mécanisme de désinscription générique prévu dans cette spec (complexité jugée disproportionnée vu le nombre de pages).
- **`DOMParser` et balises `<script src="...">` externes** (ex: CDN GSAP/ScrollTrigger déjà chargés une fois) : ne doivent pas être re-fetchées/ré-exécutées si présentes dans le `<head>` du HTML retourné — seuls les scripts internes au `<main>` sont concernés par la réinjection (le swap ne touche jamais le `<head>`).
- **Cache Cloudflare edge (10 min TTL)** : le fetch client suit les mêmes règles de cache HTTP que la navigation classique — pas de bypass de cache à ajouter, sauf si des incohérences apparaissent en test (page servie "périmée" après une action qui a changé son contenu, ex. après une commande).
- **GA4 double comptage** : vérifier que le `gtag('config', ...)` initial (chargement direct d'une page) ne produit pas un deuxième `page_view` en plus de celui envoyé manuellement au swap suivant — le `page_view` automatique du chargement initial et celui envoyé manuellement pour les swaps ne doivent pas se chevaucher sur la même navigation.
