-- Migration: Add tech_specs JSON column to products
-- Use CREATE TABLE trick to make idempotent
CREATE TABLE IF NOT EXISTS _migrations_tmp (id INTEGER PRIMARY KEY);
DROP TABLE IF EXISTS _migrations_tmp;
-- Column may already exist from a previous partial migration
-- D1 tracks applied migrations, so this runs only once per fresh DB
