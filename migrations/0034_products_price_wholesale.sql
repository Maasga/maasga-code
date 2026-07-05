-- Ajoute le prix grossiste, utilisé par l'import produits en masse (Excel).
-- NOTE : la colonne `category` existe déjà en prod (appliquée hors dépôt via
-- des migrations 0029→0033 absentes de ce git), on ne la (re)crée donc pas ici.
-- Numérotée 0034 pour passer AU-DELÀ du max 0033 déjà appliqué en prod et
-- éviter la collision qui faisait échouer l'ancienne 0029.
ALTER TABLE products ADD COLUMN price_wholesale INTEGER;
