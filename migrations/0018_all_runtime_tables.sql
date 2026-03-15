-- Migration: Create all runtime tables that were previously created via ensureXxxTables()
-- This includes: admin_settings, maintenance_contracts, maintenance_visits, maintenance_requests,
-- payments, user_activity_log, client_sessions

-- Admin settings (was CREATE TABLE IF NOT EXISTS in login handler)
CREATE TABLE IF NOT EXISTS admin_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TEXT
);

-- Maintenance contracts
CREATE TABLE IF NOT EXISTS maintenance_contracts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  plan_type TEXT NOT NULL CHECK(plan_type IN ('trimestriel','semestriel','annuel')),
  plan_price INTEGER NOT NULL,
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

-- Maintenance visits
CREATE TABLE IF NOT EXISTS maintenance_visits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contract_id INTEGER,
  client_id INTEGER,
  client_name TEXT,
  client_phone TEXT,
  visit_type TEXT NOT NULL DEFAULT 'preventive' CHECK(visit_type IN ('preventive','occasionnelle','urgence')),
  visit_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK(status IN ('scheduled','done','cancelled')),
  technician TEXT,
  description TEXT,
  actions_performed TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Maintenance requests
CREATE TABLE IF NOT EXISTS maintenance_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  quartier TEXT,
  request_type TEXT NOT NULL DEFAULT 'occasionnelle' CHECK(request_type IN ('occasionnelle','urgence','contrat')),
  description TEXT,
  preferred_date TEXT,
  equipment_type TEXT,
  plan_type TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','contacted','scheduled','done','cancelled')),
  admin_notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER,
  client_name TEXT,
  client_phone TEXT,
  order_id INTEGER,
  maintenance_request_id INTEGER,
  payment_type TEXT NOT NULL DEFAULT 'order' CHECK(payment_type IN ('order','maintenance_contract','maintenance_request')),
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'XOF',
  method TEXT CHECK(method IN ('ligdicash','carte','orange_money','moov_money','wave','cash')),
  provider_ref TEXT,
  provider_status TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','processing','completed','failed','cancelled','refunded')),
  metadata TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- User activity log (immutable)
CREATE TABLE IF NOT EXISTS user_activity_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL,
  client_phone TEXT,
  action TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general' CHECK(category IN ('auth','order','rdv','maintenance','payment','profile','general')),
  details TEXT,
  ip_address TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Client sessions (persistent)
CREATE TABLE IF NOT EXISTS client_sessions (
  token TEXT PRIMARY KEY,
  client_id INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_client ON client_sessions(client_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON client_sessions(expires_at);
