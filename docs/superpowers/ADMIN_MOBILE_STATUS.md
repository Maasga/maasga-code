# MaasGa Admin Mobile - État Actuel

## Contexte

Transformation du backend admin web en application Android native responsive avec Flutter.

## Progression

### Complété (Tasks 1-7)

**Branch:** `admin-mobile` (pushée sur GitHub)

**Commits:**
- `fc5052c` → `851a1e7`: Initialisation projet Flutter avec dépendances
- `851a1e7` → `63966cb`: Structure core partagée (config, réseau, thème)
- `63966cb` → `aac9968`: Configuration Firebase et providers core Riverpod
- `aac9968` → `a34fbac`: Écran login Firebase avec vérification rôle admin
- `a34fbac` → `e557ffb`: Shell admin avec navigation drawer et bottom nav
- `e557ffb` → `351d76d`: Router GoRouter avec guards d'authentification
- `351d76d` → `9f00bb4`: Dashboard avec KPIs et graphiques

### Infrastructure en Place

✅ **Stack Flutter:**
- Flutter 3.41.7+
- Riverpod 3.x (state management)
- Firebase Core/Auth/Messaging
- Dio (réseau)
- fl_chart (graphiques)
- go_router (navigation)

✅ **Architecture:**
- Feature-first (identique à app client)
- Core partagé: config, network, theme, utils, design tokens
- Repositories pattern pour chaque feature
- Riverpod providers pour dépendances

✅ **Authentification:**
- Firebase Auth avec email/password
- Custom claims pour rôle admin
- Provider chain: firebaseAuthProvider → dioProvider → repositories
- Token refresh automatique via interceptors

✅ **Navigation:**
- GoRouter avec guards auth
- Redirect: non-authentifié → /login, authentifié sur /login → /dashboard
- Drawer avec 16 sections groupées (Principal, Commercial, Service, Marketing, Système)
- Bottom nav pour 4 sections principales
- App bar avec notifications et recherche

✅ **Dashboard:**
- 4 KPIs interactifs (RDV, Stock, Avis, CA)
- Graphique fl_chart pour RDV 7 derniers jours
- Alert card pour RDV en attente
- Navigation vers sections détaillées

### Reste à Faire

⏳ **Task 8: Produits & Stock** (CRUD complet)
- Liste produits avec filtres (catégorie, marque, disponibilité)
- Recherche en temps réel
- Gestion stock (rupture, limité, OK)
- CRUD complet (create, read, update, delete)
- Upload images via ImgBB
- Gestion galerie multi-images
- Import Excel (détection colonnes automatique)

⏳ **Tasks 9-25:** Autres sections (Commandes, RDV, Clients, Maintenance, Devis, Paiements, SAV, Messages, Avis, Réalisations, Audit, Notifications, Bannières, Paramètres)

⏳ **Backend:**
- Migration Firebase Auth sur API admin
- Custom claims pour autorisation
- Endpoints mobile-friendly JSON
- Tests intégration

## Notes

- Les fichiers mobile_admin sont synchronisés entre worktree et dépôt principal
- Firebase configuration contient des placeholders (YOUR_*) à remplacer
- API endpoint `/api/admin/dashboard` doit exister côté backend
- Pubspec.yaml nécessite `flutter pub get` dans le worktree pour validation
