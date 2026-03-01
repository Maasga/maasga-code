-- Ajouter support multi-media (images + vidéos) par produit
ALTER TABLE products ADD COLUMN media_urls TEXT DEFAULT NULL;
-- Format: JSON array of {type: 'image'|'video', url: string, caption?: string}
