-- Migration 0013: Rebuild orders table with correct schema
-- The original orders table (0001) has constraints incompatible with the new order flow:
--   - appointment_id NOT NULL (new orders have no appointment)
--   - type CHECK IN ('devis','installation')  => client sends 'vente'
--   - status CHECK not including 'pending'    => endpoint sets 'pending'
--   - Missing columns: quantity, client_email, total_price, installation_price
-- Migration 0012 was a no-op (CREATE TABLE IF NOT EXISTS does nothing when table exists).

PRAGMA foreign_keys = OFF;

CREATE TABLE orders_new (
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
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'validation_terrain', 'validated', 'installed', 'cancelled')),
  notes TEXT,
  total_price REAL DEFAULT 0,
  installation_price REAL DEFAULT 50000,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(client_id) REFERENCES clients(id) ON DELETE SET NULL,
  FOREIGN KEY(appointment_id) REFERENCES appointments(id) ON DELETE SET NULL,
  FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- Migrate existing data (normalise type/status values that may violate new CHECK constraints)
INSERT INTO orders_new (
  id, client_id, appointment_id, product_id,
  client_name, client_phone, quartier,
  type, status, notes, created_at, updated_at
)
SELECT
  id, client_id, appointment_id, product_id,
  client_name, client_phone, COALESCE(quartier, ''),
  CASE WHEN type IN ('devis','installation','vente','commande') THEN type ELSE 'vente' END,
  CASE WHEN status IN ('pending','validation_terrain','validated','installed','cancelled') THEN status ELSE 'validated' END,
  notes,
  COALESCE(created_at, CURRENT_TIMESTAMP),
  COALESCE(updated_at, CURRENT_TIMESTAMP)
FROM orders;

DROP TABLE orders;

ALTER TABLE orders_new RENAME TO orders;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_orders_client_id ON orders(client_id);
CREATE INDEX IF NOT EXISTS idx_orders_appointment_id ON orders(appointment_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

PRAGMA foreign_keys = ON;
