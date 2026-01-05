# CDMT Application - Architecture Modulaire

**Version du Document :** 1.0
**Dernière Mise à Jour :** 2026-01-05
**REQ-MAINT-02 :** Architecture modulaire

---

## Table des Matières

1. [Vue d'Ensemble](#1-vue-densemble)
2. [Principes Architecturaux](#2-principes-architecturaux)
3. [Architecture Backend](#3-architecture-backend)
4. [Architecture Frontend](#4-architecture-frontend)
5. [Modules Fonctionnels](#5-modules-fonctionnels)
6. [Patterns et Bonnes Pratiques](#6-patterns-et-bonnes-pratiques)
7. [Extensibilité](#7-extensibilité)
8. [Intégrations](#8-intégrations)

---

## 1. Vue d'Ensemble

### 1.1 Architecture Globale

L'application CDMT suit une **architecture en couches** avec une séparation claire entre le frontend et le backend, communiquant via une **API REST**.

```
┌─────────────────────────────────────────────────────────────────────┐
│                      ARCHITECTURE CDMT                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                    PRESENTATION LAYER                        │    │
│  │  ┌─────────────────────────────────────────────────────┐    │    │
│  │  │                    REACT FRONTEND                    │    │    │
│  │  │  Components │ Pages │ Hooks │ Services │ Store      │    │    │
│  │  └─────────────────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                              │ HTTP/REST                             │
│                              ▼                                       │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                      API LAYER                               │    │
│  │  ┌─────────────────────────────────────────────────────┐    │    │
│  │  │                  EXPRESS ROUTES                      │    │    │
│  │  │  Auth │ Ministries │ TOFE │ CBMT │ CDMT │ ...       │    │    │
│  │  └─────────────────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                              │                                       │
│                              ▼                                       │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                    BUSINESS LAYER                            │    │
│  │  ┌─────────────────────────────────────────────────────┐    │    │
│  │  │                    SERVICES                          │    │    │
│  │  │  AuthService │ TOFEService │ CBMTService │ ...      │    │    │
│  │  └─────────────────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                              │                                       │
│                              ▼                                       │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                     DATA LAYER                               │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │    │
│  │  │   Prisma    │  │    Redis    │  │    Files    │          │    │
│  │  │   (ORM)     │  │   (Cache)   │  │  (Storage)  │          │    │
│  │  └──────┬──────┘  └─────────────┘  └─────────────┘          │    │
│  │         │                                                    │    │
│  │         ▼                                                    │    │
│  │  ┌─────────────┐                                            │    │
│  │  │ PostgreSQL  │                                            │    │
│  │  └─────────────┘                                            │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.2 Stack Technologique

| Couche | Technologie | Responsabilité |
|--------|-------------|----------------|
| Frontend | React 19 + TypeScript | Interface utilisateur |
| UI Components | Material-UI 7 | Composants visuels |
| State | Redux Toolkit + React Query | Gestion d'état |
| API Gateway | Express 4 | Routing, middleware |
| Business Logic | TypeScript Services | Logique métier |
| ORM | Prisma 6 | Accès données |
| Database | PostgreSQL 16 | Persistance |
| Cache | Redis 7 | Performance |

---

## 2. Principes Architecturaux

### 2.1 Séparation des Préoccupations (SoC)

Chaque couche a une responsabilité unique et bien définie :

```
┌─────────────────────────────────────────────────────────────────────┐
│                 SEPARATION OF CONCERNS                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ROUTES (routes/*.ts)                                                │
│  └── Définition des endpoints                                        │
│  └── Application des middlewares                                     │
│  └── Validation des requêtes                                         │
│                                                                      │
│  CONTROLLERS (controllers/*.ts)                                      │
│  └── Réception des requêtes HTTP                                     │
│  └── Extraction des paramètres                                       │
│  └── Formatage des réponses                                          │
│                                                                      │
│  SERVICES (services/*.ts)                                            │
│  └── Logique métier                                                  │
│  └── Orchestration des opérations                                    │
│  └── Gestion du cache                                                │
│                                                                      │
│  REPOSITORIES (via Prisma)                                           │
│  └── Requêtes base de données                                        │
│  └── Mapping des entités                                             │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Injection de Dépendances

Les services sont injectés via des imports statiques, permettant le remplacement facile pour les tests :

```typescript
// Service avec dépendances injectables
export class TOFEService {
  constructor(
    private prisma: PrismaClient = prismaClient,
    private cache: CacheService = cacheService,
    private audit: AuditService = auditService
  ) {}

  async getByFiscalYear(fiscalYearId: string) {
    // Vérifie le cache d'abord
    const cached = await this.cache.get(`tofe:${fiscalYearId}`);
    if (cached) return cached;

    // Sinon, requête DB
    const data = await this.prisma.tofe.findUnique({
      where: { fiscalYearId }
    });

    // Met en cache
    await this.cache.set(`tofe:${fiscalYearId}`, data, 300);
    return data;
  }
}
```

### 2.3 Modularité

L'application est découpée en **modules indépendants** qui peuvent être :
- Développés séparément
- Testés en isolation
- Déployés indépendamment (si besoin)

```
backend/src/
├── modules/
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.routes.ts
│   │   └── auth.types.ts
│   ├── tofe/
│   │   ├── tofe.controller.ts
│   │   ├── tofe.service.ts
│   │   ├── tofe.routes.ts
│   │   └── tofe.types.ts
│   ├── cbmt/
│   │   └── ...
│   └── cdmt/
│       └── ...
```

---

## 3. Architecture Backend

### 3.1 Structure des Dossiers

```
backend/
├── prisma/
│   ├── schema.prisma          # Schéma de base de données
│   ├── migrations/            # Historique des migrations
│   └── seed.ts                # Données initiales
├── src/
│   ├── config/                # Configuration
│   │   ├── config.ts          # Variables d'environnement
│   │   ├── database.ts        # Connexion Prisma
│   │   ├── redis.ts           # Connexion Redis
│   │   └── logger.ts          # Configuration logs
│   ├── controllers/           # Gestionnaires de requêtes
│   ├── services/              # Logique métier
│   ├── routes/                # Définition des routes
│   ├── middleware/            # Middleware Express
│   │   ├── auth.middleware.ts
│   │   ├── rbac.middleware.ts
│   │   ├── rateLimiter.ts
│   │   ├── audit.middleware.ts
│   │   ├── csrf.middleware.ts
│   │   └── errorHandler.ts
│   ├── types/                 # Types TypeScript
│   ├── utils/                 # Fonctions utilitaires
│   ├── schedulers/            # Tâches planifiées
│   └── server.ts              # Point d'entrée
├── tests/                     # Tests unitaires et intégration
├── scripts/                   # Scripts de maintenance
└── docs/                      # Documentation
```

### 3.2 Flux de Requête

```
┌─────────────────────────────────────────────────────────────────────┐
│                      REQUEST LIFECYCLE                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. CLIENT REQUEST                                                   │
│     │ POST /api/v1/tofe                                             │
│     │ Headers: Authorization: Bearer <token>                         │
│     │ Body: { fiscalYearId: "...", data: {...} }                    │
│     ▼                                                                │
│  2. EXPRESS MIDDLEWARE CHAIN                                         │
│     │                                                                │
│     ├── helmet()           → Security headers                       │
│     ├── cors()             → CORS validation                        │
│     ├── rateLimit()        → Rate limiting check                    │
│     ├── bodyParser()       → Parse JSON body                        │
│     ├── authenticate()     → JWT verification                       │
│     ├── checkPermission()  → RBAC authorization                     │
│     └── auditContext()     → Set audit context                      │
│     │                                                                │
│     ▼                                                                │
│  3. ROUTE HANDLER                                                    │
│     │ router.post('/', TOFEController.create)                       │
│     ▼                                                                │
│  4. CONTROLLER                                                       │
│     │ Extract params, call service                                  │
│     │ const result = await TOFEService.create(data)                 │
│     ▼                                                                │
│  5. SERVICE                                                          │
│     │ Business logic, validation                                     │
│     │ await prisma.tofe.create({ data })                            │
│     │ await cache.invalidate('tofe:*')                              │
│     │ await audit.log('CREATE', 'TOFE', id)                         │
│     ▼                                                                │
│  6. RESPONSE                                                         │
│     │ res.status(201).json({ success: true, data: result })         │
│     ▼                                                                │
│  7. ERROR HANDLER (if error)                                         │
│     │ errorHandler(err, req, res, next)                             │
│     │ Log error, return formatted response                          │
│     ▼                                                                │
│  8. CLIENT RESPONSE                                                  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.3 Middleware Pipeline

| Ordre | Middleware | Fonction |
|-------|------------|----------|
| 1 | `helmet` | Headers de sécurité |
| 2 | `cors` | Cross-Origin Resource Sharing |
| 3 | `compression` | Compression gzip |
| 4 | `bodyParser` | Parsing JSON/URL-encoded |
| 5 | `cookieParser` | Parsing des cookies |
| 6 | `rateLimiter` | Limitation du taux de requêtes |
| 7 | `authenticate` | Vérification JWT |
| 8 | `checkPermission` | Contrôle RBAC |
| 9 | `auditContext` | Contexte pour l'audit |
| 10 | `csrf` | Protection CSRF |
| 11 | Routes | Handlers de route |
| 12 | `errorHandler` | Gestion des erreurs |

---

## 4. Architecture Frontend

### 4.1 Structure des Dossiers

```
frontend/src/
├── components/               # Composants réutilisables
│   ├── common/               # Boutons, inputs, modals
│   ├── layout/               # Header, Sidebar, Footer
│   ├── forms/                # Formulaires génériques
│   └── tables/               # Tableaux de données
├── pages/                    # Pages (routes)
│   ├── Dashboard/
│   ├── TOFE/
│   ├── CBMT/
│   ├── CDMTGlobal/
│   ├── CDMTSectoral/
│   ├── Administration/
│   └── Settings/
├── services/                 # Appels API
│   ├── api.ts                # Instance Axios
│   ├── authService.ts
│   ├── tofeService.ts
│   └── ...
├── store/                    # Redux store
│   ├── index.ts
│   ├── authSlice.ts
│   ├── uiSlice.ts
│   └── ...
├── hooks/                    # Custom hooks
│   ├── useAuth.ts
│   ├── usePermissions.ts
│   └── useNotifications.ts
├── types/                    # Types TypeScript
├── utils/                    # Utilitaires
├── i18n/                     # Internationalisation
├── styles/                   # Styles globaux
│   ├── responsive.css
│   ├── print.css
│   └── rtl.css
└── App.tsx                   # Composant racine
```

### 4.2 State Management

```
┌─────────────────────────────────────────────────────────────────────┐
│                    STATE MANAGEMENT STRATEGY                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                     REDUX STORE                              │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │    │
│  │  │ authSlice   │  │  uiSlice    │  │ settingsSlice│         │    │
│  │  │ • user      │  │ • theme     │  │ • language  │          │    │
│  │  │ • token     │  │ • sidebar   │  │ • prefs     │          │    │
│  │  │ • isLogged  │  │ • loading   │  │             │          │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘          │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                   REACT QUERY                                │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │    │
│  │  │ useQuery    │  │ useMutation │  │ useInfinite │          │    │
│  │  │ • TOFE data │  │ • create    │  │ • lists     │          │    │
│  │  │ • CBMT data │  │ • update    │  │ • paginated │          │    │
│  │  │ • cached    │  │ • delete    │  │             │          │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘          │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                   LOCAL STATE                                │    │
│  │  • useState for form inputs                                  │    │
│  │  • useReducer for complex forms                              │    │
│  │  • Context for theme/language                                │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.3 Component Architecture

```typescript
// Page Component Pattern
const TOFEPage: React.FC = () => {
  // 1. Hooks en premier
  const { t } = useTranslation();
  const { hasPermission } = usePermissions();
  const { data, isLoading, error } = useQuery(['tofe'], fetchTOFE);

  // 2. État local
  const [selectedYear, setSelectedYear] = useState<string>('');

  // 3. Handlers
  const handleExport = useCallback(() => {
    // ...
  }, []);

  // 4. Rendu conditionnel
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  // 5. Rendu principal
  return (
    <PageLayout title={t('tofe.title')}>
      <TOFEToolbar onExport={handleExport} />
      <TOFETable data={data} />
    </PageLayout>
  );
};
```

---

## 5. Modules Fonctionnels

### 5.1 Liste des Modules

| Module | Description | Routes API |
|--------|-------------|------------|
| **Auth** | Authentification, 2FA | `/api/v1/auth` |
| **Users** | Gestion utilisateurs | `/api/v1/users` |
| **Roles** | Rôles et permissions | `/api/v1/roles` |
| **Ministries** | Référentiel ministères | `/api/v1/ministries` |
| **Programs** | Structure programmatique | `/api/v1/programmatic-structure` |
| **FiscalYears** | Années fiscales | `/api/v1/fiscal-years` |
| **TOFE** | Opérations financières | `/api/v1/tofe` |
| **CBMT** | Cadre budgétaire | `/api/v1/cbmt` |
| **CDMTGlobal** | CDMT consolidé | `/api/v1/cdmt-global` |
| **SectoralTrend** | Budget tendanciel | `/api/v1/sectoral-trends` |
| **Measures** | Mesures nouvelles | `/api/v1/sectoral-measures` |
| **ActionPlans** | Plans d'action | `/api/v1/action-plans` |
| **Workflow** | Validation documents | `/api/v1/workflow` |
| **Notifications** | Alertes utilisateurs | `/api/v1/notifications` |
| **AuditLogs** | Journal d'audit | `/api/v1/audit-logs` |
| **Dashboard** | Tableau de bord | `/api/v1/dashboard` |
| **Export** | Génération rapports | `/api/v1/export` |
| **Import** | Import Excel | `/api/v1/import` |

### 5.2 Dépendances entre Modules

```
┌─────────────────────────────────────────────────────────────────────┐
│                    MODULE DEPENDENCIES                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│                         ┌──────────┐                                 │
│                         │   Auth   │                                 │
│                         └────┬─────┘                                 │
│                              │                                       │
│                              ▼                                       │
│                         ┌──────────┐                                 │
│                         │  Users   │◀────────────────┐               │
│                         └────┬─────┘                 │               │
│                              │                       │               │
│          ┌───────────────────┼───────────────────────┤               │
│          │                   │                       │               │
│          ▼                   ▼                       ▼               │
│    ┌──────────┐        ┌──────────┐           ┌──────────┐          │
│    │  Roles   │        │Ministries│           │ AuditLogs│          │
│    └──────────┘        └────┬─────┘           └──────────┘          │
│                              │                                       │
│          ┌───────────────────┼───────────────────┐                   │
│          │                   │                   │                   │
│          ▼                   ▼                   ▼                   │
│    ┌──────────┐        ┌──────────┐        ┌──────────┐             │
│    │ Programs │        │   TOFE   │        │   CBMT   │             │
│    └────┬─────┘        └──────────┘        └────┬─────┘             │
│         │                                       │                    │
│         │              ┌────────────────────────┘                    │
│         │              │                                             │
│         ▼              ▼                                             │
│    ┌──────────────────────────┐                                      │
│    │      CDMT Global         │                                      │
│    └────────────┬─────────────┘                                      │
│                 │                                                    │
│    ┌────────────┼────────────┐                                       │
│    │            │            │                                       │
│    ▼            ▼            ▼                                       │
│ ┌────────┐ ┌────────┐ ┌──────────┐                                   │
│ │Workflow│ │ Export │ │Dashboard │                                   │
│ └────────┘ └────────┘ └──────────┘                                   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 6. Patterns et Bonnes Pratiques

### 6.1 Design Patterns Utilisés

| Pattern | Utilisation |
|---------|-------------|
| **Repository** | Accès aux données via Prisma |
| **Service Layer** | Logique métier isolée |
| **Factory** | Création d'objets complexes |
| **Observer** | Système de notifications |
| **Strategy** | Calculs de projection |
| **Decorator** | Middleware Express |
| **Singleton** | Connexions DB/Redis |

### 6.2 Conventions de Code

**Nommage :**
```typescript
// Classes: PascalCase
class MinistryService {}

// Interfaces: PascalCase avec préfixe I
interface IMinistry {}

// Fonctions: camelCase
function calculateTrend() {}

// Constantes: SCREAMING_SNAKE_CASE
const MAX_RETRIES = 3;

// Fichiers: kebab-case ou camelCase
// ministry.service.ts ou ministryService.ts
```

**Structure de Service :**
```typescript
export class ExampleService {
  // 1. Propriétés statiques
  private static readonly CACHE_TTL = 300;

  // 2. Constructeur avec DI
  constructor(
    private prisma: PrismaClient,
    private cache: CacheService
  ) {}

  // 3. Méthodes publiques
  async findAll(): Promise<Example[]> {
    return this.prisma.example.findMany();
  }

  // 4. Méthodes privées
  private validateData(data: unknown): boolean {
    return true;
  }
}
```

### 6.3 Gestion des Erreurs

```typescript
// Erreurs métier personnalisées
export class BusinessError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'BusinessError';
  }
}

// Utilisation dans un service
if (amount > ceiling) {
  throw new BusinessError(
    'Le montant dépasse le plafond CBMT',
    'CEILING_EXCEEDED',
    400
  );
}

// Gestionnaire d'erreurs central
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error(err.message, { stack: err.stack });

  if (err instanceof BusinessError) {
    return res.status(err.statusCode).json({
      success: false,
      error: { code: err.code, message: err.message }
    });
  }

  return res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'Erreur interne' }
  });
};
```

---

## 7. Extensibilité

### 7.1 Ajout d'un Nouveau Module

Pour ajouter un nouveau module (ex: `grants` pour les subventions) :

**Étape 1 : Schéma Prisma**
```prisma
model Grant {
  id          String   @id @default(uuid())
  name        String
  amount      Decimal
  ministryId  String
  ministry    Ministry @relation(fields: [ministryId], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("grants")
}
```

**Étape 2 : Service**
```typescript
// src/services/grant.service.ts
export class GrantService {
  static async findAll() {
    return prisma.grant.findMany();
  }

  static async create(data: CreateGrantDto) {
    return prisma.grant.create({ data });
  }
}
```

**Étape 3 : Controller**
```typescript
// src/controllers/grant.controller.ts
export class GrantController {
  static async getAll(req: Request, res: Response) {
    const grants = await GrantService.findAll();
    res.json({ success: true, data: grants });
  }
}
```

**Étape 4 : Routes**
```typescript
// src/routes/grant.routes.ts
const router = Router();
router.get('/', authenticate, GrantController.getAll);
router.post('/', authenticate, checkPermission('grants', 'create'), GrantController.create);
export default router;
```

**Étape 5 : Enregistrement**
```typescript
// src/server.ts
import grantRoutes from './routes/grant.routes';
app.use(`${config.apiPrefix}/grants`, grantRoutes);
```

### 7.2 Ajout d'un Nouveau Calcul

Pour ajouter une nouvelle formule de calcul :

```typescript
// src/services/calculations/grantProjection.service.ts
export class GrantProjectionService {
  static calculate(
    baseAmount: number,
    growthRate: number,
    years: number
  ): number[] {
    const projections: number[] = [];
    let current = baseAmount;

    for (let i = 0; i < years; i++) {
      current *= (1 + growthRate);
      projections.push(current);
    }

    return projections;
  }
}
```

### 7.3 Points d'Extension

| Extension | Méthode |
|-----------|---------|
| Nouveau module | Ajouter service + controller + routes |
| Nouvelle permission | Seed dans la table `permissions` |
| Nouveau rapport | Ajouter template dans `export.service.ts` |
| Nouveau workflow | Configurer dans `workflow.service.ts` |
| Nouvelle langue | Ajouter traductions dans `public/locales` |

---

## 8. Intégrations

### 8.1 API REST pour Intégrations Externes

L'API est conçue pour faciliter les intégrations avec d'autres systèmes :

```
┌─────────────────────────────────────────────────────────────────────┐
│                    INTEGRATIONS POSSIBLES                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────┐                           ┌─────────────┐          │
│  │  Système    │◀── API REST ──────────────│    CDMT     │          │
│  │  Comptable  │    /api/v1/executions     │             │          │
│  └─────────────┘                           │             │          │
│                                            │             │          │
│  ┌─────────────┐                           │             │          │
│  │  Système    │◀── API REST ──────────────│             │          │
│  │  RH/Paie    │    /api/v1/salaries       │             │          │
│  └─────────────┘                           │             │          │
│                                            │             │          │
│  ┌─────────────┐                           │             │          │
│  │  Portail    │◀── API REST ──────────────│             │          │
│  │  Citoyen    │    /api/v1/public/budget  │             │          │
│  └─────────────┘                           └─────────────┘          │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 8.2 Authentification pour Intégrations

```typescript
// API Key pour systèmes externes
router.use('/external', apiKeyAuth);

// Middleware d'authentification API Key
const apiKeyAuth = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey || !isValidApiKey(apiKey)) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  req.integration = getIntegrationByApiKey(apiKey);
  next();
};
```

### 8.3 Webhooks

```typescript
// Configuration de webhook pour notifications externes
interface WebhookConfig {
  url: string;
  events: string[];
  secret: string;
}

// Envoi de webhook après validation
async function sendWebhook(event: string, payload: any) {
  const subscribers = await getWebhookSubscribers(event);

  for (const subscriber of subscribers) {
    await axios.post(subscriber.url, {
      event,
      payload,
      timestamp: new Date().toISOString(),
      signature: generateSignature(payload, subscriber.secret)
    });
  }
}
```

---

## Annexes

### A. Diagramme de Classes Simplifié

```
┌─────────────────┐     ┌─────────────────┐
│      User       │────▶│      Role       │
├─────────────────┤     ├─────────────────┤
│ - id            │     │ - id            │
│ - email         │     │ - code          │
│ - password      │     │ - name          │
│ - roleId        │     │ - permissions[] │
│ - ministryId    │     └─────────────────┘
└─────────────────┘
        │
        ▼
┌─────────────────┐     ┌─────────────────┐
│    Ministry     │────▶│    Program      │
├─────────────────┤     ├─────────────────┤
│ - id            │     │ - id            │
│ - code          │     │ - code          │
│ - name          │     │ - name          │
│ - programs[]    │     │ - actions[]     │
└─────────────────┘     └─────────────────┘
```

### B. Documentation Associée

- [API Reference](./API_REFERENCE.md)
- [Database Evolution](./DATABASE_EVOLUTION.md)
- [Technical Documentation](./TECHNICAL.md)

---

**Propriétaire du Document :** Équipe Architecture
**Approuvé Par :** Architecte Principal
**Prochaine Révision :** 2026-04-01
