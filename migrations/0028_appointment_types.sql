-- Migration 0028: Expand appointment type CHECK constraint
-- Adds 'entretien' and 'depannage' to the allowed appointment types
-- SQLite requires table rebuild to modify CHECK constraints

PRAGMA foreign_keys = OFF;

-- Create new appointments table with expanded type CHECK
CREATE TABLE appointments_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  quartier TEXT NOT NULL,
  date TEXT NOT NULL,
  heure_debut TEXT DEFAULT '08:00',
  heure_fin TEXT DEFAULT '18:00',
  type TEXT NOT NULL DEFAULT 'devis' CHECK (type IN ('devis', 'installation', 'entretien', 'depannage')),
  notes TEXT,
  latitude REAL,
  longitude REAL,
  adresse_precise TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'done')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Copy all existing data
INSERT INTO appointments_new SELECT * FROM appointments;

-- Drop old table
DROP TABLE appointments;

-- Rename new table
ALTER TABLE appointments_new RENAME TO appointments;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);
CREATE INDEX IF NOT EXISTS idx_appointments_phone ON appointments(phone);
CREATE INDEX IF NOT EXISTS idx_appointments_quartier ON appointments(quartier);

PRAGMA foreign_keys = ON;
