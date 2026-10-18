# MaasGa Admin — Application mobile d'administration

Application Flutter d'administration interne pour le site MaasGa. Android uniquement, distribution APK directe (pas de Play Store).

---

## Stack technique

- **Flutter** 3.x + **Dart** SDK ^3.11.5
- **State management** : Riverpod 3 (FutureProvider + StateProvider)
- **Navigation** : go_router 14
- **Réseau** : Dio 5 + intercepteurs d'auth
- **Auth** : Firebase Auth (email/password)
- **Notifications push** : Firebase Cloud Messaging
- **Graphiques** : fl_chart
- **Images** : image_picker + cached_network_image
- **Stockage local** : Hive + shared_preferences
- **Offline detection** : connectivity_plus

---

## Prérequis

- Flutter SDK 3.x (`flutter --version`)
- Android SDK (API 21+)
- Java 17
- Compte Firebase avec le projet MaasGa configuré
- Fichier `google-services.json` dans `android/app/`

---

## Build APK release (interne)

```bash
# Depuis le dossier mobile_admin/
flutter clean
flutter pub get
flutter build apk --release
```

L'APK se trouve dans :
```
build/app/outputs/flutter-apk/app-release.apk
```

### Installer sur un appareil Android

```bash
# Via ADB (appareil connecté en USB avec débogage USB activé)
adb install build/app/outputs/flutter-apk/app-release.apk

# Ou copier l'APK et l'installer manuellement sur l'appareil
```

---

## Développement local

```bash
flutter run
```

Pour cibler un appareil spécifique :
```bash
flutter devices                        # lister les appareils disponibles
flutter run -d <device-id>
```

---

## Tests

```bash
# Tests unitaires (repositories)
flutter test test/unit/

# Tests widget
flutter test test/widget/

# Tests d'intégration (nécessite un appareil Android connecté)
flutter test integration_test/

# Tout en une seule commande
flutter test test/unit/ test/widget/
```

---

## Fonctionnalités implémentées

| Section | Features |
|---|---|
| **Auth** | Login email/password Firebase, mot de passe oublié |
| **Dashboard** | KPIs temps réel, graphiques RDV + CA, activité récente |
| **Commandes** | Liste, filtres, **détail complet** (timeline statut, notes admin) |
| **Rendez-vous** | Liste, filtres, **détail RDV**, **création de RDV** (FAB) |
| **Produits** | CRUD complet, **upload image galerie** |
| **Clients** | Liste, **détail avec onglets** (infos, commandes, RDV) |
| **Devis** | Liste, stats, **formulaire de création** complet (calcul TTC temps réel) |
| **Paiements** | Liste, stats, filtres |
| **Maintenance** | Contrats/Demandes/Visites, activation, validation visites |
| **SAV** | Liste, filtres priorité/statut, **création ticket** (FAB), **vue détail** avec réponse |
| **Notifications** | Liste, **formulaire campagne push** (envoi immédiat ou planifié) |
| **Réalisations** | Grille, filtres, **création/édition** avec upload photo, mise en avant |
| **Avis** | Modération (approve/reject), réponse |
| **Bannières** | Liste, toggle actif/inactif, formulaire création/édition |
| **Audit** | Logs en lecture seule, filtres par action |
| **Paramètres** | Paramètres site (maintenance mode, SEO, coordonnées) |
| **Shell** | Recherche globale, bandeau offline, lien site public, nav drawer |

---

## Architecture

```
lib/
├── app/
│   ├── router/         # go_router — 17 routes
│   └── shell/          # AdminShell, AppBar, BottomNav, NavDrawer
├── core/
│   ├── network/        # Dio + ApiEndpoints
│   └── theme/          # AdminTheme + MaasgaTokens
├── features/
│   ├── auth/           # Firebase Auth
│   ├── dashboard/      # KPIs + graphiques
│   ├── orders/         # Commandes (liste + détail)
│   ├── appointments/   # RDV (liste + détail + création)
│   ├── products/       # Produits (CRUD + upload image)
│   ├── clients/        # Clients (liste + détail 3 onglets)
│   ├── devis/          # Devis (liste + formulaire)
│   ├── paiements/      # Paiements
│   ├── maintenance/    # Contrats/Demandes/Visites
│   ├── sav/            # Tickets SAV (liste + détail + création)
│   ├── notifications/  # Campagnes push
│   ├── realisations/   # Galerie (CRUD + upload)
│   ├── reviews/        # Avis clients
│   ├── banners/        # Bannières du site
│   ├── audit/          # Logs d'audit
│   ├── messages/       # Messages clients
│   └── settings/       # Paramètres site
└── shared/
    ├── design_tokens/  # MaasgaTokens
    └── widgets/        # ImagePickerWidget, PlaceholderScreen
```

---

## API Backend

L'app pointe vers `https://maasga-website.pages.dev` (Cloudflare Pages + Workers).

Tous les endpoints sont dans `lib/core/network/api_endpoints.dart`.

Les endpoints admin utilisent l'authentification Firebase (`Authorization: Bearer <token>`).

---

## Notes de déploiement

- L'APK ne nécessite pas de signature Play Store — distribution directe via USB ou partage de fichier
- Le fichier `google-services.json` doit correspondre au projet Firebase de production
- Le backend doit être déployé sur Cloudflare avant de tester l'app
