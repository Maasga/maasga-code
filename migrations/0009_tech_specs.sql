-- Migration: Add tech_specs JSON column to products
ALTER TABLE products ADD COLUMN tech_specs TEXT;
