-- MAASGA D1 Database - Seed Data
-- Insérer les données initiales (produits, quartiers, avis)

-- ============================================================
-- PRODUITS
-- ============================================================
INSERT INTO products (name, brand, model, btu, price, stock, surface_min, surface_max, energy_class, description, inverter, available, warranty, features, image, imageUrl) VALUES
('Climatiseur Split Inverter 9000 BTU', 'SAMSUNG', 'AR09TXHQASINUA', 9000, 280000, 8, 9, 15, 'A++', 'Climatiseur inverter haute performance, idéal pour les petites pièces. Technologie WindFree pour un confort optimal sans courant d''air direct.', 1, 1, '2 ans constructeur', '["Mode Turbo", "Auto-nettoyage", "Wi-Fi intégré", "Mode Eco", "Anti-bactérien"]', '🌡️', NULL),
('Climatiseur Split Inverter 12000 BTU', 'SAMSUNG', 'AR12TXHQASINUA', 12000, 340000, 5, 15, 25, 'A++', 'Solution parfaite pour les chambres et bureaux de taille moyenne. Refroidissement rapide et silencieux.', 1, 1, '2 ans constructeur', '["Mode Turbo", "Auto-nettoyage", "Wi-Fi intégré", "Mode Eco", "Timer programmable"]', '❄️', NULL),
('Climatiseur Split Inverter 18000 BTU', 'LG', 'S18EQ-NSLA', 18000, 480000, 3, 25, 40, 'A+++', 'Climatiseur puissant pour les grands espaces. Technologie Dual Inverter pour une efficacité énergétique maximale.', 1, 1, '2 ans + extension disponible', '["Dual Inverter", "Mode Quiet", "Auto Cleaning", "4-Way Swing", "Smart Diagnosis"]', '🏢', NULL),
('Climatiseur Split 9000 BTU Non-Inverter', 'MIDEA', 'MSAF1-09CRN8-QD0GW', 9000, 175000, 12, 9, 14, 'A', 'Climatiseur entrée de gamme robuste et fiable. Idéal pour les petites pièces avec un budget maîtrisé.', 0, 1, '1 an constructeur', '["Refroidissement rapide", "Mode Sommeil", "Timer 24h", "Filtre lavable"]', '💨', NULL),
('Climatiseur Split 12000 BTU Non-Inverter', 'MIDEA', 'MSAF1-12CRN8-QD0GW', 12000, 220000, 7, 14, 22, 'A', 'Bon rapport qualité-prix pour les pièces à vivre. Fiabilité éprouvée en climat tropical.', 0, 1, '1 an constructeur', '["Démarrage à froid", "Mode Auto", "Filtre anti-poussière", "Timer programmable"]', '🌬️', NULL),
('Climatiseur Split Inverter 24000 BTU', 'LG', 'S24EQ-NSLA', 24000, 650000, 2, 40, 60, 'A+++', 'Solution professionnelle pour les grands espaces commerciaux et bureaux open-space. Performance maximale.', 1, 1, '3 ans constructeur', '["Dual Inverter Gold Fin", "Mode Jet Cool", "Auto Cleaning", "Smart ThinQ", "UVnano"]', '🏬', NULL),
('Climatiseur Cassette 18000 BTU', 'DAIKIN', 'FCAG18AV1', 18000, 720000, 0, 25, 45, 'A++', 'Climatiseur cassette plafond idéal pour les espaces commerciaux. Diffusion d''air à 360°.', 1, 0, '3 ans constructeur', '["Diffusion 4 directions", "Filtre plasma", "Mode Confort", "Programmation hebdo"]', '🏗️', NULL),
('Climatiseur Split Inverter 24000 BTU', 'SAMSUNG', 'AR24TXHQASINUA', 24000, 580000, 4, 38, 58, 'A+++', 'Puissance et économie d''énergie pour les grands volumes. Idéal pour salons, salles de réunion.', 1, 1, '2 ans constructeur', '["WindFree Cooling", "AI Auto Mode", "SmartThings", "Self Clean", "Triple Protection+"]', '🔵', NULL);

-- ============================================================
-- AVIS / REVIEWS
-- ============================================================
INSERT INTO reviews (name, note, comment, date, service, approved) VALUES
('Moussa Ouédraogo', 5, 'Excellente installation, technicien professionnel et ponctuel. Mon salon est maintenant parfaitement climatisé. Je recommande vivement MAASGA !', '2025-01-15', 'Installation Split 12000 BTU', 1),
('Aminata Sawadogo', 5, 'Service impeccable du début à la fin. La visite technique préalable m''a rassurée. Ils savent exactement ce qu''ils font. Résultat parfait.', '2025-01-28', 'Installation Split 9000 BTU', 1),
('Ibrahim Compaoré', 4, 'Très bonne prestation. Légèrement en retard sur le rendez-vous mais travail de qualité. L''entretien trimestriel est un vrai plus.', '2025-02-05', 'Maintenance trimestrielle', 1),
('Fatou Kaboré', 5, 'MAASGA c''est la référence à Ouagadougou ! Devis transparent, installation soignée, SAV réactif. Que demander de plus ?', '2025-02-12', 'Installation Split Inverter 18000 BTU', 1),
('Seydou Traoré', 5, 'J''ai acheté 3 climatiseurs pour mon immeuble. Équipe très compétente, travail propre, délais respectés. Prix compétitifs par rapport à la concurrence.', '2025-02-20', 'Multi-installation', 1),
('Mariam Diallo', 4, 'Simulateur BTU très pratique sur le site. Résultat conforme à ce qui a été installé. Très satisfaite du service.', '2025-03-01', 'Installation Split 12000 BTU', 1);

-- ============================================================
-- QUARTIERS (à insérer en plusieurs batches pour éviter les erreurs)
-- ============================================================
-- Arrondissement 1
INSERT INTO quartiers (name, arrondissement, latitude, longitude) VALUES
('Bilbalogo', 1, 12.3656, -1.5197),
('Saint Léon', 1, 12.3645, -1.5203),
('Zangouettin', 1, 12.3654, -1.5210),
('Tiedpalogo', 1, 12.3663, -1.5215),
('Koulouba', 1, 12.3651, -1.5220),
('Kamsonghin', 1, 12.3642, -1.5208),
('Samandin', 1, 12.3660, -1.5200),
('Gounghin Sud', 1, 12.3648, -1.5190),
('Gandin', 1, 12.3655, -1.5225),
('Kouritenga', 1, 12.3670, -1.5230),
('Mankougoudou', 1, 12.3675, -1.5205);

-- Arrondissement 2
INSERT INTO quartiers (name, arrondissement, latitude, longitude) VALUES
('Paspanga', 2, 12.3710, -1.5150),
('Ouidi', 2, 12.3720, -1.5160),
('Larlé', 2, 12.3705, -1.5170),
('Kologh Naba', 2, 12.3715, -1.5145),
('Dapoya 2', 2, 12.3725, -1.5155),
('Nemnin', 2, 12.3708, -1.5165),
('Niogsin', 2, 12.3712, -1.5175),
('Hamdalaye', 2, 12.3718, -1.5140),
('Gounghin Nord', 2, 12.3722, -1.5148),
('Baoghin', 2, 12.3730, -1.5158);

-- Arrondissement 3
INSERT INTO quartiers (name, arrondissement, latitude, longitude) VALUES
('Camp militaire', 3, 12.3580, -1.5100),
('Naababpougo', 3, 12.3590, -1.5095),
('Kienbaoghin', 3, 12.3598, -1.5105),
('Zongo', 3, 12.3585, -1.5110),
('Koumdayonré', 3, 12.3605, -1.5100),
('Nonsin', 3, 12.3595, -1.5115),
('Rimkièta', 3, 12.3588, -1.5088),
('Tampouy', 3, 12.3610, -1.5095),
('Kilwin', 3, 12.3592, -1.5120);

-- Arrondissement 4
INSERT INTO quartiers (name, arrondissement, latitude, longitude) VALUES
('Tanghin', 4, 12.3520, -1.5050),
('Sambin barrage', 4, 12.3530, -1.5060),
('Somgandé', 4, 12.3525, -1.5045),
('Zone industrielle', 4, 12.3540, -1.5055),
('Nioko 2', 4, 12.3535, -1.5040),
('Bendogo', 4, 12.3515, -1.5065),
('Toukin', 4, 12.3545, -1.5050);

-- Arrondissement 5
INSERT INTO quartiers (name, arrondissement, latitude, longitude) VALUES
('Zogona', 5, 12.3650, -1.4950),
('Wemtenga', 5, 12.3660, -1.4960),
('Dagnoën', 5, 12.3645, -1.4945),
('Ronsin', 5, 12.3655, -1.4955),
('Kalgondin', 5, 12.3670, -1.4940);

-- Arrondissement 6
INSERT INTO quartiers (name, arrondissement, latitude, longitude) VALUES
('Cissin', 6, 12.3720, -1.5000),
('Kouritenga2', 6, 12.3730, -1.5010),
('Pissy', 6, 12.3710, -1.4990);

-- Arrondissement 7
INSERT INTO quartiers (name, arrondissement, latitude, longitude) VALUES
('Nagrin', 7, 12.3780, -1.5050),
('Yaoghin', 7, 12.3790, -1.5060),
('Sandogo', 7, 12.3770, -1.5040),
('Kankasin', 7, 12.3785, -1.5055),
('Boassa', 7, 12.3795, -1.5045);

-- Arrondissement 8
INSERT INTO quartiers (name, arrondissement, latitude, longitude) VALUES
('Zaghtouli', 8, 12.3650, -1.5250),
('Zongo Nabitenga', 8, 12.3660, -1.5260),
('Sogpèlcé', 8, 12.3640, -1.5245),
('Bissighin', 8, 12.3670, -1.5255),
('Bassinko', 8, 12.3655, -1.5270),
('Dar-es-Salam', 8, 12.3665, -1.5240),
('Silmiougou', 8, 12.3645, -1.5265),
('Gantin', 8, 12.3675, -1.5250);

-- Arrondissement 9
INSERT INTO quartiers (name, arrondissement, latitude, longitude) VALUES
('Bangpooré', 9, 12.3580, -1.5300),
('Larlé Wéogo', 9, 12.3590, -1.5310),
('Marcoussis', 9, 12.3570, -1.5290),
('Silmiyiri', 9, 12.3600, -1.5305),
('Wob Riguéré', 9, 12.3585, -1.5315),
('Ouapassi', 9, 12.3595, -1.5295);

-- Arrondissement 10
INSERT INTO quartiers (name, arrondissement, latitude, longitude) VALUES
('Kossodo', 10, 12.3500, -1.5150),
('Wayalghin', 10, 12.3510, -1.5160),
('Godin', 10, 12.3490, -1.5140),
('Nioko 1', 10, 12.3505, -1.5155),
('Dassosgho', 10, 12.3515, -1.5145),
('Taabtenga', 10, 12.3495, -1.5165);

-- Arrondissement 11
INSERT INTO quartiers (name, arrondissement, latitude, longitude) VALUES
('Dassasgo', 11, 12.3450, -1.5120),
('Yemtenga', 11, 12.3460, -1.5130),
('Karpala', 11, 12.3440, -1.5110),
('Balkuy', 11, 12.3470, -1.5125),
('Lanoayiri', 11, 12.3455, -1.5135),
('Dayongo', 11, 12.3465, -1.5115),
('Ouidtenga', 11, 12.3445, -1.5140);
