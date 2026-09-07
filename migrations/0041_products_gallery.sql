-- Migration 0041: galerie multi-images produits + stockage delete_url ImgBB
-- Ajoute imgbb_delete_url pour l'image principale et étend media_urls (JSON array)
-- pour la galerie. Rétrocompatible : valeurs NULL par défaut.
ALTER TABLE products ADD COLUMN imgbb_delete_url TEXT;