# Audit Global du Système MAASGA

**Date de réalisation :** Octobre 2026  
**Périmètre audité :**
1. **`maasga-code`** : Plateforme Web SSR (Hono + Cloudflare Pages/Workers + D1 + R2) & Application Flutter Admin (`mobile_admin`)
2. **`maasga-mobile`** : Application mobile Flutter Client (Commandes, RDV, SAV, Maintenance, Espace Client)

---

## 1. Synthèse Exécutive & Score Global

L'écosystème MAASGA dispose d'une couverture fonctionnelle très riche (catalogue, devis, RDV clim, contrats d'entretien, SAV, messagerie, notifications push, médiathèque de marques, bannières dynamiques). Le passage récent à **Cloudflare R2** et le découplage Firebase Auth / D1 fournissent une base cloud moderne et économique.

Cependant, le système souffre d'une **dette technique structurelle critique** due à une croissance rapide en mode monolithique, d'une **absence de suite de tests automatisés côté backend**, et de **fichiers géants non découpés** qui freinent la maintenance et augmentent le risque de régression.

### Tableau de bord de santé du système

| Domaine | Note | État | Points d'attention majeurs |
|---|:---:|:---:|---|
| **Architecture Backend (`maasga-code`)** | ⚠️ 4/10 | Critique | Monolithe de 13 788 lignes (`index.tsx`), 593 requêtes SQL en dur sans couche service, cache mémoire d'isolate non synchronisé. |
| **Front Web Admin (`src/pages/admin.tsx`)** | ⚠️ 4.5/10 | Fragile | Monolithe de 6 921 lignes, 20 blocs de scripts JS inline, aucun composant réutilisable isolé. |
| **App Mobile Client (`maasga-mobile`)** |  7.5/10 | Bon | Architecture Riverpod propre, CI GitHub Actions fonctionnelle, mais paiements en ligne absents et iOS non configuré. |
| **App Mobile Admin (`mobile_admin`)** | ⚠️ 5.5/10 | Moyen | 52 avertissements d'analyse statique (`use_build_context_synchronously`), code dupliqué (`paiements` vs `payments`), pas de CI. |
| **Sécurité & Hygiène du code** | ⚠️ 5/10 | Moyen | Fichiers de secrets orphelins (`secrets_tmp.json`), traces de tokens dans l'historique git, crash logs et dossiers malformés. |
| **DevOps & Tests automatisés** | ❌ 2.5/10 | Très insuffisant | Backend : 0 test unitaire sur la logique métier, script `test` égal à `curl localhost`, pas de CI sur `maasga-code`. |

---

## 2. Audit Détaillé du Backend & Web (`maasga-code`)

### 2.1. Le mégalithe `src/index.tsx` (13 788 lignes)
* **Constat :** Le fichier central regroupe à lui seul :
  * La déclaration de **270 routes** HTTP (pages publiques, webhooks, API client, API mobile, API admin, exports CSV/JSON).
  * **593 requêtes SQL directes** (`db.prepare(...)`).
  * Les algorithmes métiers (calcul de tarification des plans de maintenance, devis, validation de magic bytes d'images).
  * Les intégrations tierces (Cloudflare R2, ImgBB, Brevo emails, Telegram Bot, Firebase Token Verification).
  * Les gabarits HTML rendus côté serveur (SSR).
* **Risques :**
  * Temps de rechargement/compilation IDE dégradé.
  * Risque maximal de merge conflicts en équipe.
  * Impossibilité de tester unitairement une règle métier (ex: `calculatePlanPricing`) sans instancier tout le routeur HTTP.

### 2.2. Gestion du cache en mémoire dans les isolates Workers
* **Constat :** Ligne 443-450 de `src/index.tsx` :
  ```typescript
  let _d1LoadPromise: Promise<void> | null = null
  app.use(async (c, next) => {
    if (products.length === 0 && c.env.DB) { ... }
  })
  ```
* **Problème :** Sur Cloudflare Workers, chaque PoP (Point of Presence) mondial ou nouvel isolate possède sa propre mémoire RAM. Si un administrateur modifie un produit ou un stock sur le PoP A, le PoP B n'invalide pas automatiquement son tableau `products` en mémoire tant que l'isolate ne redémarre pas.
* **Conséquence :** Les visiteurs peuvent voir des prix ou des disponibilités non synchronisés selon le centre de données Cloudflare qui répond.

### 2.3. Taille du bundle Worker (`dist/_worker.js` = 1,35 Mo)
* Le bundle généré par Vite atteint **1,35 Mo**. Bien que supporté sur les offres Workers Paid (jusqu'à 10 Mo), il dépasse la limite historique du plan gratuit Cloudflare Workers (1 Mo non compressé) et allonge le "Cold Start" de l'isolate.

### 2.4. Historique et cohérence des migrations D1
* **Constat :** Dans le dossier `migrations/`, il existe un saut inexpliqué de numérotation entre la migration `0028_appointment_types.sql` et la migration `0034_products_price_wholesale.sql` (les migrations 0029 à 0033 n'existent pas dans le dépôt).
* **Recommandation :** Documenter formellement dans `README.md` la raison de ce saut pour éviter toute confusion lors d'un déploiement sur un nouvel environnement D1 vierge.

---

## 3. Audit de l'Application Mobile Client (`maasga-mobile`)

### 3.1. Points Forts
* Architecture en couches propre avec **Riverpod** (`features/<feature>/{data, presentation}`).
* **CI GitHub Actions (`.github/workflows/ci.yml`)** exemplaire : exécute `dart format`, `flutter analyze`, `flutter test`, et un build release R8 smoke test à chaque push/PR.
* Keystore de production documenté et configuré avec ProGuard/R8.

### 3.2. Ce qui manque & Anomalies
1. **Absence de passerelle de paiement intégrée** :
   * Le paiement direct (LigdiCash/Mobile Money) a été désactivé en V1.1. Les commandes sont validées au statut `en_attente` avec règlement à la livraison ou contact direct.
   * *Manque :* Pas de réconciliation automatisée des paiements réels avec D1.
2. **Plateforme unique (Android seulement)** :
   * Aucun dossier `ios/` initialisé. L'application ne peut pas être compilée pour iPhone/iPad sans une passe complète de configuration CocoaPods / Runner Xcode / Firebase iOS.
3. **Fichiers résiduels volumineux** :
   * Fichier `build2.log` (près de **3 Mo**) et `build.log` laissés à la racine du dépôt.
   * `google-services (2).json` présent à la racine en doublon du vrai fichier dans `android/app/`.

---

## 4. Audit de l'Application Mobile Admin (`mobile_admin`)

### 4.1. 52 Alertes d'analyse statique (`dart analyze`)
* **Problème critique : `use_build_context_synchronously`**
  * Plusieurs écrans (`sav_screen.dart`, `sav_detail_screen.dart`, `realisations_screen.dart`, `products_screen.dart`, `mediatheque_screen.dart`) manipulent le `context` (ex: `Navigator.of(context).pop()` ou `ScaffoldMessenger.of(context)`) après une opération asynchrone `await` sans vérifier `if (!mounted) return;`.
  * *Risque :* Crash violent de l'application si l'administrateur quitte l'écran ou tourne son téléphone pendant le chargement.
* **Éléments dépréciés Flutter** :
  * Utilisation de `groupValue` et `onChanged` dépréciés sur les composants Radio (Flutter 3.32+ préconise `RadioGroup`).

### 4.2. Incohérences de structure
* **Dossiers doublons** : Présence de `lib/features/paiements/` (contenant un seul fichier wrapper vers `payments`) ET de `lib/features/payments/`. Le premier doit être supprimé et les routes d'import alignées.
* **Absence de CI/CD** : Contrairement à `maasga-mobile`, `mobile_admin` ne possède aucun workflow GitHub Actions pour vérifier la compilation et les tests automatiquement.

---

## 5. Audit de Sécurité & Hygiène du Dépôt

### 5.1. Fuite potentielle de secrets et hygiène des credentials
* Le fichier `secrets_tmp.json` à la racine de `maasga-code` contient en clair :
  `{"ADMIN_SECRET":"ma voiture de reve"}`. Bien qu'ignoré par `.gitignore`, il ne doit jamais séjourner sur une machine de développement sans chiffrement.
* L'historique Git (`commit fc5052c`) contient un ancien token API Cloudflare (`cfut_jam55...`) codé en dur dans `package.json`. Même si la clé a été changée, il est recommandé de révoquer définitivement tout token ayant fuité dans un commit.

### 5.2. Dossiers malformés et fichiers orphelins à la racine de `maasga-code`
Plusieurs répertoires et fichiers créés par accident lors d'anciennes commandes Windows/Bash polluent la racine :
* `CUserssaytaDownloadsTelegram` *(nom avec deux-points généré par une commande mal échappée)*
* `Desktopmaasga-codesrccomponentsadmin` *(dossier vide)*
* `Desktopmaasga-codesrchooks` *(dossier vide)*
* `hs_err_pid3860.log` et `replay_pid3860.log` *(crash dumps Java/Gradle de 1.3 Mo)*
* Fichiers de déploiement en doublon : `deploy.bat`, `deploy.ps1`, `deploy-wrapper.bat`, `deploy-output.txt`.

---

## 6. Plan de Transformation Structurelle Recommandé

### Phase 1 : Nettoyage & Stabilisation Immédiate (Effort : 1 jour)
- [ ] Supprimer les répertoires et fichiers résiduels (`build*.log`, crash logs, faux dossiers Windows).
- [ ] Révoquer et nettoyer tout secret présent dans l'historique ou les fichiers temporaires.
- [ ] Corriger les 52 avertissements dans `mobile_admin` (ajouter `if (!mounted) return;` avant chaque usage de `context`).
- [ ] Fusionner `lib/features/paiements` dans `lib/features/payments`.

### Phase 2 : Modularisation du Backend Hono (Effort : 3-4 jours)
Transformer le monolithe `src/index.tsx` en une architecture modulaire :
```
src/
├── core/                  # Configuration, types, bindings Hono
├── middlewares/           # adminAuth, mobileAuth, rateLimiter, csrf, cors
├── services/              # Logique métier pure (indépendante de HTTP)
│   ├── pricing.service.ts # calculatePlanPricing, remises, TVA
│   ├── storage.service.ts # Upload R2 / fallback
│   ├── auth.service.ts    # Firebase JWT verifier, admin session
│   ├── notification.ts    # Brevo, Telegram, Push FCM
│   └── audit.service.ts   # logAdminAudit, logSecurityEvent
├── repositories/          # 100% des requêtes SQL D1 (ex-db.ts)
│   ├── product.repo.ts
│   ├── order.repo.ts
│   ├── client.repo.ts
│   ├── appointment.repo.ts
│   └── maintenance.repo.ts
├── routes/                # Contrôleurs HTTP fins (app.route)
│   ├── web/               # Pages SSR publiques (catalogue, contact, etc.)
│   ├── admin-web/         # Pages SSR admin
│   ├── api-client/        # Endpoints espace client web
│   ├── api-mobile/        # Endpoints app mobile client
│   └── api-mobile-admin/  # Endpoints app Flutter admin
└── index.tsx              # Point d'entrée allégé (< 150 lignes)
```

### Phase 3 : Découpage du Tableau de Bord Admin (`admin.tsx`)
- [ ] Découper `src/pages/admin.tsx` en sous-composants dédiés par onglet (`AdminProductsTab.tsx`, `AdminOrdersTab.tsx`, `AdminMaintenanceTab.tsx`, etc.).
- [ ] Externaliser les scripts JS inline (actuellement injectés sous forme de chaînes de caractères sans validation TypeScript) vers des fichiers statiques typés et minifiés dans `public/static/js/admin/`.

### Phase 4 : Stratégie de Tests & CI/CD Backend
- [ ] Configurer **Vitest** + **Miniflare** dans `maasga-code` pour tester les Workers et les requêtes D1 localement sans avoir à déployer.
- [ ] Écrire les tests unitaires prioritaires :
  1. Recalcul des montants de commandes côté serveur.
  2. Calcul des prix des contrats de maintenance.
  3. Upload R2 et route CDN `/media/...`.
  4. Sécurité des routes admin (rejet des tokens falsifiés ou expirés).
- [ ] Créer `.github/workflows/backend-ci.yml` pour valider le build, le lint et les tests à chaque PR.
