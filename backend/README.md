# CDMT Backend API

API REST pour l'application de gestion du Cadre de Dépenses à Moyen Terme (CDMT)

## Technologies

- Node.js 18+
- TypeScript
- Express.js
- Prisma ORM
- PostgreSQL 15+
- Redis
- JWT Authentication

## Structure du projet

```
backend/
├── src/
│   ├── config/          # Configuration (database, logger, etc.)
│   ├── controllers/     # Contrôleurs (logique métier)
│   ├── middleware/      # Middleware (auth, error handling, etc.)
│   ├── models/          # Modèles (si nécessaire)
│   ├── routes/          # Routes API
│   ├── services/        # Services (business logic)
│   ├── utils/           # Utilitaires
│   ├── types/           # Types TypeScript
│   └── server.ts        # Point d'entrée
├── prisma/
│   ├── schema.prisma    # Schéma de base de données
│   └── seed.ts          # Données initiales
├── .env                 # Variables d'environnement
├── tsconfig.json        # Configuration TypeScript
└── package.json
```

## Installation

### 1. Installer les dépendances

```bash
npm install
```

### 2. Configurer PostgreSQL

#### Option A: Avec pgAdmin ou DBeaver
1. Ouvrir pgAdmin ou DBeaver
2. Se connecter avec:
   - Host: localhost
   - Port: 5432
   - User: postgres
   - Password: union
3. Créer une nouvelle base de données nommée: `cdmt_db`

#### Option B: En ligne de commande
```bash
# Ouvrir PowerShell en tant qu'administrateur
# Si psql est dans le PATH:
psql -U postgres

# Puis dans psql:
CREATE DATABASE cdmt_db;
\q
```

#### Option C: Avec le script SQL fourni
```bash
psql -U postgres -f setup-database.sql
```

### 3. Configuration de l'environnement

Le fichier `.env` est déjà créé avec la configuration par défaut. Vérifiez les valeurs:

```env
DATABASE_URL="postgresql://postgres:union@localhost:5432/cdmt_db?schema=public"
PORT=5000
NODE_ENV=development
```

### 4. Initialiser Prisma

```bash
# Générer le client Prisma
npm run prisma:generate

# Créer les migrations et initialiser la base de données
npm run prisma:migrate

# (Optionnel) Ouvrir Prisma Studio pour visualiser les données
npm run prisma:studio
```

## Commandes disponibles

```bash
# Développement (avec hot reload)
npm run dev

# Build pour production
npm run build

# Démarrer en production
npm start

# Tests
npm test
npm run test:watch

# Linting
npm run lint
npm run lint:fix

# Formatage du code
npm run format

# Prisma
npm run prisma:generate    # Générer le client Prisma
npm run prisma:migrate     # Créer/appliquer les migrations
npm run prisma:studio      # Ouvrir Prisma Studio
npm run prisma:seed        # Peupler la base de données
```

## Démarrage

### Mode développement

```bash
npm run dev
```

Le serveur démarre sur `http://localhost:5000`

### Endpoints disponibles

- `GET /health` - Vérifier l'état du serveur
- `GET /api/v1` - Informations sur l'API

## Base de données

### Modèle de données

Le schéma Prisma définit les tables suivantes:

**Utilisateurs et Accès:**
- `users` - Utilisateurs
- `roles` - Rôles
- `permissions` - Permissions
- `role_permissions` - Association rôles-permissions
- `audit_logs` - Logs d'audit

**Référentiels:**
- `ministries` - Ministères
- `programs` - Programmes
- `actions` - Actions
- `activities` - Activités
- `economic_categories` - Catégories économiques
- `financing_sources` - Sources de financement
- `functional_classifications` - Classifications fonctionnelles

**Cadre budgétaire:**
- `budget_years` - Années budgétaires
- `macro_frameworks` - Cadres macroéconomiques
- `baseline_budgets` - Budgets tendanciels
- `ministerial_ceilings` - Plafonds ministériels
- `cdmt_sectoral_documents` - Documents CDMT sectoriels

### Migrations

```bash
# Créer une nouvelle migration
npx prisma migrate dev --name nom_de_la_migration

# Appliquer les migrations en production
npx prisma migrate deploy

# Réinitialiser la base de données (ATTENTION: perte de données)
npx prisma migrate reset
```

### Seeds (Données initiales)

Pour peupler la base de données avec des données initiales:

```bash
npm run prisma:seed
```

## Logging

Les logs sont enregistrés dans le dossier `logs/`:
- `error.log` - Erreurs uniquement
- `combined.log` - Tous les logs
- `exceptions.log` - Exceptions non gérées
- `rejections.log` - Promesses rejetées

## Sécurité

- Authentification JWT
- Helmet.js pour les headers HTTP
- CORS configuré
- Rate limiting
- Validation des entrées
- Hachage des mots de passe (bcrypt)

## Variables d'environnement

Voir `.env.example` pour la liste complète des variables.

Variables principales:
- `NODE_ENV` - Environnement (development/production)
- `PORT` - Port du serveur
- `DATABASE_URL` - URL de connexion PostgreSQL
- `JWT_SECRET` - Clé secrète JWT
- `REDIS_HOST` - Hôte Redis
- `SMTP_*` - Configuration email

## Troubleshooting

### Erreur de connexion à PostgreSQL

```bash
# Vérifier que PostgreSQL est démarré
# Windows: Ouvrir Services et vérifier "postgresql-x64-15"

# Tester la connexion
psql -U postgres -d cdmt_db
```

### Erreur Prisma

```bash
# Régénérer le client Prisma
npm run prisma:generate

# Vérifier l'état des migrations
npx prisma migrate status
```

### Port déjà utilisé

```bash
# Changer le PORT dans .env
PORT=5001
```

## Support

Pour toute question ou problème, contactez l'équipe de développement.

---

Développé pour le Ministère de l'Économie et des Finances - République de Djibouti
