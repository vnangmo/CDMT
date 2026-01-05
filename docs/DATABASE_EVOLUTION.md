# CDMT Application - Base de Données Évolutive

**Version du Document :** 1.0
**Dernière Mise à Jour :** 2026-01-05
**REQ-MAINT-02 :** Base de données évolutive

---

## Table des Matières

1. [Vue d'Ensemble](#1-vue-densemble)
2. [Architecture de la Base de Données](#2-architecture-de-la-base-de-données)
3. [Gestion des Migrations](#3-gestion-des-migrations)
4. [Modèle de Données](#4-modèle-de-données)
5. [Stratégies de Scalabilité](#5-stratégies-de-scalabilité)
6. [Optimisations de Performance](#6-optimisations-de-performance)
7. [Procédures d'Évolution](#7-procédures-dévolution)
8. [Maintenance et Monitoring](#8-maintenance-et-monitoring)

---

## 1. Vue d'Ensemble

### 1.1 Technologie

| Composant | Technologie | Version |
|-----------|-------------|---------|
| SGBD | PostgreSQL | 16.x |
| ORM | Prisma | 6.x |
| Cache | Redis | 7.x |
| Backup | pg_dump + S3 | - |

### 1.2 Caractéristiques

- **Type** : Base de données relationnelle
- **Schéma** : Normalisé (3NF)
- **Transactions** : ACID compliant
- **Encoding** : UTF-8
- **Timezone** : UTC

### 1.3 Statistiques Actuelles

| Métrique | Valeur |
|----------|--------|
| Tables | 35+ |
| Relations | 60+ |
| Volume estimé (5 ans) | 50 GB |
| Requêtes/jour | ~10,000 |

---

## 2. Architecture de la Base de Données

### 2.1 Schéma Conceptuel

```
┌─────────────────────────────────────────────────────────────────────┐
│                    DATABASE ARCHITECTURE                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                    CORE ENTITIES                             │    │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐         │    │
│  │  │  Users  │  │  Roles  │  │Ministry │  │ Program │         │    │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘         │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                              │                                       │
│                              ▼                                       │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                   BUDGET ENTITIES                            │    │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐         │    │
│  │  │  TOFE   │  │  CBMT   │  │  CDMT   │  │Trending │         │    │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘         │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                              │                                       │
│                              ▼                                       │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                  WORKFLOW ENTITIES                           │    │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐         │    │
│  │  │Document │  │Workflow │  │Comments │  │ Notifs  │         │    │
│  │  │ Version │  │ History │  │         │  │         │         │    │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘         │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                              │                                       │
│                              ▼                                       │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                   AUDIT ENTITIES                             │    │
│  │  ┌─────────────────────────────────────────────────────┐    │    │
│  │  │                    AuditLog                          │    │    │
│  │  │  Traçabilité complète de toutes les opérations       │    │    │
│  │  └─────────────────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Groupes de Tables

| Groupe | Tables | Description |
|--------|--------|-------------|
| **Core** | users, roles, permissions | Authentification et autorisations |
| **Référentiels** | ministries, programs, actions | Données de référence |
| **Budget** | fiscal_years, document_versions | Gestion budgétaire |
| **TOFE** | tofe_entries, revenue_projections | Opérations financières |
| **CBMT** | ministerial_ceilings, expense_projections | Cadre budgétaire |
| **CDMT** | cdmt_sectoral_documents, trend_projections | CDMT sectoriels |
| **Measures** | sectoral_measures, action_plans | Mesures nouvelles |
| **Projects** | pie_projects, pip_projects | Investissements |
| **Workflow** | workflow_history, comments | Processus validation |
| **Audit** | audit_logs, notifications | Traçabilité |
| **Settings** | app_settings, user_settings | Configuration |

---

## 3. Gestion des Migrations

### 3.1 Outil de Migration : Prisma Migrate

Prisma Migrate permet de gérer les évolutions du schéma de manière versionnée et reproductible.

### 3.2 Workflow de Migration

```
┌─────────────────────────────────────────────────────────────────────┐
│                    MIGRATION WORKFLOW                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. DÉVELOPPEMENT                                                    │
│     │                                                                │
│     ├── Modifier schema.prisma                                       │
│     │   model NewEntity {                                           │
│     │     id    String @id @default(uuid())                         │
│     │     name  String                                              │
│     │   }                                                           │
│     │                                                                │
│     ├── Générer la migration                                        │
│     │   $ npx prisma migrate dev --name add_new_entity              │
│     │                                                                │
│     └── Vérifier les fichiers générés                               │
│         prisma/migrations/20260105_add_new_entity/migration.sql     │
│                                                                      │
│  2. REVIEW                                                           │
│     │                                                                │
│     ├── Code review de la migration                                 │
│     ├── Vérifier les impacts sur les données existantes             │
│     └── Tester en environnement de staging                          │
│                                                                      │
│  3. DÉPLOIEMENT                                                      │
│     │                                                                │
│     ├── Appliquer la migration                                      │
│     │   $ npx prisma migrate deploy                                 │
│     │                                                                │
│     └── Régénérer le client Prisma                                  │
│         $ npx prisma generate                                       │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.3 Commandes Prisma

| Commande | Description | Environnement |
|----------|-------------|---------------|
| `prisma migrate dev` | Créer et appliquer migration | Dev |
| `prisma migrate deploy` | Appliquer migrations en prod | Prod |
| `prisma migrate status` | Vérifier l'état des migrations | Tous |
| `prisma migrate reset` | Réinitialiser la base | Dev uniquement |
| `prisma db push` | Sync sans migration | Dev/Prototypage |
| `prisma generate` | Générer le client | Tous |

### 3.4 Structure des Migrations

```
prisma/
├── schema.prisma           # Schéma actuel
├── migrations/
│   ├── 20260101000000_initial/
│   │   └── migration.sql
│   ├── 20260115000000_add_2fa/
│   │   └── migration.sql
│   ├── 20260120000000_add_measures/
│   │   └── migration.sql
│   └── migration_lock.toml
└── seed.ts                 # Données initiales
```

### 3.5 Bonnes Pratiques

1. **Ne jamais modifier une migration déjà appliquée** en production
2. **Toujours inclure des migrations down** pour le rollback
3. **Tester les migrations** sur une copie de la production
4. **Documenter les breaking changes**
5. **Faire des backups avant chaque migration**

---

## 4. Modèle de Données

### 4.1 Entités Principales

#### Users
```prisma
model User {
  id                    String            @id @default(uuid())
  email                 String            @unique
  password              String
  firstName             String
  lastName              String
  phone                 String?
  isActive              Boolean           @default(true)
  roleId                String
  ministryId            String?
  createdAt             DateTime          @default(now())
  updatedAt             DateTime          @updatedAt
  lastLogin             DateTime?
  twoFactorEnabled      Boolean           @default(false)
  twoFactorSecret       String?
  twoFactorBackupCodes  String[]

  role                  Role              @relation(...)
  ministry              Ministry?         @relation(...)
  auditLogs             AuditLog[]
  notifications         Notification[]

  @@map("users")
}
```

#### Ministry
```prisma
model Ministry {
  id                  String                 @id @default(uuid())
  code                String                 @unique
  name                String
  nameAr              String?
  nameEn              String?
  description         String?
  isPriority          Boolean                @default(false)
  isActive            Boolean                @default(true)
  createdAt           DateTime               @default(now())
  updatedAt           DateTime               @updatedAt

  programs            Program[]
  users               User[]
  expenseProjections  ExpenseProjection[]
  ministerialCeilings MinisterialCeiling[]
  sectoralMeasures    SectoralMeasure[]

  @@map("ministries")
}
```

#### DocumentVersion
```prisma
model DocumentVersion {
  id              String           @id @default(uuid())
  fiscalYearId    String
  documentType    DocumentType
  version         Int
  status          DocumentStatus   @default(DRAFT)
  createdBy       String
  submittedAt     DateTime?
  validatedAt     DateTime?
  validatedBy     String?
  rejectedAt      DateTime?
  rejectedBy      String?
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt

  fiscalYear      FiscalYear       @relation(...)
  workflowHistory WorkflowHistory[]
  comments        Comment[]

  @@unique([fiscalYearId, documentType, version])
  @@map("document_versions")
}
```

### 4.2 Relations

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ENTITY RELATIONSHIPS                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  User ──────┬──────> Role ────────> Permission                      │
│             │                                                        │
│             └──────> Ministry ────> Program ────> Action            │
│                          │              │            │               │
│                          │              │            ▼               │
│                          │              │        Activity            │
│                          │              │                            │
│                          ▼              ▼                            │
│                   SectoralMeasure   Objective ───> Indicator        │
│                          │                                           │
│                          ▼                                           │
│                     ActionPlan                                       │
│                                                                      │
│  FiscalYear ────> DocumentVersion ────> WorkflowHistory             │
│       │                   │                                          │
│       │                   └────────────> Comment                     │
│       │                                                              │
│       ├────> TOFE                                                    │
│       ├────> CBMT                                                    │
│       └────> CDMTGlobal                                              │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.3 Types et Enums

```prisma
enum DocumentStatus {
  DRAFT
  SUBMITTED
  UNDER_REVIEW
  VALIDATED
  REJECTED
}

enum DocumentType {
  TOFE
  CBMT
  CDMT_GLOBAL
  CDMT_SECTORAL
}

enum MeasureType {
  OPERATING
  INVESTMENT
}

enum MeasureStatus {
  PENDING
  APPROVED
  REJECTED
}
```

---

## 5. Stratégies de Scalabilité

### 5.1 Scalabilité Verticale

Augmentation des ressources du serveur :

| Charge | CPU | RAM | Storage |
|--------|-----|-----|---------|
| Légère (< 100 users) | 2 vCPU | 4 GB | 50 GB SSD |
| Moyenne (100-500 users) | 4 vCPU | 8 GB | 100 GB SSD |
| Forte (500+ users) | 8 vCPU | 16 GB | 250 GB SSD |

### 5.2 Scalabilité Horizontale

Pour une charge très élevée :

```
┌─────────────────────────────────────────────────────────────────────┐
│                    HORIZONTAL SCALING                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│                         Load Balancer                                │
│                              │                                       │
│              ┌───────────────┼───────────────┐                       │
│              │               │               │                       │
│              ▼               ▼               ▼                       │
│        ┌─────────┐     ┌─────────┐     ┌─────────┐                  │
│        │ Backend │     │ Backend │     │ Backend │                  │
│        │    1    │     │    2    │     │    3    │                  │
│        └────┬────┘     └────┬────┘     └────┬────┘                  │
│             │               │               │                        │
│             └───────────────┼───────────────┘                        │
│                             │                                        │
│                             ▼                                        │
│                    ┌─────────────────┐                               │
│                    │  Redis Cluster  │                               │
│                    │    (Cache)      │                               │
│                    └────────┬────────┘                               │
│                             │                                        │
│                             ▼                                        │
│              ┌──────────────────────────────┐                        │
│              │       PostgreSQL             │                        │
│              │  ┌─────────┐  ┌─────────┐   │                        │
│              │  │ Primary │──│ Replica │   │                        │
│              │  └─────────┘  └─────────┘   │                        │
│              └──────────────────────────────┘                        │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 5.3 Réplication PostgreSQL

**Configuration Primary-Replica :**

```sql
-- Sur le primary (postgresql.conf)
wal_level = replica
max_wal_senders = 3
wal_keep_size = 128MB

-- Sur le replica
hot_standby = on
```

### 5.4 Partitionnement des Tables

Pour les tables volumineuses (audit_logs) :

```sql
-- Partitionnement par date
CREATE TABLE audit_logs (
    id UUID NOT NULL,
    user_id UUID,
    action VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    ...
) PARTITION BY RANGE (created_at);

-- Partitions mensuelles
CREATE TABLE audit_logs_2026_01 PARTITION OF audit_logs
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

CREATE TABLE audit_logs_2026_02 PARTITION OF audit_logs
    FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
```

---

## 6. Optimisations de Performance

### 6.1 Index Stratégiques

```prisma
model AuditLog {
  id        String   @id @default(uuid())
  userId    String
  action    String
  entity    String
  entityId  String?
  createdAt DateTime @default(now())

  @@index([userId])           // Recherche par utilisateur
  @@index([entity, entityId]) // Recherche par entité
  @@index([createdAt])        // Recherche par date
  @@map("audit_logs")
}

model DocumentVersion {
  id           String @id @default(uuid())
  fiscalYearId String
  documentType DocumentType
  status       DocumentStatus

  @@index([fiscalYearId, status])  // Filtrage courant
  @@map("document_versions")
}
```

### 6.2 Requêtes Optimisées

```typescript
// ❌ N+1 Problem
const ministries = await prisma.ministry.findMany();
for (const ministry of ministries) {
  const programs = await prisma.program.findMany({
    where: { ministryId: ministry.id }
  });
}

// ✅ Eager Loading
const ministries = await prisma.ministry.findMany({
  include: {
    programs: {
      include: {
        actions: true
      }
    }
  }
});
```

### 6.3 Caching avec Redis

```typescript
// Pattern de cache
class CacheService {
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number = 300
  ): Promise<T> {
    // Vérifier le cache
    const cached = await redis.get(key);
    if (cached) return JSON.parse(cached);

    // Récupérer et mettre en cache
    const data = await fetchFn();
    await redis.setex(key, ttl, JSON.stringify(data));
    return data;
  }
}

// Utilisation
const ministries = await cacheService.getOrSet(
  'ministries:active',
  () => prisma.ministry.findMany({ where: { isActive: true } }),
  3600 // 1 heure
);
```

### 6.4 Configuration PostgreSQL

```ini
# postgresql.conf - Optimisations
shared_buffers = 256MB            # 25% de la RAM
effective_cache_size = 768MB      # 75% de la RAM
work_mem = 16MB                   # Pour les opérations de tri
maintenance_work_mem = 128MB      # Pour VACUUM, CREATE INDEX
random_page_cost = 1.1            # Pour SSD
effective_io_concurrency = 200    # Pour SSD
```

---

## 7. Procédures d'Évolution

### 7.1 Ajouter une Nouvelle Table

**Étape 1 : Définir le modèle**
```prisma
// schema.prisma
model Grant {
  id          String   @id @default(uuid())
  name        String
  amount      Decimal  @db.Decimal(15, 2)
  ministryId  String
  fiscalYearId String
  status      GrantStatus @default(PENDING)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  ministry    Ministry   @relation(fields: [ministryId], references: [id])
  fiscalYear  FiscalYear @relation(fields: [fiscalYearId], references: [id])

  @@index([ministryId, fiscalYearId])
  @@map("grants")
}

enum GrantStatus {
  PENDING
  APPROVED
  DISBURSED
}
```

**Étape 2 : Créer la migration**
```bash
npx prisma migrate dev --name add_grants_table
```

**Étape 3 : Vérifier la migration générée**
```sql
-- migration.sql
CREATE TYPE "GrantStatus" AS ENUM ('PENDING', 'APPROVED', 'DISBURSED');

CREATE TABLE "grants" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "ministryId" UUID NOT NULL,
    "fiscalYearId" UUID NOT NULL,
    "status" "GrantStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grants_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "grants_ministryId_fiscalYearId_idx"
    ON "grants"("ministryId", "fiscalYearId");

ALTER TABLE "grants"
    ADD CONSTRAINT "grants_ministryId_fkey"
    FOREIGN KEY ("ministryId") REFERENCES "ministries"("id");

ALTER TABLE "grants"
    ADD CONSTRAINT "grants_fiscalYearId_fkey"
    FOREIGN KEY ("fiscalYearId") REFERENCES "fiscal_years"("id");
```

### 7.2 Modifier une Table Existante

**Ajout d'une colonne :**
```prisma
model Ministry {
  // ... existing fields
  budgetCode    String?   // Nouvelle colonne optionnelle
  sortOrder     Int       @default(0) // Avec valeur par défaut
}
```

**Migration générée :**
```sql
ALTER TABLE "ministries" ADD COLUMN "budgetCode" TEXT;
ALTER TABLE "ministries" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;
```

### 7.3 Migration de Données

Pour des migrations complexes avec transformation de données :

```typescript
// prisma/migrations/20260120_migrate_data.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Migrer les données
  const oldRecords = await prisma.oldTable.findMany();

  for (const record of oldRecords) {
    await prisma.newTable.create({
      data: {
        id: record.id,
        name: record.oldName, // Renommage
        value: record.oldValue * 100, // Transformation
      }
    });
  }

  console.log(`Migrated ${oldRecords.length} records`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

### 7.4 Rollback de Migration

```bash
# Voir l'historique
npx prisma migrate status

# Rollback manuel (créer une migration inverse)
npx prisma migrate dev --name rollback_feature_x

# Contenu de la migration de rollback
# ALTER TABLE ... DROP COLUMN ...
# DROP TABLE IF EXISTS ...
```

---

## 8. Maintenance et Monitoring

### 8.1 Tâches de Maintenance

| Tâche | Fréquence | Commande |
|-------|-----------|----------|
| VACUUM ANALYZE | Quotidienne | `VACUUM ANALYZE;` |
| REINDEX | Hebdomadaire | `REINDEX DATABASE cdmt_db;` |
| Backup | Quotidienne | `pg_dump -Fc cdmt_db > backup.dump` |
| Purge audit_logs | Mensuelle | Script personnalisé |

### 8.2 Monitoring des Performances

**Requêtes lentes :**
```sql
-- Activer le log des requêtes lentes
ALTER SYSTEM SET log_min_duration_statement = 1000; -- 1 seconde

-- Consulter les statistiques
SELECT
    query,
    calls,
    total_time / 1000 as total_seconds,
    mean_time / 1000 as avg_seconds
FROM pg_stat_statements
ORDER BY total_time DESC
LIMIT 10;
```

**Taille des tables :**
```sql
SELECT
    relname AS table_name,
    pg_size_pretty(pg_total_relation_size(relid)) AS total_size,
    pg_size_pretty(pg_relation_size(relid)) AS table_size,
    pg_size_pretty(pg_indexes_size(relid)) AS index_size
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC;
```

### 8.3 Alertes

| Métrique | Seuil | Action |
|----------|-------|--------|
| Connections | > 80% max | Alerte email |
| Disk usage | > 80% | Alerte urgente |
| Slow queries | > 10/min | Investigation |
| Replication lag | > 60s | Alerte urgente |

### 8.4 Script de Santé

```bash
#!/bin/bash
# health_check.sh

# Vérifier la connexion
psql -U postgres -d cdmt_db -c "SELECT 1;" > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "ERROR: Database connection failed"
    exit 1
fi

# Vérifier l'espace disque
DISK_USAGE=$(df -h /var/lib/postgresql | awk 'NR==2 {print $5}' | tr -d '%')
if [ $DISK_USAGE -gt 80 ]; then
    echo "WARNING: Disk usage at ${DISK_USAGE}%"
fi

# Vérifier les connexions
CONNECTIONS=$(psql -U postgres -d cdmt_db -t -c \
    "SELECT count(*) FROM pg_stat_activity;")
MAX_CONNECTIONS=$(psql -U postgres -d cdmt_db -t -c \
    "SHOW max_connections;")

echo "Connections: ${CONNECTIONS}/${MAX_CONNECTIONS}"
echo "Database health check: OK"
```

---

## Annexes

### A. Conventions de Nommage

| Élément | Convention | Exemple |
|---------|------------|---------|
| Tables | snake_case pluriel | `audit_logs` |
| Colonnes | camelCase | `fiscalYearId` |
| Clés primaires | `id` (UUID) | `id` |
| Clés étrangères | `entityId` | `ministryId` |
| Index | `table_columns_idx` | `users_email_idx` |
| Contraintes | `table_type_column` | `users_pk`, `users_fk_role` |

### B. Checklist Avant Migration en Production

- [ ] Backup complet effectué
- [ ] Migration testée en staging
- [ ] Temps d'exécution estimé
- [ ] Plan de rollback préparé
- [ ] Équipe informée
- [ ] Fenêtre de maintenance planifiée
- [ ] Monitoring activé

### C. Documentation Associée

- [Technical Documentation](./TECHNICAL.md)
- [Architecture Guide](./ARCHITECTURE.md)
- [Backup Strategy](../backend/docs/BACKUP_STRATEGY.md)

---

**Propriétaire du Document :** Équipe Base de Données
**Approuvé Par :** DBA Principal
**Prochaine Révision :** 2026-04-01
