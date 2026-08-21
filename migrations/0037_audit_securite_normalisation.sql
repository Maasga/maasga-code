-- Migration 0037: audit sécurité — échappement unique + statut RDV « cancelled »
--
-- 1. Décodage des entités HTML stockées en base
--    Historiquement plusieurs endpoints appliquaient escapeHtml() AVANT l'INSERT,
--    alors que le rendu applique déjà escapeHtml() / _esc() en sortie. Résultat :
--    double échappement, et « L'Hôpital » s'affichait « L&#39;Hôpital ».
--    On stocke désormais du texte brut (helpers.sanitizeText) et on échappe au
--    rendu uniquement. Cette migration ramène les lignes existantes en texte brut.
--
--    ORDRE IMPORTANT : &amp; doit être traité EN DERNIER, sinon « &amp;lt; »
--    devient « &lt; » puis « < » (double décodage).
--
--    Seules les tables et colonnes garanties par les migrations versionnées sont
--    traitées. Toute référence à une table ou une colonne absente interrompt la
--    migration entière, et la production porte 0029→0033 dont les fichiers
--    manquent au dépôt : voir la note sur « devis » plus bas.
--
-- 2. appointments.status accepte « cancelled »
--    Le code écrit status='cancelled' (annulation d'un RDV côté admin et côté
--    client) alors que le CHECK de la migration 0028 ne listait que
--    pending/confirmed/done : l'UPDATE échouait, l'annulation ne partait jamais
--    en base. SQLite ne sait pas modifier un CHECK : reconstruction de la table.

-- ============================================================
-- 1. Décodage des entités HTML
-- ============================================================

UPDATE appointments SET
  name     = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(name,     '&#39;', ''''), '&quot;', '"'), '&lt;', '<'), '&gt;', '>'), '&amp;', '&'),
  phone    = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(phone,    '&#39;', ''''), '&quot;', '"'), '&lt;', '<'), '&gt;', '>'), '&amp;', '&'),
  quartier = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(quartier, '&#39;', ''''), '&quot;', '"'), '&lt;', '<'), '&gt;', '>'), '&amp;', '&'),
  notes    = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(COALESCE(notes, ''), '&#39;', ''''), '&quot;', '"'), '&lt;', '<'), '&gt;', '>'), '&amp;', '&')
WHERE name LIKE '%&%' OR phone LIKE '%&%' OR quartier LIKE '%&%' OR notes LIKE '%&%';

UPDATE clients SET
  name     = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(name,     '&#39;', ''''), '&quot;', '"'), '&lt;', '<'), '&gt;', '>'), '&amp;', '&'),
  email    = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(COALESCE(email, ''),    '&#39;', ''''), '&quot;', '"'), '&lt;', '<'), '&gt;', '>'), '&amp;', '&'),
  phone    = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(phone,    '&#39;', ''''), '&quot;', '"'), '&lt;', '<'), '&gt;', '>'), '&amp;', '&'),
  quartier = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(COALESCE(quartier, ''), '&#39;', ''''), '&quot;', '"'), '&lt;', '<'), '&gt;', '>'), '&amp;', '&')
WHERE name LIKE '%&%' OR email LIKE '%&%' OR phone LIKE '%&%' OR quartier LIKE '%&%';

UPDATE orders SET
  client_name  = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(client_name,  '&#39;', ''''), '&quot;', '"'), '&lt;', '<'), '&gt;', '>'), '&amp;', '&'),
  client_phone = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(client_phone, '&#39;', ''''), '&quot;', '"'), '&lt;', '<'), '&gt;', '>'), '&amp;', '&'),
  client_email = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(COALESCE(client_email, ''), '&#39;', ''''), '&quot;', '"'), '&lt;', '<'), '&gt;', '>'), '&amp;', '&'),
  quartier     = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(COALESCE(quartier, ''),     '&#39;', ''''), '&quot;', '"'), '&lt;', '<'), '&gt;', '>'), '&amp;', '&'),
  notes        = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(COALESCE(notes, ''),        '&#39;', ''''), '&quot;', '"'), '&lt;', '<'), '&gt;', '>'), '&amp;', '&')
WHERE client_name LIKE '%&%' OR client_phone LIKE '%&%' OR client_email LIKE '%&%' OR quartier LIKE '%&%' OR notes LIKE '%&%';

UPDATE maintenance_requests SET
  name        = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(name,  '&#39;', ''''), '&quot;', '"'), '&lt;', '<'), '&gt;', '>'), '&amp;', '&'),
  phone       = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(phone, '&#39;', ''''), '&quot;', '"'), '&lt;', '<'), '&gt;', '>'), '&amp;', '&'),
  email       = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(COALESCE(email, ''),       '&#39;', ''''), '&quot;', '"'), '&lt;', '<'), '&gt;', '>'), '&amp;', '&'),
  quartier    = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(COALESCE(quartier, ''),    '&#39;', ''''), '&quot;', '"'), '&lt;', '<'), '&gt;', '>'), '&amp;', '&'),
  description = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(COALESCE(description, ''), '&#39;', ''''), '&quot;', '"'), '&lt;', '<'), '&gt;', '>'), '&amp;', '&')
WHERE name LIKE '%&%' OR phone LIKE '%&%' OR email LIKE '%&%' OR quartier LIKE '%&%' OR description LIKE '%&%';

UPDATE maintenance_contracts SET
  client_name  = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(client_name,  '&#39;', ''''), '&quot;', '"'), '&lt;', '<'), '&gt;', '>'), '&amp;', '&'),
  client_phone = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(client_phone, '&#39;', ''''), '&quot;', '"'), '&lt;', '<'), '&gt;', '>'), '&amp;', '&'),
  notes        = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(COALESCE(notes, ''), '&#39;', ''''), '&quot;', '"'), '&lt;', '<'), '&gt;', '>'), '&amp;', '&')
WHERE client_name LIKE '%&%' OR client_phone LIKE '%&%' OR notes LIKE '%&%';

UPDATE maintenance_visits SET
  technician        = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(COALESCE(technician, ''),        '&#39;', ''''), '&quot;', '"'), '&lt;', '<'), '&gt;', '>'), '&amp;', '&'),
  actions_performed = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(COALESCE(actions_performed, ''), '&#39;', ''''), '&quot;', '"'), '&lt;', '<'), '&gt;', '>'), '&amp;', '&'),
  notes             = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(COALESCE(notes, ''),             '&#39;', ''''), '&quot;', '"'), '&lt;', '<'), '&gt;', '>'), '&amp;', '&')
WHERE technician LIKE '%&%' OR actions_performed LIKE '%&%' OR notes LIKE '%&%';

UPDATE products SET
  name        = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(name,  '&#39;', ''''), '&quot;', '"'), '&lt;', '<'), '&gt;', '>'), '&amp;', '&'),
  brand       = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(brand, '&#39;', ''''), '&quot;', '"'), '&lt;', '<'), '&gt;', '>'), '&amp;', '&'),
  model       = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(COALESCE(model, ''),       '&#39;', ''''), '&quot;', '"'), '&lt;', '<'), '&gt;', '>'), '&amp;', '&'),
  description = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(COALESCE(description, ''), '&#39;', ''''), '&quot;', '"'), '&lt;', '<'), '&gt;', '>'), '&amp;', '&')
WHERE name LIKE '%&%' OR brand LIKE '%&%' OR model LIKE '%&%' OR description LIKE '%&%';

-- order_devis / devis : volontairement absente de cette migration.
-- La table a été renommée et remaniée par 0033_merge_devis_tables.sql, dont le
-- fichier manque au dépôt : la production expose « devis » (avec
-- client_quartier / produit_nom / message_client / notes_internes) tandis qu'une
-- base reconstruite depuis git seule expose « order_devis » (avec
-- client_response_notes). Aucune des deux formes ne peut être référencée ici
-- sans faire échouer l'autre — un UPDATE sur une table absente interrompt toute
-- la migration, ce qui est exactement ce qui s'est produit au premier essai.
-- Le décodage des lignes historiques de « devis » est donc traité hors migration,
-- par une requête ciblée sur la production. Le code stocke désormais du texte
-- brut, donc les nouvelles lignes sont correctes dans les deux cas.

-- ============================================================
-- 2. appointments.status : ajout de « cancelled »
-- ============================================================

PRAGMA foreign_keys = OFF;

CREATE TABLE appointments_v3 (
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
  -- Ajoutée par 0029/0030, dont les fichiers manquent au dépôt (la prod les a
  -- bien enregistrées). On la redéclare pour ne pas la perdre à la
  -- reconstruction, mais on ne la référence PAS dans le SELECT de copie :
  -- une base reconstruite depuis git seule ne l'a pas et la migration
  -- échouerait. La table est vide en production, donc rien à copier.
  technician TEXT DEFAULT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'done', 'cancelled')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO appointments_v3 (
  id, name, phone, quartier, date, heure_debut, heure_fin, type, notes,
  latitude, longitude, adresse_precise, status, created_at, updated_at
)
SELECT
  id, name, phone, quartier, date,
  COALESCE(heure_debut, '08:00'), COALESCE(heure_fin, '18:00'),
  CASE WHEN type IN ('devis', 'installation', 'entretien', 'depannage') THEN type ELSE 'devis' END,
  notes, latitude, longitude, adresse_precise,
  CASE WHEN status IN ('pending', 'confirmed', 'done', 'cancelled') THEN status ELSE 'pending' END,
  COALESCE(created_at, CURRENT_TIMESTAMP), COALESCE(updated_at, CURRENT_TIMESTAMP)
FROM appointments;

DROP TABLE appointments;
ALTER TABLE appointments_v3 RENAME TO appointments;

CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);
CREATE INDEX IF NOT EXISTS idx_appointments_phone ON appointments(phone);
CREATE INDEX IF NOT EXISTS idx_appointments_quartier ON appointments(quartier);

PRAGMA foreign_keys = ON;
