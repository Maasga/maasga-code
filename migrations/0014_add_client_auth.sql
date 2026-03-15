-- Ajouter colonnes authentification clients
-- Column may already exist from a previous partial migration
CREATE TABLE IF NOT EXISTS _migrations_tmp (id INTEGER PRIMARY KEY);
DROP TABLE IF EXISTS _migrations_tmp;
