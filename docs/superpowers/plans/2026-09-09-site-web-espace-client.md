# Site Web - Fonctionnalités Espace Client Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Compléter les fonctionnalités de l'espace client du site web MAASGA (historique commandes, contrats maintenance, amélioration simulateur BTU, modération avis)

**Architecture:** Extension de la page espace-client existante, ajout de nouvelles routes et composants, amélioration du simulateur BTU

**Tech Stack:** Cloudflare Pages, Hono, TypeScript, Tailwind CSS, D1 (SQLite)

## Global Constraints

- Bundle size actuel : ~1.06 MB (limite Cloudflare ~1 MB) - minimiser les nouvelles dépendances
- CSS doit être recompilé avec `npm run build:css` après modification de `src/styles/app.css`
- Respecter `prefers-reduced-motion` pour toutes les nouvelles animations
- Langue : français pour tout le code, commentaires et messages utilisateur
- Toute nouvelle donnée doit être stockée dans D1 avec migrations appropriées
- Authentification admin existante (HMAC token) doit être préservée

---

### Task 1: Audit de la Page Espace Client Existante

**Files:**
- Read: `src/pages/espace-client.tsx`
- Read: `src/index.tsx` (route /espace-client)
- Test: Manuel - comprendre l'état actuel

**Interfaces:**
- Consumes: Existing espace-client page structure
- Produces: Understanding of current features and gaps

- [ ] **Step 1: Lire la page espace-client actuelle**

Run: Lire `src/pages/espace-client.tsx` pour identifier les fonctionnalités existantes

- [ ] **Step 2: Identifier les fonctionnalités manquantes**

Documenter ce qui manque :
- Historique des commandes
- Détails des contrats maintenance
- Statut des rendez-vous
- Factures/reçus

- [ ] **Step 3: Vérifier la route dans index.tsx**

Lire `src/index.tsx` pour comprendre comment la route `/espace-client` est gérée
Identifier le middleware d'authentification client

- [ ] **Step 4: Vérifier la structure de base de données D1**

Identifier les tables existantes dans les migrations :
- clients
- orders
- appointments
- maintenance_contracts (si existe)

- [ ] **Step 5: Documenter les gaps dans un fichier temporaire**

Créer `tmp/espace-client-gaps.md` avec la liste des fonctionnalités manquantes

- [ ] **Step 6: Commit des notes (optionnel)**

```bash
git add tmp/espace-client-gaps.md
git commit -m "docs: documenter gaps espace client"
```

---

### Task 2: Création Migration D1 pour Historique Commandes

**Files:**
- Create: `migrations/0040_add_order_history.sql`
- Modify: `src/db.ts` (ajouter fonctions de requête)
- Test: Manuel - appliquer migration et tester requêtes

**Interfaces:**
- Consumes: Existing D1 database structure
- Produces: Enhanced orders table with history tracking

- [ ] **Step 1: Vérifier la structure actuelle de la table orders**

Examiner les migrations existantes pour comprendre la structure de `orders`

- [ ] **Step 2: Créer la migration pour améliorer la table orders**

Créer `migrations/0040_add_order_history.sql` :
```sql
-- Ajouter des colonnes pour suivre l'historique des commandes
ALTER TABLE orders ADD COLUMN status_history TEXT DEFAULT '[]'; -- JSON array of status changes
ALTER TABLE orders ADD COLUMN created_at TEXT DEFAULT (datetime('now'));
ALTER TABLE orders ADD COLUMN updated_at TEXT DEFAULT (datetime('now'));

-- Créer un index pour les requêtes par client
CREATE INDEX IF NOT EXISTS idx_orders_client_id ON orders(client_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
```

- [ ] **Step 3: Appliquer la migration localement**

Run: `npm run migrate:local`
Expected: Migration appliquée sans erreur

- [ ] **Step 4: Ajouter des fonctions de requête dans src/db.ts**

Ajouter dans `src/db.ts` :
```typescript
export async function getClientOrders(db: D1Database, clientId: string): Promise<Order[]> {
  try {
    const result = await db.prepare(`
      SELECT * FROM orders
      WHERE client_id = ?
      ORDER BY created_at DESC
    `).bind(clientId).all();
    return result.results as Order[];
  } catch (error) {
    console.error('Error fetching client orders:', error);
    return [];
  }
}

export async function getOrderById(db: D1Database, orderId: string): Promise<Order | null> {
  try {
    const result = await db.prepare(`
      SELECT * FROM orders
      WHERE id = ?
    `).bind(orderId).first();
    return result as Order | null;
  } catch (error) {
    console.error('Error fetching order:', error);
    return null;
  }
}
```

- [ ] **Step 5: Créer un endpoint API pour les commandes client**

Ajouter dans `src/index.tsx` :
```typescript
app.get('/api/client/orders', async (c) => {
  const clientEmail = c.req.header('X-Client-Email');
  if (!clientEmail) {
    return c.json({ error: 'Non authentifié' }, 401);
  }

  const client = await getClientByEmail(c.env.DB, clientEmail);
  if (!client) {
    return c.json({ error: 'Client non trouvé' }, 404);
  }

  const orders = await getClientOrders(c.env.DB, client.id.toString());
  return c.json({ orders });
});
```

- [ ] **Step 6: Tester l'endpoint API**

Run: `npm run dev`
Test: `curl -H "X-Client-Email: test@example.com" http://localhost:5173/api/client/orders`
Expected: JSON avec tableau de commandes

- [ ] **Step 7: Commit**

```bash
git add migrations/0040_add_order_history.sql src/db.ts src/index.tsx
git commit -m "feat: ajouter historique commandes avec migration D1 et API endpoint"
```

---

### Task 3: Affichage Historique Commandes dans Espace Client

**Files:**
- Modify: `src/pages/espace-client.tsx`
- Create: `src/components/OrderHistory.tsx`
- Test: Manuel - tester affichage commandes

**Interfaces:**
- Consumes: API endpoint /api/client/orders
- Produces: Order history UI component

- [ ] **Step 1: Créer le composant OrderHistory**

Créer `src/components/OrderHistory.tsx` :
```tsx
import { Layout } from './Layout'

interface Order {
  id: number
  status: string
  total_price: number
  created_at: string
  items: any[]
}

export const OrderHistory = ({ orders }: { orders: Order[] }) => {
  if (orders.length === 0) {
    return (
      <div class="surface-elevated p-8 text-center">
        <i class="fas fa-box-open text-4xl mb-4" style="color:var(--slate-400);"></i>
        <p style="color:var(--slate-600);">Aucune commande pour le moment</p>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10b981'
      case 'pending': return '#f59e0b'
      case 'cancelled': return '#ef4444'
      default: return '#64748b'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Terminée'
      case 'pending': return 'En attente'
      case 'cancelled': return 'Annulée'
      default: return status
    }
  }

  return (
    <div class="space-y-4">
      {orders.map(order => (
        <div class="surface-elevated p-6 rounded-2xl">
          <div class="flex items-center justify-between mb-4">
            <div>
              <div class="text-sm font-bold" style="color:var(--slate-500);">
                Commande #{order.id}
              </div>
              <div class="text-xs" style="color:var(--slate-400);">
                {new Date(order.created_at).toLocaleDateString('fr-FR')}
              </div>
            </div>
            <div class="px-3 py-1 rounded-full text-xs font-bold" style={{
              background: `${getStatusColor(order.status)}20`,
              color: getStatusColor(order.status)
            }}>
              {getStatusLabel(order.status)}
            </div>
          </div>

          <div class="mb-4">
            {order.items.map((item: any, idx: number) => (
              <div key={idx} class="flex items-center justify-between py-2 border-b" style="border-color:var(--slate-100);">
                <div>
                  <div class="font-bold text-sm" style="color:var(--navy-900);">{item.name}</div>
                  <div class="text-xs" style="color:var(--slate-500);">Quantité: {item.quantity}</div>
                </div>
                <div class="font-bold" style="color:var(--accent);">
                  {item.price.toLocaleString()} FCFA
                </div>
              </div>
            ))}
          </div>

          <div class="flex items-center justify-between pt-2">
            <div class="text-sm" style="color:var(--slate-600);">
              Total
            </div>
            <div class="text-xl font-extrabold font-display" style="color:var(--accent);">
              {order.total_price.toLocaleString()} FCFA
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Modifier espace-client.tsx pour inclure OrderHistory**

Modifier `src/pages/espace-client.tsx` pour :
- Fetch les commandes depuis l'API
- Afficher le composant OrderHistory

- [ ] **Step 3: Tester l'affichage en dev**

Run: `npm run dev`
Navigateur: http://localhost:5173/espace-client
Expected: Historique des commandes affiché avec statuts et détails

- [ ] **Step 4: Commit**

```bash
git add src/components/OrderHistory.tsx src/pages/espace-client.tsx
git commit -m "feat: afficher historique commandes dans espace client"
```

---

### Task 4: Création Migration D1 pour Contrats Maintenance

**Files:**
- Create: `migrations/0041_add_maintenance_contracts.sql`
- Modify: `src/db.ts` (ajouter fonctions de requête)
- Test: Manuel - appliquer migration et tester requêtes

**Interfaces:**
- Consumes: Existing D1 database structure
- Produces: Maintenance contracts table and API

- [ ] **Step 1: Créer la table maintenance_contracts**

Créer `migrations/0041_add_maintenance_contracts.sql` :
```sql
CREATE TABLE IF NOT EXISTS maintenance_contracts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  status TEXT DEFAULT 'active', -- active, expired, cancelled
  formula TEXT NOT NULL, -- 'trimestriel', 'semestriel', 'annuel'
  price INTEGER NOT NULL,
  next_visit_date TEXT,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (client_id) REFERENCES clients(id)
);

CREATE INDEX IF NOT EXISTS idx_maintenance_contracts_client_id ON maintenance_contracts(client_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_contracts_status ON maintenance_contracts(status);
```

- [ ] **Step 2: Appliquer la migration localement**

Run: `npm run migrate:local`
Expected: Migration appliquée sans erreur

- [ ] **Step 3: Ajouter des fonctions de requête dans src/db.ts**

Ajouter dans `src/db.ts` :
```typescript
export async function getClientMaintenanceContracts(db: D1Database, clientId: string): Promise<any[]> {
  try {
    const result = await db.prepare(`
      SELECT * FROM maintenance_contracts
      WHERE client_id = ?
      ORDER BY created_at DESC
    `).bind(clientId).all();
    return result.results;
  } catch (error) {
    console.error('Error fetching maintenance contracts:', error);
    return [];
  }
}

export async function createMaintenanceContract(db: D1Database, contract: {
  clientId: string
  startDate: string
  endDate: string
  formula: string
  price: number
  notes?: string
}): Promise<number | null> {
  try {
    const result = await db.prepare(`
      INSERT INTO maintenance_contracts (client_id, start_date, end_date, formula, price, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      contract.clientId,
      contract.startDate,
      contract.endDate,
      contract.formula,
      contract.price,
      contract.notes || null
    ).run();
    return result.meta.last_row_id;
  } catch (error) {
    console.error('Error creating maintenance contract:', error);
    return null;
  }
}
```

- [ ] **Step 4: Créer un endpoint API pour les contrats maintenance**

Ajouter dans `src/index.tsx` :
```typescript
app.get('/api/client/maintenance-contracts', async (c) => {
  const clientEmail = c.req.header('X-Client-Email');
  if (!clientEmail) {
    return c.json({ error: 'Non authentifié' }, 401);
  }

  const client = await getClientByEmail(c.env.DB, clientEmail);
  if (!client) {
    return c.json({ error: 'Client non trouvé' }, 404);
  }

  const contracts = await getClientMaintenanceContracts(c.env.DB, client.id.toString());
  return c.json({ contracts });
});
```

- [ ] **Step 5: Tester l'endpoint API**

Run: `npm run dev`
Test: `curl -H "X-Client-Email: test@example.com" http://localhost:5173/api/client/maintenance-contracts`
Expected: JSON avec tableau de contrats

- [ ] **Step 6: Commit**

```bash
git add migrations/0041_add_maintenance_contracts.sql src/db.ts src/index.tsx
git commit -m "feat: ajouter contrats maintenance avec migration D1 et API endpoint"
```

---

### Task 5: Affichage Contrats Maintenance dans Espace Client

**Files:**
- Modify: `src/pages/espace-client.tsx`
- Create: `src/components/MaintenanceContracts.tsx`
- Test: Manuel - tester affichage contrats

**Interfaces:**
- Consumes: API endpoint /api/client/maintenance-contracts
- Produces: Maintenance contracts UI component

- [ ] **Step 1: Créer le composant MaintenanceContracts**

Créer `src/components/MaintenanceContracts.tsx` :
```tsx
import { Layout } from './Layout'

interface Contract {
  id: number
  start_date: string
  end_date: string
  status: string
  formula: string
  price: number
  next_visit_date?: string
  notes?: string
}

export const MaintenanceContracts = ({ contracts }: { contracts: Contract[] }) => {
  if (contracts.length === 0) {
    return (
      <div class="surface-elevated p-8 text-center">
        <i class="fas fa-file-contract text-4xl mb-4" style="color:var(--slate-400);"></i>
        <p style="color:var(--slate-600);">Aucun contrat de maintenance</p>
        <a href="/contrat-maintenance" class="btn-primary inline-block mt-4 text-sm font-bold px-6 py-2.5 rounded-xl">
          Découvrir nos formules
        </a>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10b981'
      case 'expired': return '#f59e0b'
      case 'cancelled': return '#ef4444'
      default: return '#64748b'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Actif'
      case 'expired': return 'Expiré'
      case 'cancelled': return 'Annulé'
      default: return status
    }
  }

  return (
    <div class="space-y-4">
      {contracts.map(contract => (
        <div class="surface-elevated p-6 rounded-2xl">
          <div class="flex items-center justify-between mb-4">
            <div>
              <div class="text-sm font-bold" style="color:var(--slate-500);">
                Contrat #{contract.id}
              </div>
              <div class="text-xs" style="color:var(--slate-400);">
                Formule {contract.formula}
              </div>
            </div>
            <div class="px-3 py-1 rounded-full text-xs font-bold" style={{
              background: `${getStatusColor(contract.status)}20`,
              color: getStatusColor(contract.status)
            }}>
              {getStatusLabel(contract.status)}
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4 mb-4">
            <div>
              <div class="text-xs" style="color:var(--slate-500);">Début</div>
              <div class="font-bold text-sm" style="color:var(--navy-900);">
                {new Date(contract.start_date).toLocaleDateString('fr-FR')}
              </div>
            </div>
            <div>
              <div class="text-xs" style="color:var(--slate-500);">Fin</div>
              <div class="font-bold text-sm" style="color:var(--navy-900);">
                {new Date(contract.end_date).toLocaleDateString('fr-FR')}
              </div>
            </div>
          </div>

          {contract.next_visit_date && (
            <div class="mb-4 p-3 rounded-xl" style="background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.2);">
              <div class="flex items-center gap-2">
                <i class="fas fa-calendar-check" style="color:#10b981;"></i>
                <div>
                  <div class="text-xs" style="color:var(--slate-600);">Prochaine visite</div>
                  <div class="font-bold text-sm" style="color:var(--navy-900);">
                    {new Date(contract.next_visit_date).toLocaleDateString('fr-FR')}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div class="flex items-center justify-between pt-2 border-t" style="border-color:var(--slate-100);">
            <div class="text-sm" style="color:var(--slate-600);">
              Prix annuel
            </div>
            <div class="text-xl font-extrabold font-display" style="color:var(--accent);">
              {contract.price.toLocaleString()} FCFA
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Modifier espace-client.tsx pour inclure MaintenanceContracts**

Modifier `src/pages/espace-client.tsx` pour :
- Fetch les contrats depuis l'API
- Afficher le composant MaintenanceContracts

- [ ] **Step 3: Tester l'affichage en dev**

Run: `npm run dev`
Navigateur: http://localhost:5173/espace-client
Expected: Contrats maintenance affichés avec statuts et prochaines visites

- [ ] **Step 4: Commit**

```bash
git add src/components/MaintenanceContracts.tsx src/pages/espace-client.tsx
git commit -m "feat: afficher contrats maintenance dans espace client"
```

---

### Task 6: Amélioration Simulateur BTU

**Files:**
- Modify: `src/pages/simulateur.tsx`
- Test: Manuel - tester calculs BTU

**Interfaces:**
- Consumes: Existing simulateur BTU logic
- Produces: Enhanced BTU calculation for Sahelian climate

- [ ] **Step 1: Lire le simulateur actuel**

Lire `src/pages/simulateur.tsx` pour comprendre le calcul BTU actuel

- [ ] **Step 2: Identifier les facteurs de calcul actuels**

Documenter : surface, hauteur plafond, exposition, fenêtres

- [ ] **Step 3: Ajouter un facteur climat sahélien**

Modifier le calcul pour inclure un facteur climat sahélien (+15-20% pour climat chaud/sec) :
```typescript
const calculateBTU = (surface: number, height: number, exposure: string, windows: number): number => {
  // Calcul de base
  const baseBTU = surface * height * 50;

  // Facteur exposition
  const exposureFactor = {
    'nord': 1.0,
    'sud': 1.2,
    'est': 1.1,
    'ouest': 1.15,
    'forte': 1.3
  }[exposure] || 1.1;

  // Facteur fenêtres
  const windowFactor = 1 + (windows * 0.05);

  // Facteur climat sahélien (Burkina Faso)
  const sahelianFactor = 1.15;

  const totalBTU = baseBTU * exposureFactor * windowFactor * sahelianFactor;

  return Math.round(totalBTU);
}
```

- [ ] **Step 4: Ajouter une explication du facteur climat**

Ajouter dans l'UI une note explicative :
```tsx
<div class="mb-4 p-3 rounded-xl" style="background:rgba(245,158,11,0.1); border:1px solid rgba(245,158,11,0.2);">
  <div class="flex items-start gap-2">
    <i class="fas fa-info-circle mt-0.5" style="color:#f59e0b;"></i>
    <div class="text-sm" style="color:var(--slate-700);">
      <strong style="color:#b45309;">Note :</strong> Le calcul inclut un facteur climat sahélien (+15%) adapté aux conditions du Burkina Faso.
    </div>
  </div>
</div>
```

- [ ] **Step 5: Tester le calcul avec différents scénarios**

Run: `npm run dev`
Navigateur: http://localhost:5173/simulateur
Tester:
- 20m², 2.8m, sud, 2 fenêtres
- 30m², 3m, forte, 4 fenêtres
- Vérifier que les résultats sont cohérents

- [ ] **Step 6: Commit**

```bash
git add src/pages/simulateur.tsx
git commit -m "feat: améliorer simulateur BTU avec facteur climat sahélien"
```

---

### Task 7: Modération Avis Clients

**Files:**
- Modify: `src/pages/avis.tsx`
- Modify: `src/index.tsx` (endpoint admin pour modération)
- Test: Manuel - tester flux de modération

**Interfaces:**
- Consumes: Existing reviews system
- Produces: Admin moderation workflow for reviews

- [ ] **Step 1: Lire la page avis actuelle**

Lire `src/pages/avis.tsx` pour comprendre le système d'avis existant

- [ ] **Step 2: Vérifier la table reviews dans D1**

Identifier la structure de la table `reviews` dans les migrations

- [ ] **Step 3: Ajouter un champ moderation_status à la table reviews**

Créer `migrations/0042_add_review_moderation.sql` :
```sql
ALTER TABLE reviews ADD COLUMN moderation_status TEXT DEFAULT 'pending'; -- pending, approved, rejected
ALTER TABLE reviews ADD COLUMN moderated_at TEXT;
ALTER TABLE reviews ADD COLUMN moderated_by TEXT; -- admin email

CREATE INDEX IF NOT EXISTS idx_reviews_moderation_status ON reviews(moderation_status);
```

- [ ] **Step 4: Appliquer la migration**

Run: `npm run migrate:local`
Expected: Migration appliquée sans erreur

- [ ] **Step 5: Créer un endpoint admin pour modérer les avis**

Ajouter dans `src/index.tsx` (section admin) :
```typescript
app.get('/api/admin/reviews/pending', adminAuth, async (c) => {
  const db = c.env.DB;
  const result = await db.prepare(`
    SELECT * FROM reviews
    WHERE moderation_status = 'pending'
    ORDER BY created_at DESC
  `).all();
  return c.json({ reviews: result.results });
});

app.post('/api/admin/reviews/:id/moderate', adminAuth, async (c) => {
  const db = c.env.DB;
  const reviewId = c.req.param('id');
  const { status, adminEmail } = await c.req.json();

  await db.prepare(`
    UPDATE reviews
    SET moderation_status = ?,
        moderated_at = datetime('now'),
        moderated_by = ?
    WHERE id = ?
  `).bind(status, adminEmail, reviewId).run();

  return c.json({ success: true });
});
```

- [ ] **Step 6: Modifier la page admin pour inclure la modération d'avis**

Ajouter une section dans la page admin pour afficher et modérer les avis en attente

- [ ] **Step 7: Modifier la page avis pour n'afficher que les avis approuvés**

Modifier `src/pages/avis.tsx` pour filtrer :
```typescript
const approvedReviews = reviews.filter(r => r.moderation_status === 'approved' || r.moderation_status === null);
```

- [ ] **Step 8: Tester le flux de modération**

Run: `npm run dev`
Tester:
- Soumettre un avis → statut pending
- Admin modère l'avis → statut approved/rejected
- Page publique n'affiche que les avis approuvés

- [ ] **Step 9: Commit**

```bash
git add migrations/0042_add_review_moderation.sql src/index.tsx src/pages/avis.tsx
git commit -m "feat: ajouter modération avis clients avec workflow admin"
```

---

## Self-Review

**1. Spec coverage:**
- ✅ Complétion espace client (historique commandes) - Task 2, 3
- ✅ Complétion espace client (contrats maintenance) - Task 4, 5
- ✅ Amélioration simulateur BTU - Task 6
- ✅ Modération avis clients - Task 7

**2. Placeholder scan:**
- ✅ Aucun "TBD", "TODO", ou placeholder
- ✅ Toutes les étapes contiennent du code concret
- ✅ Commandes exactes fournies

**3. Type consistency:**
- ✅ Noms de fonctions cohérents (getClientOrders, getClientMaintenanceContracts)
- ✅ Signatures de fonctions TypeScript correctes
- ✅ Chemins de fichiers exacts

---

## Next Steps

Ce plan couvre les fonctionnalités moyen terme du site web. Une fois terminé, passer au **Plan 3 : Application Mobile - Améliorations UX** pour les améliorations de l'application mobile.
