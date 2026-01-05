# Guide d'installation CDMT

Ce guide vous accompagne dans l'installation complète de l'application CDMT.

## Prérequis

### 1. Node.js et npm
- **Version requise:** Node.js 18 ou supérieur
- **Téléchargement:** https://nodejs.org/
- **Vérification:**
  ```bash
  node --version  # doit afficher v18.x.x ou supérieur
  npm --version   # doit afficher 9.x.x ou supérieur
  ```

### 2. PostgreSQL
- **Version requise:** PostgreSQL 15 ou supérieur
- **Téléchargement:** https://www.postgresql.org/download/windows/
- **Configuration:**
  - Utilisateur: `postgres`
  - Mot de passe: `union` (ou selon votre choix)
  - Port: `5432`

### 3. Docker Desktop (optionnel mais recommandé)
- **Téléchargement:** https://www.docker.com/products/docker-desktop
- **Utilité:** Pour Redis et éventuellement PostgreSQL
- **Vérification:**
  ```bash
  docker --version
  docker-compose --version
  ```

### 4. Git
- **Téléchargement:** https://git-scm.com/downloads
- **Vérification:**
  ```bash
  git --version
  ```

## Installation pas à pas

### Étape 1: Cloner le projet (si applicable)

```bash
git clone <repository-url>
cd CDMT
```

### Étape 2: Configuration PostgreSQL

#### Option A: Avec pgAdmin (GUI)
1. Ouvrir pgAdmin 4
2. Se connecter au serveur PostgreSQL
3. Clic droit sur "Databases" → "Create" → "Database"
4. Nom: `cdmt_db`
5. Owner: `postgres`
6. Cliquer sur "Save"

#### Option B: En ligne de commande

**Windows PowerShell:**
```powershell
# Chemin typique de psql sur Windows
cd "C:\Program Files\PostgreSQL\15\bin"
.\psql.exe -U postgres

# Dans psql:
CREATE DATABASE cdmt_db;
\l  # Vérifier que la base est créée
\q  # Quitter
```

**Avec le script fourni:**
```bash
cd D:\PROJETS_DEV\PROJET\CDMT\backend
psql -U postgres -f setup-database.sql
```

### Étape 3: Installation du Backend

```bash
cd backend

# Vérifier que .env existe et contient les bonnes valeurs
# Si besoin, copier depuis .env.example
# cp .env.example .env

# Installer les dépendances (déjà fait)
npm install

# Générer le client Prisma
npm run prisma:generate

# Créer les tables dans la base de données
npm run prisma:migrate
# Nom de la migration: init

# (Optionnel) Peupler avec des données initiales
npm run prisma:seed
```

### Étape 4: Démarrer Redis

#### Option A: Avec Docker (recommandé)
```bash
cd ..  # Retour à la racine du projet

# Démarrer Redis seul
docker-compose up -d redis

# Vérifier que Redis fonctionne
docker-compose ps
docker logs cdmt-redis
```

#### Option B: Installation native Windows
1. Télécharger Redis pour Windows: https://github.com/microsoftarchive/redis/releases
2. Installer et démarrer le service Redis

#### Option C: Sans Redis (mode développement)
- Commenter les parties Redis dans le code backend
- L'application fonctionnera sans cache

### Étape 5: Démarrer le Backend

```bash
cd backend

# Mode développement (avec hot reload)
npm run dev

# Le serveur devrait démarrer sur http://localhost:5000
# Vérifier: http://localhost:5000/health
```

### Étape 6: Installation du Frontend

```bash
cd ../frontend

# Installer les dépendances
npm install

# Créer le fichier .env si nécessaire
# echo "REACT_APP_API_URL=http://localhost:5000/api/v1" > .env

# Démarrer en mode développement
npm start

# L'application devrait s'ouvrir sur http://localhost:3000
```

## Vérification de l'installation

### 1. Backend
- ✅ URL: http://localhost:5000/health
- ✅ Réponse attendue:
  ```json
  {
    "status": "success",
    "message": "CDMT API is running",
    ...
  }
  ```

### 2. Base de données
```bash
# Se connecter à la base
psql -U postgres -d cdmt_db

# Lister les tables
\dt

# Devrait afficher les tables créées par Prisma
```

### 3. Redis
```bash
# Avec Docker
docker exec -it cdmt-redis redis-cli ping
# Réponse: PONG

# Ou
redis-cli ping
```

### 4. Frontend
- ✅ URL: http://localhost:3000
- ✅ L'interface devrait se charger

## Problèmes courants

### Erreur: Cannot find module

```bash
# Réinstaller les dépendances
npm install
```

### Erreur: Port already in use

```bash
# Backend: Changer le port dans backend/.env
PORT=5001

# Frontend: Utiliser un autre port
PORT=3001 npm start
```

### Erreur: PostgreSQL connection failed

1. Vérifier que PostgreSQL est démarré
   - Windows: Services → postgresql-x64-15 → Démarrer
2. Vérifier les credentials dans `backend/.env`
3. Tester la connexion:
   ```bash
   psql -U postgres -d cdmt_db
   ```

### Erreur: Prisma migration failed

```bash
cd backend

# Réinitialiser Prisma
npm run prisma:generate

# Recréer les migrations
npm run prisma:migrate

# En cas de problème persistant (ATTENTION: perte de données)
npx prisma migrate reset
```

### Docker ne démarre pas

1. Vérifier que Docker Desktop est démarré
2. Vérifier la configuration WSL2 (Windows)
3. Redémarrer Docker Desktop

## Structure finale

```
CDMT/
├── backend/          ✅ Backend API (Node.js)
├── frontend/         ✅ Frontend React
├── docs/             📚 Documentation
├── docker/           🐳 Configuration Docker
├── docker-compose.yml
├── README.md
└── PLAN_DE_DEVELOPPEMENT.md
```

## Prochaines étapes

Une fois l'installation terminée:

1. **Tester l'authentification**
   - Créer un utilisateur admin
   - Se connecter

2. **Configurer les référentiels**
   - Ajouter les ministères
   - Configurer les nomenclatures

3. **Commencer le développement**
   - Suivre le plan de développement
   - Implémenter les modules

## Support

Pour toute question:
- Consulter la documentation dans `docs/`
- Vérifier les logs: `backend/logs/`
- Contacter l'équipe de développement

---

Bonne installation ! 🚀
