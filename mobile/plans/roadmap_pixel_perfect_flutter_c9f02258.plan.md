---
name: Roadmap Pixel Perfect Flutter
overview: Roadmap d’itération pixel-perfect pour aligner l’app Flutter MAASGA sur les visuels finaux fournis, avec exécution écran par écran et critères de validation visuelle.
todos:
  - id: pp-phase1-foundations
    content: Finaliser tokens/composants globaux et supprimer les styles divergents écran par écran.
    status: completed
  - id: pp-phase2-auth-home
    content: Reproduire pixel-perfect Onboarding/Login/Register/Home selon les visuels cibles.
    status: completed
  - id: pp-phase3-service-profile
    content: Aligner Simulator/RDV/Profil/Notifications/Support sur les maquettes finales.
    status: completed
  - id: pp-phase4-commerce
    content: Finaliser Catalogue/Panier/Checkout/Paiement avec cohérence visuelle complète.
    status: completed
  - id: pp-phase5-nav-settings
    content: Implémenter le menu latéral premium et l’écran Réglages conforme aux visuels.
    status: completed
  - id: pp-phase6-polish-qa
    content: Passer la checklist pixel-perfect et stabiliser performances/animations/tests.
    status: completed
isProject: false
---

# Roadmap Pixel-Perfect Flutter MAASGA

## Objectif de l’itération
Atteindre un rendu visuel fidèle aux maquettes finales sur l’ensemble des écrans Flutter Android, sans casser les flux fonctionnels déjà livrés (auth, catalogue, panier, paiement, rdv, espace client).

## Périmètre de la passe pixel-perfect
- Onboarding
- Connexion / Inscription
- Accueil + navigation (barre basse, menu, header)
- Simulateur
- Prise de rendez-vous
- Catalogue
- Panier
- Profil / Espace client
- Notifications
- Réglages
- Support
- Paiement (webview + états)

## Phase 1 - Fondations UI (Design System strict)
Fichiers cibles:
- [mobile/app/lib/shared/design_tokens/maasga_tokens.dart](mobile/app/lib/shared/design_tokens/maasga_tokens.dart)
- [mobile/app/lib/app/theme/app_theme.dart](mobile/app/lib/app/theme/app_theme.dart)
- [mobile/app/lib/shared/widgets/maasga_primary_button.dart](mobile/app/lib/shared/widgets/maasga_primary_button.dart)
- [mobile/app/lib/shared/widgets/maasga_shell.dart](mobile/app/lib/shared/widgets/maasga_shell.dart)
- [mobile/app/lib/shared/widgets/main_bottom_nav.dart](mobile/app/lib/shared/widgets/main_bottom_nav.dart)

Actions:
- Geler les tokens finaux (couleurs, gradients, radius, spacing, typo, shadows).
- Uniformiser les composants globaux (button/input/card/chips/nav).
- Créer des variantes strictes (primary/secondary/outline/danger).
- Ajouter les états UI systématiques: idle, loading, error, empty, disabled.

Critères de sortie:
- Tous les composants de base ont des styles centralisés.
- Aucun style inline redondant sur les écrans ciblés.

## Phase 2 - Parcours prioritaire 1 (Onboarding/Auth/Home)
Fichiers cibles:
- [mobile/app/lib/features/home/presentation/onboarding_screen.dart](mobile/app/lib/features/home/presentation/onboarding_screen.dart)
- [mobile/app/lib/features/auth/presentation/login_screen.dart](mobile/app/lib/features/auth/presentation/login_screen.dart)
- [mobile/app/lib/features/auth/presentation/register_screen.dart](mobile/app/lib/features/auth/presentation/register_screen.dart)
- [mobile/app/lib/features/home/presentation/home_screen.dart](mobile/app/lib/features/home/presentation/home_screen.dart)

Actions:
- Reproduire la composition héro (logo, ovale visuel, anneaux décoratifs).
- Ajuster la hiérarchie typo/espacement pour match maquette.
- Finaliser le header mobile (menu + notifications + search premium).
- Introduire micro-animations subtiles (entrée cartes, CTA, transitions).

Critères de sortie:
- Fidélité visuelle haute sur la première impression utilisateur.
- Alignements, marges, tailles boutons conformes aux visuels cibles.

## Phase 3 - Parcours prioritaire 2 (Service/Simulator/RDV/Profile)
Fichiers cibles:
- [mobile/app/lib/features/simulator/presentation/simulator_screen.dart](mobile/app/lib/features/simulator/presentation/simulator_screen.dart)
- [mobile/app/lib/features/rdv/presentation/rdv_screen.dart](mobile/app/lib/features/rdv/presentation/rdv_screen.dart)
- [mobile/app/lib/features/client_space/presentation/client_space_screen.dart](mobile/app/lib/features/client_space/presentation/client_space_screen.dart)
- [mobile/app/lib/features/notifications/presentation/notifications_screen.dart](mobile/app/lib/features/notifications/presentation/notifications_screen.dart)
- [mobile/app/lib/features/support/presentation/support_screen.dart](mobile/app/lib/features/support/presentation/support_screen.dart)

Actions:
- Simulateur: chips segmentées, blocs résultats, CTA et icônes conformes.
- RDV: cartes type service + état sélection + CTA sticky.
- Profil: cartes KPI, sections commandes/RDV/maintenance visuellement conformes.
- Notifications/Support: structure finale avec cartes chronologiques et actions.

Critères de sortie:
- Parcours service complet cohérent visuellement.
- Lisibilité mobile excellente sur 360x800 et 390x844.

## Phase 4 - Parcours prioritaire 3 (Catalogue/Panier/Paiement)
Fichiers cibles:
- [mobile/app/lib/features/catalog/presentation/catalog_screen.dart](mobile/app/lib/features/catalog/presentation/catalog_screen.dart)
- [mobile/app/lib/features/cart/presentation/cart_screen.dart](mobile/app/lib/features/cart/presentation/cart_screen.dart)
- [mobile/app/lib/features/cart/presentation/checkout_screen.dart](mobile/app/lib/features/cart/presentation/checkout_screen.dart)
- [mobile/app/lib/features/cart/presentation/payment_webview_screen.dart](mobile/app/lib/features/cart/presentation/payment_webview_screen.dart)
- [mobile/app/lib/features/cart/presentation/payment_redirect_screen.dart](mobile/app/lib/features/cart/presentation/payment_redirect_screen.dart)

Actions:
- Catalogue: cartes produits, badges, filtres, recherche premium.
- Panier: layout items + stepper quantité + résumé final conforme.
- Checkout: bloc récapitulatif + promo + validation visuelle finale.
- Paiement: écran webview propre, statut live, transitions retour.

Critères de sortie:
- Conversion funnel visuellement premium de bout en bout.
- Aucun saut UI entre catalogue -> panier -> checkout -> paiement.

## Phase 5 - Navigation latérale et réglages (match complet des maquettes)
Fichiers cibles:
- [mobile/app/lib/shared/widgets/maasga_shell.dart](mobile/app/lib/shared/widgets/maasga_shell.dart)
- [mobile/app/lib/app/router/app_router.dart](mobile/app/lib/app/router/app_router.dart)
- écrans navigation/paramètres à créer ou finaliser dans `features/`

Actions:
- Implémenter le drawer stylé (menu latéral lumineux + profil déconnexion).
- Ajouter écran Réglages complet (langue, notifications, sécurité).
- Uniformiser labels, icônes et états actifs/inactifs.

Critères de sortie:
- Navigation globale identique à l’intention des visuels.
- Structure IA claire (Accueil/Catalogue/Service/Simulateur/RDV/Panier/Profil/Notifications/Réglages).

## Phase 6 - Polish final et validation qualité
Actions:
- Vérification responsive fine (petits Android + grands écrans).
- Harmonisation des animations (durées et courbes unifiées).
- Optimisation de performance visuelle (images/cache/lists).
- Relecture UI/UX en checklist pixel-perfect.
- Captures comparatives avant/après pour validation produit.

Critères de sortie:
- `flutter analyze` et `flutter test` propres.
- Rendu perçu très proche de la maquette sur tous les écrans clés.
- Aucun blocage UX critique dans les parcours prioritaires.

## Ordre d’exécution recommandé (court terme)
1. Phase 1 (fondations)
2. Phase 2 (onboarding/auth/home)
3. Phase 3 (service/simulator/rdv/profile)
4. Phase 4 (catalogue/panier/paiement)
5. Phase 5 (drawer/réglages)
6. Phase 6 (polish + QA)

## Livrables attendus par itération
- Diff ciblé par écran
- Captures d’écran comparatives
- Checkpoint QA (`analyze`, `test`)
- Journal des écarts restants à corriger