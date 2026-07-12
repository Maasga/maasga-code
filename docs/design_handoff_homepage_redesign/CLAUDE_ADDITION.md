## Homepage — refonte visuelle (juillet 2026)

Changements apportés à `src/pages/home.tsx`, `src/components/Layout.tsx`, `src/styles/app.css` suite à une revue design :

1. **Hero — carrousel photo plein écran.** La vidéo `HOMZ3.mp4` + halos bleus + flocons décoratifs du hero sont remplacés par un carrousel de 7 photos (`public/hero/hero-1.jpg` → `hero-7.jpg`) en fondu automatique (4s/photo) avec un léger zoom continu (`heroCarouselZoom` keyframe, 9s). Overlay dégradé sombre conservé pour la lisibilité du texte. Les particules de neige (`#snow-container`, GSAP) sont conservées par-dessus.
2. **Avis clients — bandeau défilant continu.** L'ancien carrousel à points + `scrollCarousel()` (scroll manuel toutes les 4.5s) est remplacé par un bandeau CSS en boucle infinie (`testimonial-track`, `testimonialMarquee` keyframe, 32s linéaire), pause au survol (`:hover { animation-play-state: paused }`). Apparition en fondu + scale à l'entrée de section via `IntersectionObserver` (`.testimonial-card-in.in`).
3. **Icônes.** Ajout de Phosphor Icons (duotone/fill, `cdn.jsdelivr.net/npm/@phosphor-icons/web`) en remplacement des icônes Font Awesome basiques sur la homepage (shield, snowflake, arrow, calendar, chart, wrench, cart, star, chevron). Le composant `AnimatedIcon` (Lordicon) existant est étendu à 2 nouveaux emplacements homepage : badge "Techniciens certifiés" (cadenas animé, `lbjtvqiv.json`) et section CTA finale (fusée animée, `fttvwdlw.json`).
4. **Header — pill desktop complète.** Référence visuelle validée pour la nav flottante : logo réel + séparateurs + les 8 liens (Accueil, Catalogue, Maintenance, Simulateur, Rendez-vous, Avis, À propos, Contact) avec icône Phosphor duotone par lien + Espace client + bouton "Rendez-vous" en dégradé bleu/cyan. La structure de nav existante dans `Layout.tsx` (xl+/lg/mobile) reste inchangée — c'est un ajustement de style.

Aucune nouvelle dépendance npm — tout est chargé via CDN comme le reste du projet (cohérent avec le pattern Font Awesome / Lordicon / GSAP déjà en place). CSP déjà compatible (`cdn.jsdelivr.net` autorisé).

Détail des patchs : voir `design_handoff_homepage_redesign/PATCHES.md` (package de handoff, non commité — à intégrer manuellement ou via Claude Code).
