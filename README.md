# GeoTrack — Plateforme de Supervision Géospatiale & Recherche Intelligente

> **Application de démonstration technique** conçue pour illustrer des compétences en Ingénierie Logicielle Full-Stack.

[![PHP 8.3](https://img.shields.io/badge/PHP-8.3%20MVC-777BB4?logo=php)](https://php.net)
[![React 18](https://img.shields.io/badge/React-18%20%2B%20Vite-61DAFB?logo=react)](https://react.dev)
[![MySQL 8](https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql)](https://mysql.com)
[![Elasticsearch](https://img.shields.io/badge/Elasticsearch-8.15-005571?logo=elasticsearch)](https://elastic.co)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker)](https://docker.com)

---

## Stack Technique

| Couche | Technologie |
|---|---|
| **Backend** | PHP 8.3 — Architecture MVC custom, API REST, PDO |
| **Frontend** | React 18 + Vite + Leaflet (cartographie interactive) |
| **Base de données** | MySQL 8.0 — Schéma auto-provisionné au démarrage |
| **Moteur de recherche** | Elasticsearch 8.15 — Fuzzy search + fallback SQL |
| **Conteneurisation** | Docker & Docker Compose multi-services avec healthchecks |
| **CI/CD** | GitHub Actions, tests PHPUnit |

---

## Architecture Système

```text
       Navigateur Web (React 18 + Vite + Leaflet)
                         │
                         │ HTTP / REST (CORS & OPTIONS intégrés)
                         ▼
        API PHP 8.3 MVC (Apache 2.4 — FallbackResource)
         ├── Controllers (SiteController, HealthController)
         ├── Services    (SearchService — Elasticsearch)
         ├── Repositories (SiteRepository — PDO)
         └── Core        (Router, Request, Response, Container, Database)
                │                         │
                ▼                         ▼
         MySQL 8.0               Elasticsearch 8.15
   (Persistance & Schéma)       (Recherche multi-champs)
```

---

## Démarrage Rapide (Docker)

```bash
# Cloner et démarrer toute la stack
docker compose up --build -d

# Vérifier que tous les services sont healthy
docker compose ps
```

### Accès aux Services

| Service | URL |
|---|---|
| **Application Web** (React) | http://localhost:5173 |
| **API REST** | http://localhost:8080/api/sites |
| **Health Check** | http://localhost:8080/api/health |
| **Elasticsearch** | http://localhost:9200 |
| **MySQL** | `localhost:3307` — user: `geotrack` / pass: `geotrack` |

---

## Fonctionnalités Clés

### 🗺️ Cartographie Interactive (Leaflet / OpenStreetMap)
- Visualisation géospatiale de tous les sites sur fond de carte haute résolution
- Marqueurs interactifs avec état opérationnel (vert = actif, gris = inactif)
- **Mode sélecteur GPS** : cliquez sur la carte pour remplir automatiquement les coordonnées
- Trois modes d'affichage : **Split View**, **Grille** ou **Plein écran Carte**

### ✏️ CRUD Complet & Ergonomie
- Création de sites avec suggestions rapides de villes
- Modification en direct avec pré-remplissage
- Consultation des métadonnées complètes (statuts, horodatages, coordonnées GPS)
- Suppression sécurisée avec boîte de dialogue de confirmation

### ⚡ Recherche Intelligente & Résilience
- Recherche textuelle *fuzzy* multi-champs avec Elasticsearch
- Bascule automatique vers MySQL si Elasticsearch est indisponible
- Réindexation à chaud via le bouton **Sync Elastic**

### 📊 Monitoring Temps Réel
- Badges dynamiques MySQL, Elasticsearch & PHP dans la navbar
- Rafraîchissement automatique toutes les 25 secondes

### 📥 Export CSV
- Export complet de la base de sites en CSV avec encodage UTF-8

---

## API REST — Référence Complète

| Méthode | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Bilan de santé complet (MySQL, Elasticsearch, PHP) |
| `GET` | `/api/sites` | Liste paginée (`?page=1&limit=10&city=...&status=...`) |
| `GET` | `/api/sites?all=1` | Liste complète sans pagination |
| `GET` | `/api/sites/meta` | Villes, types distincts et statistiques globales |
| `GET` | `/api/sites/{id}` | Détails d'un site par son identifiant |
| `POST` | `/api/sites` | Création d'un nouveau site |
| `PUT` | `/api/sites/{id}` | Mise à jour d'un site existant |
| `DELETE` | `/api/sites/{id}` | Suppression d'un site |
| `GET` | `/api/sites/search?q=...` | Recherche multi-champs (Elasticsearch + fallback DB) |
| `POST` | `/api/sites/sync-elasticsearch` | Réindexation de tous les sites |

### Exemple — Créer un site

```bash
curl -X POST http://localhost:8080/api/sites \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Centre Logistique Tunis Nord",
    "city": "Tunis",
    "type": "Logistique",
    "status": "active",
    "latitude": 36.8190,
    "longitude": 10.1658
  }'
```

---

## Tests Unitaires (PHPUnit)

```bash
# Exécuter les tests dans le conteneur API
docker exec geotrack-api ./vendor/bin/phpunit
```

---

## Structure du Projet

```
GeoTrack/
├── backend/
│   ├── database/       # Schéma SQL & données de démo
│   ├── docker/         # Configuration Apache
│   ├── public/         # Point d'entrée API (index.php)
│   ├── src/
│   │   ├── Controllers/  # SiteController, HealthController
│   │   ├── Core/         # Router, Request, Response, Database, Container
│   │   ├── Repositories/ # SiteRepository (PDO)
│   │   └── Services/     # SearchService (Elasticsearch)
│   └── tests/          # Tests PHPUnit
├── frontend/
│   └── src/
│       ├── components/  # MapView, SiteModal, Toast, etc.
│       ├── App.jsx      # Composant principal
│       ├── api.js       # Couche d'accès API
│       └── style.css    # Design system complet
├── scripts/            # Scripts d'initialisation Elasticsearch
├── docker-compose.yml  # Orchestration multi-services
└── README.md
```
