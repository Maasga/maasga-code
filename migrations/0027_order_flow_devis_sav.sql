-- Migration 0027: Order flow enhancements, devis system, SAV gratuit
-- Adds new order statuses, delivery/installation tracking, devis table, SAV gratuit contract type

-- ============================================================
-- 1. Add tracking columns to orders
-- ============================================================
ALTER TABLE orders ADD COLUMN delivered_at TEXT DEFAULT NULL;
ALTER TABLE orders ADD COLUMN installed_at TEXT DEFAULT NULL;
ALTER TABLE orders ADD COLUMN delivery_confirmed_by TEXT DEFAULT NULL;
ALTER TABLE orders ADD COLUMN installation_confirmed_by TEXT DEFAULT NULL;

-- D1 does not support ALTER CHECK constraints, so we drop and recreate
-- But since D1 is SQLite and ALTER TABLE has limits, we just ensure the new
-- statuses work by inserting them as valid — SQLite CHECK is evaluated on insert

-- ============================================================
-- 2. Order devis table (devis linked to an order for unexpected costs)
-- ============================================================
CREATE TABLE IF NOT EXISTS order_devis (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  client_id INTEGER,
  client_name TEXT NOT NULL DEFAULT '',
  client_phone TEXT NOT NULL DEFAULT '',
  client_email TEXT DEFAULT '',
  title TEXT NOT NULL DEFAULT 'Devis installation',
  description TEXT DEFAULT '',
  items TEXT DEFAULT '[]',
  total_amount INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','sent','validated','refused','expired')),
  admin_notes TEXT DEFAULT '',
  client_response_notes TEXT DEFAULT '',
  pdf_generated INTEGER NOT NULL DEFAULT 0,
  sent_email INTEGER NOT NULL DEFAULT 0,
  sent_whatsapp INTEGER NOT NULL DEFAULT 0,
  validated_at TEXT DEFAULT NULL,
  refused_at TEXT DEFAULT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_order_devis_order ON order_devis(order_id);
CREATE INDEX IF NOT EXISTS idx_order_devis_status ON order_devis(status);
CREATE INDEX IF NOT EXISTS idx_order_devis_client ON order_devis(client_phone);

-- ============================================================
-- 3. Recreate maintenance_contracts with sav_gratuit plan_type
-- Since SQLite can't ALTER CHECK, we use a new column approach
-- Actually, we just need to ensure future inserts accept 'sav_gratuit'
-- The cleanest approach: drop the CHECK and recreate
-- But D1 doesn't support DROP CONSTRAINT either.
-- Solution: Create a new table, migrate data, drop old, rename.
-- ============================================================

-- Step A: Create new table with updated CHECK
CREATE TABLE IF NOT EXISTS maintenance_contracts_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  order_id INTEGER DEFAULT NULL,
  plan_type TEXT NOT NULL CHECK(plan_type IN ('trimestriel','semestriel','annuel','sav_gratuit')),
  plan_price INTEGER NOT NULL DEFAULT 0,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','expired','cancelled')),
  total_visits INTEGER NOT NULL DEFAULT 0,
  completed_visits INTEGER NOT NULL DEFAULT 0,
  next_visit_date TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Step B: Copy existing data
INSERT INTO maintenance_contracts_new (id, client_id, client_name, client_phone, plan_type, plan_price, start_date, end_date, status, total_visits, completed_visits, next_visit_date, notes, created_at, updated_at)
  SELECT id, client_id, client_name, client_phone, plan_type, plan_price, start_date, end_date, status, total_visits, completed_visits, next_visit_date, notes, created_at, updated_at
  FROM maintenance_contracts;

-- Step C: Drop old table and rename
DROP TABLE IF EXISTS maintenance_contracts;
ALTER TABLE maintenance_contracts_new RENAME TO maintenance_contracts;

-- Re-create indexes
CREATE INDEX IF NOT EXISTS idx_mc_client_phone ON maintenance_contracts(client_phone);
CREATE INDEX IF NOT EXISTS idx_mc_status ON maintenance_contracts(status);
CREATE INDEX IF NOT EXISTS idx_mc_order ON maintenance_contracts(order_id);

-- ============================================================
-- 4. Recreate orders table with updated status CHECK
-- ============================================================
CREATE TABLE IF NOT EXISTS orders_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER,
  appointment_id INTEGER,
  product_id INTEGER,
  quantity INTEGER DEFAULT 1,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  client_email TEXT,
  quartier TEXT,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending','paid','en_livraison','livre','validation_terrain','devis_en_attente','devis_valide','devis_refuse','validated','installing','installed','cancelled','refunded')),
  type TEXT DEFAULT 'vente',
  notes TEXT,
  total_price REAL,
  installation_price REAL DEFAULT 0,
  delivered_at TEXT DEFAULT NULL,
  installed_at TEXT DEFAULT NULL,
  delivery_confirmed_by TEXT DEFAULT NULL,
  installation_confirmed_by TEXT DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(client_id) REFERENCES clients(id) ON DELETE SET NULL,
  FOREIGN KEY(appointment_id) REFERENCES appointments(id) ON DELETE SET NULL,
  FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE SET NULL
);

INSERT INTO orders_new (id, client_id, appointment_id, product_id, quantity, client_name, client_phone, client_email, quartier, status, type, notes, total_price, installation_price, created_at, updated_at)
  SELECT id, client_id, appointment_id, product_id, quantity, client_name, client_phone, client_email, quartier, status, type, notes, total_price, installation_price, created_at, updated_at
  FROM orders;

DROP TABLE IF EXISTS orders;
ALTER TABLE orders_new RENAME TO orders;

CREATE INDEX IF NOT EXISTS idx_orders_client_id ON orders(client_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_client_phone ON orders(client_phone);
