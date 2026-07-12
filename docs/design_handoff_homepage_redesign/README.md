# Handoff : Refonte visuelle homepage MAASGA

## Important — pourquoi ce dossier existe
Je n'ai pas d'accès en écriture à ton dossier local `maasga-code/` ni au dépôt GitHub `Maasga/Me` (je peux le lire, pas y pousser de commits). Je ne peux donc pas appliquer ces changements moi-même ni faire le `git push`.

Ce dossier contient tout le nécessaire pour qu'un développeur (toi, ou **Claude Code** en ligne de commande, qui lui a un accès git réel) applique les changements en 15-20 minutes.

## Contenu
- `PATCHES.md` — les 3 changements demandés, en blocs "AVANT / APRÈS" à coller directement dans `src/pages/home.tsx`, `src/components/Layout.tsx` et `src/styles/app.css`. Écrit dans le style Hono JSX + GSAP + Lordicon déjà utilisé par le site (pas du React, pas de nouvelle dépendance).
- `assets/hero/hero-1.jpg` → `hero-7.jpg` — les 7 photos fournies, déjà compressées (~15-200 Ko chacune). À copier dans `public/hero/` du projet.
- `CLAUDE_ADDITION.md` — le texte à coller à la fin de ton `CLAUDE.md` existant pour documenter ces changements.

## Ce qui est implémenté
1. **Hero en carrousel plein écran** — les 7 photos défilent en fondu (4s/photo) avec un léger zoom continu, en fond du hero, à la place de la vidéo + halos bleus. Aucun indicateur de progression (retiré à ta demande).
2. **Avis clients en défilement continu gauche→droite** — remplace le carrousel à points/scroll manuel par un bandeau qui défile en boucle, pause au survol, avec une apparition en fondu + léger scale à l'entrée de section.
3. **Icônes de qualité + animées** — ajout de la feuille de style Phosphor Icons (duotone) en remplacement des icônes Font Awesome basiques sur la page d'accueil, + 2 icônes animées Lordicon supplémentaires (cadenas dans le badge "Techniciens certifiés", fusée dans le CTA final) via le composant `AnimatedIcon` déjà présent dans `Layout.tsx`.
4. **Navigation complète dans la pill flottante** — référence visuelle pour aligner le header desktop sur les 8 liens du site (Accueil, Catalogue, Maintenance, Simulateur, Rendez-vous, Avis, À propos, Contact) avec logo réel, icônes Phosphor, Espace client et bouton "Rendez-vous" en dégradé.

## Comment appliquer (toi-même)
1. Copie `assets/hero/*.jpg` dans `maasga-code/public/hero/`.
2. Ouvre `PATCHES.md`, applique chaque bloc "AVANT/APRÈS" par copier-coller dans les fichiers indiqués.
3. `npm run build:css && npm run dev` pour vérifier en local.
4. `git add -A && git commit -m "Hero carousel, testimonials marquee, Phosphor+Lordicon icons" && git push`.
5. `npm run deploy` (ou laisse ta CI Cloudflare Pages le faire au push, selon ta config).

## Comment appliquer (via Claude Code)
Colle ce dossier dans ton repo, ouvre un terminal Claude Code dedans, et demande : *"Applique les patchs dans PATCHES.md, place les images de assets/hero/ dans public/hero/, puis commit et push."* Claude Code a un accès git réel et peut le faire de bout en bout.

## Fidélité
Design haute-fidélité : couleurs, tailles, timings d'animation exacts. Le code ci-joint est déjà dans le langage du projet (Hono JSX + Tailwind + GSAP + Lordicon) — pas du HTML à retranscrire.
