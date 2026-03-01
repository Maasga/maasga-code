-- Migration: Create orders table for persistent shopping cart storage
-- D1 Database: maasga_db
-- Description: Stockage persistant des commandes avec références aux clients et produits

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER,
  appointment_id INTEGER,
  product_id INTEGER,
  quantity INTEGER DEFAULT 1,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  client_email TEXT,
  quartier TEXT,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'validation_terrain', 'validated', 'installed', 'cancelled')),
  notes TEXT,
  total_price REAL,
  installation_price REAL DEFAULT 50000,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(client_id) REFERENCES clients(id) ON DELETE SET NULL,
  FOREIGN KEY(appointment_id) REFERENCES appointments(id) ON DELETE SET NULL,
  FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- Index pour les recherches rapides
CREATE INDEX IF NOT EXISTS idx_orders_client_id ON orders(client_id);
CREATE INDEX IF NOT EXISTS idx_orders_appointment_id ON orders(appointment_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
