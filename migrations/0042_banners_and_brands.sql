-- Migration 0042 : Bannières du carrousel + marques de l'accueil mobile
--
-- banners -> alimente GET /api/mobile/banners (carrousel PromoBanner Flutter)
-- brands  -> alimente GET /api/mobile/brands  (barre BrandScroll Flutter)

CREATE TABLE IF NOT EXISTS banners (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  title         TEXT    NOT NULL,
  subtitle      TEXT,
  image_url     TEXT    NOT NULL,
  target_page   TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active     INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_banners_order ON banners(display_order, is_active);

INSERT INTO banners (title, subtitle, image_url, target_page, display_order, is_active) VALUES
  ('Soldes de fin d''ete',  '- Economisez jusqu''a 30%',
   'https://images.unsplash.com/photo-1542013976693-85499f1c7964?q=80&w=600&auto=format&fit=crop',
   '/catalog', 1, 1),
  ('Installation rapide',  'Pose en 24h a Ouagadougou',
   'https://images.unsplash.com/photo-1585771724684-38269d6639fd?q=80&w=600&auto=format&fit=crop',
   '/rdv', 2, 1);

-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS brands (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT    NOT NULL UNIQUE,
  logo_url      TEXT,
  asset_key     TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active     INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_brands_order ON brands(display_order, is_active);

INSERT INTO brands (name, asset_key, display_order, is_active) VALUES
  ('DAIKIN',     'daikin',     1, 1),
  ('MITSUBISHI', 'mitsubishi', 2, 1),
  ('PANASONIC',  'panasonic',  3, 1),
  ('TOSHIBA',    'toshiba',    4, 1),
  ('AERO',       'aero',       5, 1);