-- Migration 0016: Contrats de maintenance et demandes de maintenance
-- Exécutée automatiquement au démarrage via ensureMaintenanceTables()

-- Table des contrats de maintenance
CREATE TABLE IF NOT EXISTS maintenance_contracts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  plan_type TEXT NOT NULL CHECK(plan_type IN ('trimestriel', 'semestriel', 'annuel')),
  plan_price INTEGER NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'expired', 'cancelled')),
  total_visits INTEGER NOT NULL DEFAULT 0,
  completed_visits INTEGER NOT NULL DEFAULT 0,
  next_visit_date TEXT,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Table des interventions de maintenance (liées à un contrat ou occasionnelles)
CREATE TABLE IF NOT EXISTS maintenance_visits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contract_id INTEGER,
  client_id INTEGER NOT NULL,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  visit_type TEXT NOT NULL CHECK(visit_type IN ('preventive', 'occasionnelle', 'urgence')),
  visit_date TEXT NOT NULL,
  status TEXT DEFAULT 'planifiee' CHECK(status IN ('planifiee', 'confirmee', 'effectuee', 'annulee')),
  technician TEXT,
  description TEXT,
  actions_performed TEXT,
  gas_recharged INTEGER DEFAULT 0,
  filters_cleaned INTEGER DEFAULT 0,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (contract_id) REFERENCES maintenance_contracts(id)
);

-- Table des demandes de maintenance (formulaire public)
CREATE TABLE IF NOT EXISTS maintenance_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  quartier TEXT,
  request_type TEXT NOT NULL CHECK(request_type IN ('occasionnelle', 'urgence', 'contrat')),
  description TEXT,
  preferred_date TEXT,
  equipment_type TEXT,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'contacted', 'scheduled', 'done', 'cancelled')),
  admin_notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
