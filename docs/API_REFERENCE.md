# CDMT Application - API Reference

**Version du Document :** 1.0
**Version API :** v1
**Dernière Mise à Jour :** 2026-01-05
**REQ-MAINT-02 :** API REST pour intégrations futures

---

## Table des Matières

1. [Introduction](#1-introduction)
2. [Authentification](#2-authentification)
3. [Format des Réponses](#3-format-des-réponses)
4. [Endpoints](#4-endpoints)
5. [Codes d'Erreur](#5-codes-derreur)
6. [Limites et Quotas](#6-limites-et-quotas)
7. [Exemples d'Intégration](#7-exemples-dintégration)

---

## 1. Introduction

### 1.1 Base URL

```
Production:  https://cdmt.finances.dj/api/v1
Development: http://localhost:5000/api/v1
```

### 1.2 Versioning

L'API utilise un versioning dans l'URL. La version actuelle est `v1`.

### 1.3 Content-Type

Toutes les requêtes doivent utiliser :
```
Content-Type: application/json
Accept: application/json
```

### 1.4 Encodage

Tous les échanges sont en UTF-8.

---

## 2. Authentification

### 2.1 JWT Bearer Token

L'API utilise l'authentification JWT. Incluez le token dans le header :

```http
Authorization: Bearer <access_token>
```

### 2.2 Obtenir un Token

**Endpoint :** `POST /auth/login`

**Request :**
```json
{
  "email": "user@finances.dj",
  "password": "your_password"
}
```

**Response (sans 2FA) :**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 86400,
    "user": {
      "id": "uuid",
      "email": "user@finances.dj",
      "firstName": "John",
      "lastName": "Doe",
      "role": "DIR_BUDGET"
    }
  }
}
```

**Response (avec 2FA) :**
```json
{
  "success": true,
  "data": {
    "requiresTwoFactor": true,
    "userId": "uuid",
    "message": "Authentification à deux facteurs requise"
  }
}
```

### 2.3 Vérification 2FA

**Endpoint :** `POST /auth/2fa/verify`

**Request :**
```json
{
  "userId": "uuid",
  "token": "123456"
}
```

**Response :**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": { ... }
  }
}
```

### 2.4 Rafraîchir le Token

**Endpoint :** `POST /auth/refresh`

**Request :**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

### 2.5 Déconnexion

**Endpoint :** `POST /auth/logout`

---

## 3. Format des Réponses

### 3.1 Réponse Succès

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2026-01-05T10:30:00.000Z",
    "requestId": "req-abc-123"
  }
}
```

### 3.2 Réponse Succès avec Pagination

```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  },
  "meta": {
    "timestamp": "2026-01-05T10:30:00.000Z"
  }
}
```

### 3.3 Réponse Erreur

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Les données fournies sont invalides",
    "details": [
      {
        "field": "email",
        "message": "Format d'email invalide"
      }
    ]
  },
  "meta": {
    "timestamp": "2026-01-05T10:30:00.000Z",
    "requestId": "req-abc-123"
  }
}
```

---

## 4. Endpoints

### 4.1 Authentification (`/auth`)

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| POST | `/auth/login` | Connexion | Non |
| POST | `/auth/logout` | Déconnexion | Oui |
| POST | `/auth/refresh` | Rafraîchir token | Non |
| GET | `/auth/me` | Profil utilisateur | Oui |
| POST | `/auth/2fa/generate` | Générer secret 2FA | Oui |
| POST | `/auth/2fa/enable` | Activer 2FA | Oui |
| POST | `/auth/2fa/verify` | Vérifier code 2FA | Non |
| POST | `/auth/2fa/disable` | Désactiver 2FA | Oui |

---

### 4.2 Utilisateurs (`/users`)

| Méthode | Endpoint | Description | Permissions |
|---------|----------|-------------|-------------|
| GET | `/users` | Liste des utilisateurs | users.read |
| GET | `/users/:id` | Détail utilisateur | users.read |
| POST | `/users` | Créer utilisateur | users.create |
| PUT | `/users/:id` | Modifier utilisateur | users.update |
| DELETE | `/users/:id` | Supprimer utilisateur | users.delete |
| PATCH | `/users/:id/status` | Activer/Désactiver | users.update |

**Exemple - Créer un utilisateur :**

```http
POST /api/v1/users
Content-Type: application/json
Authorization: Bearer <token>

{
  "email": "nouveau@finances.dj",
  "firstName": "Ahmed",
  "lastName": "Hassan",
  "phone": "+253123456",
  "roleId": "uuid-role",
  "ministryId": "uuid-ministry"
}
```

**Response :**
```json
{
  "success": true,
  "data": {
    "id": "uuid-new-user",
    "email": "nouveau@finances.dj",
    "firstName": "Ahmed",
    "lastName": "Hassan",
    "isActive": true,
    "role": {
      "id": "uuid-role",
      "code": "SECTORAL_MINISTRY",
      "name": "Ministère Sectoriel"
    },
    "ministry": {
      "id": "uuid-ministry",
      "code": "SANTE",
      "name": "Ministère de la Santé"
    },
    "createdAt": "2026-01-05T10:30:00.000Z"
  }
}
```

---

### 4.3 Rôles et Permissions (`/roles`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/roles` | Liste des rôles |
| GET | `/roles/:id` | Détail d'un rôle |
| POST | `/roles` | Créer un rôle |
| PUT | `/roles/:id` | Modifier un rôle |
| DELETE | `/roles/:id` | Supprimer un rôle |
| GET | `/roles/:id/permissions` | Permissions du rôle |
| PUT | `/roles/:id/permissions` | Modifier permissions |

**Structure d'un Rôle :**
```json
{
  "id": "uuid",
  "code": "DIR_BUDGET",
  "name": "Direction du Budget",
  "description": "Responsable de la validation finale",
  "permissions": [
    {
      "module": "cdmt",
      "canCreate": false,
      "canRead": true,
      "canUpdate": false,
      "canDelete": false,
      "canValidate": true
    }
  ]
}
```

---

### 4.4 Ministères (`/ministries`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/ministries` | Liste des ministères |
| GET | `/ministries/:id` | Détail ministère |
| POST | `/ministries` | Créer ministère |
| PUT | `/ministries/:id` | Modifier ministère |
| DELETE | `/ministries/:id` | Supprimer ministère |
| GET | `/ministries/:id/programs` | Programmes du ministère |
| GET | `/ministries/:id/budget` | Budget du ministère |

**Exemple - Liste des ministères :**

```http
GET /api/v1/ministries?page=1&limit=10&isPriority=true
```

**Response :**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-1",
      "code": "EDUC",
      "name": "Ministère de l'Éducation",
      "nameAr": "وزارة التربية",
      "nameEn": "Ministry of Education",
      "isPriority": true,
      "isActive": true,
      "programCount": 5
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 15
  }
}
```

---

### 4.5 Années Fiscales (`/fiscal-years`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/fiscal-years` | Liste des années |
| GET | `/fiscal-years/:id` | Détail année |
| POST | `/fiscal-years` | Créer année |
| PUT | `/fiscal-years/:id` | Modifier année |
| GET | `/fiscal-years/current` | Année en cours |

---

### 4.6 TOFE (`/tofe`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/tofe` | Liste TOFE |
| GET | `/tofe/:fiscalYearId` | TOFE par année |
| POST | `/tofe` | Créer TOFE |
| PUT | `/tofe/:id` | Modifier TOFE |
| GET | `/tofe/:id/export` | Exporter en Excel |
| GET | `/tofe/:id/pdf` | Exporter en PDF |

**Structure TOFE :**
```json
{
  "id": "uuid",
  "fiscalYearId": "uuid-fy",
  "versionId": "uuid-version",
  "revenues": {
    "taxRevenues": {
      "directTaxes": 50000000000,
      "indirectTaxes": 30000000000,
      "total": 80000000000
    },
    "nonTaxRevenues": 15000000000,
    "grants": 10000000000,
    "totalRevenues": 105000000000
  },
  "expenditures": {
    "currentExpenditures": {
      "wages": 40000000000,
      "goodsServices": 20000000000,
      "interests": 5000000000,
      "total": 65000000000
    },
    "capitalExpenditures": {
      "domestic": 25000000000,
      "foreignFinanced": 15000000000,
      "total": 40000000000
    },
    "totalExpenditures": 105000000000
  },
  "balance": 0,
  "status": "VALIDATED"
}
```

---

### 4.7 CBMT (`/cbmt`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/cbmt` | Liste CBMT |
| GET | `/cbmt/:fiscalYearId` | CBMT par année |
| POST | `/cbmt/ceilings` | Définir plafonds |
| PUT | `/cbmt/ceilings/:ministryId` | Modifier plafond |
| GET | `/cbmt/comparison` | Comparaison N vs N-1 |
| GET | `/cbmt/export` | Export Excel |

**Exemple - Définir un plafond :**

```http
POST /api/v1/cbmt/ceilings
Content-Type: application/json
Authorization: Bearer <token>

{
  "fiscalYearId": "uuid-fy-2027",
  "ministryId": "uuid-ministry-sante",
  "ceilings": {
    "yearN1": 3500000000,
    "yearN2": 3700000000,
    "yearN3": 3900000000
  },
  "notes": "Augmentation pour plan santé national"
}
```

---

### 4.8 CDMT Global (`/cdmt-global`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/cdmt-global/:fiscalYearId` | CDMT Global |
| POST | `/cdmt-global/consolidate` | Consolider |
| GET | `/cdmt-global/:id/by-ministry` | Par ministère |
| GET | `/cdmt-global/:id/by-nature` | Par nature économique |
| GET | `/cdmt-global/:id/by-source` | Par source financement |
| GET | `/cdmt-global/:id/export` | Export Excel |

---

### 4.9 CDMT Sectoriel (`/sectoral-trends`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/sectoral-trends` | Liste CDMT sectoriels |
| GET | `/sectoral-trends/:ministryId/:fiscalYearId` | CDMT d'un ministère |
| POST | `/sectoral-trends` | Créer CDMT sectoriel |
| PUT | `/sectoral-trends/:id` | Modifier |
| POST | `/sectoral-trends/:id/calculate-trend` | Calculer tendanciel |
| POST | `/sectoral-trends/:id/submit` | Soumettre |

---

### 4.10 Mesures Nouvelles (`/sectoral-measures`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/sectoral-measures` | Liste mesures |
| GET | `/sectoral-measures/:id` | Détail mesure |
| POST | `/sectoral-measures` | Créer mesure |
| PUT | `/sectoral-measures/:id` | Modifier mesure |
| DELETE | `/sectoral-measures/:id` | Supprimer mesure |

**Structure Mesure Nouvelle :**
```json
{
  "id": "uuid",
  "title": "Construction de 10 écoles rurales",
  "description": "Amélioration de l'accès à l'éducation",
  "programId": "uuid-program",
  "type": "INVESTMENT",
  "costs": {
    "yearN1": 500000000,
    "yearN2": 500000000,
    "yearN3": 500000000
  },
  "justification": "Plan National de Développement",
  "status": "PENDING",
  "attachments": ["etude_faisabilite.pdf"]
}
```

---

### 4.11 Workflow (`/workflow`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/workflow/pending` | Documents en attente |
| POST | `/workflow/submit` | Soumettre document |
| POST | `/workflow/validate` | Valider document |
| POST | `/workflow/reject` | Rejeter document |
| POST | `/workflow/return` | Retourner pour correction |
| GET | `/workflow/history/:documentId` | Historique |

**Exemple - Valider un document :**

```http
POST /api/v1/workflow/validate
Content-Type: application/json
Authorization: Bearer <token>

{
  "documentId": "uuid-document",
  "documentType": "CDMT_SECTORAL",
  "comment": "Conforme aux directives budgétaires",
  "decision": "APPROVED"
}
```

---

### 4.12 Notifications (`/notifications`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/notifications` | Mes notifications |
| GET | `/notifications/unread` | Non lues |
| PATCH | `/notifications/:id/read` | Marquer lue |
| PATCH | `/notifications/read-all` | Tout marquer lu |
| DELETE | `/notifications/:id` | Supprimer |

---

### 4.13 Journal d'Audit (`/audit-logs`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/audit-logs` | Liste des logs |
| GET | `/audit-logs/export` | Export Excel |

**Paramètres de filtrage :**
- `startDate`, `endDate` : Période
- `userId` : Filtre par utilisateur
- `action` : CREATE, UPDATE, DELETE, LOGIN
- `entity` : Type d'entité concernée

---

### 4.14 Dashboard (`/dashboard`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/dashboard/stats` | Statistiques globales |
| GET | `/dashboard/alerts` | Alertes actives |
| GET | `/dashboard/pending-actions` | Actions en attente |
| GET | `/dashboard/recent-activity` | Activité récente |

**Response Stats :**
```json
{
  "success": true,
  "data": {
    "totalBudget": 350000000000,
    "executionRate": 78.5,
    "pendingValidations": 12,
    "alerts": 3,
    "byMinistry": [
      { "name": "Éducation", "budget": 55000000000, "percentage": 15.7 }
    ]
  }
}
```

---

### 4.15 Export (`/export`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/export/custom` | Export personnalisé |
| GET | `/export/templates` | Modèles disponibles |

**Exemple - Export personnalisé :**

```http
POST /api/v1/export/custom
Content-Type: application/json
Authorization: Bearer <token>

{
  "type": "CDMT_GLOBAL",
  "fiscalYearId": "uuid-fy",
  "format": "EXCEL",
  "columns": ["ministry", "program", "yearN", "yearN1", "yearN2"],
  "filters": {
    "ministryIds": ["uuid-1", "uuid-2"]
  }
}
```

---

### 4.16 Import (`/import`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/import/budgets` | Importer budgets |
| POST | `/import/executions` | Importer exécutions |
| GET | `/import/templates/:type` | Télécharger modèle |
| GET | `/import/history` | Historique imports |

---

## 5. Codes d'Erreur

### 5.1 Codes HTTP

| Code | Signification |
|------|---------------|
| 200 | Succès |
| 201 | Créé avec succès |
| 400 | Requête invalide |
| 401 | Non authentifié |
| 403 | Non autorisé |
| 404 | Ressource non trouvée |
| 409 | Conflit (doublon) |
| 422 | Entité non traitable |
| 429 | Trop de requêtes |
| 500 | Erreur serveur |

### 5.2 Codes d'Erreur Applicatifs

| Code | Description |
|------|-------------|
| AUTH_001 | Identifiants invalides |
| AUTH_002 | Token expiré |
| AUTH_003 | Token invalide |
| AUTH_004 | 2FA requis |
| AUTH_005 | Code 2FA invalide |
| VAL_001 | Données invalides |
| VAL_002 | Champ requis manquant |
| VAL_003 | Format invalide |
| PERM_001 | Permission refusée |
| PERM_002 | Accès ministère interdit |
| BUS_001 | Plafond dépassé |
| BUS_002 | Document déjà validé |
| BUS_003 | Transition workflow invalide |
| NOT_FOUND | Ressource non trouvée |
| CONFLICT | Doublon détecté |
| RATE_LIMIT | Quota dépassé |

---

## 6. Limites et Quotas

### 6.1 Rate Limiting

| Endpoint | Limite | Fenêtre |
|----------|--------|---------|
| `/auth/login` | 5 requêtes | 15 minutes |
| `/auth/*` | 20 requêtes | 15 minutes |
| `/api/v1/*` | 100 requêtes | 15 minutes |
| `/export/*` | 10 requêtes | 15 minutes |

### 6.2 Headers Rate Limit

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1704451200
```

### 6.3 Pagination

- Limite par défaut : 20 éléments
- Limite maximale : 100 éléments

```
GET /api/v1/ministries?page=2&limit=50
```

---

## 7. Exemples d'Intégration

### 7.1 cURL

```bash
# Login
curl -X POST https://cdmt.finances.dj/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@finances.dj","password":"password"}'

# Get ministries with token
curl -X GET https://cdmt.finances.dj/api/v1/ministries \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

### 7.2 JavaScript/TypeScript

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://cdmt.finances.dj/api/v1',
  headers: { 'Content-Type': 'application/json' }
});

// Login
const login = async (email: string, password: string) => {
  const response = await api.post('/auth/login', { email, password });
  api.defaults.headers.common['Authorization'] =
    `Bearer ${response.data.data.accessToken}`;
  return response.data;
};

// Get ministries
const getMinistries = async () => {
  const response = await api.get('/ministries');
  return response.data.data;
};
```

### 7.3 Python

```python
import requests

BASE_URL = 'https://cdmt.finances.dj/api/v1'

# Login
response = requests.post(
    f'{BASE_URL}/auth/login',
    json={'email': 'user@finances.dj', 'password': 'password'}
)
token = response.json()['data']['accessToken']

# Get ministries
headers = {'Authorization': f'Bearer {token}'}
ministries = requests.get(f'{BASE_URL}/ministries', headers=headers)
print(ministries.json())
```

---

## Annexes

### A. Webhooks (Intégrations Avancées)

Pour les systèmes nécessitant des notifications en temps réel :

```json
{
  "event": "document.validated",
  "timestamp": "2026-01-05T10:30:00.000Z",
  "data": {
    "documentId": "uuid",
    "documentType": "CDMT_SECTORAL",
    "ministryId": "uuid",
    "validatedBy": "uuid"
  },
  "signature": "sha256=abc123..."
}
```

### B. SDK Disponibles

- JavaScript/TypeScript : `npm install @cdmt/api-client`
- Python : `pip install cdmt-api`

### C. Environnement de Test (Sandbox)

```
URL: https://sandbox.cdmt.finances.dj/api/v1
Credentials: demo@finances.dj / Demo2026!
```

---

**Propriétaire du Document :** Équipe API
**Approuvé Par :** Architecte API
**Prochaine Révision :** 2026-04-01
