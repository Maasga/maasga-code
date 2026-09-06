-- Migration 0040 : Table des tokens FCM pour les notifications push mobile.
--
-- Chaque appareil enregistré correspond à une ligne.
-- Un token FCM peut changer (rotation) : l'UNIQUE sur token + le ON CONFLICT
-- dans le worker garantissent qu'un même token ne génère jamais de doublon.
-- Plusieurs appareils peuvent appartenir au même client (client_id).

CREATE TABLE IF NOT EXISTS push_tokens (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id   INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  token       TEXT    NOT NULL,
  platform    TEXT    NOT NULL DEFAULT 'android',
  app_version TEXT,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(token)
);

CREATE INDEX IF NOT EXISTS idx_push_tokens_client_id ON push_tokens(client_id);
