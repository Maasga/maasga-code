# Mise en ligne d'images & Gestion Bannières et Marques (Mobile Admin) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permettre aux administrateurs de téléverser des images depuis l'application mobile pour les bannières et de gérer intégralement les marques partenaires (avec leurs logos) sur un écran unifié à deux onglets.

**Architecture:** 
1. Côté backend Hono (`src/index.tsx`) : ajout de l'endpoint d'upload ImgBB sécurisé par token Firebase mobile admin (`/api/mobile/admin/upload/image`) et du CRUD complet pour les marques (`/api/mobile/admin/brands`).
2. Côté mobile Flutter (`mobile_admin`) : création d'un service et d'un composant de téléversement d'image (`ImageUploadField`), intégration dans `BannerForm`, création du module `brands` (modèle, repository, providers, carte et formulaire), et refonte de `BannersScreen` en vue à onglets (Bannières / Marques).

**Tech Stack:** Hono, Cloudflare Workers, Cloudflare D1, ImgBB API, Flutter 3.x, Dart, Riverpod, Dio, ImagePicker.

## Global Constraints

- Backend : Toutes les routes mobiles admin doivent utiliser le middleware `mobileAdminAuth`.
- Backend : Respecter la limite de 10 Mo pour les uploads et la validation magic bytes.
- Mobile : Utiliser les design tokens existants (`MaasgaTokens`, `AdminTheme`).
- Mobile : Toujours vérifier `flutter analyze` sans erreur ni warning bloquant.

---

### Task 1: Endpoints Backend — Upload Image & CRUD Marques

**Files:**
- Modify: `c:/Users/sayta/Downloads/Telegram Desktop/maasga-code/src/index.tsx`
- Test: `c:/Users/sayta/Downloads/Telegram Desktop/maasga-code/src/tests/` or build verification

**Interfaces:**
- Produces: 
  - `POST /api/mobile/admin/upload/image` -> `{ success: true, url: string, delete_url: string }`
  - `GET /api/mobile/admin/brands` -> `Brand[]`
  - `POST /api/mobile/admin/brands` -> `{ success: true, id: number }`
  - `PUT /api/mobile/admin/brands/:id` -> `{ success: true }`
  - `DELETE /api/mobile/admin/brands/:id` -> `{ success: true }`
  - `PATCH /api/mobile/admin/brands/:id/toggle` -> `{ success: true }`

- [ ] **Step 1: Ajouter l'endpoint d'upload d'image mobile admin dans `src/index.tsx`**

Ajouter la route `POST /api/mobile/admin/upload/image` protégée par `mobileAdminAuth` :
```typescript
// ── POST /api/mobile/admin/upload/image — téléverse une image vers ImgBB ──
app.post('/api/mobile/admin/upload/image', mobileAdminAuth, async (c) => {
  const clientIp = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown'
  const rateLimit = checkImageUploadRateLimit(clientIp)
  if (!rateLimit.allowed) {
    return c.json({ error: 'Trop d\'uploads récents. Attendez 1 minute.' }, 429)
  }
  const imgbbKey = (c.env as any).IMGBB_API_KEY as string
  if (!imgbbKey) return c.json({ error: 'IMGBB_API_KEY non configurée' }, 500)
  let file: any = null
  try {
    const form = await c.req.formData()
    file = form.get('image')
  } catch (_) {
    const body = await c.req.parseBody()
    file = body['image']
  }
  if (!file || typeof file !== 'object' || typeof file.arrayBuffer !== 'function' || !file.size) {
    return c.json({ error: 'Fichier image manquant ou corrompu' }, 400)
  }
  if (file.size > IMAGE_SIZE_LIMITS.BRAND_MEDIA) {
    return c.json({ error: 'Image trop volumineuse (max 10 MB)' }, 400)
  }
  const rawType = (file.type || '').toLowerCase()
  const fileType = rawType.startsWith('image/') ? rawType : 'image/jpeg'
  const buffer = await file.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  if (!validateImageMagicBytes(bytes)) {
    return c.json({ error: 'Format d\'image non valide' }, 400)
  }
  try {
    const r = await uploadToImgBBWithRetry(imgbbKey, buffer, fileType)
    return c.json({ success: true, url: r.url, delete_url: r.deleteUrl })
  } catch (e: any) {
    console.error('Mobile admin image upload error:', e)
    return c.json({ error: 'Upload ImgBB échoué : ' + (e?.message || 'Erreur') }, 500)
  }
})
```

- [ ] **Step 2: Ajouter les routes CRUD pour les marques mobile admin dans `src/index.tsx`**

Ajouter les routes :
```typescript
// ── GET /api/mobile/admin/brands ──────────────────────────────────
app.get('/api/mobile/admin/brands', mobileAdminAuth, async (c) => {
  const db = c.env.DB
  if (!db) return c.json({ error: 'Service indisponible' }, 503)
  try {
    const brands = await db.prepare('SELECT * FROM brands ORDER BY display_order ASC, id ASC').all()
    return c.json(brands.results || [])
  } catch (e: any) {
    console.error('Get mobile admin brands error:', e)
    return c.json({ error: 'Erreur récupération marques: ' + e.message }, 500)
  }
})

// ── POST /api/mobile/admin/brands ─────────────────────────────────
app.post('/api/mobile/admin/brands', mobileAdminAuth, async (c) => {
  const db = c.env.DB
  if (!db) return c.json({ error: 'Service indisponible' }, 503)
  try {
    const body = await c.req.json()
    const name = ((body.name as string) || '').trim().toUpperCase()
    const asset_key = ((body.asset_key as string) || '').trim().toLowerCase() || null
    const logo_url = ((body.logo_url as string) || '').trim() || null
    const display_order = parseInt(String(body.display_order || '0')) || 0
    const is_active = body.is_active ? 1 : 0
    if (!name) return c.json({ error: 'Nom de marque obligatoire' }, 400)

    const result = await db.prepare(
      'INSERT INTO brands (name, asset_key, logo_url, display_order, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, datetime(\'now\'), datetime(\'now\'))'
    ).bind(name, asset_key, logo_url, display_order, is_active).run()

    await logAdminAudit(db, {
      action: 'create_brand',
      detail: `Brand: ${name}`,
      ip: c.req.header('cf-connecting-ip') || 'unknown',
      userAgent: c.req.header('user-agent') || 'unknown'
    })

    return c.json({ success: true, id: result.meta?.last_row_id })
  } catch (e: any) {
    const msg = e?.message?.includes('UNIQUE') ? 'Cette marque existe déjà' : e.message
    return c.json({ error: 'Erreur création marque: ' + msg }, 500)
  }
})

// ── PUT /api/mobile/admin/brands/:id ──────────────────────────────
app.put('/api/mobile/admin/brands/:id', mobileAdminAuth, async (c) => {
  const db = c.env.DB
  if (!db) return c.json({ error: 'Service indisponible' }, 503)
  try {
    const id = parseInt(c.req.param('id'))
    if (isNaN(id)) return c.json({ error: 'ID invalide' }, 400)
    const body = await c.req.json()
    const name = ((body.name as string) || '').trim().toUpperCase()
    const asset_key = ((body.asset_key as string) || '').trim().toLowerCase() || null
    const logo_url = ((body.logo_url as string) || '').trim() || null
    const display_order = parseInt(String(body.display_order || '0')) || 0
    const is_active = body.is_active ? 1 : 0
    if (!name) return c.json({ error: 'Nom obligatoire' }, 400)

    const result = await db.prepare(
      'UPDATE brands SET name=?, asset_key=?, logo_url=?, display_order=?, is_active=?, updated_at=datetime(\'now\') WHERE id=?'
    ).bind(name, asset_key, logo_url, display_order, is_active, id).run()

    if (result.meta?.changes === 0) return c.json({ error: 'Marque non trouvée' }, 404)

    await logAdminAudit(db, {
      action: 'update_brand',
      detail: `Brand ID: ${id}`,
      ip: c.req.header('cf-connecting-ip') || 'unknown',
      userAgent: c.req.header('user-agent') || 'unknown'
    })

    return c.json({ success: true })
  } catch (e: any) {
    return c.json({ error: 'Erreur modification marque: ' + e.message }, 500)
  }
})

// ── DELETE /api/mobile/admin/brands/:id ───────────────────────────
app.delete('/api/mobile/admin/brands/:id', mobileAdminAuth, async (c) => {
  const db = c.env.DB
  if (!db) return c.json({ error: 'Service indisponible' }, 503)
  try {
    const id = parseInt(c.req.param('id'))
    if (isNaN(id)) return c.json({ error: 'ID invalide' }, 400)
    await db.prepare('DELETE FROM brands WHERE id=?').bind(id).run()
    await logAdminAudit(db, {
      action: 'delete_brand',
      detail: `Brand ID: ${id}`,
      ip: c.req.header('cf-connecting-ip') || 'unknown',
      userAgent: c.req.header('user-agent') || 'unknown'
    })
    return c.json({ success: true })
  } catch (e: any) {
    return c.json({ error: 'Erreur suppression marque: ' + e.message }, 500)
  }
})

// ── PATCH /api/mobile/admin/brands/:id/toggle ─────────────────────
app.patch('/api/mobile/admin/brands/:id/toggle', mobileAdminAuth, async (c) => {
  const db = c.env.DB
  if (!db) return c.json({ error: 'Service indisponible' }, 503)
  try {
    const id = parseInt(c.req.param('id'))
    if (isNaN(id)) return c.json({ error: 'ID invalide' }, 400)
    const { is_active } = await c.req.json()
    if (typeof is_active !== 'boolean') return c.json({ error: 'is_active doit être un booléen' }, 400)
    await db.prepare('UPDATE brands SET is_active = ?, updated_at = datetime(\'now\') WHERE id = ?')
      .bind(is_active ? 1 : 0, id).run()
    return c.json({ success: true })
  } catch (e: any) {
    return c.json({ error: 'Erreur activation marque: ' + e.message }, 500)
  }
})
```

- [ ] **Step 3: Vérification de la compilation backend**

Exécuter la vérification TypeScript / bundle :
```powershell
npx tsc --noEmit
```
Expected : Aucun problème de typage.

- [ ] **Step 4: Commit**

```bash
git add src/index.tsx
git commit -m "feat(api): add mobile admin upload and brands CRUD endpoints"
```

---

### Task 2: Mobile Admin — Constantes Réseau & Service d'Upload

**Files:**
- Modify: `c:/Users/sayta/Downloads/Telegram Desktop/maasga-code/mobile_admin/lib/core/network/api_endpoints.dart`
- Create: `c:/Users/sayta/Downloads/Telegram Desktop/maasga-code/mobile_admin/lib/core/services/image_upload_service.dart`

**Interfaces:**
- Produces:
  - `ApiEndpoints.adminImageUpload`
  - `ApiEndpoints.adminBrands`
  - `ApiEndpoints.adminBrandDetail`
  - `ApiEndpoints.adminBrandToggle`
  - `ImageUploadService.pickAndUploadImage({ImageSource source}) -> Future<String?>`

- [ ] **Step 1: Ajouter les constantes dans `api_endpoints.dart`**

```dart
  // Upload endpoint
  static const String adminImageUpload = '/api/mobile/admin/upload/image';

  // Brands admin endpoints
  static const String adminBrands = '/api/mobile/admin/brands';
  static const String adminBrandDetail = '/api/mobile/admin/brands/{id}';
  static const String adminBrandToggle = '/api/mobile/admin/brands/{id}/toggle';
```

- [ ] **Step 2: Créer `image_upload_service.dart`**

Créer le service avec Dio pour téléverser en multipart :
```dart
import 'dart:io';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import '../network/api_endpoints.dart';
import '../network/dio_client.dart';
import '../utils/app_logger.dart';

final imageUploadServiceProvider = Provider<ImageUploadService>((ref) {
  final dio = ref.watch(dioProvider);
  return ImageUploadService(dio);
});

class ImageUploadService {
  final Dio _dio;
  final ImagePicker _picker = ImagePicker();

  ImageUploadService(this._dio);

  Future<String?> pickAndUploadImage({
    ImageSource source = ImageSource.gallery,
    void Function(double progress)? onProgress,
  }) async {
    try {
      final XFile? pickedFile = await _picker.pickImage(
        source: source,
        maxWidth: 1920,
        maxHeight: 1920,
        imageQuality: 85,
      );
      if (pickedFile == null) return null;

      final file = File(pickedFile.path);
      final filename = pickedFile.name;

      final formData = FormData.fromMap({
        'image': await MultipartFile.fromFile(
          file.path,
          filename: filename,
        ),
      });

      AppLogger.info('Téléversement d\'image vers $adminImageUpload...');
      final response = await _dio.post(
        ApiEndpoints.adminImageUpload,
        data: formData,
        onSendProgress: (sent, total) {
          if (total > 0 && onProgress != null) {
            onProgress(sent / total);
          }
        },
      );

      if (response.statusCode == 200 && response.data != null) {
        final url = response.data['url'] as String?;
        AppLogger.info('Image téléversée avec succès: $url');
        return url;
      } else {
        throw Exception(response.data?['error'] ?? 'Échec de l\'upload');
      }
    } catch (e) {
      AppLogger.error(e, null, 'ImageUploadService.pickAndUploadImage');
      rethrow;
    }
  }
}
```

- [ ] **Step 3: Vérification `flutter analyze`**

```powershell
cd "c:\Users\sayta\Downloads\Telegram Desktop\maasga-code\mobile_admin"
flutter analyze lib/core/services/image_upload_service.dart lib/core/network/api_endpoints.dart
```

- [ ] **Step 4: Commit**

```bash
git add mobile_admin/lib/core/network/api_endpoints.dart mobile_admin/lib/core/services/image_upload_service.dart
git commit -m "feat(mobile_admin): add image upload service and brand endpoints"
```

---

### Task 3: Mobile Admin — Composant Réutilisable `ImageUploadField`

**Files:**
- Create: `c:/Users/sayta/Downloads/Telegram Desktop/maasga-code/mobile_admin/lib/shared/widgets/image_upload_field.dart`

**Interfaces:**
- Produces: `ImageUploadField(initialUrl, onUrlChanged, label, height, isLogo)`

- [ ] **Step 1: Créer le widget `ImageUploadField`**

Widget interactif comprenant :
- Prévisualisation soignée (hauteur personnalisable, mode bannière ou mode logo).
- Bouton "Téléverser une image" ouvrant le choix Galerie / Caméra.
- Jauge d'avancement / indicateur pendant l'upload ImgBB.
- Option de saisir ou coller directement une URL HTTP(S) si souhaité.
- Bouton pour supprimer ou remplacer l'image.

- [ ] **Step 2: Vérifier avec `flutter analyze`**

```powershell
cd "c:\Users\sayta\Downloads\Telegram Desktop\maasga-code\mobile_admin"
flutter analyze lib/shared/widgets/image_upload_field.dart
```

- [ ] **Step 3: Commit**

```bash
git add mobile_admin/lib/shared/widgets/image_upload_field.dart
git commit -m "feat(mobile_admin): add ImageUploadField reusable widget"
```

---

### Task 4: Mobile Admin — Intégration Upload dans `BannerForm`

**Files:**
- Modify: `c:/Users/sayta/Downloads/Telegram Desktop/maasga-code/mobile_admin/lib/features/banners/presentation/widgets/banner_form.dart`

- [ ] **Step 1: Mettre à jour `BannerForm` pour utiliser `ImageUploadField`**

Remplacer le simple `TextFormField` par `ImageUploadField` :
- Champ obligatoire validé si `_imageUrlController.text` n'est pas vide.
- Synchronisation automatique dès que l'upload réussi renvoie une URL ImgBB.

- [ ] **Step 2: Vérifier avec `flutter analyze`**

```powershell
cd "c:\Users\sayta\Downloads\Telegram Desktop\maasga-code\mobile_admin"
flutter analyze lib/features/banners/presentation/widgets/banner_form.dart
```

- [ ] **Step 3: Commit**

```bash
git add mobile_admin/lib/features/banners/presentation/widgets/banner_form.dart
git commit -m "feat(mobile_admin): integrate ImageUploadField in BannerForm"
```

---

### Task 5: Mobile Admin — Module Marques (`Brand`)

**Files:**
- Create: `c:/Users/sayta/Downloads/Telegram Desktop/maasga-code/mobile_admin/lib/features/brands/data/models/brand.dart`
- Create: `c:/Users/sayta/Downloads/Telegram Desktop/maasga-code/mobile_admin/lib/features/brands/data/repositories/brand_repository.dart`
- Create: `c:/Users/sayta/Downloads/Telegram Desktop/maasga-code/mobile_admin/lib/features/brands/data/providers/brand_provider.dart`
- Create: `c:/Users/sayta/Downloads/Telegram Desktop/maasga-code/mobile_admin/lib/features/brands/presentation/widgets/brand_card.dart`
- Create: `c:/Users/sayta/Downloads/Telegram Desktop/maasga-code/mobile_admin/lib/features/brands/presentation/widgets/brand_form.dart`

**Interfaces:**
- Produces:
  - `Brand` model (`id`, `name`, `logoUrl`, `assetKey`, `displayOrder`, `isActive`)
  - `BrandRepository` (`getBrands`, `createBrand`, `updateBrand`, `deleteBrand`, `toggleBrand`)
  - `brandsProvider`, `createBrandProvider`, `updateBrandProvider`, `deleteBrandProvider`, `toggleBrandProvider`
  - `BrandCard` widget
  - `BrandForm` widget

- [ ] **Step 1: Créer le modèle `Brand`**
- [ ] **Step 2: Créer le repository `BrandRepository` et les providers Riverpod**
- [ ] **Step 3: Créer le widget `BrandCard` (carte de marque avec logo, statut, toggle, édition, suppression)**
- [ ] **Step 4: Créer le widget `BrandForm` (nom en majuscules, logo via `ImageUploadField`, clé asset, ordre, actif)**
- [ ] **Step 5: Vérifier avec `flutter analyze`**

```powershell
cd "c:\Users\sayta\Downloads\Telegram Desktop\maasga-code\mobile_admin"
flutter analyze lib/features/brands/
```

- [ ] **Step 6: Commit**

```bash
git add mobile_admin/lib/features/brands/
git commit -m "feat(mobile_admin): create brands feature module"
```

---

### Task 6: Mobile Admin — Refonte de l'Écran Bannières & Marques (`BannersScreen`)

**Files:**
- Modify: `c:/Users/sayta/Downloads/Telegram Desktop/maasga-code/mobile_admin/lib/features/banners/presentation/screens/banners_screen.dart`

- [ ] **Step 1: Transformer `BannersScreen` avec `DefaultTabController` à 2 onglets**
  - Onglet 1 : « Bannières » (liste existante enrichie).
  - Onglet 2 : « Marques » (liste / grille de cartes des marques).
  - `TabBar` stylisée dans l'AppBar ou en haut de la vue.
  - FloatingActionButton dynamique ouvrant soit `BannerForm` soit `BrandForm` selon l'onglet actif.
- [ ] **Step 2: Vérification `flutter analyze`**

```powershell
cd "c:\Users\sayta\Downloads\Telegram Desktop\maasga-code\mobile_admin"
flutter analyze
```

- [ ] **Step 3: Commit**

```bash
git add mobile_admin/lib/features/banners/presentation/screens/banners_screen.dart
git commit -m "feat(mobile_admin): add TabBar for Banners and Brands with contextual FAB"
```

---

### Task 7: Validation Globale & Tests

**Files:**
- All touched files

- [ ] **Step 1: Lancer `flutter analyze` sur tout `mobile_admin`**
- [ ] **Step 2: Lancer `npm run build` dans `maasga-code`**
- [ ] **Step 3: Rapport final et démonstration des fonctionnalités ajoutées**
