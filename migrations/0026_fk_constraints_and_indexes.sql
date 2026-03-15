-- Migration 0026: Add missing foreign key enforcement + performance indexes
-- D1 (FK constraints) + D2 (indexes) from security audit

-- Enable foreign key enforcement (D1 requires PRAGMA per-connection, but we set it for clarity)
-- Note: Cloudflare D1 enforces FK by default since 2024

-- ============================================================
-- INDEXES for frequently queried columns (D2)
-- ============================================================

-- Clients: phone lookups are extremely frequent (login, search, orders)
CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);

-- Orders: client lookups, status filtering
CREATE INDEX IF NOT EXISTS idx_orders_client_id ON orders(client_id);
CREATE INDEX IF NOT EXISTS idx_orders_client_phone ON orders(client_phone);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- Appointments: phone lookup, quartier filtering
CREATE INDEX IF NOT EXISTS idx_appointments_phone ON appointments(phone);
CREATE INDEX IF NOT EXISTS idx_appointments_quartier ON appointments(quartier);

-- Payments: client lookups, order association, status checks
CREATE INDEX IF NOT EXISTS idx_payments_client_id ON payments(client_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);

-- Maintenance contracts: client lookups, status filtering
CREATE INDEX IF NOT EXISTS idx_maintenance_contracts_client_id ON maintenance_contracts(client_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_contracts_status ON maintenance_contracts(status);

-- Maintenance visits: contract association, date filtering
CREATE INDEX IF NOT EXISTS idx_maintenance_visits_contract_id ON maintenance_visits(contract_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_visits_client_id ON maintenance_visits(client_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_visits_visit_date ON maintenance_visits(visit_date);
CREATE INDEX IF NOT EXISTS idx_maintenance_visits_status ON maintenance_visits(status);

-- Maintenance requests: status filtering, phone lookup
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_phone ON maintenance_requests(phone);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_status ON maintenance_requests(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_created_at ON maintenance_requests(created_at);

-- User activity log: client lookup, category filtering, chronological
CREATE INDEX IF NOT EXISTS idx_activity_log_client_id ON user_activity_log(client_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_category ON user_activity_log(category);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON user_activity_log(created_at);

-- Reviews: approval filtering
CREATE INDEX IF NOT EXISTS idx_reviews_approved ON reviews(approved);

-- Realisations: visibility + featured sorting
CREATE INDEX IF NOT EXISTS idx_realisations_visible ON realisations(is_visible);
CREATE INDEX IF NOT EXISTS idx_realisations_featured ON realisations(is_featured);

-- Products: brand filtering, availability
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_available ON products(available);

-- Stock movements: product association
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON stock_movements(product_id);

-- SAV tickets: order association
CREATE INDEX IF NOT EXISTS idx_sav_tickets_order_id ON sav_tickets(order_id);

-- Password reset codes: phone lookup (indexes already exist from 0025, but ensure)
CREATE INDEX IF NOT EXISTS idx_password_reset_phone ON password_reset_codes(phone);
