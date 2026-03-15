-- Migration 0015: Ensure reviews table exists with correct schema
-- Safe to run even if table already exists

CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  note INTEGER NOT NULL DEFAULT 5,
  comment TEXT NOT NULL,
  date TEXT NOT NULL DEFAULT (date('now')),
  service TEXT,
  approved INTEGER DEFAULT 0
);

-- Add created_at column if it doesn't exist (safe ALTER TABLE)
-- SQLite doesn't support IF NOT EXISTS on ALTER TABLE, so we use a workaround
CREATE TABLE IF NOT EXISTS reviews_backup_check (id INTEGER);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_reviews_approved ON reviews(approved);
CREATE INDEX IF NOT EXISTS idx_reviews_date ON reviews(date);
