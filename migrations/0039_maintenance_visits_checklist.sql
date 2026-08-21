-- Migration 0039: rétablir les colonnes de checklist d'intervention
--
-- Contexte : la migration 0024 a reconstruit maintenance_visits pour passer les
-- statuts en français, mais la nouvelle table a perdu deux colonnes que le code
-- écrit toujours :
--   * gas_recharged    (case « Gaz rechargé »   du formulaire admin)
--   * filters_cleaned  (case « Filtres nettoyés » du formulaire admin)
-- POST /admin/maintenance/validate-visit fait un UPDATE sur ces colonnes dans un
-- try/catch : l'erreur « no such column » était avalée, l'admin était redirigé
-- avec un air de succès et la visite n'était jamais marquée effectuée.
--
-- On reconstruit la table plutôt que d'utiliser ALTER TABLE ADD COLUMN : la base
-- de production porte des migrations 0029→0033 absentes du dépôt, donc on ne sait
-- pas si ces colonnes ont été rajoutées à la main entre-temps. Le SELECT de copie
-- ne référence que les colonnes garanties par 0024, donc la migration passe dans
-- les deux cas ; gas_recharged / filters_cleaned repartent à 0 (valeur par défaut).

PRAGMA foreign_keys = OFF;

CREATE TABLE maintenance_visits_v3 (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contract_id INTEGER,
  client_id INTEGER,
  client_name TEXT,
  client_phone TEXT,
  visit_type TEXT NOT NULL DEFAULT 'preventive' CHECK(visit_type IN ('preventive','occasionnelle','urgence')),
  visit_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'planifiee' CHECK(status IN ('planifiee','confirmee','effectuee','annulee')),
  technician TEXT,
  description TEXT,
  actions_performed TEXT,
  gas_recharged INTEGER NOT NULL DEFAULT 0,
  filters_cleaned INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO maintenance_visits_v3 (
  id, contract_id, client_id, client_name, client_phone,
  visit_type, visit_date, status, technician,
  description, actions_performed, notes, created_at, updated_at
)
SELECT
  id, contract_id, client_id, client_name, client_phone,
  CASE WHEN visit_type IN ('preventive','occasionnelle','urgence') THEN visit_type ELSE 'preventive' END,
  visit_date,
  CASE WHEN status IN ('planifiee','confirmee','effectuee','annulee') THEN status ELSE 'planifiee' END,
  technician, description, actions_performed, notes,
  COALESCE(created_at, datetime('now')), COALESCE(updated_at, datetime('now'))
FROM maintenance_visits;

DROP TABLE maintenance_visits;
ALTER TABLE maintenance_visits_v3 RENAME TO maintenance_visits;

CREATE INDEX IF NOT EXISTS idx_maintenance_visits_contract_id ON maintenance_visits(contract_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_visits_client_id ON maintenance_visits(client_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_visits_visit_date ON maintenance_visits(visit_date);
CREATE INDEX IF NOT EXISTS idx_maintenance_visits_status ON maintenance_visits(status);

PRAGMA foreign_keys = ON;
