-- =============================================================================
-- GeoTrack — Schéma Relationnel & Données Initiales
-- Compatible MySQL 8.0+ / utf8mb4
-- =============================================================================

CREATE TABLE IF NOT EXISTS sites (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    city VARCHAR(100) NOT NULL,
    type VARCHAR(100) NOT NULL,
    status ENUM('active','inactive') NOT NULL DEFAULT 'active',
    latitude DECIMAL(10,7) NULL,
    longitude DECIMAL(10,7) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_city (city),
    INDEX idx_status (status),
    INDEX idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Données de démonstration initiales (insérées seulement si la table est vide)
INSERT IGNORE INTO sites (id, name, city, type, status, latitude, longitude) VALUES
    (1, 'Site industriel Zarzis',          'Zarzis',   'Industriel',  'active',   33.5030, 11.1120),
    (2, 'Centre technique Djerba',         'Djerba',   'Technique',   'active',   33.8076, 10.8451),
    (3, 'Plateforme logistique Gabès',     'Gabès',    'Logistique',  'active',   33.8815, 10.0982),
    (4, 'Station de contrôle Médenine',    'Médenine', 'Contrôle',    'inactive', 33.3549, 10.5055),
    (5, 'Hub commercial Tunis Nord',       'Tunis',    'Commercial',  'active',   36.8190, 10.1658),
    (6, 'Centre R&D Sfax Technopôle',      'Sfax',     'Recherche',   'active',   34.7800, 10.7600),
    (7, 'Siège régional Sousse',           'Sousse',   'Siège',       'active',   35.8256, 10.6084),
    (8, 'Dépôt logistique Bizerte',        'Bizerte',  'Logistique',  'inactive', 37.2744, 9.8739),
    (9, 'Station surveillance Kairouan',   'Kairouan', 'Contrôle',    'active',   35.6784, 10.0963),
    (10,'Unité industrielle Gafsa',        'Gafsa',    'Industriel',  'active',   34.4250, 8.7840);
