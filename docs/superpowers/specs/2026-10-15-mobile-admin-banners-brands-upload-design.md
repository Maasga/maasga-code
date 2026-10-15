# Spécification Technique — Mise en ligne d'images et gestion des Bannières & Marques (Mobile Admin)

- **Date** : 2026-10-15
- **Statut** : Validé
- **Cible** : Backend Hono/Cloudflare Workers (`maasga-code`) & Application Flutter Mobile Admin (`maasga-code/mobile_admin`)

---

## 1. Contexte & Objectifs

Sur l'application web d'administration (`/admin/banners`), l'administrateur peut à la fois :
1. Téléverser des images pour le carrousel d'accueil (bannières) via ImgBB.
2. Gérer les marques partenaires (nom, logo uploadé sur ImgBB, ordre d'affichage, activation).

Sur l'application mobile administrateur Flutter (`mobile_admin`) :
- L'écran `Bannières` ne permettait que de saisir une URL texte manuelle, sans sélecteur ni téléversement d'image depuis le smartphone.
- La gestion des marques était totalement absente.

**Objectifs :**
- Permettre le téléversement d'images pour les bannières directement depuis la galerie ou l'appareil photo du téléphone.
- Ajouter la gestion complète des marques (CRUD + logos uploadés) sur le mobile.
- Unifier la page mobile sous forme de deux onglets : **Bannières** et **Marques**.

---

## 2. Architecture & Endpoints API Backend (`src/index.tsx`)

### 2.1. Upload d'image mobile
* **Route** : `POST /api/mobile/admin/upload/image`
* **Middleware** : `mobileAdminAuth` (Firebase Auth Bearer token avec rôle admin).
* **Format** : `multipart/form-data` avec le champ `image`.
* **Règles métier & sécurité** :
  - Limitation de débit : `checkImageUploadRateLimit(clientIp)`.
  - Taille maximale : 10 Mo (`IMAGE_SIZE_LIMITS.BRAND_MEDIA`).
  - Validation du type MIME (`image/jpeg`, `image/png`, `image/webp`).
  - Validation des octets magiques (`validateImageMagicBytes`).
  - Envoi vers ImgBB via `uploadToImgBBWithRetry`.
* **Réponse 200 OK** :
  ```json
  {
    "success": true,
    "url": "https://i.ibb.co/xxxxx/image.jpg",
    "delete_url": "https://ibb.co/delete/xxxxx"
  }
  ```

### 2.2. CRUD Marques Mobile Admin
* **GET `/api/mobile/admin/brands`** :
  - Retourne toutes les marques ordonnées par `display_order ASC`.
  - Colonnes : `id`, `name`, `asset_key`, `logo_url`, `display_order`, `is_active`, `created_at`, `updated_at`.
* **POST `/api/mobile/admin/brands`** :
  - Corps JSON : `{ name, asset_key, logo_url, display_order, is_active }`.
  - `name` mis en majuscules. Audit log `create_brand`.
* **PUT `/api/mobile/admin/brands/:id`** :
  - Corps JSON : `{ name, asset_key, logo_url, display_order, is_active }`.
  - Mise à jour et audit log `update_brand`.
* **DELETE `/api/mobile/admin/brands/:id`** :
  - Suppression de la marque et audit log `delete_brand`.
* **PATCH `/api/mobile/admin/brands/:id/toggle`** :
  - Corps JSON : `{ is_active: boolean }`.
  - Activation ou désactivation rapide.

---

## 3. Conception Application Mobile (`mobile_admin`)

### 3.1. Endpoints & Constantes (`lib/core/network/api_endpoints.dart`)
Ajout des constantes réseau :
- `uploadImage = '/api/mobile/admin/upload/image'`
- `adminBrands = '/api/mobile/admin/brands'`
- `adminBrandDetail = '/api/mobile/admin/brands/{id}'`
- `adminBrandToggle = '/api/mobile/admin/brands/{id}/toggle'`

### 3.2. Service d'upload d'image (`lib/core/services/image_upload_service.dart`)
- Sélection via `image_picker` (Source: Galerie ou Caméra).
- Compression/préparation de l'image (max 1920x1920, qualité 85%).
- Envoi multipart vers `ApiEndpoints.uploadImage`.
- Gestion des erreurs et retour de l'URL hébergée sur ImgBB.

### 3.3. Widget Réutilisable `ImageUploadField` (`lib/shared/widgets/image_upload_field.dart`)
- Affiche une zone de prévisualisation réactive.
- Boutons pour choisir depuis la galerie ou prendre une photo.
- Indicateur de progression circulaire pendant l'upload ImgBB.
- Option pour saisir ou modifier manuellement l'URL externe si souhaité.
- Bouton de suppression / réinitialisation.

### 3.4. Module Bannières (`lib/features/banners`)
- **`BannerForm`** :
  - Remplacement du simple `TextFormField` URL par le `ImageUploadField`.
  - Enregistrement immédiat de l'URL ImgBB obtenue.
  - Prévisualisation avec ratio carrousel bannière (hauteur ~150px, fit cover).

### 3.5. Module Marques (`lib/features/brands`)
- **Modèle `Brand`** : `id`, `name`, `logoUrl`, `assetKey`, `displayOrder`, `isActive`.
- **`BrandRepository`** : `getBrands`, `createBrand`, `updateBrand`, `deleteBrand`, `toggleBrand`.
- **Providers Riverpod** : `brandsProvider`, `createBrandProvider`, `updateBrandProvider`, `deleteBrandProvider`, `toggleBrandProvider`.
- **Formulaire `BrandForm`** :
  - Champ Nom de la marque (`TextCapitalization.characters`).
  - Sélection & Upload du logo (`ImageUploadField` avec fond neutre adapté aux logos transparents).
  - Champ Clé asset Flutter (optionnel).
  - Ordre d'affichage (`TextInputType.number`).
  - Switch « Marque active / visible ».
- **Carte Marque `BrandCard`** :
  - Vignette du logo (`Image.network` avec fallback icône).
  - Nom, ordre d'affichage, badge d'état.
  - Switch d'activation instantanée.
  - Boutons éditer et supprimer avec dialogue de confirmation.

### 3.6. Écran Principal Bannières & Marques (`lib/features/banners/presentation/screens/banners_screen.dart`)
- Utilisation de `DefaultTabController` avec 2 onglets :
  - **Onglet 1 : Bannières** (Liste des cartes de bannières avec formulaire d'ajout/édition doté de l'upload d'image).
  - **Onglet 2 : Marques** (Liste des marques partenaires avec formulaire d'ajout/édition doté de l'upload de logo).
- FloatingActionButton contextuel : ouvre `BannerForm` sur l'onglet Bannières, et `BrandForm` sur l'onglet Marques.

---

## 4. Plan de Test & Vérification

1. **Test unitaire / analyse statique** :
   - `flutter analyze` dans `mobile_admin`.
   - `npm run build` / vérification TypeScript dans `maasga-code`.
2. **Vérification API Backend** :
   - Requête POST `/api/mobile/admin/upload/image` avec fichier image -> vérification réponse JSON avec URL ImgBB.
   - Requêtes CRUD `/api/mobile/admin/brands` -> vérification insertion, lecture, mise à jour et suppression dans la table SQLite `brands`.
3. **Vérification Mobile** :
   - Changement d'onglet Bannières <-> Marques.
   - Sélection d'une image locale pour une bannière -> upload automatique -> sauvegarde -> affichage immédiat dans la liste.
   - Création d'une marque avec upload de logo -> affichage dans la liste.
   - Bascule du switch actif/inactif pour bannière et marque.
