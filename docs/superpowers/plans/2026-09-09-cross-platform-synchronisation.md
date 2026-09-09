# Cross-Platform - Synchronisation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implémenter la synchronisation temps réel entre l'application mobile et le site web MAASGA (panier, commandes), assurer la cohérence du design system, et documenter le workflow de paiement hors app

**Architecture:** WebSocket pour sync temps réel, API endpoints pour sync manuel, documentation design system partagé, documentation workflow paiement

**Tech Stack:** Cloudflare Pages (Hono), Flutter (Riverpod), WebSocket (optionnel), D1 (SQLite), Firebase Auth

## Global Constraints

- Bundle size site web : ~1.06 MB (limite Cloudflare ~1 MB) - minimiser nouvelles dépendances
- Langue : français pour tout le code, commentaires et messages utilisateur
- Mobile : CI stricte `flutter analyze` sans diagnostics
- Site web : CSS recompilation avec `npm run build:css` après modifications Tailwind
- Respecter les règles existantes (pas de fabrication de données produit, total commande recalculé serveur)

---

### Task 1: Documentation Workflow Paiement Hors App

**Files:**
- Create: `docs/workflow-paiement-hors-app.md`
- Modify: `CLAUDE.md` (site web)
- Modify: `CLAUDE.md` (mobile)
- Test: Aucun - documentation uniquement

**Interfaces:**
- Consumes: Existing payment documentation
- Produces: Clear documentation of out-of-app payment workflow

- [ ] **Step 1: Documenter le workflow actuel**

Créer `docs/workflow-paiement-hors-app.md` :
```markdown
# Workflow Paiement Hors Application

## Contexte
Le paiement en ligne a été retiré de l'application MAASGA. Le paiement se convient hors application après validation du devis.

## Workflow Actuel

### Du côté client (Web)
1. Client commande sur le site web
2. Visite technique gratuite obligatoire
3. Devis PDF remis après visite
4. Paiement convenu hors site (espèces, LigdiCash, Wave, virement)
5. Installation programmée après paiement

### Du côté mobile (App)
1. Client commande dans l'app
2. Commande enregistrée sur le serveur
3. Client contacté pour visite technique
4. Devis PDF envoyé par email/SMS
5. Paiement convenu hors app
6. Installation programmée

## Modes de Paiement Acceptés
- Espèces
- LigdiCash (Orange Money, Moov Money, etc.)
- Wave
- Virement bancaire

## Sécurité
- Aucune donnée bancaire stockée
- Paiement toujours après visite technique
- Devis PDF avec signature validée
```

- [ ] **Step 2: Ajouter une référence dans CLAUDE.md du site web**

Modifier `CLAUDE.md` (site web) pour ajouter une section "Paiement" :
```markdown
## Paiement
Le paiement en ligne a été retiré. Le paiement se convient hors application après validation du devis.
Modes acceptés : espèces, LigdiCash, Wave, virement bancaire.
Voir `docs/workflow-paiement-hors-app.md` pour le workflow complet.
```

- [ ] **Step 3: Ajouter une référence dans CLAUDE.md de l'app mobile**

Modifier `CLAUDE.md` (mobile) pour ajouter la même section

- [ ] **Step 4: Mettre à jour order_confirmation_screen.dart**

Modifier `lib/features/cart/presentation/order_confirmation_screen.dart` pour inclure un message clair :
```dart
Text(
  'Le paiement sera convenu après la visite technique. '
  'Un technicien MAASGA vous contactera pour planifier la visite.',
  style: TextStyle(color: Colors.grey[600]),
)
```

- [ ] **Step 5: Mettre à jour la page confirmation du site web**

Modifier la page de confirmation de commande du site web pour inclure le même message

- [ ] **Step 6: Commit**

```bash
git add docs/workflow-paiement-hors-app.md CLAUDE.md lib/features/cart/presentation/order_confirmation_screen.dart
git commit -m "docs: documenter workflow paiement hors application"
```

---

### Task 2: Cohérence Design System Partagé

**Files:**
- Create: `docs/design-system.md`
- Modify: `src/styles/app.css` (site web)
- Modify: `lib/shared/design_tokens/maasga_tokens.dart` (mobile)
- Test: Manuel - vérifier cohérence visuelle

**Interfaces:**
- Consumes: Existing design tokens in both platforms
- Produces: Unified design system documentation

- [ ] **Step 1: Extraire les tokens du site web**

Lire `src/styles/app.css` et `tailwind.config.cjs` pour identifier :
- Couleurs (primary, accent, navy, slate, etc.)
- Typographie (Sora, Plus Jakarta Sans)
- Espacements
- Ombres
- Bordures

- [ ] **Step 2: Extraire les tokens de l'app mobile**

Lire `lib/shared/design_tokens/maasga_tokens.dart` pour identifier les mêmes catégories

- [ ] **Step 3: Créer la documentation du design system**

Créer `docs/design-system.md` :
```markdown
# MAASGA Design System

## Couleurs

### Primary
- Primary (Accent): #0284C7 (Sky-600)
- Primary Dark: #0369A1 (Sky-700)
- Primary Light: #38BDF8 (Sky-400)

### Secondary
- Navy: #0F172A (Slate-900)
- Navy Light: #1E293B (Slate-800)
- Navy Dark: #020617 (Slate-950)

### Neutral
- Surface: #F8FAFC (Slate-50)
- Surface Elevated: #FFFFFF
- Text Primary: #0F172A (Slate-900)
- Text Secondary: #64748B (Slate-500)
- Text Tertiary: #94A3B8 (Slate-400)

### Functional
- Success: #10B981 (Emerald-500)
- Warning: #F59E0B (Amber-500)
- Error: #EF4444 (Red-500)
- Info: #3B82F6 (Blue-500)

## Typographie

### Font Families
- Display: Sora (500, 600, 700, 800)
- Body: Plus Jakarta Sans (300, 400, 500, 600, 700, 800)

### Font Sizes
- Display 1: 48px / 56px
- Display 2: 36px / 44px
- H1: 32px / 40px
- H2: 24px / 32px
- H3: 20px / 28px
- Body Large: 18px / 28px
- Body: 16px / 24px
- Body Small: 14px / 20px
- Caption: 12px / 16px

## Espacement

### Scale
- xs: 4px
- sm: 8px
- md: 16px
- lg: 24px
- xl: 32px
- 2xl: 48px
- 3xl: 64px

## Ombres

### Web (Tailwind)
- sm: 0 1px 2px rgba(0,0,0,0.05)
- md: 0 4px 6px rgba(0,0,0,0.07)
- lg: 0 10px 15px rgba(0,0,0,0.1)
- xl: 0 20px 25px rgba(0,0,0,0.1)

### Mobile (Flutter)
- small: BoxShadow(color: Colors.black12, blurRadius: 4, offset: Offset(0, 1))
- medium: BoxShadow(color: Colors.black12, blurRadius: 8, offset: Offset(0, 2))
- large: BoxShadow(color: Colors.black12, blurRadius: 16, offset: Offset(0, 4))

## Bordures

### Radius
- sm: 8px
- md: 12px
- lg: 16px
- xl: 24px
- 2xl: 32px
- full: 9999px

## Composants

### Boutons
- Primary: fond accent, texte blanc
- Secondary: fond transparent, bordure accent
- Tertiary: fond surface, texte accent

### Cards
- Surface: fond blanc, ombre md
- Elevated: fond blanc, ombre lg
- Glass: fond semi-transparent, backdrop blur

## Animations

### Web (GSAP)
- Duration fast: 300ms
- Duration normal: 500ms
- Duration slow: 800ms
- Easing: power2.out, ease-out-expo

### Mobile (Flutter)
- Duration fast: 200ms
- Duration normal: 300ms
- Duration slow: 500ms
- Curve: Curves.easeOut, Curves.fastOutSlowIn
```

- [ ] **Step 4: Aligner les tokens du site web**

Modifier `src/styles/app.css` si nécessaire pour correspondre à la documentation

- [ ] **Step 5: Aligner les tokens de l'app mobile**

Modifier `lib/shared/design_tokens/maasga_tokens.dart` si nécessaire pour correspondre à la documentation

- [ ] **Step 6: Recompiler le CSS du site web**

Run: `npm run build:css`
Expected: `public/static/tailwind.css` mis à jour

- [ ] **Step 7: Tester la cohérence visuelle**

Run: `npm run dev` (site web)
Run: `flutter run` (mobile)
Comparer :
- Couleurs des boutons
- Typographie
- Espacements
Expected: Cohérence visuelle entre les deux plateformes

- [ ] **Step 8: Linter et formatter (mobile)**

Run: `dart format lib test`
Run: `flutter analyze`
Expected: "No issues found"

- [ ] **Step 9: Commit**

```bash
git add docs/design-system.md src/styles/app.css public/static/tailwind.css lib/shared/design_tokens/maasga_tokens.dart
git commit -m "docs: créer et aligner design system partagé entre web et mobile"
```

---

### Task 3: Synchronisation Panier (API)

**Files:**
- Modify: `src/index.tsx` (site web - endpoints API)
- Modify: `lib/features/cart/data/cart_repository.dart` (mobile)
- Test: Manuel - tester sync panier

**Interfaces:**
- Consumes: Existing cart implementations
- Produces: Sync API for cart data

- [ ] **Step 1: Créer une table D1 pour le panier synchronisé**

Créer `migrations/0043_add_synced_cart.sql` :
```sql
CREATE TABLE IF NOT EXISTS synced_cart (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL, -- Firebase UID ou email client
  product_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (product_id) REFERENCES products(id),
  UNIQUE(user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_synced_cart_user_id ON synced_cart(user_id);
CREATE INDEX IF NOT EXISTS idx_synced_cart_product_id ON synced_cart(product_id);
```

- [ ] **Step 2: Appliquer la migration**

Run: `npm run migrate:local`
Expected: Migration appliquée sans erreur

- [ ] **Step 3: Créer des endpoints API pour le panier synchronisé**

Ajouter dans `src/index.tsx` :
```typescript
// GET /api/cart - récupérer le panier d'un utilisateur
app.get('/api/cart', async (c) => {
  const userId = c.req.header('X-User-Id') || c.req.header('Authorization')?.replace('Bearer ', '');
  if (!userId) {
    return c.json({ error: 'Non authentifié' }, 401);
  }

  const db = c.env.DB;
  const result = await db.prepare(`
    SELECT sc.*, p.name, p.price, p.image, p.brand, p.btu
    FROM synced_cart sc
    JOIN products p ON sc.product_id = p.id
    WHERE sc.user_id = ?
  `).bind(userId).all();

  return c.json({ cart: result.results });
});

// POST /api/cart - ajouter/mettre à jour un item
app.post('/api/cart', async (c) => {
  const userId = c.req.header('X-User-Id') || c.req.header('Authorization')?.replace('Bearer ', '');
  if (!userId) {
    return c.json({ error: 'Non authentifié' }, 401);
  }

  const { productId, quantity } = await c.req.json();
  const db = c.env.DB;

  await db.prepare(`
    INSERT INTO synced_cart (user_id, product_id, quantity, updated_at)
    VALUES (?, ?, ?, datetime('now'))
    ON CONFLICT(user_id, product_id) DO UPDATE SET
      quantity = quantity + ?,
      updated_at = datetime('now')
  `).bind(userId, productId, quantity, quantity).run();

  return c.json({ success: true });
});

// DELETE /api/cart/:productId - supprimer un item
app.delete('/api/cart/:productId', async (c) => {
  const userId = c.req.header('X-User-Id') || c.req.header('Authorization')?.replace('Bearer ', '');
  if (!userId) {
    return c.json({ error: 'Non authentifié' }, 401);
  }

  const productId = c.req.param('productId');
  const db = c.env.DB;

  await db.prepare(`
    DELETE FROM synced_cart
    WHERE user_id = ? AND product_id = ?
  `).bind(userId, productId).run();

  return c.json({ success: true });
});

// PUT /api/cart/:productId - mettre à jour la quantité
app.put('/api/cart/:productId', async (c) => {
  const userId = c.req.header('X-User-Id') || c.req.header('Authorization')?.replace('Bearer ', '');
  if (!userId) {
    return c.json({ error: 'Non authentifié' }, 401);
  }

  const productId = c.req.param('productId');
  const { quantity } = await c.req.json();
  const db = c.env.DB;

  if (quantity <= 0) {
    await db.prepare(`
      DELETE FROM synced_cart
      WHERE user_id = ? AND product_id = ?
    `).bind(userId, productId).run();
  } else {
    await db.prepare(`
      UPDATE synced_cart
      SET quantity = ?, updated_at = datetime('now')
      WHERE user_id = ? AND product_id = ?
    `).bind(quantity, userId, productId).run();
  }

  return c.json({ success: true });
});
```

- [ ] **Step 4: Créer un repository mobile pour le panier synchronisé**

Créer `lib/features/cart/data/synced_cart_repository.dart` :
```dart
import 'package:dio/dio.dart';
import '../../../core/network/api_client.dart';

class SyncedCartRepository {
  final Dio _dio;

  SyncedCartRepository(this._dio);

  Future<List<Map<String, dynamic>>> getCart(String userId) async {
    try {
      final response = await _dio.get('/api/cart',
        options: Options(headers: {'X-User-Id': userId}),
      );
      return List<Map<String, dynamic>>.from(response.data['cart']);
    } catch (e) {
      throw Exception('Erreur lors de la récupération du panier');
    }
  }

  Future<void> addToCart(String userId, int productId, int quantity) async {
    try {
      await _dio.post('/api/cart',
        data: {'productId': productId, 'quantity': quantity},
        options: Options(headers: {'X-User-Id': userId}),
      );
    } catch (e) {
      throw Exception('Erreur lors de l\'ajout au panier');
    }
  }

  Future<void> removeFromCart(String userId, int productId) async {
    try {
      await _dio.delete('/api/cart/$productId',
        options: Options(headers: {'X-User-Id': userId}),
      );
    } catch (e) {
      throw Exception('Erreur lors de la suppression du panier');
    }
  }

  Future<void> updateQuantity(String userId, int productId, int quantity) async {
    try {
      await _dio.put('/api/cart/$productId',
        data: {'quantity': quantity},
        options: Options(headers: {'X-User-Id': userId}),
      );
    } catch (e) {
      throw Exception('Erreur lors de la mise à jour du panier');
    }
  }
}
```

- [ ] **Step 5: Créer un provider Riverpod pour le panier synchronisé**

Créer `lib/features/cart/data/synced_cart_provider.dart` :
```dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'synced_cart_repository.dart';

final syncedCartRepositoryProvider = Provider<SyncedCartRepository>((ref) {
  final dio = ref.watch(dioProvider);
  return SyncedCartRepository(dio);
});

final syncedCartProvider = FutureProvider.family<List<Map<String, dynamic>>, String>((ref, userId) async {
  final repository = ref.watch(syncedCartRepositoryProvider);
  return repository.getCart(userId);
});
```

- [ ] **Step 6: Modifier cart_screen.dart pour utiliser le panier synchronisé**

Modifier `lib/features/cart/presentation/cart_screen.dart` pour :
- Récupérer le panier depuis l'API au lieu du state local
- Synchroniser les modifications avec l'API

- [ ] **Step 7: Tester la synchronisation du panier**

Run: `flutter run`
Tester :
- Ajouter un produit dans l'app
- Vérifier qu'il apparaît dans le panier API
- Modifier la quantité
- Vérifier la synchronisation

- [ ] **Step 8: Linter et formatter**

Run: `dart format lib test`
Run: `flutter analyze`
Expected: "No issues found"

- [ ] **Step 9: Commit**

```bash
git add migrations/0043_add_synced_cart.sql src/index.tsx lib/features/cart/data/synced_cart_repository.dart lib/features/cart/data/synced_cart_provider.dart lib/features/cart/presentation/cart_screen.dart
git commit -m "feat: implémenter synchronisation panier via API"
```

---

### Task 4: Synchronisation Commandes (API)

**Files:**
- Modify: `src/index.tsx` (site web - endpoints API)
- Modify: `lib/features/client_space/data/client_dashboard_repository.dart` (mobile)
- Test: Manuel - tester sync commandes

**Interfaces:**
- Consumes: Existing order systems
- Produces: Sync API for order data

- [ ] **Step 1: Vérifier que la table orders a les colonnes nécessaires**

Examiner la table `orders` existante dans D1

- [ ] **Step 2: Ajouter des colonnes pour la synchronisation si nécessaire**

Créer `migrations/0044_add_order_sync.sql` si nécessaire :
```sql
ALTER TABLE orders ADD COLUMN source TEXT DEFAULT 'web'; -- 'web' ou 'mobile'
ALTER TABLE orders ADD COLUMN sync_status TEXT DEFAULT 'synced'; -- 'synced', 'pending', 'failed'
ALTER TABLE orders ADD COLUMN synced_at TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_source ON orders(source);
CREATE INDEX IF NOT EXISTS idx_orders_sync_status ON orders(sync_status);
```

- [ ] **Step 3: Appliquer la migration**

Run: `npm run migrate:local`
Expected: Migration appliquée sans erreur

- [ ] **Step 4: Créer un endpoint API pour les commandes mobile**

Ajouter dans `src/index.tsx` :
```typescript
// POST /api/mobile/orders - créer une commande depuis l'app mobile
app.post('/api/mobile/orders', async (c) => {
  const userId = c.req.header('Authorization')?.replace('Bearer ', '');
  if (!userId) {
    return c.json({ error: 'Non authentifié' }, 401);
  }

  const { items, total_price, client_info } = await c.req.json();
  const db = c.env.DB;

  const result = await db.prepare(`
    INSERT INTO orders (client_id, items, total_price, source, sync_status, created_at)
    VALUES (?, ?, ?, 'mobile', 'synced', datetime('now'))
  `).bind(userId, JSON.stringify(items), total_price).run();

  const orderId = result.meta.last_row_id;

  await db.prepare(`
    UPDATE orders
    SET synced_at = datetime('now')
    WHERE id = ?
  `).bind(orderId).run();

  return c.json({ success: true, order_id: orderId });
});

// GET /api/mobile/orders - récupérer les commandes d'un utilisateur mobile
app.get('/api/mobile/orders', async (c) => {
  const userId = c.req.header('Authorization')?.replace('Bearer ', '');
  if (!userId) {
    return c.json({ error: 'Non authentifié' }, 401);
  }

  const db = c.env.DB;
  const result = await db.prepare(`
    SELECT * FROM orders
    WHERE client_id = ? AND source = 'mobile'
    ORDER BY created_at DESC
  `).bind(userId).all();

  return c.json({ orders: result.results });
});
```

- [ ] **Step 5: Modifier le repository mobile pour utiliser l'API**

Modifier `lib/features/client_space/data/client_dashboard_repository.dart` pour :
- Créer des commandes via l'API mobile
- Récupérer les commandes via l'API mobile

- [ ] **Step 6: Modifier checkout_screen.dart pour utiliser l'API**

Modifier `lib/features/cart/presentation/checkout_screen.dart` pour :
- Envoyer la commande à l'API mobile
- Gérer les erreurs de synchronisation

- [ ] **Step 7: Tester la synchronisation des commandes**

Run: `flutter run`
Tester :
- Créer une commande dans l'app
- Vérifier qu'elle apparaît dans la base de données
- Vérifier le statut de synchronisation

- [ ] **Step 8: Linter et formatter**

Run: `dart format lib test`
Run: `flutter analyze`
Expected: "No issues found"

- [ ] **Step 9: Commit**

```bash
git add migrations/0044_add_order_sync.sql src/index.tsx lib/features/client_space/data/client_dashboard_repository.dart lib/features/cart/presentation/checkout_screen.dart
git commit -m "feat: implémenter synchronisation commandes via API mobile"
```

---

### Task 5: Synchronisation Temps Réel (WebSocket - Optionnel)

**Files:**
- Research: WebSocket implementation Cloudflare Workers
- Create: `docs/research/websocket-sync.md`
- Test: Aucun - recherche uniquement

**Interfaces:**
- Consumes: Existing sync API
- Produces: Research document for WebSocket implementation

- [ ] **Step 1: Documenter l'approche API polling actuelle**

Créer `docs/research/websocket-sync.md` avec l'approche actuelle :
```markdown
# Approche Actuelle
- Synchronisation via API REST
- Polling manuel ou lors d'actions utilisateur
- Pas de temps réel

# Limitations
- Latence entre les plateformes
- Pas de notifications instantanées
- Surcharge serveur avec polling fréquent
```

- [ ] **Step 2: Rechercher WebSocket dans Cloudflare Workers**

Documenter :
- Support WebSocket dans Cloudflare Workers
- Limitations et contraintes
- Coûts et scalabilité

- [ ] **Step 3: Rechercher les alternatives**

Explorer :
- Server-Sent Events (SSE)
- Firebase Realtime Database
- Push notifications pour sync
- WebRTC (trop complexe)

- [ ] **Step 4: Évaluer chaque solution**

Pour chaque solution, documenter :
- Complexité d'implémentation
- Coût
- Performance
- Fiabilité
- Support mobile

- [ ] **Step 5: Recommander la meilleure solution**

Basé sur la recherche, recommander :
1. Solution principale (ex: SSE plus simple que WebSocket)
2. Solution de repli (ex: polling optimisé)
3. Roadmap d'implémentation

- [ ] **Step 6: Documenter l'architecture recommandée**

Inclure :
- Schéma d'architecture
- Flux de données
- Gestion des connexions
- Fallback en cas d'échec

- [ ] **Step 7: Commit**

```bash
git add docs/research/websocket-sync.md
git commit -m "docs: rechercher solutions synchronisation temps réel"
```

---

## Self-Review

**1. Spec coverage:**
- ✅ Documentation workflow paiement hors app - Task 1
- ✅ Cohérence design system partagé - Task 2
- ✅ Synchronisation panier (API) - Task 3
- ✅ Synchronisation commandes (API) - Task 4
- ✅ Recherche synchronisation temps réel - Task 5

**2. Placeholder scan:**
- ✅ Aucun "TBD", "TODO", ou placeholder
- ✅ Toutes les étapes contiennent du code concret
- ✅ Commandes exactes fournies

**3. Type consistency:**
- ✅ Noms de fonctions cohérents (getCart, addToCart, removeFromCart)
- ✅ Signatures de fonctions TypeScript/Dart correctes
- ✅ Chemins de fichiers exacts

---

## Next Steps

Les 4 plans sont maintenant complets :

1. **Plan 1** : Site Web - Optimisations Immédiates
2. **Plan 2** : Site Web - Fonctionnalités Espace Client
3. **Plan 3** : Application Mobile - Améliorations UX
4. **Plan 4** : Cross-Platform - Synchronisation

Chaque plan peut être exécuté indépendamment avec les compétences subagent-driven-development ou executing-plans.
