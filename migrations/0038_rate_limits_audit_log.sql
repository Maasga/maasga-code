-- Migration 0038: infrastructure sécurité admin
--
-- 1. rate_limits : limitation de débit persistante
--    Le rate limiting actuel vit dans une Map en mémoire, donc par isolate
--    Cloudflare. Un attaquant qui retente sa chance tombe sur un autre isolate
--    et repart d'un compteur à zéro — la protection du login admin ne tient pas.
--    Table partagée = compteur unique pour tout le worker.
--
-- 2. admin_settings.admin_token_epoch : révocation de session
--    Les cookies admin sont des jetons HMAC autoportants : impossible de les
--    invalider avant leur expiration (24 h). On signe désormais l'epoch courant
--    dans le jeton et on le compare à celui stocké ; incrémenter l'epoch
--    (déconnexion, changement de mot de passe) invalide tous les jetons émis.
--
-- 3. admin_audit_log : traçabilité des actions sensibles
--    export de sauvegarde, réinitialisation de la base, changement de mot de
--    passe. Sans trace, une compromission ne laisse rien à reconstituer.

CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  window_start INTEGER NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON rate_limits(window_start);

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  action TEXT NOT NULL,
  detail TEXT,
  ip TEXT,
  user_agent TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_created ON admin_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_audit_action ON admin_audit_log(action);

-- L'epoch démarre à 1 : tous les jetons émis avant cette migration (sans epoch)
-- sont donc rejetés, ce qui force une reconnexion propre après déploiement.
-- Le CREATE est défensif : admin_settings vient de la migration 0018, mais la base
-- de production porte des migrations 0029→0033 absentes du dépôt.
CREATE TABLE IF NOT EXISTS admin_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TEXT
);

INSERT OR IGNORE INTO admin_settings (key, value) VALUES ('admin_token_epoch', '1');
