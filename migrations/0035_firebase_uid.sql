-- Migration 0035 : ajout colonne firebase_uid sur la table clients
-- Permet de lier un compte Firebase Auth à un client D1

ALTER TABLE clients ADD COLUMN firebase_uid TEXT;

-- Index pour les lookups rapides par uid Firebase
CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_firebase_uid
  ON clients (firebase_uid)
  WHERE firebase_uid IS NOT NULL;
