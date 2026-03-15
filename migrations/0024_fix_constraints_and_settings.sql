-- Migration 0024: Fix schema inconsistencies found in audit
-- 1. Add 'paid' and 'en_livraison' to orders status constraint
-- 2. Fix maintenance_visits status to French values (code always uses FR strings)
-- 3. Fix wrong slogan in site_settings

PRAGMA foreign_keys = OFF;

-- ============================================================
-- 1. Rebuild orders table with expanded status CHECK
-- ============================================================
CREATE TABLE orders_v2 (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER,
  appointment_id INTEGER,
  product_id INTEGER,
  quantity INTEGER DEFAULT 1,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  client_email TEXT,
  quartier TEXT,
  type TEXT DEFAULT 'vente' CHECK(type IN ('devis', 'installation', 'vente', 'commande')),
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'paid', 'validation_terrain', 'validated', 'en_livraison', 'installed', 'cancelled')),
  notes TEXT,
  total_price REAL DEFAULT 0,
  installation_price REAL DEFAULT 50000,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(client_id) REFERENCES clients(id) ON DELETE SET NULL,
  FOREIGN KEY(appointment_id) REFERENCES appointments(id) ON DELETE SET NULL,
  FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE SET NULL
);

INSERT OR IGNORE INTO orders_v2 (
  id, client_id, appointment_id, product_id, quantity,
  client_name, client_phone, client_email, quartier,
  type, status, notes, total_price, installation_price,
  created_at, updated_at
)
SELECT
  id, client_id, appointment_id, product_id, COALESCE(quantity, 1),
  client_name, client_phone, client_email, quartier,
  CASE WHEN type IN ('devis','installation','vente','commande') THEN type ELSE 'vente' END,
  CASE WHEN status IN ('pending','paid','validation_terrain','validated','en_livraison','installed','cancelled') THEN status ELSE 'pending' END,
  notes, COALESCE(total_price, 0), COALESCE(installation_price, 50000),
  COALESCE(created_at, CURRENT_TIMESTAMP), COALESCE(updated_at, CURRENT_TIMESTAMP)
FROM orders;

DROP TABLE orders;
ALTER TABLE orders_v2 RENAME TO orders;

CREATE INDEX IF NOT EXISTS idx_orders_client_id ON orders(client_id);
CREATE INDEX IF NOT EXISTS idx_orders_appointment_id ON orders(appointment_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- ============================================================
-- 2. Rebuild maintenance_visits with French status values
-- ============================================================
CREATE TABLE maintenance_visits_v2 (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contract_id INTEGER,
  client_id INTEGER,
  client_name TEXT,
  client_phone TEXT,
  visit_type TEXT NOT NULL DEFAULT 'preventive' CHECK(visit_type IN ('preventive','occasionnelle','urgence')),
  visit_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'planifiee' CHECK(status IN ('planifiee','confirmee','effectuee','annulee')),
  technician TEXT,
  description TEXT,
  actions_performed TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO maintenance_visits_v2 (
  id, contract_id, client_id, client_name, client_phone,
  visit_type, visit_date, status, technician,
  description, actions_performed, notes, created_at, updated_at
)
SELECT
  id, contract_id, client_id, client_name, client_phone,
  CASE WHEN visit_type IN ('preventive','occasionnelle','urgence') THEN visit_type ELSE 'preventive' END,
  visit_date,
  CASE
    WHEN status IN ('planifiee','confirmee','effectuee','annulee') THEN status
    WHEN status = 'scheduled' THEN 'planifiee'
    WHEN status = 'done' THEN 'effectuee'
    WHEN status = 'cancelled' THEN 'annulee'
    ELSE 'planifiee'
  END,
  technician, description, actions_performed, notes,
  COALESCE(created_at, datetime('now')), COALESCE(updated_at, datetime('now'))
FROM maintenance_visits;

DROP TABLE maintenance_visits;
ALTER TABLE maintenance_visits_v2 RENAME TO maintenance_visits;

-- ============================================================
-- 3. Fix wrong slogan in site_settings
-- ============================================================
UPDATE site_settings
SET value = 'Spécialiste climatisation & froid à Ouagadougou'
WHERE key = 'slogan'
  AND value = 'Solutions énergétiques solaires professionnelles';

PRAGMA foreign_keys = ON;
