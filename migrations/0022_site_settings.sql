-- Migration 0022: Editable site settings
-- Paramètres du site éditables par l'admin

CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL DEFAULT '',
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Default values
INSERT OR IGNORE INTO site_settings (key, value) VALUES ('phone', '+226 55 99 64 18');
INSERT OR IGNORE INTO site_settings (key, value) VALUES ('email', 'maasgabf@gmail.com');
INSERT OR IGNORE INTO site_settings (key, value) VALUES ('address', 'Ouagadougou, Burkina Faso');
INSERT OR IGNORE INTO site_settings (key, value) VALUES ('hours', 'Lundi–Dimanche · 8h00–18h00');
INSERT OR IGNORE INTO site_settings (key, value) VALUES ('company_name', 'MAASGA');
INSERT OR IGNORE INTO site_settings (key, value) VALUES ('whatsapp', '+226 55 99 64 18');
INSERT OR IGNORE INTO site_settings (key, value) VALUES ('facebook', '');
INSERT OR IGNORE INTO site_settings (key, value) VALUES ('instagram', '');
INSERT OR IGNORE INTO site_settings (key, value) VALUES ('slogan', 'Solutions énergétiques solaires professionnelles');
