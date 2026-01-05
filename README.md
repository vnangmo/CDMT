# Application Web de Gestion du CDMT

Application web pour la gestion du Cadre de Dépenses à Moyen Terme (CDMT) - République de Djibouti

## Structure du projet

```
CDMT/
├── backend/          # API Node.js + Express + TypeScript
├── frontend/         # Application React + TypeScript + Material-UI
├── docker/           # Configuration Docker
├── docs/             # Documentation
├── docker-compose.yml
└── README.md
```

## Prérequis

- Node.js 18+ et npm
- PostgreSQL 15+
- Redis (via Docker)
- Docker et Docker Compose

## Démarrage rapide

### 1. Installation des dépendances

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configuration de la base de données

```bash
# Créer la base de données PostgreSQL
psql -U postgres
CREATE DATABASE cdmt_db;
```

### 3. Variables d'environnement

Copier les fichiers `.env.example` et les renommer en `.env` dans les dossiers backend et frontend.

### 4. Lancement de l'application

```bash
# Avec Docker Compose (recommandé)
docker-compose up -d

# Ou manuellement
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm start
```

## Documentation

- [Plan de développement](./PLAN_DE_DEVELOPPEMENT.md)
- [Cahier des charges](./Cahier%20des%20Charges%20et%20Spécifications%20Fonctionnelles%20V0%20du%2020122025.pdf)
- [Documentation technique](./docs/TECHNICAL.md)
- [Guide de contribution](./docs/CONTRIBUTING.md)

## Technologies utilisées

### Frontend
- React 18 + TypeScript
- Material-UI (MUI)
- Redux Toolkit
- React Query
- Chart.js

### Backend
- Node.js + Express + TypeScript
- Prisma ORM
- PostgreSQL
- Redis
- JWT Authentication

## Licence

Propriétaire - République de Djibouti - Ministère de l'Économie et des Finances
