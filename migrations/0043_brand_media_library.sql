-- Migration 0043 : Médiathèque centralisée par marque
-- Permet d'uploader des images une fois, taguées par marque,
-- puis de les affecter à n'importe quel produit (image principale ou galerie).
--
-- Appliquer via : wrangler d1 migrations apply <DB_NAME> --remote

CREATE TABLE IF NOT EXISTS brand_media_library (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  brand        TEXT    NOT NULL,
  url          TEXT    NOT NULL,
  delete_url   TEXT,
  label        TEXT,
  created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_brand_media_brand ON brand_media_library(brand);
