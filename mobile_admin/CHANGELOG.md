# Changelog — Finalisation MaasGa Admin Flutter

## [1.0.0] — Finalisation complète (octobre 2026)

### Phase 1 — Écrans de détail et de consultation

#### Commandes
- ✅ Créé `OrderDetailScreen` : timeline de statuts en 5 étapes, infos client, items commandés avec calcul des prix, section notes admin avec sauvegarde, bottom sheet de changement de statut, confirmation d'annulation
- ✅ Ajouté `orderDetailProvider(id)` dans `order_provider.dart`
- ✅ Branché le `onTap` des `OrderCard` vers `OrderDetailScreen`

#### Rendez-vous
- ✅ Créé `AppointmentDetailScreen` : détail RDV avec actions confirm/done/cancel
- ✅ Créé `AppointmentForm` (bottom sheet modal) : champs nom/téléphone/email/quartier, sélecteur date/heure, type de RDV
- ✅ Ajouté `appointmentDetailProvider`, `createAppointmentProvider`, `updateAppointmentStatusProvider`
- ✅ Ajouté méthodes `createAppointment`, `updateAppointmentStatus` dans `AppointmentRepository`
- ✅ Branché `onTap` dans `AppointmentCard` → `AppointmentDetailScreen`
- ✅ Ajouté FAB `+` dans `AppointmentsScreen` → `AppointmentForm`
- ✅ Corrigé le bug `?year` / `?month` dans `getCalendarAppointments`

#### Clients
- ✅ Créé `ClientDetailScreen` avec 3 onglets : Informations / Commandes / RDV
- ✅ Connecté `clientOrdersProvider` et `clientRdvProvider` aux onglets
- ✅ Remplacé l'ancien `onTap` (qui ouvrait directement le form) par `ClientDetailScreen`

#### SAV
- ✅ Créé `SAVDetailScreen` : en-tête ticket avec badges priorité/statut, description du problème, technicien assigné, résolution, zone de réponse fixe en bas, menu actions (assigner/résoudre/fermer)
- ✅ Branché `onTap` dans `SAVScreen` → `SAVDetailScreen`

---

### Phase 2 — Formulaires de création

#### Devis
- ✅ Créé `DevisForm` (bottom sheet) : client, liste d'items dynamique avec ajout/suppression, calcul TVA en temps réel, total TTC, modes brouillon/envoi
- ✅ Corrigé les stats hardcodées dans `DevisScreen._buildStatsBar` (connectées aux données API)
- ✅ Branché FAB `+` → `DevisForm`

#### SAV
- ✅ Créé `SAVForm` (bottom sheet) : client, équipement, description, sélecteur priorité visuel 4 niveaux
- ✅ Branché FAB `+` → `SAVForm`

#### Notifications push
- ✅ Créé `NotificationForm` (bottom sheet) : titre, message, cible, mode envoi immédiat ou planifié, prévisualisation notification en temps réel
- ✅ Branché FAB `+` → `NotificationForm`

#### Réalisations
- ✅ Créé `RealisationForm` (bottom sheet) : mode création + édition, upload image via `ImagePickerWidget`, catégorie, localisation, date de réalisation, mise en avant
- ✅ Branché FAB `+` et bouton Éditer → `RealisationForm`

---

### Phase 3 — Upload image et enrichissements

- ✅ Créé `ImagePickerWidget` (widget réutilisable dans `shared/widgets/`) : sélection galerie Android, encodage base64, prévisualisation locale
- ✅ Branché `ImagePickerWidget` dans `ProductForm` (remplace le TODO `_pickImage`)
- ✅ Branché `ImagePickerWidget` dans `RealisationForm`
- ✅ Ajouté permissions Android dans `AndroidManifest.xml` : `READ_MEDIA_IMAGES` (Android 13+), `READ_EXTERNAL_STORAGE` (Android < 13), `QUERY_ALL_PACKAGES`

---

### Phase 4 — Features avancées

#### Recherche globale
- ✅ Implémenté `SearchDelegate` complet dans `AdminAppBar` : interface de recherche, résultats groupés par catégorie (commandes/RDV/clients/produits), navigation rapide

#### Mot de passe oublié
- ✅ Implémenté `_showForgotPasswordDialog` dans `LoginScreen` : dialog email, appel `sendPasswordResetEmail` Firebase, feedback succès/erreur

#### Lien site public
- ✅ Branché `url_launcher` dans `NavDrawer` pour ouvrir `https://maasga-website.pages.dev`

#### Offline detection
- ✅ Ajouté `connectivityProvider` dans `AdminShell`
- ✅ Banderole rouge animée "Hors ligne — Vérifiez votre connexion" quand `ConnectivityResult.none`

---

### Phase 5 — Tests complets

#### Tests unitaires (80 tests)
- ✅ `order_repository_test.dart` : 5 suites (fetchOrders, fetchDetail, updateStatus, cancel, addNotes)
- ✅ `appointment_repository_test.dart` : 5 suites (fetch, detail, confirm, cancel, create)
- ✅ `client_repository_test.dart` : 6 suites (fetch, detail, create, update, orders, rdv)
- ✅ `maintenance_repository_test.dart` : 4 suites (summary, contracts, requests, visits)
- ✅ 6 anciens tests de repository conservés et fonctionnels (devis, messages, notifications, payments, realisations, sav)

#### Tests widget (42 tests)
- ✅ `order_detail_screen_test.dart` : 8 cas (affichage, loading, erreur, statut, notes, timeline)
- ✅ `devis_form_test.dart` : 6 cas (champs, validation, items, total)
- ✅ `sav_form_test.dart` : 6 cas (champs, priorités, validation, bouton)
- ✅ `notification_form_test.dart` : 5 cas (champs, cible, switch, prévisualisation)
- ✅ `client_detail_screen_test.dart` : 8 cas (3 onglets, badges, données)
- ✅ `appointment_form_test.dart` : 6 cas (champs, type, date/heure, bouton)

#### Tests d'intégration (3 flux)
- ✅ `order_flow_test.dart` : liste → détail → changement statut
- ✅ `sav_flow_test.dart` : liste → détail → FAB présent
- ✅ `devis_flow_test.dart` : liste avec stats → formulaire validation

---

### Phase 6 — Finalisation

- ✅ Zéro TODO / SnackBar "à implémenter" restant dans `lib/`
- ✅ `AdminBannersPage` web vérifiée : déjà présente dans `src/pages/banners.tsx`
- ✅ `README.md` mis à jour avec instructions build, architecture, features
- ✅ APK release buildé
