# Audit Technique & Pré-requis de Déploiement — GeoTrack

Ce document constitue l'audit complet du projet **GeoTrack**, son état actuel, les freins identifiés pour un déploiement en production, ainsi que la feuille de route des ajustements nécessaires.

---

## 1. Architecture Actuelle

Le projet repose sur une architecture découplée frontend / backend conteneurisée :

```text
[ Navigateur Web ]
       │
       │ HTTP / JSON (REST)
       ▼
[ Frontend React 18 + Vite + Leaflet ] (Port 5173 en dev)
       │
       │ API REST
       ▼
[ Backend PHP 8.3 MVC / Apache 2.4 ] (Port 8080)
       ├── Core (Router, Request, Response, Container, Database)
       ├── Controllers (SiteController, HealthController)
       ├── Repositories (SiteRepository avec PDO MySQL)
       └── Services (SearchService avec cURL Elasticsearch)
              │                    │
              ▼                    ▼
     [ MySQL 8.0 ]       [ Elasticsearch 8.15 ]
      (Port 3307)             (Port 9200)
```

### Technologies Utilisées
- **Backend** : PHP 8.3, Apache 2.4, PDO MySQL, cURL, Composer 2, PHPUnit 11.
- **Frontend** : React 18, Vite 5, Leaflet 1.9, Lucide React, CSS moderne Vanilla.
- **Base de données** : MySQL 8.0 (schéma `geotrack`, table `sites`).
- **Moteur de recherche** : Elasticsearch 8.15.0 (cluster mono-noeud, mapping plein-texte).
- **Conteneurisation** : Docker, Docker Compose (services `api`, `frontend`, `mysql`, `elasticsearch`).
- **CI/CD** : GitHub Actions (PHP lint, tests unitaires PHPUnit, build Vite).

---

## 2. Processus de Démarrage Actuel

- **Développement local (Docker)** :
  ```bash
  docker compose up --build -d
  ```
- **Tests unitaires** :
  ```bash
  docker exec geotrack-api composer test
  ```
- **Frontend local (hors Docker)** :
  ```bash
  cd frontend && npm install && npm run dev
  ```

---

## 3. Bloquants pour le Déploiement en Production (Deployment Blockers)

| # | Composant | Problème identifié | Impact Déploiement |
|---|---|---|---|
| 1 | **Frontend API URL** | URL API codée en dur (`http://localhost:8080/api`) dans `frontend/src/api.js`. | En production (Vercel, Netlify), le navigateur de l'utilisateur pointe sur son propre `localhost`, rendant l'API inaccessible. |
| 2 | **CORS Backend** | Pas de filtrage d'origine basé sur l'environnement (`Access-Control-Allow-Origin: *` systématique). | Faiblesse de sécurité et incompatibilité en production avec des cookies ou requêtes strictes. |
| 3 | **Elasticsearch Externe** | `SearchService` ne supporte pas l'authentification Elastic Cloud (Basic Auth / API Key / HTTPS). | Impossible d'utiliser une instance cloud managée (Bonsai, Elastic Cloud). |
| 4 | **Variables d'Environnement** | Absence d'un `.env.example` racine complet et standardisé. | Difficulté pour les plateformes cloud (Render, Railway, Heroku) de provisionner les variables. |
| 5 | **Gestion des Erreurs API** | Fuite potentielle de messages d'exception internes en cas d'erreur 500. | Risque de divulgation d'informations sensibles en production. |
| 6 | **Frontend Dockerfile** | `frontend/Dockerfile` utilise `npm run dev` (Vite dev server) au lieu d'un serveur de production ou build statique optimisé. | Non adapté à un hébergement conteneurisé de production. |
| 7 | **Absence de documentation déploiement** | Pas de guide pas-à-pas pour déployer sur des plateformes gratuites / cloud. | Recruteur incapable de tester le déploiement rapidement. |

---

## 4. Modifications Requises

1. **Environnement & Configuration** :
   - Remplacer l'URL en dur du frontend par `import.meta.env.VITE_API_URL || 'http://localhost:8080/api'`.
   - Créer `.env.example` documentant toutes les variables (`APP_ENV`, `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `ELASTICSEARCH_HOST`, `ELASTICSEARCH_USER`, `ELASTICSEARCH_PASSWORD`, `CORS_ALLOWED_ORIGINS`).
   - Mettre à jour `bootstrap.php` pour accepter les alias courants (`DB_DATABASE`, `DB_USERNAME`, `ELASTICSEARCH_URL`).
2. **CORS Dynamique** :
   - Autoriser `*` en environnement `local`, et restreindre à `CORS_ALLOWED_ORIGINS` en `production`.
3. **Résilience Elasticsearch** :
   - Support des identifiants et clés API dans `SearchService`.
   - Tolérance aux pannes garantie : si Elasticsearch est absent ou injoignable, basculer sur MySQL sans crasher.
4. **Sécurité en Production** :
   - Masquer les détails d'erreurs 500 lorsque `APP_ENV=production`.
5. **CI/CD** :
   - Valider la compatibilité de `.github/workflows/ci.yml`.
6. **Documentation** :
   - Produire un `DEPLOYMENT.md` clair et exploitable par un recruteur (déploiement Vercel + Render / Railway).

---

## 5. Architecture de Déploiement Recommandée (Production / Démo Recruteur)

Pour une démonstration en ligne simple, gratuite et sans maintenance de serveurs :

```text
┌───────────────────────────────────────┐
│     Frontend (React / Vite Static)     │
│       Hébergé sur VERCEL ou NETLIFY    │
│    URL: https://geotrack-demo.vercel.app │
└──────────────────┬────────────────────┘
                   │ HTTPS
                   ▼
┌───────────────────────────────────────┐
│       Backend API (Docker / PHP 8.3)   │
│         Hébergé sur RENDER ou RAILWAY  │
│    URL: https://geotrack-api.onrender.com │
└─────────────┬─────────────────┬───────┘
              │                 │
              ▼                 ▼
   ┌──────────────────┐   ┌───────────────────────────┐
   │ Managed MySQL 8  │   │ Managed Elasticsearch     │
   │  (Aiven / TiDB / │   │ (Elastic Cloud / Bonsai / │
   │  Railway MySQL)  │   │ Fallback SQL intégré)     │
   └──────────────────┘   └───────────────────────────┘
```

> **Note de résilience** : Si le recruteur ou l'évaluateur ne souhaite pas configurer un Elasticsearch Cloud payant, l'API intègre un **mode de repli transparent sur MySQL** qui permet à l'ensemble de la démo (recherche, filtres, CRUD, cartographie) de fonctionner à 100% avec seulement MySQL.
