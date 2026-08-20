-- Migration 0036: Simplification des statuts orders + suppression système paiement
-- Nouveau flux : commande confirmée → MAASGA contacte le client par email/WhatsApp
--
-- Nouveaux statuts orders :
--   en_attente   → commande reçue, en attente de traitement admin
--   contacte     → MAASGA a contacté le client
--   confirme     → transaction confirmée avec le client
--   en_livraison → produit en cours de livraison
--   livre        → livré et installé
--   annule       → annulée (par client ou admin)

-- ============================================================
-- 1. Recréer la table orders avec les nouveaux statuts simplifiés
-- ============================================================

CREATE TABLE IF NOT EXISTS orders_v2 (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER,
  appointment_id INTEGER,
  product_id INTEGER,
  quantity INTEGER DEFAULT 1,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  client_email TEXT,
  quartier TEXT,
  status TEXT NOT NULL DEFAULT 'en_attente'
    CHECK(status IN ('en_attente','contacte','confirme','en_livraison','livre','annule')),
  type TEXT NOT NULL DEFAULT 'commande',
  notes TEXT,
  total_price REAL DEFAULT 0,
  installation_price REAL DEFAULT 0,
  admin_notes TEXT,
  delivered_at TEXT DEFAULT NULL,
  installed_at TEXT DEFAULT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(client_id) REFERENCES clients(id) ON DELETE SET NULL,
  FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- Migrer les données existantes en mappant les anciens statuts vers les nouveaux
INSERT INTO orders_v2 (
  id, client_id, appointment_id, product_id, quantity,
  client_name, client_phone, client_email, quartier,
  status, type, notes, total_price, installation_price,
  delivered_at, installed_at, created_at, updated_at
)
SELECT
  id, client_id, appointment_id, product_id, COALESCE(quantity, 1),
  client_name, client_phone, client_email, quartier,
  CASE
    WHEN status IN ('pending', 'devis_en_attente', 'validation_terrain') THEN 'en_attente'
    WHEN status IN ('paid', 'validated', 'devis_valide') THEN 'confirme'
    WHEN status = 'en_livraison' THEN 'en_livraison'
    WHEN status IN ('livre', 'installed', 'installing', 'devis_refuse', 'refunded') THEN 'livre'
    WHEN status = 'cancelled' THEN 'annule'
    ELSE 'en_attente'
  END,
  COALESCE(type, 'commande'),
  notes,
  COALESCE(total_price, 0),
  COALESCE(installation_price, 0),
  delivered_at,
  installed_at,
  COALESCE(created_at, datetime('now')),
  COALESCE(updated_at, datetime('now'))
FROM orders;

DROP TABLE IF EXISTS orders;
ALTER TABLE orders_v2 RENAME TO orders;

-- Recréer les index
CREATE INDEX IF NOT EXISTS idx_orders_client_id ON orders(client_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_client_phone ON orders(client_phone);

-- ============================================================
-- 2. Supprimer la table payments (remplacée par le flux contact)
-- ============================================================
DROP TABLE IF EXISTS payments;

-- ============================================================
-- 3. Simplifier maintenance_contracts : statuts simplifiés
-- ============================================================

CREATE TABLE IF NOT EXISTS maintenance_contracts_v2 (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  client_email TEXT,
  order_id INTEGER DEFAULT NULL,
  plan_type TEXT NOT NULL CHECK(plan_type IN ('trimestriel','semestriel','annuel','sav_gratuit')),
  plan_price INTEGER NOT NULL DEFAULT 0,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'en_attente'
    CHECK(status IN ('en_attente','contacte','actif','expire','annule')),
  total_visits INTEGER NOT NULL DEFAULT 0,
  completed_visits INTEGER NOT NULL DEFAULT 0,
  next_visit_date TEXT,
  notes TEXT,
  admin_notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO maintenance_contracts_v2 (
  id, client_id, client_name, client_phone, order_id,
  plan_type, plan_price, start_date, end_date,
  status, total_visits, completed_visits, next_visit_date,
  notes, created_at, updated_at
)
SELECT
  id, client_id, client_name, client_phone, order_id,
  plan_type, COALESCE(plan_price, 0), start_date, end_date,
  CASE
    WHEN status = 'active'    THEN 'actif'
    WHEN status = 'expired'   THEN 'expire'
    WHEN status = 'cancelled' THEN 'annule'
    WHEN status = 'pending'   THEN 'en_attente'
    ELSE 'en_attente'
  END,
  COALESCE(total_visits, 0),
  COALESCE(completed_visits, 0),
  next_visit_date,
  notes,
  COALESCE(created_at, datetime('now')),
  COALESCE(updated_at, datetime('now'))
FROM maintenance_contracts;

DROP TABLE IF EXISTS maintenance_contracts;
ALTER TABLE maintenance_contracts_v2 RENAME TO maintenance_contracts;

CREATE INDEX IF NOT EXISTS idx_mc_client_phone ON maintenance_contracts(client_phone);
CREATE INDEX IF NOT EXISTS idx_mc_status ON maintenance_contracts(status);
