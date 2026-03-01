-- Ajouter colonnes authentification clients
ALTER TABLE clients ADD COLUMN password_hash TEXT;
