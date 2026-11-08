# Plan de correction — Gestion des images (admin mobile + utilisateur mobile)

## Contexte et architecture

Le projet comprend trois pièces distinctes qui doivent fonctionner ensemble :

| Composant | Chemin | Rôle |
|---|---|---|
| **Backend Cloudflare Workers / Hono** | `maasga-code/src/` | API REST + route `/media/:key` pour servir les images depuis R2 |
| **App admin Flutter** | `mobile_admin/lib/` | Panneau d'administration : upload, affectation à une marque |
| **App utilisateur Flutter** | `maasga-mobile/lib/` | Consultation produits avec images R2 |

Le stockage est **Cloudflare R2** (binding `IMAGES_BUCKET`), les URLs publiques sont de la forme `https://maasga-website.pages.dev/media/<clé>`.

---

## Bugs identifiés

### BUG 1 — Le `Content-Type` multipart écrase le token d'auth dans le Dio admin (CRITIQUE)

**Localisation :** `mobile_admin/lib/features/banners/data/repositories/brand_repository.dart` — méthode `uploadImage()`

**Problème :** Lors de l'upload via `BrandRepository.uploadImage()`, on passe explicitement `Options(contentType: 'multipart/form-data')` à `_dio.post()`. Or le `dio_provider.dart` de l'app admin injecte d'abord le header `Content-Type: application/json` au niveau de `BaseOptions`. Quand `FormData` est détecté par Dio il génère automatiquement le bon boundary (`multipart/form-data; boundary=...`) — mais l'option `Options(contentType: 'multipart/form-data')` **sans boundary** remplace cette valeur auto-générée, ce qui corrompt le Content-Type envoyé au serveur. Le serveur Hono tente alors de parser le corps en JSON et échoue (`file is null`), renvoyant `{ "error": "Fichier image manquant" }`.

**Fix :** Supprimer `Options(contentType: 'multipart/form-data')` de l'appel `_dio.post()` dans `uploadImage()`. Quand on passe un `FormData` à Dio, il fixe automatiquement le bon `Content-Type` avec boundary.

---

### BUG 2 — `BrandMediaRepository.uploadMediaImage()` n'envoie pas le bon MIME type (CRITIQUE)

**Localisation :** `mobile_admin/lib/features/products/data/repositories/brand_media_repository.dart` — méthode `uploadMediaImage()`

**Problème :** Le `MultipartFile.fromFile()` est appelé sans `contentType` explicite. Dio détermine alors le type MIME depuis l'extension du fichier, mais les fichiers issus du `ImagePicker` Flutter ont souvent un chemin temporaire sans extension (`/data/user/0/.../image_picker1234`) ou se terminent par `.heic` (iOS). Le serveur Hono reçoit alors `Content-Type: application/octet-stream`, qui ne passe pas le test `rawType.startsWith('image/')`, si bien que la détection du type est degradée en `image/jpeg` — ce qui peut faire échouer la validation `validateImageMagicBytes` pour les PNG par exemple, ou simplement stocker le mauvais MIME.

**Fix :** Déduire le type MIME depuis l'extension du fichier et le passer explicitement à `MultipartFile.fromFile()` via `contentType: DioMediaType.parse(mime)` — exactement comme `BrandRepository.uploadImage()` le fait déjà correctement. Ajouter aussi une vérification sur `.heic`/`.heif` (format iOS) → les convertir en JPEG avec le paramètre `imageQuality` qui est déjà passé à `pickImage()` / `pickMultiImage()`.

---

### BUG 3 — `product_form.dart` envoie `image_url` mais l'API de mise à jour produit ne l'applique pas (CRITIQUE)

**Localisation :**
- `mobile_admin/lib/features/products/presentation/widgets/product_form.dart` — `_submitForm()`  
- `maasga-code/src/routes/api-mobile/admin.routes.ts` — route `PUT /admin/products/:id`
- `maasga-code/src/repositories/product.repository.ts` — méthode `update()`

**Problème :** Quand un admin modifie un produit et choisit une nouvelle image, `product_form.dart` inclut `'image_url': _imageUrl` dans le corps JSON envoyé à `PUT /api/mobile/admin/products/:id`. La route passe ce corps tel quel à `prodRepo.update(id, body)`. Il faut vérifier que le `ProductRepository.update()` effectue bien une mise à jour de `imageUrl` ET `image_url` dans la DB — l'API dédiée `POST /admin/products/:id/image` le fait correctement (en mettant à jour les deux colonnes), mais la route `PUT /admin/products/:id` générique peut ne pas inclure ce champ dans son UPDATE SQL.

**Fix :** Dans la route `PUT /admin/products/:id` et/ou dans `ProductRepository.update()`, s'assurer que si `body.image_url` ou `body.imageUrl` est présent, il est persisté dans les colonnes `imageUrl` ET `image_url` (la DB a les deux pour rétrocompatibilité).

---

### BUG 4 — L'`ImagePickerWidget` (partagé) initialise `_uploadedUrl` à `null` même quand `currentImageUrl` est déjà défini, ce qui cause une perte d'image lors des modifications (MODÉRÉ)

**Localisation :** `mobile_admin/lib/shared/widgets/image_picker_widget.dart`

**Problème :** `_uploadedUrl` est initialisé à `null` dans l'état. La propriété `_displayUrl` retourne `_uploadedUrl ?? widget.currentImageUrl`. Si l'admin ouvre le formulaire de modification d'un produit existant avec une image, la prévisualisation fonctionne. Mais si l'admin soumet le formulaire **sans changer l'image**, `_uploadedUrl` reste `null` et `_imageUrl` dans `ProductForm._submitForm()` utilise la valeur de `_imageUrl` initialisée à `widget.product!.imageUrl` — c'est correct. Cependant il y a un problème subtil : si l'admin a cliqué sur l'image pendant l'upload et qu'une erreur survient, `_localFile` est remis à null mais `_uploadedUrl` reste null, et `onImageSelected` n'est jamais rappelé avec l'URL initiale. L'image du produit peut alors être effacée si le formulaire est soumis.

**Fix :** Dans `_ImagePickerWidgetState.initState()`, initialiser `_uploadedUrl = widget.currentImageUrl` pour que l'URL courante soit toujours remontée dans `onImageSelected` même sans nouvel upload.

---

### BUG 5 — `ImageUploadField` dans la banners/brands feature a le même problème d'initialisation que BUG 4 (MODÉRÉ)

**Localisation :** `mobile_admin/lib/features/banners/presentation/widgets/image_upload_field.dart`

**Problème :** `_uploadedUrl = widget.currentUrl` est bien présent dans `initState()` — c'est **correct**. Cependant quand le widget est reconstruit (ex: le `BrandForm` est dans une `ListView` qui scroll), l'`initState` n'est pas rappelé. L'`_uploadedUrl` reste la valeur précédente. La variable `_displayUrl` utilise `_uploadedUrl ?? widget.currentUrl` donc ça fonctionne par construction. Ce bug n'est pas bloquant mais il faut aussi vérifier `didUpdateWidget()`.

**Fix :** Ajouter `didUpdateWidget()` dans `_ImageUploadFieldState` pour synchroniser `_uploadedUrl` si `widget.currentUrl` change et qu'aucun upload n'est en cours.

---

### BUG 6 — Le flux d'affectation de marque (`/admin/media/brand/assign`) retourne une réponse 200 mais le champ `message` n'est pas toujours présent (MODÉRÉ)

**Localisation :**
- `maasga-code/src/routes/api-mobile/admin.routes.ts` — route `POST /admin/media/brand/assign`
- `mobile_admin/lib/features/products/data/repositories/brand_media_repository.dart` — `assignMediaImage()`

**Problème :** La route renvoie `{ success: true, count: N, message: "..." }` dans certains cas et `{ success: true, message: "..." }` dans d'autres. Le repository Flutter lit `data['message']` et si absent retourne la string par défaut. Ce n'est pas bloquant mais il manque aussi la gestion du cas `success: false` côté Flutter.

**Fix :** S'assurer que la route renvoie systématiquement un champ `message` dans tous les cas de succès. Côté Flutter, ajouter la vérification `data['success'] == true` avant de considérer l'opération réussie.

---

### BUG 7 — L'app utilisateur (`maasga-mobile`) affiche un placeholder pour les images R2 en raison d'un bug de CORS sur la route `/media/` (CRITIQUE)

**Localisation :**
- `maasga-code/src/index.tsx` — middleware CORS
- `maasga-code/src/routes/web/index.tsx` — route `GET /media/:key{.*}`

**Problème :** Le middleware CORS n'est posé que sur `/api/*`. La route `/media/` (qui sert les images depuis R2) n'a aucun header CORS. Dans l'app Flutter, `Image.network()` et `CachedNetworkImage` fonctionnent sans CORS car c'est un fetch natif (pas un `XMLHttpRequest` browser). Donc ce n'est pas un bug CORS pur — mais la route `/media/:key` ne renvoie pas les bons headers `Content-Type` et `Cache-Control` dans tous les cas car elle s'appuie sur `object.writeHttpMetadata(headers)` : si l'objet R2 n'a pas de métadonnée `contentType` (cas des anciens uploads faits avant que le `httpMetadata` était correctement posé), la réponse peut avoir `Content-Type: application/octet-stream`, que Flutter interprète comme binaire non-image.

**Fix :** Dans la route `/media/:key{.*}`, si après `writeHttpMetadata` le header `Content-Type` est absent ou vaut `application/octet-stream`, déduire le type MIME depuis l'extension de la clé R2 et le forcer explicitement.

---

### BUG 8 — Double enregistrement de l'URL dans `admin.routes.ts /admin/upload/image` : hardcoding de `baseUrl` (MODÉRÉ)

**Localisation :** `maasga-code/src/routes/api-mobile/admin.routes.ts` — route `POST /admin/upload/image`

**Problème :** L'URL est construite manuellement avec `const baseUrl = 'https://maasga-website.pages.dev'` et `const url = \`${baseUrl}/media/${key}\`` **directement dans la route** (ligne ~534), sans passer par `StorageService`. C'est redondant, maintenir deux endroits, et si le domaine change il faut mettre à jour deux fichiers. De plus, la route `POST /admin/media/brand/upload` passe bien par `StorageService.uploadImage()` mais essaie de déduire le `baseUrl` depuis `parsedUrl.origin` — ce qui retourne `https://maasga-website.pages.dev` dans les Pages, mais échoue en local.

**Fix :** Refactorer `POST /admin/upload/image` pour utiliser `StorageService` comme le fait déjà `POST /admin/media/brand/upload`. Utiliser `SITE_URL` importé depuis `src/types.ts` comme `baseUrl` de fallback dans les deux routes.

---

### BUG 9 — `RadioGroup` non défini dans `mediatheque_screen.dart` (COMPILATION)

**Localisation :** `mobile_admin/lib/features/products/presentation/screens/mediatheque_screen.dart`

**Problème :** L'écran utilise `RadioGroup<String>` (un composant avec `groupValue`, `onChanged` et `child`) qui n'est pas un widget Flutter standard. Ce widget n'est importé nulle part dans ce fichier et n't existe pas dans les dépendances listées dans `pubspec.yaml`. Ce composant n'existe pas dans Flutter — la bonne approche est d'utiliser deux `Radio<String>` directement avec leur `groupValue` commun depuis l'état `setModalState`.

**Fix :** Supprimer `RadioGroup<String>` et utiliser directement les deux `Radio<String>` avec `groupValue: scope` comme valeur et `onChanged` qui appelle `setModalState(() => scope = v!)`.

---

### BUG 10 — Timeout trop court pour upload d'images lourdes dans `dio_provider.dart` (admin) (MODÉRÉ)

**Localisation :** `mobile_admin/lib/core/network/dio_provider.dart`

**Problème :** `connectTimeout` et `receiveTimeout` sont tous les deux à 30 secondes. Un upload d'image de 5 MB sur une connexion mobile lente (connexion Burkina Faso) peut dépasser ce délai, causant un `DioException` de type timeout. Il manque un `sendTimeout` pour les requêtes avec corps volumineux.

**Fix :** Ajouter `sendTimeout: const Duration(seconds: 120)` dans les `BaseOptions` du `dioProvider` admin. Augmenter `receiveTimeout` à 60 secondes pour les réponses longues.

---

## Plan d'implémentation (ordonné par dépendances)

---

- [ ] **1. Corriger le `ContentType` multipart dans `BrandRepository.uploadImage()` (BUG 1)**

  Retirer l'option `Options(contentType: 'multipart/form-data')` du `_dio.post()` afin que Dio génère automatiquement le bon Content-Type avec boundary.

  **Fichier :** `mobile_admin/lib/features/banners/data/repositories/brand_repository.dart`
  
  **Changement exact :** Dans la méthode `uploadImage()`, remplacer :
  ```dart
  final response = await _dio.post(
    ApiEndpoints.adminUploadImage,
    data: formData,
    options: Options(contentType: 'multipart/form-data'),
  );
  ```
  par :
  ```dart
  final response = await _dio.post(
    ApiEndpoints.adminUploadImage,
    data: formData,
  );
  ```

  **Vérifier :** `flutter analyze lib/features/banners/` dans `mobile_admin/` — aucune erreur.

---

- [ ] **2. Ajouter le MIME type explicite dans `BrandMediaRepository.uploadMediaImage()` (BUG 2)**

  Déduire le MIME type depuis l'extension du fichier et le passer à `MultipartFile.fromFile()`, en ajoutant le support de `.heic`/`.heif` → `image/jpeg`.

  **Fichier :** `mobile_admin/lib/features/products/data/repositories/brand_media_repository.dart`

  **Changement exact :** Remplacer la construction du `FormData` dans `uploadMediaImage()` :
  ```dart
  // Avant
  final formData = FormData.fromMap({
    'brand': brand,
    'label': label ?? '',
    'image': await MultipartFile.fromFile(file.path, filename: fileName),
  });
  ```
  par :
  ```dart
  final ext = fileName.split('.').last.toLowerCase();
  final mime = ext == 'png' ? 'image/png'
    : ext == 'webp' ? 'image/webp'
    : ext == 'gif' ? 'image/gif'
    : 'image/jpeg'; // jpeg, jpg, heic, heif → jpeg
  
  final formData = FormData.fromMap({
    'brand': brand,
    'label': label ?? '',
    'image': await MultipartFile.fromFile(
      file.path,
      filename: 'upload.$ext',
      contentType: DioMediaType.parse(mime),
    ),
  });
  ```
  Ajouter l'import `import 'package:dio/dio.dart';` si absent.

  **Vérifier :** `flutter analyze lib/features/products/data/repositories/` — pas d'erreur.

---

- [ ] **3. Corriger `RadioGroup` non-défini dans `mediatheque_screen.dart` (BUG 9)**

  C'est un bug de compilation qui empêche le build — à corriger en priorité avant les tests. Supprimer le widget `RadioGroup<String>` inexistant et remplacer par des `Radio<String>` standard.

  **Fichier :** `mobile_admin/lib/features/products/presentation/screens/mediatheque_screen.dart`

  **Changement exact :** Dans `_showAssignSheet()`, remplacer le bloc :
  ```dart
  RadioGroup<String>(
    groupValue: scope,
    onChanged: (v) => setModalState(() => scope = v ?? scope),
    child: Column(
      children: [ ...deux InkWell... ],
    ),
  ),
  ```
  par :
  ```dart
  Column(
    children: [
      // Option 1 : brand
      InkWell(
        onTap: () => setModalState(() => scope = 'brand'),
        ...
        child: Row(children: [
          Radio<String>(
            value: 'brand',
            groupValue: scope,
            onChanged: (v) => setModalState(() => scope = v ?? scope),
            activeColor: Colors.purple,
          ),
          ...
        ]),
      ),
      // Option 2 : single
      InkWell(
        onTap: () => setModalState(() => scope = 'single'),
        ...
        child: Row(children: [
          Radio<String>(
            value: 'single',
            groupValue: scope,
            onChanged: (v) => setModalState(() => scope = v ?? scope),
            activeColor: Colors.purple,
          ),
          ...
        ]),
      ),
    ],
  ),
  ```
  Conserver exactement le même style visuel que l'original — seule la structure `RadioGroup` disparaît.

  **Vérifier :** `flutter build apk --debug` dans `mobile_admin/` compile sans erreur sur cet écran.

---

- [ ] **4. Corriger la route `PUT /admin/products/:id` pour persister l'image (BUG 3)**

  Vérifier que le `ProductRepository.update()` inclut `imageUrl` et `image_url` dans l'UPDATE SQL quand ces champs sont présents dans le body.

  **Fichier :** `maasga-code/src/repositories/product.repository.ts`

  **Changement :** Dans la méthode `update(id, data)`, s'assurer que la colonne `imageUrl`/`image_url` est bien incluse dans la liste des colonnes mises à jour. Si la méthode construit dynamiquement la clause SET, ajouter `imageUrl` et `image_url` aux champs autorisés. Si elle fait un UPDATE générique avec toutes les clés du body, vérifier qu'elle gère les deux aliases (`imageUrl` pour rétrocompatibilité et `image_url` normalisé).

  **Vérifier :** `npm test` dans `maasga-code/` — les tests existants `storage.service.test.ts` et `helpers.test.ts` passent.

---

- [ ] **5. Refactorer `POST /admin/upload/image` pour utiliser `StorageService` et `SITE_URL` (BUG 8)**

  Remplacer le code inline de génération de clé et d'URL dans la route `POST /admin/upload/image` par un appel à `StorageService.uploadImage()`, en utilisant `SITE_URL` comme baseUrl.

  **Fichier :** `maasga-code/src/routes/api-mobile/admin.routes.ts`

  **Changement exact :** Dans la route `POST /admin/upload/image`, remplacer le bloc de construction manuelle de la clé et de l'URL (lignes ~510–537) :
  ```ts
  // Avant
  const ext = ...; const randomSuffix = ...; const key = `mobile-uploads/...`
  await r2.put(key, buffer, { httpMetadata: { ... } })
  const baseUrl = 'https://maasga-website.pages.dev'
  const url = `${baseUrl}/media/${key}`
  return c.json({ url })
  ```
  par :
  ```ts
  // Après
  import { SITE_URL } from '../../types'   // déjà importé dans le fichier
  const storage = new StorageService(r2)
  const uploadRes = await storage.uploadImage(buffer, fileType, 'mobile-uploads', SITE_URL)
  return c.json({ url: uploadRes.url })
  ```
  Le binding `r2 = c.env.IMAGES_BUCKET` reste intact. `StorageService` est déjà importé.

  **Vérifier :** `npm test` dans `maasga-code/` — tests passent.

---

- [ ] **6. Corriger la route `/media/:key` pour forcer le Content-Type quand R2 n'a pas de métadonnées (BUG 7)**

  Dans la route `GET /media/:key{.*}`, après `object.writeHttpMetadata(headers)`, vérifier si `Content-Type` est absent ou vaut `application/octet-stream` et le déduire depuis l'extension de la clé.

  **Fichier :** `maasga-code/src/routes/web/index.tsx`

  **Changement exact :** Après `object.writeHttpMetadata(headers)`, ajouter :
  ```ts
  // Fallback: déduire le Content-Type depuis l'extension si R2 ne l'a pas positionné
  const ct = headers.get('content-type') || ''
  if (!ct || ct === 'application/octet-stream') {
    const keyLower = key.toLowerCase()
    const mimeFromExt = keyLower.endsWith('.png') ? 'image/png'
      : keyLower.endsWith('.webp') ? 'image/webp'
      : keyLower.endsWith('.gif') ? 'image/gif'
      : keyLower.endsWith('.svg') ? 'image/svg+xml'
      : 'image/jpeg'
    headers.set('content-type', mimeFromExt)
  }
  ```

  **Vérifier :** `npm test` — tests passent. Tester manuellement qu'une image uploadée depuis la médiathèque s'affiche dans l'app utilisateur.

---

- [ ] **7. Corriger l'initialisation de `_ImagePickerWidgetState` (BUG 4)**

  Initialiser `_uploadedUrl` à `widget.currentImageUrl` dans `initState()`.

  **Fichier :** `mobile_admin/lib/shared/widgets/image_picker_widget.dart`

  **Changement exact :** Ajouter un `initState()` :
  ```dart
  @override
  void initState() {
    super.initState();
    _uploadedUrl = widget.currentImageUrl;
  }
  ```
  Et modifier `_pickAndUpload()` pour appeler `widget.onImageSelected(_uploadedUrl!)` en cas d'erreur upload si une URL existante était présente, afin de ne pas effacer l'image courante.

  **Vérifier :** `flutter analyze lib/shared/widgets/` — pas d'erreur.

---

- [ ] **8. Ajouter `didUpdateWidget()` dans `_ImageUploadFieldState` (BUG 5)**

  Synchroniser `_uploadedUrl` lorsque `widget.currentUrl` change et qu'aucun upload n'est en cours.

  **Fichier :** `mobile_admin/lib/features/banners/presentation/widgets/image_upload_field.dart`

  **Changement exact :** Ajouter après `initState()` :
  ```dart
  @override
  void didUpdateWidget(covariant ImageUploadField oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (!_isUploading && widget.currentUrl != oldWidget.currentUrl) {
      _uploadedUrl = widget.currentUrl;
    }
  }
  ```

  **Vérifier :** `flutter analyze lib/features/banners/` — pas d'erreur.

---

- [ ] **9. Corriger la réponse d'affectation de marque (BUG 6)**

  Garantir que le champ `message` est toujours présent dans la réponse de la route `POST /admin/media/brand/assign` et ajouter la vérification `success` côté Flutter.

  **Fichier backend :** `maasga-code/src/routes/api-mobile/admin.routes.ts`  
  Vérifier que chaque `return c.json({ success: true, count, message: '...' })` dans la route `/admin/media/brand/assign` inclut bien `message`.

  **Fichier Flutter :** `mobile_admin/lib/features/products/data/repositories/brand_media_repository.dart` — méthode `assignMediaImage()`  
  Ajouter :
  ```dart
  if (data['success'] != true) {
    throw Exception(data['error']?.toString() ?? 'Affectation échouée');
  }
  ```
  avant de lire `data['message']`.

  **Vérifier :** `flutter analyze lib/features/products/` — pas d'erreur ; `npm test` — tests passent.

---

- [ ] **10. Augmenter les timeouts Dio pour l'upload (BUG 10)**

  Ajouter `sendTimeout` et augmenter `receiveTimeout` dans le `dioProvider` de l'app admin.

  **Fichier :** `mobile_admin/lib/core/network/dio_provider.dart`

  **Changement exact :** Dans `BaseOptions(...)` :
  ```dart
  // Avant
  connectTimeout: const Duration(seconds: 30),
  receiveTimeout: const Duration(seconds: 30),
  
  // Après
  connectTimeout: const Duration(seconds: 30),
  receiveTimeout: const Duration(seconds: 60),
  sendTimeout: const Duration(seconds: 120),
  ```

  **Vérifier :** `flutter analyze lib/core/network/` — pas d'erreur.

---

## Variables d'environnement à vérifier

Avant le déploiement, vérifier dans le dashboard Cloudflare Pages que les bindings suivants sont bien configurés pour l'environnement de **production** :

| Variable / Binding | Clé | Usage |
|---|---|---|
| R2 Bucket binding | `IMAGES_BUCKET` | Upload et lecture d'images — doit pointer vers le bucket `maasga-images` |
| D1 Database binding | `DB` | Stockage des métadonnées `brand_media_library` |
| Base URL (côté types) | `SITE_URL` dans `src/types.ts` | Valeur actuelle : `https://maasga-website.pages.dev` — à mettre à jour si le domaine personnalisé est activé |
| Firebase project | `FIREBASE_PROJECT_ID` | Auth mobile — doit correspondre au projet Firebase `maasga-83b35` |

---

## Digest

### Fichiers modifiés et blocs concernés

| Fichier | Bloc / Méthode | Bug corrigé | Test couvrant |
|---|---|---|---|
| `mobile_admin/lib/features/banners/data/repositories/brand_repository.dart` | `uploadImage()` (ligne ~42–67) | BUG 1 | `flutter analyze` |
| `mobile_admin/lib/features/products/data/repositories/brand_media_repository.dart` | `uploadMediaImage()` (ligne ~47–65) | BUG 2 | `flutter analyze` |
| `mobile_admin/lib/features/products/presentation/screens/mediatheque_screen.dart` | `_showAssignSheet()` — bloc `RadioGroup` (~ligne 190–260) | BUG 9 | `flutter build apk --debug` |
| `maasga-code/src/repositories/product.repository.ts` | méthode `update(id, data)` | BUG 3 | `npm test` (suite existante) |
| `maasga-code/src/routes/api-mobile/admin.routes.ts` | route `POST /admin/upload/image` (~ligne 480–540) | BUG 8 | `npm test` |
| `maasga-code/src/routes/web/index.tsx` | route `GET /media/:key{.*}` (~ligne 27–43) | BUG 7 | `npm test` |
| `mobile_admin/lib/shared/widgets/image_picker_widget.dart` | `_ImagePickerWidgetState.initState()` | BUG 4 | `flutter analyze` |
| `mobile_admin/lib/features/banners/presentation/widgets/image_upload_field.dart` | `_ImageUploadFieldState.didUpdateWidget()` | BUG 5 | `flutter analyze` |
| `mobile_admin/lib/features/products/data/repositories/brand_media_repository.dart` | `assignMediaImage()` (~ligne 90–110) | BUG 6 | `flutter analyze` |
| `mobile_admin/lib/core/network/dio_provider.dart` | `BaseOptions` (~ligne 12–16) | BUG 10 | `flutter analyze` |

### Commandes de build et test

```bash
# Backend (depuis maasga-code/)
npm test                          # lance vitest, doit passer tous les tests existants

# App admin Flutter (depuis mobile_admin/)
flutter analyze                   # lint + vérification de types
flutter build apk --debug         # build complet de l'APK de debug

# App utilisateur Flutter (depuis maasga-mobile/)
flutter analyze                   # s'assurer qu'aucune dépendance cassée
```

### Ce qui a été vérifié pendant l'exploration

- Lus : `src/routes/api-mobile/admin.routes.ts` (route upload, route brand/upload, route assign), `src/routes/web/index.tsx` (route /media/), `src/services/storage.service.ts`, `src/utils/helpers.ts`, `src/types.ts`, `wrangler.jsonc`, `public/_routes.json`
- Lus : `mobile_admin/lib/core/network/dio_provider.dart`, `api_endpoints.dart`, `brand_repository.dart`, `brand_media_repository.dart`, `brand_form.dart`, `image_upload_field.dart`, `product_form.dart`, `mediatheque_screen.dart`, `image_picker_widget.dart`, `pubspec.yaml`
- Lus : `maasga-mobile/lib/features/catalog/data/catalog_repository.dart`, `shared/widgets/product_image.dart`, `core/network/api_client.dart`, `core/config/env.dart`
- Commandes de test vérifiées depuis `package.json` : `npm test` = `vitest run`
- Commandes Flutter confirmées depuis `pubspec.yaml` SDK `^3.11.5`
