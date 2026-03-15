-- Migration 0025: Add password_reset_codes table for persistent reset tokens
-- Solves SEC-9: Reset codes stored in memory are lost on Worker restart

CREATE TABLE IF NOT EXISTS password_reset_codes (
  token TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  phone TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  used INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_reset_codes_phone ON password_reset_codes(phone);
CREATE INDEX IF NOT EXISTS idx_reset_codes_created ON password_reset_codes(created_at);

-- Also add IFU to site_settings for invoice customization
INSERT OR IGNORE INTO site_settings (key, value, updated_at)
VALUES ('ifu', '00127845A', datetime('now'));
