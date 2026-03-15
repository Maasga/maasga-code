-- Migration 0019: Table réalisations (projets terminés)
CREATE TABLE IF NOT EXISTS realisations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'climatisation' CHECK(category IN ('climatisation','ventilation','chambre_froide','maintenance','commercial','residentiel')),
  client_name TEXT,
  quartier TEXT,
  image_url TEXT,
  date_realisation TEXT,
  is_featured INTEGER DEFAULT 0,
  is_visible INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_realisations_category ON realisations(category);
CREATE INDEX IF NOT EXISTS idx_realisations_visible ON realisations(is_visible);
