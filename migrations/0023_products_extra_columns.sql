-- Migration 0023: Add missing columns to products table
-- Columns already present: energy_class, surface_min, surface_max, inverter, imageUrl
-- Only adding the truly missing ones:
ALTER TABLE products ADD COLUMN image_url TEXT DEFAULT '';
ALTER TABLE products ADD COLUMN refrigerant TEXT DEFAULT '';
ALTER TABLE products ADD COLUMN compressor TEXT DEFAULT '';
