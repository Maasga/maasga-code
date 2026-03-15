-- Migration 0021: Stock movement history + enhanced alerts
-- Historique des mouvements de stock

CREATE TABLE IF NOT EXISTS stock_movements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  product_name TEXT DEFAULT '',
  movement_type TEXT NOT NULL CHECK(movement_type IN ('entree', 'sortie', 'ajustement', 'vente', 'retour')),
  quantity INTEGER NOT NULL,             -- positive for in, negative for out
  stock_before INTEGER NOT NULL,
  stock_after INTEGER NOT NULL,
  reason TEXT DEFAULT '',
  reference TEXT DEFAULT '',             -- order_id, ticket_ref, etc.
  created_by TEXT DEFAULT 'admin',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_stock_moves_product ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_moves_date ON stock_movements(created_at);
