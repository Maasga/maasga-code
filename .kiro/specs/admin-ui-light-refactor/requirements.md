# Requirements Document

## Introduction

Ce document decrit la refonte de l'interface d'administration du back-office MAASGA.
Le perimetre couvre deux axes distincts :

1. **Correction de bugs fonctionnels et CSS** - erreurs JavaScript actives, routes manquantes, conflits de styles.
2. **Refonte visuelle vers un theme clair** - remplacement du dark mode par un theme SaaS moderne, pilote par des tokens CSS isoles.

Le projet utilise Hono JSX SSR. Les interactions sont en JavaScript vanilla inline.

---

## Glossary

- **Admin_UI** : pages et composants du back-office admin rendus par AdminLayout.
- **Design_Token_File** : fichier public/static/admin-tokens.css avec variables --admin-* sous .admin-ui.
- **Sidebar** : panneau de navigation lateral rendu par AdminLayout.
- **Topbar** : barre d'en-tete fixe rendue par AdminLayout.
- **Stat_Card** : carte KPI affichant un indicateur cle.
- **Status_Badge** : pastille coloree affichant le statut d'une entite.
- **Toast** : notification ephemere via window.showToast().
- **BulkActionsToolbar** : composant affiche quand des commandes sont selectionnees.
- **CommandesTable** : composant affichant un tableau pagine de commandes.
- **adminPaginate()** : fonction JS de pagination sur tbody[data-paginate=N].
- **filterTable()** : fonction JS de filtrage dans CommandesTable.
- **Light_Theme** : palette cible fond #f8fafc, sidebar #0f172a, cards #ffffff, bordures #e2e8f0, accent #0369a1.
- **Dead_File** : ImprovedAdminCommandesPage.tsx avec hooks React incompatibles Hono SSR.

---

## Requirements

---

### Requirement 1: Definir les fonctions d'actions en lot manquantes

**User Story:** En tant qu'administrateur, je veux utiliser les boutons d'actions groupees sans erreur JavaScript, afin de traiter plusieurs commandes simultanement.

#### Acceptance Criteria

1. WHEN l'administrateur clique sur Statut en lot, THE Admin_UI SHALL appeler adminBulkAction('status') sans lever d'exception.
2. WHEN l'administrateur clique sur Exporter, THE Admin_UI SHALL appeler adminBulkAction('export') sans lever d'exception.
3. WHEN l'administrateur clique sur Supprimer, THE Admin_UI SHALL appeler adminBulkAction('delete') sans lever d'exception.
4. WHEN l'administrateur clique sur Effacer selection, THE Admin_UI SHALL appeler adminClearSelection() sans lever d'exception.
5. THE Admin_UI SHALL rendre adminBulkAction et adminClearSelection accessibles dans le scope global avant le rendu de BulkActionsToolbar.
6. IF adminBulkAction ou adminClearSelection n'est pas definie, THEN THE Admin_UI SHALL desactiver les boutons concernes sans ReferenceError.
7. IF aucune commande n'est selectionnee, THEN THE Admin_UI SHALL desactiver les boutons d'action en lot.

---

### Requirement 2: Supprimer le fichier mort ImprovedAdminCommandesPage

**User Story:** En tant que developpeur, je veux que le codebase ne contienne pas de fichiers invalides, afin d'eviter les erreurs de compilation.

#### Acceptance Criteria

1. WHEN le projet est compile apres suppression, THE Admin_UI SHALL NOT contenir d'import ni de reference a ImprovedAdminCommandesPage.
2. WHEN le projet est compile avec tsc, THE Admin_UI SHALL produire zero erreur liee aux hooks React cote serveur.
3. IF ImprovedAdminCommandesPage.tsx existe, THEN la compilation SHALL produire une erreur signalant sa presence.

---

### Requirement 3: Corriger les liens invalides dans ClientDetailModal

**User Story:** En tant qu'administrateur, je veux que les actions de la fiche client redirigent vers des routes admin existantes, afin de ne pas obtenir d'erreur 404.

#### Acceptance Criteria

1. WHEN l'administrateur clique sur Nouvelle commande dans ClientDetailModal, THE Admin_UI SHALL naviguer vers /admin/commandes avec client_id en parametre.
2. IF la route /admin/commandes/nouveau n'est pas enregistree, THEN THE Admin_UI SHALL NOT generer de lien vers ce chemin.
3. WHEN l'administrateur clique sur Nouveau RDV dans ClientDetailModal, THE Admin_UI SHALL naviguer vers /admin/rdv et non une route hors /admin.
4. IF client.phone est absent, THEN THE Admin_UI SHALL naviguer vers /admin/rdv sans parametre client_phone.
5. THE Admin_UI SHALL conserver un lien WhatsApp au format https://wa.me/{numero}.

---

### Requirement 4: Ajouter la page Realisations dans la sidebar

**User Story:** En tant qu'administrateur, je veux trouver Realisations dans la navigation, afin d'y acceder sans saisir l'URL.

#### Acceptance Criteria

1. THE Sidebar SHALL afficher une entree Realisations avec icone fa-images et lien /admin/realisations.
2. WHEN la page courante est /admin/realisations, THE Sidebar SHALL appliquer la classe active sur l'entree Realisations.
3. THE Sidebar SHALL positionner Realisations apres Avis clients et avant Audit / Logs.
4. IF /admin/realisations est saisi dans la barre d'adresse, THEN THE Sidebar SHALL appliquer active sur l'entree Realisations.

---

### Requirement 5: Activer la pagination sur les tableaux de commandes

**User Story:** En tant qu'administrateur, je veux des tableaux de commandes pagines, afin d'eviter une liste illimitee.

#### Acceptance Criteria

1. WHEN adminPaginate() s'execute, THE CommandesTable SHALL avoir son tbody marque avec data-paginate=20.
2. THE CommandesTable SHALL afficher au maximum 20 lignes par page.
3. WHEN le nombre de lignes est inferieur ou egal a 20, THE CommandesTable SHALL afficher toutes les lignes sans controles de pagination.
4. WHEN l'utilisateur navigue vers une page, THE CommandesTable SHALL afficher uniquement les lignes de cette page.
5. IF adminPaginate() ne trouve pas de tbody avec data-paginate, THEN THE CommandesTable SHALL afficher toutes les lignes et consigner un avertissement.

---

### Requirement 6: Synchroniser les statuts de maintenance

**User Story:** En tant qu'administrateur, je veux que les statuts de visites correspondent aux valeurs stockees, afin que les boutons d'action s'affichent correctement.

#### Acceptance Criteria

1. THE Admin_UI SHALL utiliser planifiee et non scheduled pour les visites a effectuer.
2. THE Admin_UI SHALL utiliser effectuee et non done pour les visites terminees.
3. WHEN useAdminMaintenanceData retourne status scheduled, THE Admin_UI SHALL mapper vers planifiee avant rendu.
4. WHEN useAdminMaintenanceData retourne status done, THE Admin_UI SHALL mapper vers effectuee avant rendu.
5. WHILE une visite est planifiee et visit_date est anterieure ou egale a aujourd'hui, THE Admin_UI SHALL afficher le bouton Valider.

---

### Requirement 7: Dedoublonner la fonction filterTable

**User Story:** En tant qu'administrateur, je veux que la recherche fonctionne correctement avec deux tableaux simultanement, sans conflit de definition.

#### Acceptance Criteria

1. THE Admin_UI SHALL definir filterTable une seule fois dans le scope global.
2. WHEN deux CommandesTable sont affiches, THE Admin_UI SHALL filtrer uniquement les lignes du tableau dont l'id correspond au tableId.
3. IF filterTable est deja definie, THEN THE CommandesTable SHALL NOT redefinir cette fonction.

---

### Requirement 8: Corriger la grille orpheline de CommandesProcessDiagram

**User Story:** En tant que developpeur, je veux que le conteneur de CommandesProcessDiagram n'ait pas une colonne vide, afin d'eviter l'espace inattendu.

#### Acceptance Criteria

1. THE Admin_UI SHALL envelopper CommandesProcessDiagram dans un conteneur non-grille quand il est seul enfant.
2. THE Admin_UI SHALL NOT appliquer grid-cols-2 sur un conteneur dont CommandesProcessDiagram est le seul enfant.

---

### Requirement 9: Resoudre le conflit d'ID client-detail-modal

**User Story:** En tant qu'administrateur, je veux que la fiche client fonctionne sans ID HTML duplique dans le DOM.

#### Acceptance Criteria

1. THE Admin_UI SHALL utiliser l'id order-client-detail-modal pour la modale client dans la page Commandes.
2. THE Admin_UI SHALL utiliser l'id client-detail-modal uniquement dans la page Clients.
3. WHEN deux modales client coexistent, THE Admin_UI SHALL garantir que chaque modale a un id HTML unique.

---

### Requirement 10: Creer le fichier de design tokens admin

**User Story:** En tant que developpeur, je veux une source unique definissant toutes les couleurs admin, afin de modifier le theme facilement.

#### Acceptance Criteria

1. WHEN AdminLayout est rendu, THE Admin_UI SHALL charger admin-tokens.css apres tailwind.css et avant style.css.
2. THE Design_Token_File SHALL declarer toutes ses variables sous .admin-ui.
3. THE Admin_UI SHALL appliquer la classe admin-ui sur le body de AdminLayout.
4. THE Design_Token_File SHALL definir --admin-bg, --admin-bg-elevated, --admin-sidebar-bg, --admin-card-bg, --admin-border, --admin-text-primary, --admin-text-muted, --admin-accent, --admin-accent-hover, --admin-accent-light, --admin-success, --admin-success-light, --admin-warning, --admin-warning-light, --admin-danger, --admin-danger-light, --admin-info, --admin-info-light.
5. THE Design_Token_File SHALL definir --admin-status-pending, --admin-status-confirmed, --admin-status-delivered, --admin-status-cancelled, --admin-status-processing.
6. THE Design_Token_File SHALL definir --admin-radius et --admin-shadow-card.
7. THE Design_Token_File SHALL NOT importer app.css, tailwind.css ni d'autres bibliotheques.

---

### Requirement 11: Appliquer le Light Theme a AdminLayout

**User Story:** En tant qu'administrateur, je veux une interface claire style SaaS, afin de reduire la fatigue visuelle.

#### Acceptance Criteria

1. WHEN la page admin est affichee, THE Admin_UI SHALL appliquer la classe admin-ui sur le body.
2. WHEN la page admin est affichee, THE Admin_UI SHALL utiliser var(--admin-bg) comme fond du contenu principal.
3. WHEN la page admin est affichee, THE Sidebar SHALL utiliser var(--admin-sidebar-bg) avec un contraste minimum 4.5:1 sur les textes.
4. WHEN la page admin est affichee, THE Topbar SHALL utiliser un fond semi-opaque avec backdrop-filter blur et bordure var(--admin-border).
5. THE Admin_UI SHALL remplacer le fond encode en dur sur le body par var(--admin-bg).
6. WHEN l'administrateur survole la Sidebar, THE Sidebar SHALL afficher un etat de survol maintenant un contraste minimum 4.5:1.
7. IF un token CSS n'est pas defini, THEN THE Admin_UI SHALL utiliser les valeurs de repli CSS natives.

---

### Requirement 12: Appliquer le Light Theme aux Stat Cards

**User Story:** En tant qu'administrateur, je veux des cartes KPI lisibles sur fond clair, afin d'identifier rapidement les indicateurs.

#### Acceptance Criteria

1. THE Stat_Card SHALL utiliser var(--admin-card-bg) comme fond et var(--admin-border) comme bordure.
2. THE Stat_Card SHALL afficher la valeur en var(--admin-text-primary) avec font-weight 700 ou plus.
3. THE Stat_Card SHALL afficher le libelle en var(--admin-text-muted).
4. WHEN l'administrateur survole une Stat_Card, THE Stat_Card SHALL appliquer var(--admin-shadow-card) et decalage vertical -2px.
5. IF une page contient des Stat_Cards, THEN THE Admin_UI SHALL appliquer ces regles a chacune.

---

### Requirement 13: Appliquer le Light Theme aux tableaux admin

**User Story:** En tant qu'administrateur, je veux des tableaux avec fonds blancs et lignes separees, afin d'ameliorer la lisibilite.

#### Acceptance Criteria

1. THE Admin_UI SHALL utiliser var(--admin-card-bg) comme fond des conteneurs de tableaux.
2. THE Admin_UI SHALL utiliser var(--admin-border) pour les separateurs border-bottom dans les tbody.
3. THE Admin_UI SHALL afficher les th sur fond var(--admin-bg) avec texte var(--admin-text-muted) et hauteur minimale 40px.
4. WHEN l'administrateur survole une ligne tr, THE Admin_UI SHALL appliquer un fond de survol de 2% a 6% de la couleur d'accent.
5. IF une page contient des tables, THEN THE Admin_UI SHALL appliquer ces regles a tous ces tableaux.
6. IF un token CSS n'est pas resolu, THEN THE Admin_UI SHALL afficher le tableau avec les styles de repli Tailwind.

---

### Requirement 14: Standardiser les Status Badges

**User Story:** En tant qu'administrateur, je veux des pastilles de statut uniformes quel que soit le composant, afin d'avoir une interface coherente.

#### Acceptance Criteria

1. THE Status_Badge SHALL utiliser une opacite de fond de 0.12 de maniere uniforme dans tous les composants admin.
2. THE Admin_UI SHALL definir les couleurs de statut via --admin-status-* et les Status_Badge SHALL referencer ces variables.
3. THE Status_Badge SHALL avoir border-radius 9999px et padding 0.2rem 0.65rem de maniere uniforme.
4. THE Status_Badge SHALL avoir font-size 0.7rem et font-weight 600 de maniere uniforme.
5. THE Admin_UI SHALL appliquer ces regles aux statuts commande, RDV, SAV, maintenance et paiement.

---

### Requirement 15: Resoudre le conflit de definition de .btn-primary

**User Story:** En tant que developpeur, je veux un bouton .btn-primary previsible dans l'admin, sans conflits de styles.

#### Acceptance Criteria

1. THE Design_Token_File SHALL definir --admin-btn-primary-bg avec le degrade cible.
2. WHEN un .btn-primary est affiche dans l'Admin_UI, THE Admin_UI SHALL appliquer var(--admin-btn-primary-bg) independamment des autres feuilles de style.
3. THE Admin_UI SHALL definir .btn-primary dans un seul endroit du scope admin.
4. IF un .btn-primary est affiche hors de .admin-ui, THEN les styles admin ne SHALL pas affecter son rendu.

---

### Requirement 16: Resoudre le conflit de police de caracteres

**User Story:** En tant qu'administrateur, je veux une police coherente Inter dans l'admin, sans conflits entre feuilles de style.

#### Acceptance Criteria

1. THE Design_Token_File SHALL definir --admin-font-sans avec la pile de polices cible.
2. WHEN une page admin est rendue, THE Admin_UI SHALL afficher tout le texte avec la police var(--admin-font-sans).
3. IF Inter n'est pas disponible, THEN THE Admin_UI SHALL utiliser la premiere police de repli disponible.

---

### Requirement 17: Corriger les overrides CSS mobile trop larges

**User Story:** En tant qu'administrateur sur mobile, je veux que max-width ne s'applique qu'aux modales, afin que les cartes occupent toute la largeur.

#### Acceptance Criteria

1. WHERE l'ecran est inferieur a 640px, THE Admin_UI SHALL appliquer max-width uniquement aux elements .modal ou role=dialog.
2. WHEN une section rounded-2xl est affichee sur mobile, THE Admin_UI SHALL l'afficher a 100% de la largeur du conteneur.
3. WHEN une modale .modal ou role=dialog est affichee sur mobile, THE Admin_UI SHALL contraindre sa largeur a calc(100vw - 1rem).

---

### Requirement 18: Corriger le gonflement des boutons d'action

**User Story:** En tant qu'administrateur, je veux des boutons d'action compacts, sans gonflement par une regle min-height du site public.

#### Acceptance Criteria

1. THE Admin_UI SHALL neutraliser la regle min-height sur les a et button dans le scope .admin-ui.
2. WHEN un bouton d'action icone a un contenu inferieur a 44px, THE Admin_UI SHALL l'afficher a sa hauteur naturelle.
3. THE Admin_UI SHALL preserver les min-height explicites sur .btn-primary et .btn-secondary.

---

### Requirement 19: Appliquer le Light Theme aux modales admin

**User Story:** En tant qu'administrateur, je veux des modales en theme clair, coherentes avec le reste de l'interface.

#### Acceptance Criteria

1. THE Admin_UI SHALL utiliser var(--admin-card-bg) comme fond de toutes les modales admin.
2. THE Admin_UI SHALL utiliser var(--admin-border) comme bordure avec border-radius de 1rem minimum.
3. THE Admin_UI SHALL afficher les libelles en var(--admin-text-muted) et les valeurs en var(--admin-text-primary).
4. THE Admin_UI SHALL maintenir un overlay sombre rgba(0,0,0,0.5) derriere chaque modale.
5. THE Admin_UI SHALL appliquer ces regles a OrderDetailModal, ClientDetailModal et toutes les modales inline.

---

### Requirement 20: Appliquer le Light Theme aux formulaires admin

**User Story:** En tant qu'administrateur, je veux des champs de saisie avec fond blanc et bordure visible, afin d'identifier les zones interactives.

#### Acceptance Criteria

1. THE Admin_UI SHALL afficher .input-field avec fond var(--admin-card-bg), bordure var(--admin-border) et texte var(--admin-text-primary).
2. WHEN un .input-field recoit le focus, THE Admin_UI SHALL afficher bordure var(--admin-accent) et box-shadow 0 0 0 3px rgba(3,105,161,0.15).
3. THE Admin_UI SHALL afficher les placeholders en var(--admin-text-muted).
4. THE Admin_UI SHALL appliquer ces regles a tous les formulaires admin.

---

### Requirement 21: Appliquer le Light Theme aux toasts et notifications

**User Story:** En tant qu'administrateur, je veux des toasts et notifications lisibles sur fond clair, afin de ne pas manquer les alertes.

#### Acceptance Criteria

1. THE Admin_UI SHALL afficher les toasts avec fond colore selon le type (succes, erreur, avertissement, info) avec texte blanc.
2. THE Admin_UI SHALL afficher le panneau notifications avec fond var(--admin-card-bg) et bordure var(--admin-border).
3. WHEN une notification est non lue, THE Admin_UI SHALL afficher un fond de ligne de 2% a 5% de la couleur d'accent.
4. THE Admin_UI SHALL maintenir le badge rouge de compteur de notifications quelle que soit la couleur du Topbar.

---

### Requirement 22: Appliquer le Light Theme a la recherche globale

**User Story:** En tant qu'administrateur, je veux que la barre de recherche globale s'affiche en theme clair, afin d'etre lisible.

#### Acceptance Criteria

1. THE Admin_UI SHALL afficher le champ de recherche avec fond semi-opaque var(--admin-bg), bordure var(--admin-border) et texte var(--admin-text-primary).
2. THE Admin_UI SHALL afficher le panneau de resultats avec fond var(--admin-card-bg), bordure var(--admin-border) et ombre var(--admin-shadow-card).
3. WHEN l'administrateur survole un resultat, THE Admin_UI SHALL appliquer un fond de survol de 2% a 6% de la couleur d'accent.
