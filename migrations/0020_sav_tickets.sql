-- Migration 0020: SAV / Tickets support
-- Système de support après-vente (tickets)

CREATE TABLE IF NOT EXISTS sav_tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_ref TEXT NOT NULL UNIQUE,          -- ex: SAV-2024-0001
  client_phone TEXT NOT NULL,
  client_name TEXT DEFAULT '',
  client_email TEXT DEFAULT '',
  category TEXT NOT NULL CHECK(category IN ('panne', 'garantie', 'installation', 'maintenance', 'reclamation', 'autre')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK(priority IN ('basse', 'normal', 'haute', 'urgente')),
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ouvert' CHECK(status IN ('ouvert', 'en_cours', 'attente_client', 'resolu', 'ferme')),
  assigned_to TEXT DEFAULT '',
  order_id INTEGER DEFAULT NULL,
  product_info TEXT DEFAULT '',             -- Nom du produit concerné
  resolution_notes TEXT DEFAULT '',
  resolved_at TEXT DEFAULT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sav_ticket_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_id INTEGER NOT NULL REFERENCES sav_tickets(id),
  sender_type TEXT NOT NULL CHECK(sender_type IN ('client', 'admin')),
  sender_name TEXT DEFAULT '',
  message TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_tickets_client ON sav_tickets(client_phone);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON sav_tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_ref ON sav_tickets(ticket_ref);
CREATE INDEX IF NOT EXISTS idx_ticket_msgs ON sav_ticket_messages(ticket_id);
