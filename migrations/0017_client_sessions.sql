-- Migration: Create client_sessions table for persistent server-side sessions
-- Replaces the in-memory Map that was lost on every redeploy

CREATE TABLE IF NOT EXISTS client_sessions (
  token TEXT PRIMARY KEY,
  client_id INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_client ON client_sessions(client_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON client_sessions(expires_at);
