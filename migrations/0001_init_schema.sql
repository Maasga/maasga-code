-- MAASGA D1 Database Schema
-- Initialization migration

-- Table: Appointments (Rendez-vous)
CREATE TABLE IF NOT EXISTS appointments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  quartier TEXT NOT NULL,
  date TEXT NOT NULL,
  heure_debut TEXT DEFAULT '08:00',
  heure_fin TEXT DEFAULT '18:00',
  type TEXT NOT NULL CHECK (type IN ('devis', 'installation')),
  notes TEXT,
  latitude REAL,
  longitude REAL,
  adresse_precise TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'done')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: Orders (Commandes)
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  appointment_id INTEGER NOT NULL,
  client_id INTEGER,
  product_id INTEGER,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  quartier TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('devis', 'installation')),
  status TEXT NOT NULL DEFAULT 'validated' CHECK (status IN ('validation_terrain', 'validated', 'installed', 'cancelled')),
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE
);

-- Table: Products (Produits)
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  model TEXT,
  btu INTEGER NOT NULL,
  price INTEGER NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  surface_min INTEGER DEFAULT 10,
  surface_max INTEGER DEFAULT 25,
  energy_class TEXT DEFAULT 'A++',
  description TEXT,
  inverter INTEGER DEFAULT 0,
  available INTEGER DEFAULT 1,
  warranty TEXT DEFAULT '1 an constructeur',
  features TEXT, -- JSON array stored as text
  image TEXT DEFAULT '❄️',
  imageUrl TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: Reviews (Avis)
CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  note INTEGER NOT NULL CHECK (note >= 1 AND note <= 5),
  comment TEXT NOT NULL,
  date TEXT NOT NULL,
  service TEXT,
  approved INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: Quartiers (Districts à Ouagadougou)
CREATE TABLE IF NOT EXISTS quartiers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  arrondissement INTEGER NOT NULL CHECK (arrondissement >= 1 AND arrondissement <= 11),
  latitude REAL,
  longitude REAL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: Clients
CREATE TABLE IF NOT EXISTS clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  quartier TEXT,
  password_hash TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: Admin Sessions (for tracking)
CREATE TABLE IF NOT EXISTS admin_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token TEXT UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);
CREATE INDEX IF NOT EXISTS idx_orders_appointment_id ON orders(appointment_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_products_btu ON products(btu);
CREATE INDEX IF NOT EXISTS idx_reviews_approved ON reviews(approved);
