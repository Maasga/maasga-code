# Spécification - MaasGa Admin Mobile

**Date** : 9 septembre 2026  
**Version** : 1.0  
**Statut** : À approuver

---

## Résumé

Transformation complète de l'interface admin web actuelle en application mobile native Flutter. L'application inclura **toutes** les fonctionnalités de l'admin web (16 sections) avec une architecture partagée avec l'app client existante pour maximiser la réutilisation de code.

---

## Objectifs

1. **UI Flutter native complète** : Reconstruire toute l'interface admin avec des composants Flutter natifs
2. **Architecture unifiée** : Partager le code core (config, réseau, thème) avec l'app client existante
3. **Authentification Firebase** : Migrer l'admin web vers Firebase Auth pour cohérence web/mobile
4. **Fonctionnalités complètes** : Reproduire exactement toutes les fonctionnalités de l'admin web
5. **Expérience mobile optimisée** : Interface adaptée aux patterns mobile (swipe, FAB, navigation drawer)

---

## Architecture Technique

### Stack Technologique

- **Framework** : Flutter 3.41.7+
- **State Management** : Riverpod 3.x
- **Architecture** : Feature-first avec partage de code core
- **Réseau** : Dio avec intercepteurs
- **Authentification** : Firebase Auth avec custom claims
- **Notifications** : Firebase Cloud Messaging (FCM)
- **Stockage local** : SharedPreferences, Hive (cache)
- **Charts** : Flutter Chart.js wrapper
- **Thème** : Adaptatif (clair/sombre/système)

### Structure de Dossiers

```
mobile_admin/
├── lib/
│   ├── core/                    # Partagé avec app client
│   │   ├── config/
│   │   │   └── env.dart        # Variables d'environnement
│   │   ├── network/
│   │   │   ├── api_client.dart # Dio + intercepteurs Firebase
│   │   │   └── api_endpoints.dart
│   │   ├── theme/
│   │   │   ├── app_theme.dart   # Thème clair/sombre
│   │   │   └── admin_theme.dart # Tokens spécifiques admin
│   │   └── constants/
│   ├── features/               # Features admin (16 sections)
│   │   ├── auth/
│   │   │   ├── data/
│   │   │   │   ├── repositories/auth_repository.dart
│   │   │   │   └── models/admin_user.dart
│   │   │   └── presentation/
│   │   │       ├── screens/login_screen.dart
│   │   │       └── widgets/
│   │   ├── dashboard/
│   │   ├── produits/
│   │   ├── commandes/
│   │   ├── rdv/
│   │   ├── clients/
│   │   ├── maintenance/
│   │   ├── devis/
│   │   ├── paiements/
│   │   ├── sav/
│   │   ├── messages/
│   │   ├── avis/
│   │   ├── realisations/
│   │   ├── audit/
│   │   ├── notifications/
│   │   ├── banners/
│   │   └── parametres/
│   ├── shared/                 # Partagé avec app client
│   │   ├── widgets/
│   │   ├── utils/
│   │   └── design_tokens/
│   └── app/
│       ├── router/
│       │   └── app_router.dart
│       └── shell/
│           └── admin_shell.dart
```

### Pattern Repository & Providers

```dart
// Chaîne de providers asynchrones
firebaseAuthProvider → dioProvider → *RepositoryProvider → *DataProvider
```

Chaque feature suit le pattern :
- `data/repositories/` : Accès API avec Dio
- `data/models/` : Models typés
- `presentation/screens/` : Écrans UI
- `presentation/widgets/` : Widgets réutilisables

---

## Authentification

### Flow d'Authentification

1. **Écran de login** : Email + mot de passe Firebase
2. **Vérification email** : Confirmation requise avant accès
3. **Récupération mot de passe** : Lien email Firebase
4. **Session persistante** : Firebase Auth persiste automatiquement
5. **Vérification rôle admin** : Custom claims Firebase côté serveur
6. **Déconnexion** : Firebase signOut + suppression locale

### Migration Admin Web

**Backend à modifier :**
- Remplacer auth actuelle (mot de passe + ADMIN_SECRET) par Firebase Auth
- Endpoint `/api/admin/verify-admin` pour vérifier les custom claims
- Routes admin acceptent tokens Firebase ID en `Authorization: Bearer`
- Migration des données admin existantes vers Firebase Auth

**Avantages :**
- SSO entre admin web et admin mobile
- Gestion centralisée des comptes admin
- Sécurité renforcée (Firebase Auth vs mot de passe simple)
- Support multi-admin avec rôles

---

## Navigation et UI

### Shell Principal

**Navigation Drawer (gauche) :**
- 16 sections organisées par catégories
- Badges avec compteurs (RDV en attente, commandes, avis, etc.)
- Profil admin avec avatar et déconnexion
- Lien vers site public

**App Bar :**
- Titre de la section courante
- Recherche globale
- Badge notifications
- Menu hamburger (mobile)
- Icone profil

**Bottom Navigation :**
- 4 sections principales : Dashboard, Commandes, RDV, Produits
- Active selon la route courante

### Navigation Router

- Routes nommées pour chaque écran
- Transitions `SharedAxisTransition` (cohérent avec app client)
- Guards d'authentification Firebase
- Deep linking support
- WebView fallback pour sections complexes

---

## Fonctionnalités par Section

### 1. Dashboard

**Layout :**
- Cartes KPIs en grille (2x2 mobile, 4x2 tablette)
- Graphiques Chart.js :
  - Évolution commandes (7j / 30j)
  - Répartition par statut
  - Revenus mensuels
- Liste alertes (RDV en attente, commandes récentes)
- Actions rapides (créer RDV, nouveau produit)

**KPIs affichés :**
- RDV en attente
- Alertes stock (rupture + limité)
- Avis en attente
- Chiffre d'affaires (commandes validées)

**Alertes :**
- Bloc alerte RDV nouveaux avec liste des 3 premiers
- Lien rapide vers section RDV

---

### 2. Produits & Stock

**Liste produits :**
- Cards avec image, nom, prix, stock
- Filtres : catégorie, marque, disponibilité
- Recherche avec autocomplete
- Swipe actions : éditer (droite), supprimer (gauche)
- FAB pour ajouter produit

**Détails produit :**
- Image principale + galerie multi-images
- Informations techniques (puissance, BTU, dimensions)
- Prix et stock
- CRUD complet

**Médiathèque par marque :**
- Upload images vers ImgBB (max 5 Mo, JPG/PNG/WebP)
- Affectation à :
  - Tous les produits d'une marque (global)
  - Un produit spécifique
- Utilisation comme : image principale ou galerie
- Filtres par marque avec boutons rapides
- Suppression d'image de la médiathèque

**Import Excel en masse :**
- Glisser/déposer fichier fournisseur
- Détection automatique des colonnes
- Aperçu complet avant import
- Mapping intelligent des champs

**Galerie multi-images par produit :**
- Upload direct depuis la fiche produit
- Suppression individuelle
- Prévisualisation

---

### 3. Commandes

**Liste commandes :**
- Tableau avec filtres par statut
- KPIs : total, payées, installées, en attente, annulées
- Recherche par client, ID
- Sélection multiple pour bulk actions
- Pagination (20 par page)

**Bulk actions :**
- Changement de statut en masse
- Export CSV des commandes sélectionnées
- Suppression en masse avec confirmation

**Détail commande :**
- Informations client
- Liste des produits commandés
- Historique des statuts
- Actions : changer statut, créer devis, supprimer
- Paiements associés

**Détail client :**
- Historique des commandes du client
- Informations de contact
- Statut client

---

### 4. Rendez-vous

**Liste RDV :**
- Filtres par statut (pending, confirmed, done, cancelled)
- Filtres par type (devis, installation, entretien, dépannage)
- KPIs : en attente, confirmés, effectués
- Alertes pour RDV nouveaux

**Actions RDV :**
- Confirmer/refuser RDV
- Créer devis depuis RDV
- Modifier date/heure
- Annuler RDV

---

### 5. Clients

**Base clients :**
- Liste avec recherche
- Filtres par quartier, date d'inscription
- Détail client :
  - Informations personnelles
  - Historique commandes
  - Historique RDV
  - Statut client

---

### 6. Maintenance

**Gestion contrats :**
- Liste des contrats maintenance
- Filtres par statut (actif, expiré, en attente renouvellement)
- Alertes contrats à renouveler
- Détail contrat :
  - Client et équipement
  - Date début/fin
  - Visites effectuées
  - Documents associés

---

### 7. Devis

**Liste devis :**
- Filtres par statut (draft, sent, accepted, refused, expired)
- Création de devis depuis :
  - RDV
  - Commande
  - Ticket SAV
  - Contrat maintenance
  - Manuel

**Création devis :**
- Sélection client (ou pré-rempli depuis contexte)
- Sélection produits avec quantités
- Calcul automatique du total
- Génération PDF
- Envoi par email

**Détail devis :**
- Statut avec indicateur visuel
- Lien public pour client
- Actions : renvoyer, convertir en commande, supprimer

---

### 8. Paiements

**Suivi paiements :**
- Liste des paiements
- Filtres par statut (pending, completed, failed)
- KPIs : total, en attente, complétés, échoués, revenus
- Association avec commandes
- Export CSV

---

### 9. SAV / Tickets

**Gestion tickets :**
- Liste des tickets SAV
- Filtres par statut (open, in_progress, resolved, closed)
- Priorité (low, medium, high, urgent)
- Création de ticket depuis client ou commande
- Historique des communications
- Création devis depuis ticket

---

### 10. Messages

**Messagerie :**
- Liste des conversations
- Thread de messages par client
- Notifications nouveaux messages
- Réponse rapide
- Archivage des conversations

---

### 11. Avis Clients

**Modération avis :**
- Liste avec filtres (approuvés, en attente)
- Prévisualisation de l'avis
- Actions : approuver, refuser, supprimer
- Note moyenne globale
- Statistiques (nombre avis, distribution notes)

---

### 12. Réalisations

**Portfolio :**
- Liste des réalisations
- Upload images avant/après
- Description et tags
- Association avec produits
- Publication sur site public

---

### 13. Audit / Logs

**Journal d'activité :**
- Liste des actions admin
- Filtres par utilisateur, date, type d'action
- Détail de l'action (anciennes/nouvelles valeurs)
- Export des logs

---

### 14. Notifications

**Centre notifications :**
- Liste des notifications
- Filtres par type (commandes, RDV, messages, système)
- Marquer comme lu/non lu
- Marquer tout comme lu
- Badge compteur unread
- Configuration des préférences

---

### 15. Bannières & Marques

**Gestion bannières :**
- Liste des bannières promo
- Upload image
- Configuration :
  - Page cible
  - Date début/fin
  - Priorité
  - Condition d'affichage
- Prévisualisation
- Activation/désactivation

**Gestion marques :**
- Liste des marques
- Logo et description
- Association avec produits
- Tri par popularité

---

### 16. Paramètres

**Configuration site :**
- Informations entreprise (nom, adresse, téléphone)
- Réseaux sociaux
- Textes légaux (CGU, politique confidentialité)
- Configuration notifications (Telegram, WhatsApp, Email)
- Configuration paiements (LigdiCash)
- Configuration Google OAuth
- Configuration SMS (Twilio)

**Paramètres admin :**
- Gestion des comptes admin
- Changer mot de passe
- Préférences utilisateur (thème, langue)
- Logs de connexion

---

## Design Tokens et Thème

### Thème Adaptatif

- **Mode clair** : Fond blanc/gris clair, texte noir
- **Mode sombre** : Fond marine (#0F0F1A), texte blanc
- **Mode système** : Suit les préférences OS

### Couleurs Admin

- **Primary** : Bleu admin (#1A1A2E → #16213E gradient)
- **Accent** : Or (#D4AF37)
- **Success** : Vert (#34D399)
- **Warning** : Orange (#FBBF24)
- **Error** : Rouge (#F87171)
- **Info** : Cyan (#38BDF8)

### Typographie

- **Font** : Inter (Google Fonts)
- **Tailles** : Display (24px), Title (18px), Body (14px), Caption (12px)

### Espacement

- **Scale** : 4px base, multiples de 4
- **Padding** : sm (8px), md (16px), lg (24px), xl (32px)

### Ombres

- **Card** : `box-shadow: 0 4px 12px rgba(3,105,161,0.12)`
- **Elevated** : `box-shadow: 0 8px 24px rgba(3,105,161,0.15)`

---

## Notifications Temps Réel

### Firebase Cloud Messaging

**Topics :**
- `admin-commandes` : Nouvelles commandes
- `admin-rdv` : Nouveaux RDV
- `admin-maintenance` : Demandes maintenance
- `admin-sav` : Nouveaux tickets SAV
- `admin-messages` : Nouveaux messages

**Payload notification :**
```json
{
  "title": "Nouvelle commande !",
  "body": "Client X a commandé 2 climatiseurs",
  "data": {
    "type": "commande",
    "id": 123,
    "route": "/admin/commandes"
  }
}
```

**Badge compteur :**
- Incrément sur nouvelle notification
- Décrément sur lecture
- Reset sur déconnexion

---

## Performance et Optimisation

### Cache Local

- **Produits** : Cache Hive avec TTL 1h
- **Clients** : Cache Hive avec TTL 24h
- **Configuration** : Cache persistant
- **Images** : Cache automatique (flutter_cache_manager)

### Pagination

- **Listes** : 20 éléments par page
- **Infinite scroll** : Optionnel pour certaines listes
- **Lazy loading** : Images et contenu lourd

### Optimisations

- **Const everywhere** : Optimisation Flutter
- **ListView.builder** : Pour listes longues
- **Image caching** : CachedNetworkImage
- **Debounce** : Recherche et filtres

---

## Sécurité

### Authentification

- Token Firebase ID dans toutes les requêtes
- Refresh automatique sur 401
- Vérification custom claims admin
- Session timeout configurable

### Données

- Communication HTTPS uniquement
- Validation input côté client et serveur
- Sanitization des user inputs
- Pas de stockage de données sensibles en clair

### Permissions

- Vérification rôle admin côté serveur
- Actions sensibles requièrent confirmation
- Audit trail de toutes les actions

---

## Tests

### Tests Unitaires

- Repositories : Mock Dio et tests API
- Models : Sérialisation/désérialisation
- Utils : Fonctions utilitaires

### Tests Widget

- Écrans principaux
- Composants réutilisables
- Navigation

### Tests Integration

- Flow authentification complet
- CRUD produits
- Flow commande
- Notifications

---

## Deployment

### Build Android

```bash
# Release avec keystore
flutter build apk --release

# Split par ABI (recommandé)
flutter build apk --release --split-per-abi
```

### Distribution

- **Play Store** : AAB pour distribution officielle
- **Directe** : APK arm64-v8a pour distribution manuelle

### Environment

- **Dev** : API base URL dev
- **Prod** : API base URL prod
- Configuration via `String.fromEnvironment`

---

## Migration Admin Web vers Firebase Auth

### Phase 1 : Backend

1. Créer endpoints Firebase Auth :
   - `/api/admin/firebase-login`
   - `/api/admin/verify-admin`
2. Migrer routes admin pour accepter tokens Firebase
3. Créer custom claims pour rôles admin
4. Script migration comptes admin existants

### Phase 2 : Frontend Web

1. Remplacer login form par Firebase Auth
2. Mettre localStorage Firebase token
3. Mettre à jour toutes les requêtes API
4. Tester complet flow auth

### Phase 3 : Mobile Admin

1. Intégrer Firebase Auth Flutter
2. Utiliser mêmes endpoints que web
3. Tester SSO web/mobile

---

## Timeline Estimée

**Phase 1 : Setup et Architecture** (1 semaine)
- Configuration projet Flutter
- Structure dossiers
- Partage code core avec app client
- Setup Firebase Auth

**Phase 2 : Authentification et Shell** (1 semaine)
- Écran login
- Navigation drawer
- App bar et shell
- Router avec guards

**Phase 3 : Sections Principales** (4 semaines)
- Dashboard
- Produits & Stock
- Commandes
- RDV
- Clients

**Phase 4 : Sections Commercial** (2 semaines)
- Devis
- Paiements
- Maintenance

**Phase 5 : Sections Service** (2 semaines)
- SAV/Tickets
- Messages
- Avis

**Phase 6 : Sections Marketing** (1 semaine)
- Réalisations
- Bannières & Marques

**Phase 7 : Sections Système** (1 semaine)
- Audit/Logs
- Notifications
- Paramètres

**Phase 8 : Tests et Optimisation** (1 semaine)
- Tests unitaires
- Tests widget
- Performance
- Bug fixes

**Phase 9 : Migration Admin Web** (1 semaine)
- Backend Firebase Auth
- Frontend web migration
- Tests SSO

**Phase 10 : Deployment** (1 semaine)
- Build release
- Tests sur appareil
- Documentation
- Deployment

**Total estimé** : ~15 semaines

---

## Livrables

1. **Application mobile** : APK/AAB production-ready
2. **Code source** : Repository avec documentation
3. **Documentation** :
   - Guide d'installation
   - Guide d'utilisation
   - Architecture document
4. **Tests** : Suite de tests complète
5. **Migration admin web** : Backend et frontend mis à jour

---

## Risques et Mitigations

### Risque 1 : Scope trop ambitieux

**Mitigation** : Prioriser MVP avec sections essentielles, itérer sur les autres

### Risque 2 : Complexité migration admin web

**Mitigation** : Faire migration en parallèle, garder fallback mot de passe

### Risque 3 : Performance sur vieux appareils

**Mitigation** : Tests sur appareils bas de gamme, optimisations ciblées

### Risque 4 : Sync entre admin web et mobile

**Mitigation** : API unifiée, mêmes endpoints, validation côté serveur

---

## Critères de Succès

1. ✅ Toutes les 16 sections de l'admin web reproduites
2. ✅ Authentification Firebase unifiée web/mobile
3. ✅ Performance fluide sur appareils mid-range
4. ✅ Tests passants (unitaires + widget)
5. ✅ Documentation complète
6. ✅ Deployment réussi sur Play Store ou distribution directe

---

## Next Steps

1. **Approuver cette spécification**
2. **Créer plan d'implémentation détaillé**
3. **Setup environnement de développement**
4. **Commencer Phase 1**

---

**Document généré pour MaasGa Admin Mobile Project**
**Version 1.0 - 9 septembre 2026**
