-- Créer table clients pour enregistrement automatique des demandes RDV
CREATE TABLE IF NOT EXISTS clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  email TEXT,
  quartier TEXT,
  adresse_precise TEXT,
  latitude REAL,
  longitude REAL,
  type_demande TEXT,
  notes TEXT,
  product_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone);
CREATE INDEX IF NOT EXISTS idx_clients_created ON clients(created_at);
